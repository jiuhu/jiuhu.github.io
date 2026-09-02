'use strict';

// Board dimensions
const ROWS = 7;
const COLS = 5;
const TILE = 64;
const PAD  = 16;
const HDR  = 72;   // header height for score UI

// Element types — matches GameEnum.h: WATER=0 FIRE=1 EARTH=2 AIR=3 SUN=4
const ELEM_COUNT = 5;
const SP_VERTICAL = 5;
const NULL_ELEM   = -1;

const ELEM_COLOR  = ['#4A90D9', '#E84030', '#5CA84A', '#B0C8E8', '#F0C020'];
const ELEM_GLOW   = ['#88C4FF', '#FF8070', '#90D870', '#D8ECFF', '#FFE070'];
const ELEM_LABEL  = ['Water', 'Fire', 'Earth', 'Air', 'Sun'];

// Animation constants from StateHarvest.cpp
const SHAKING = [5, 0, -5, 0];       // x-offset per shake frame
const SCALING = [1.1, 1.2, 1.1, 1.0]; // scale per press-pulse frame
const EXPLODE_STEPS = 6;

// Piece status codes
const IDLE        = 0;
const PRESSED     = 1;
const SELECTED    = 2;
const SHAKE       = 3;
const CLEAR       = 4;
const DROPPING_P  = 5;  // used during drop phase
const TRANSFORMING= 6;

// Game phase
const PLAYING   = 'playing';
const EXPLODING = 'exploding';
const DROPPING  = 'dropping';
const SHAKING_P = 'shaking';

// -----------------------------------------------------------------------
// Piece
// -----------------------------------------------------------------------

class Piece {
    constructor(type = NULL_ELEM) {
        this.type       = type;
        this.status     = IDLE;
        this.dropOffset = 0;   // px, negative = piece is above its slot
        this.msg        = '';  // "+10", etc. shown during explosion
    }

    reset(type) {
        this.type = type; this.status = IDLE; this.dropOffset = 0; this.msg = '';
    }
}

// -----------------------------------------------------------------------
// Board  (column-major, matching Board::get(r,c) = _pieces[c*ROW + r])
// -----------------------------------------------------------------------

class Board {
    constructor() {
        this.pieces = Array.from({ length: ROWS * COLS }, () => new Piece());
        this.randomise();
    }

    get(r, c) { return this.pieces[c * ROWS + r]; }

    randomise() {
        for (let i = 0; i < this.pieces.length; i++) {
            this.pieces[i].reset(Math.floor(Math.random() * ELEM_COUNT));
        }
    }
}

// -----------------------------------------------------------------------
// AlchemyGame
// -----------------------------------------------------------------------

class AlchemyGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx    = canvas.getContext('2d');

        this.board = new Board();
        this.score = 0;
        this.phase = PLAYING;

        // Selection
        this.chain      = [];           // [{r,c}] accumulated chain (head is last)
        this.elemType   = NULL_ELEM;    // element being linked
        this.ptrDown    = false;
        this.head       = null;         // {r,c} of the current chain tip

        // Floating combo-count labels
        this.floats = [];  // [{x,y,label,alpha}]

        // Animation counters — mirrors _animeFrame/_animeFreq/_animeCounter
        this.animeFrame = 0;
        this.animeFreq  = 0;
        this.animating  = false;

        // Explosion
        this.explodeStep  = 0;
        this.explodeAlpha = 1.0;
        this.explodeTimer = 0;  // frames within current step

        // Shake
        this.shakeFrame = 0;
        this.shakeFreq  = 0;

        this._bindInput();
    }

    // ---- Coordinate helpers ----------------------------------------

    boardLeft()  { return PAD; }
    boardTop()   { return HDR; }

    hitTest(px, py) {
        const c = Math.floor((px - this.boardLeft()) / TILE);
        const r = Math.floor((py - this.boardTop())  / TILE);
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return null;
        return { r, c };
    }

    pieceXY(r, c) {
        return {
            x: this.boardLeft() + c * TILE + TILE / 2,
            y: this.boardTop()  + r * TILE + TILE / 2,
        };
    }

    // ---- Input -----------------------------------------------------

    _bindInput() {
        const ev = (name, fn) => this.canvas.addEventListener(name, fn);

        const down = (px, py) => {
            this.ptrDown = true;
            if (this.phase !== PLAYING) return;
            const cell = this.hitTest(px, py);
            if (!cell) return;
            const p = this.board.get(cell.r, cell.c);
            if (p.type !== NULL_ELEM && p.type < ELEM_COUNT && p.status === IDLE) {
                this.elemType = p.type;
            }
        };

        const move = (px, py) => {
            if (!this.ptrDown || this.phase !== PLAYING) return;
            const cell = this.hitTest(px, py);
            if (!cell) return;
            this._tryLink(cell.r, cell.c);
        };

        const up = () => {
            this.ptrDown = false;
            if (this.phase !== PLAYING) return;
            this._confirm();
        };

        const pos = (e) => {
            const r = this.canvas.getBoundingClientRect();
            const sx = this.canvas.width  / r.width;
            const sy = this.canvas.height / r.height;
            return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
        };

        ev('mousedown',  (e) => { const p = pos(e); down(p.x, p.y); });
        ev('mousemove',  (e) => { const p = pos(e); move(p.x, p.y); });
        ev('mouseup',    ()  => up());
        ev('mouseleave', ()  => up());

        ev('touchstart', (e) => { e.preventDefault(); const t = e.touches[0]; const r2 = this.canvas.getBoundingClientRect(); const sx = this.canvas.width/r2.width, sy = this.canvas.height/r2.height; down((t.clientX - r2.left)*sx, (t.clientY - r2.top)*sy); }, { passive: false });
        ev('touchmove',  (e) => { e.preventDefault(); const t = e.touches[0]; const r2 = this.canvas.getBoundingClientRect(); const sx = this.canvas.width/r2.width, sy = this.canvas.height/r2.height; move((t.clientX - r2.left)*sx, (t.clientY - r2.top)*sy); }, { passive: false });
        ev('touchend',   (e) => { e.preventDefault(); up(); },                { passive: false });
    }

    // ---- Chain linking logic (mirrors StateHarvest::checkTouch) ----

    _tryLink(r, c) {
        const piece = this.board.get(r, c);

        // Backtrack: touching the previous piece unlinks the head
        if (this.chain.length >= 1) {
            const prev = this.chain[this.chain.length - 1];
            if (prev.r === r && prev.c === c && this.head) {
                const old = this.head;
                this.board.get(old.r, old.c).status = IDLE;
                this.head = { ...prev };
                this.board.get(prev.r, prev.c).status = PRESSED;
                this.chain.pop();
                this.animeFreq = 0;
                this.animating = true;
                return;
            }
        }

        if (piece.status !== IDLE) return;
        if (this.elemType === NULL_ELEM) return;
        if (piece.type !== this.elemType && piece.type < ELEM_COUNT) return;

        // Must be adjacent to head (diagonal ok, matches C++ dr/dc < 2)
        if (this.head) {
            const dr = Math.abs(r - this.head.r);
            const dc = Math.abs(c - this.head.c);
            if (dr >= 2 || dc >= 2) return;
        }

        // Extend chain
        if (this.head) {
            this.board.get(this.head.r, this.head.c).status = SELECTED;
            this.chain.push({ ...this.head });
        }
        piece.status = PRESSED;
        this.head = { r, c };

        this.animeFrame = 0;
        this.animeFreq  = 0;
        this.animating  = true;

        const size = this.chain.length + 1;
        if (size > 2) {
            const xy = this.pieceXY(r, c);
            this.floats.push({ x: xy.x, y: xy.y - TILE * 0.3, label: `×${size}`, alpha: 1.0 });
        }
    }

    // ---- Confirm selection (mirrors StateHarvest::clearPieces) -----

    _confirm() {
        // Gather full chain (chain prefix + head tip)
        const full = this.head ? [...this.chain, { ...this.head }] : [...this.chain];
        this._resetSelection();

        if (full.length < 3) {
            this._unmatch(full);
            return;
        }

        // Chain ≥ 7 → transform last piece into SP_VERTICAL (+100 bonus)
        if (full.length > 6) {
            const last = full[full.length - 1];
            const halo = this.board.get(last.r, last.c);
            halo.status = TRANSFORMING;
            halo.type   = SP_VERTICAL;
            this.score += 100;
            halo.msg    = '+100';
            full.pop();
        }

        // Score + clear each piece in chain
        let count = 0;
        for (const pos of full) {
            const p = this.board.get(pos.r, pos.c);
            p.status = CLEAR;
            if (p.type < ELEM_COUNT) {
                this._addScore(p, ++count);
            } else if (p.type === SP_VERTICAL) {
                // SP_VERTICAL clears its entire column
                this.score += 100; p.msg = '+100';
                for (let row = 0; row < ROWS; row++) {
                    const cp = this.board.get(row, pos.c);
                    if (cp.status === TRANSFORMING) continue;
                    if (cp.status !== CLEAR) {
                        this._addScore(cp, ++count);
                        cp.status = CLEAR;
                    }
                }
            }
        }

        this.phase       = EXPLODING;
        this.explodeStep  = 0;
        this.explodeAlpha = 1.0;
        this.explodeTimer = 0;
    }

    _unmatch(full) {
        this.phase      = SHAKING_P;
        this.shakeFrame = 0;
        this.shakeFreq  = 0;
        for (const pos of full) {
            this.board.get(pos.r, pos.c).status = SHAKE;
        }
    }

    _addScore(piece, count) {
        let pts = 10;
        if (count > 20) pts = 100;
        else if (count > 15) pts = 75;
        else if (count > 10) pts = 50;
        else if (count > 5)  pts = 30;
        else if (count > 3)  pts = 20;
        this.score  += pts;
        piece.msg    = `+${pts}`;
    }

    _resetSelection() {
        // Clear visual state on all chain pieces
        for (const pos of this.chain) {
            const p = this.board.get(pos.r, pos.c);
            if (p.status === SELECTED || p.status === PRESSED) p.status = IDLE;
        }
        if (this.head) {
            const p = this.board.get(this.head.r, this.head.c);
            if (p.status === PRESSED) p.status = IDLE;
        }
        this.chain    = [];
        this.head     = null;
        this.elemType = NULL_ELEM;
        this.animating = false;
    }

    // ---- Gravity (applied after explosion completes) ----------------

    _applyGravity() {
        for (let c = 0; c < COLS; c++) {
            // Compact non-clear pieces downward into final slots
            let writeRow = ROWS - 1;
            for (let r = ROWS - 1; r >= 0; r--) {
                const piece = this.board.get(r, c);
                if (piece.status === CLEAR || piece.type === NULL_ELEM) continue;

                const fallDist = writeRow - r;
                if (fallDist > 0) {
                    const dest = this.board.get(writeRow, c);
                    dest.type       = piece.type;
                    dest.status     = IDLE;
                    dest.msg        = '';
                    dest.dropOffset = -fallDist * TILE;  // starts above its slot
                    piece.type      = NULL_ELEM;
                    piece.status    = CLEAR;
                    piece.dropOffset = 0;
                }
                writeRow--;
            }

            // Fill empty top slots with new random pieces
            const startRow = writeRow;
            for (let r = startRow; r >= 0; r--) {
                const piece = this.board.get(r, c);
                piece.type       = Math.floor(Math.random() * ELEM_COUNT);
                piece.status     = IDLE;
                piece.msg        = '';
                piece.dropOffset = -(startRow + 1) * TILE;
            }
        }
        this.phase = DROPPING;
    }

    // ---- Update ----------------------------------------------------

    update() {
        // Animate floating combo labels
        this.floats.forEach(f => { f.y -= 0.6; f.alpha -= 0.018; });
        this.floats = this.floats.filter(f => f.alpha > 0);

        switch (this.phase) {
        case PLAYING:
            if (this.animating) {
                this.animeFrame++;
                if (this.animeFrame === 3) { this.animeFreq++; this.animeFrame = 0; }
            }
            break;

        case EXPLODING:
            // 2 frames per explode step (matches C++ animeFrame==2 check)
            this.explodeTimer++;
            if (this.explodeTimer === 2) {
                this.explodeTimer = 0;
                this.explodeStep++;
                this.explodeAlpha -= 1 / EXPLODE_STEPS;
                if (this.explodeStep >= EXPLODE_STEPS) {
                    this._applyGravity();
                }
            }
            break;

        case DROPPING: {
            const FALL_SPEED = 8;   // px per frame
            let any = false;
            for (const piece of this.board.pieces) {
                if (piece.dropOffset < 0) {
                    piece.dropOffset = Math.min(0, piece.dropOffset + FALL_SPEED);
                    if (piece.dropOffset < 0) any = true;
                }
            }
            if (!any) this.phase = PLAYING;
            break;
        }

        case SHAKING_P:
            this.shakeFrame++;
            if (this.shakeFrame === 3) {
                this.shakeFrame = 0;
                this.shakeFreq++;
                if (this.shakeFreq > 2) {
                    for (const p of this.board.pieces) if (p.status === SHAKE) p.status = IDLE;
                    this.phase = PLAYING;
                }
            }
            break;
        }
    }

    // ---- Draw ------------------------------------------------------

    draw() {
        const ctx = this.ctx;
        const W   = this.canvas.width;
        const H   = this.canvas.height;

        // Background
        ctx.fillStyle = '#0e1128';
        ctx.fillRect(0, 0, W, H);

        this._drawHeader();

        // Clip to board so pieces don't draw into header or outside
        ctx.save();
        ctx.beginPath();
        ctx.rect(this.boardLeft(), this.boardTop(), COLS * TILE, ROWS * TILE);
        ctx.clip();
        this._drawBoard();
        ctx.restore();

        this._drawFloats();
    }

    _drawHeader() {
        const ctx = this.ctx;

        // Score
        ctx.fillStyle = '#ccc';
        ctx.font = '13px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('SCORE', PAD, 24);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px monospace';
        ctx.fillText(this.score, PAD, 54);

        // Chain length indicator while selecting
        const chainLen = this.chain.length + (this.head ? 1 : 0);
        if (chainLen > 0 && this.phase === PLAYING) {
            const color = chainLen >= 3 ? '#7fda7f' : '#da7f7f';
            ctx.fillStyle = color;
            ctx.font = 'bold 26px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(`×${chainLen}`, this.canvas.width - PAD, 50);
            ctx.textAlign = 'left';
        }

        // Phase hint
        if (this.phase !== PLAYING) {
            ctx.fillStyle = '#888';
            ctx.font = '12px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(this.phase, this.canvas.width - PAD, 50);
            ctx.textAlign = 'left';
        }
    }

    _drawBoard() {
        const ctx = this.ctx;

        // Tile backgrounds
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const x = this.boardLeft() + c * TILE;
                const y = this.boardTop()  + r * TILE;
                ctx.fillStyle = (r + c) % 2 === 0 ? '#111428' : '#0d1020';
                ctx.fillRect(x, y, TILE, TILE);
            }
        }

        // Draw connectors first (underneath pieces)
        this._drawConnectors();

        // Draw pieces
        for (let c = 0; c < COLS; c++) {
            for (let r = 0; r < ROWS; r++) {
                const piece = this.board.get(r, c);
                if (piece.type === NULL_ELEM) continue;

                const cx = this.boardLeft() + c * TILE + TILE / 2;
                let   cy = this.boardTop()  + r * TILE + TILE / 2 + piece.dropOffset;

                // Shake offset
                let   ox = 0;
                if (piece.status === SHAKE) {
                    ox = SHAKING[Math.min(this.shakeFrame, 3)];
                }

                // Scale for PRESSED pulse
                let scale = 1.0;
                if (piece.status === PRESSED && this.animeFreq === 1) {
                    scale = SCALING[Math.min(this.animeFrame, 3)];
                }

                if (piece.status === CLEAR || piece.status === TRANSFORMING) {
                    // Explosion animation
                    if (this.phase === EXPLODING) {
                        this._drawExplosion(cx + ox, cy, piece.type, this.explodeStep, this.explodeAlpha);
                        if (piece.msg) this._drawMsg(piece.msg, cx + ox, cy);
                    }
                    continue;
                }

                // Glow halo for selected/pressed
                if (piece.status === SELECTED || piece.status === PRESSED) {
                    this._drawHalo(cx + ox, cy);
                }

                this._drawPiece(cx + ox, cy, piece.type, scale);
            }
        }
    }

    _drawPiece(cx, cy, type, scale = 1.0) {
        const ctx = this.ctx;
        const r   = TILE * 0.36 * scale;

        if (type === SP_VERTICAL) {
            ctx.save();
            ctx.fillStyle    = '#ffffff';
            ctx.shadowBlur   = 16;
            ctx.shadowColor  = '#aaddff';
            ctx.fillRect(cx - 4 * scale, cy - r, 8 * scale, r * 2);
            ctx.restore();
            return;
        }

        ctx.save();
        ctx.shadowBlur  = 10;
        ctx.shadowColor = ELEM_COLOR[type];
        ctx.fillStyle   = ELEM_COLOR[type];
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inner radial highlight
        const g = ctx.createRadialGradient(cx - r * 0.28, cy - r * 0.28, 0, cx, cy, r);
        g.addColorStop(0, 'rgba(255,255,255,0.45)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    _drawHalo(cx, cy) {
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle   = 'rgba(255,255,255,0.12)';
        ctx.shadowBlur  = 20;
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, TILE * 0.46, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    _drawExplosion(cx, cy, type, step, alpha) {
        const ctx = this.ctx;
        const r   = TILE * 0.36 * (1.0 + step * 0.18);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowBlur  = 24;
        ctx.shadowColor = type < ELEM_COUNT ? ELEM_GLOW[type] : '#ffffff';
        ctx.fillStyle   = type < ELEM_COUNT ? ELEM_COLOR[type] : '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    _drawMsg(msg, cx, cy) {
        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = this.explodeAlpha;
        ctx.fillStyle   = '#fff';
        ctx.font        = 'bold 13px monospace';
        ctx.textAlign   = 'center';
        ctx.shadowBlur  = 4;
        ctx.shadowColor = '#000';
        ctx.fillText(msg, cx, cy - TILE * 0.4);
        ctx.restore();
    }

    _drawConnectors() {
        if (!this.head && this.chain.length === 0) return;
        const ctx  = this.ctx;
        const all  = [...this.chain, this.head].filter(Boolean);
        if (all.length < 2) return;

        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth   = 3.5;
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';
        ctx.shadowBlur  = 8;
        ctx.shadowColor = '#ffffff';

        ctx.beginPath();
        all.forEach((pos, i) => {
            const { x, y } = this.pieceXY(pos.r, pos.c);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.restore();
    }

    _drawFloats() {
        const ctx = this.ctx;
        ctx.save();
        ctx.font      = 'bold 16px monospace';
        ctx.textAlign = 'center';
        for (const f of this.floats) {
            ctx.globalAlpha  = f.alpha;
            ctx.fillStyle    = '#ffffff';
            ctx.shadowBlur   = 6;
            ctx.shadowColor  = '#aaaaaa';
            ctx.fillText(f.label, f.x, f.y);
        }
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // ---- Loop ------------------------------------------------------

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    newGame() {
        this.board    = new Board();
        this.score    = 0;
        this.phase    = PLAYING;
        this.chain    = [];
        this.head     = null;
        this.elemType = NULL_ELEM;
        this.floats   = [];
        this.animating  = false;
        this.animeFrame = 0;
        this.animeFreq  = 0;
    }
}

// -----------------------------------------------------------------------
// Boot
// -----------------------------------------------------------------------

const canvas = document.getElementById('canvas');
canvas.width  = COLS * TILE + PAD * 2;
canvas.height = ROWS * TILE + HDR + PAD;

const game = new AlchemyGame(canvas);

document.getElementById('btn-new').addEventListener('click', () => game.newGame());

requestAnimationFrame(() => game.loop());
