'use strict';

// Constants from Framework.h
const MAX_SHAPE_SIZE   = 0.01;
const MAX_SEARCH_RANGE = 0.125;
const TARGET_BLEND     = 0.2;
const TARGET_BLEND_DIR = 1.0 - TARGET_BLEND;
const MAX_SPEED        = MAX_SHAPE_SIZE * 0.5;

// Cyclic attractor chain: Triangle→Rect→Hex→Oct→Triangle
const ATTRACTOR_TYPE = [1, 2, 3, 0];

const COLORS = ['#00ffff', '#ff3333', '#ff00ff', '#ffff00'];

// ---------------------------------------------------------------------------
// Spatial grid — port of CSpatialGrid (SpatialGrid.cpp)
//
// World is [-1,1]×[-1,1]. Cell size = MAX_SEARCH_RANGE so an AABB query with
// half-size MAX_SEARCH_RANGE touches at most 4 cells (one per corner).
// ---------------------------------------------------------------------------

// Module-level scratch array reused by every query — avoids per-frame allocation.
const _candidates = [];

class SpatialGrid {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.cols = Math.round(2 / cellSize); // 16 for cellSize=0.125
        const n = this.cols * this.cols;
        this.cells = new Array(n);
        for (let i = 0; i < n; i++) this.cells[i] = [];
    }

    clear() {
        for (const c of this.cells) c.length = 0;
    }

    _idx(x, y) {
        // Mirrors CSpatialGrid::GetIndex(): row = (y+1)/cell, col = (x+1)/cell
        const col = Math.min(this.cols - 1, Math.max(0, Math.floor((x + 1) / this.cellSize)));
        const row = Math.min(this.cols - 1, Math.max(0, Math.floor((y + 1) / this.cellSize)));
        return row * this.cols + col;
    }

    insert(shape) {
        this.cells[this._idx(shape.posX, shape.posY)].push(shape);
    }

    // Fills _candidates with shapes in cells overlapping the search AABB.
    // Samples the 4 AABB corners and deduplicates — matches GetObjectsInBound().
    query(x, y, r) {
        _candidates.length = 0;
        const i0 = this._idx(x - r, y - r);
        const i1 = this._idx(x + r, y - r);
        const i2 = this._idx(x - r, y + r);
        const i3 = this._idx(x + r, y + r);
        _pushCell(this.cells[i0]);
        if (i1 !== i0)                            _pushCell(this.cells[i1]);
        if (i2 !== i0 && i2 !== i1)               _pushCell(this.cells[i2]);
        if (i3 !== i0 && i3 !== i1 && i3 !== i2)  _pushCell(this.cells[i3]);
    }
}

function _pushCell(cell) {
    for (const s of cell) _candidates.push(s);
}

// ---------------------------------------------------------------------------
// Geometry helper — mirrors EdgeTest() in Shape.cpp
// ---------------------------------------------------------------------------

function edgeTest(p0x, p0y, p1x, p1y, x, y) {
    return (-(p1y - p0y)) * (x - p0x) + (p1x - p0x) * (y - p0y) < 0;
}

// ---------------------------------------------------------------------------
// Base shape
// ---------------------------------------------------------------------------

class Shape {
    constructor(x, y) {
        this.posX = x;
        this.posY = y;
        // Random initial direction (C++ used hardcoded (1, 0.1) for all shapes)
        const a = Math.random() * Math.PI * 2;
        this.dirX = Math.cos(a);
        this.dirY = Math.sin(a);
        this.targetX = this.dirX;
        this.targetY = this.dirY;
        this.minDist = MAX_SEARCH_RANGE;
    }

    // Phase 1 — apply last frame's target, advance position, wrap world
    move() {
        this.dirX = this.dirX * TARGET_BLEND_DIR + this.targetX * TARGET_BLEND;
        this.dirY = this.dirY * TARGET_BLEND_DIR + this.targetY * TARGET_BLEND;

        const len = Math.sqrt(this.dirX * this.dirX + this.dirY * this.dirY);
        this.dirX /= len;
        this.dirY /= len;

        this.posX += MAX_SPEED * this.dirX;
        this.posY += MAX_SPEED * this.dirY;

        if (this.posX >  1) this.posX -= 2;
        if (this.posX < -1) this.posX += 2;
        if (this.posY >  1) this.posY -= 2;
        if (this.posY < -1) this.posY += 2;
    }

    // Phase 2 — grid query → find attractor and check collisions
    // Matches the combined FindTarget/CheckCollision pass in CShape::Update().
    findNeighbors(grid) {
        this.minDist = MAX_SEARCH_RANGE;
        this.targetX = this.dirX;
        this.targetY = this.dirY;

        grid.query(this.posX, this.posY, MAX_SEARCH_RANGE);
        for (const other of _candidates) {
            if (other !== this) {
                this._findTarget(other);
                this._checkCollision(other);
            }
        }
    }

    _findTarget(other) {
        const dx   = other.posX - this.posX;
        const dy   = other.posY - this.posY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0 && dist < this.minDist && other.type === ATTRACTOR_TYPE[this.type]) {
            this.minDist = dist;
            this.targetX = dx / dist;
            this.targetY = dy / dist;
        }
    }

    _checkCollision(other) {
        if (this.test(other) || other.test(this)) {
            const dx  = other.posX - this.posX;
            const dy  = other.posY - this.posY;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 0) {
                this.dirX = -dx / len;
                this.dirY = -dy / len;
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Triangle  (type 0, cyan)
// ---------------------------------------------------------------------------

class Triangle extends Shape {
    constructor(x, y, size) {
        super(x, y);
        this.size = size;
        this.type = 0;
    }

    test(other) {
        const h = this.size * 0.5;
        return other.isWithin(this.posX,     this.posY + h)
            || other.isWithin(this.posX - h, this.posY - h)
            || other.isWithin(this.posX + h, this.posY - h);
    }

    isWithin(x, y) {
        const h = this.size * 0.5;
        const p0x = this.posX,     p0y = this.posY + h;
        const p1x = this.posX + h, p1y = this.posY - h;
        const p2x = this.posX - h, p2y = this.posY - h;
        return edgeTest(p0x, p0y, p1x, p1y, x, y)
            && edgeTest(p1x, p1y, p2x, p2y, x, y)
            && edgeTest(p2x, p2y, p0x, p0y, x, y);
    }

    draw(ctx) {
        const h = this.size * 0.5;
        ctx.beginPath();
        ctx.moveTo(this.posX,     this.posY + h);
        ctx.lineTo(this.posX - h, this.posY - h);
        ctx.lineTo(this.posX + h, this.posY - h);
        ctx.closePath();
        ctx.fill();
    }
}

// ---------------------------------------------------------------------------
// Rectangle  (type 1, red)
// ---------------------------------------------------------------------------

class Rectangle extends Shape {
    constructor(x, y, size) {
        super(x, y);
        this.size = size;
        this.type = 1;
    }

    test(other) {
        const h = this.size * 0.5;
        return other.isWithin(this.posX - h, this.posY - h)
            || other.isWithin(this.posX + h, this.posY - h)
            || other.isWithin(this.posX - h, this.posY + h)
            || other.isWithin(this.posX + h, this.posY + h);
    }

    isWithin(x, y) {
        const h = this.size * 0.5;
        return x >= this.posX - h && x <= this.posX + h
            && y >= this.posY - h && y <= this.posY + h;
    }

    draw(ctx) {
        const h = this.size * 0.5;
        // Canvas normalises the negative height that results from the Y-flip transform.
        ctx.fillRect(this.posX - h, this.posY - h, this.size, this.size);
    }
}

// ---------------------------------------------------------------------------
// Hexagon  (type 2, magenta)
// ---------------------------------------------------------------------------

class Hexagon extends Shape {
    constructor(x, y, radius) {
        super(x, y);
        this.radius = radius;
        this.type   = 2;
        this.pts    = [];
        for (let a = 0; a < 6; a++) {
            const r = a * Math.PI / 3;
            this.pts.push([Math.cos(r) * radius, -Math.sin(r) * radius]);
        }
    }

    test(other) {
        for (const [px, py] of this.pts) {
            if (other.isWithin(this.posX + px, this.posY + py)) return true;
        }
        return false;
    }

    isWithin(x, y) {
        let hits = 0;
        for (let a = 0; a < 6; a++) {
            const [ax, ay] = this.pts[a];
            const [bx, by] = this.pts[(a + 1) % 6];
            if (edgeTest(this.posX + ax, this.posY + ay,
                         this.posX + bx, this.posY + by, x, y)) hits++;
        }
        return hits === 6;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.posX + this.pts[0][0], this.posY + this.pts[0][1]);
        for (let a = 1; a < 6; a++) {
            ctx.lineTo(this.posX + this.pts[a][0], this.posY + this.pts[a][1]);
        }
        ctx.closePath();
        ctx.fill();
    }
}

// ---------------------------------------------------------------------------
// Octagon  (type 3, yellow)
// ---------------------------------------------------------------------------

class Octagon extends Shape {
    constructor(x, y, radius) {
        super(x, y);
        this.radius = radius;
        this.type   = 3;
        this.pts    = [];
        for (let a = 0; a < 8; a++) {
            const r = a * Math.PI / 4;
            this.pts.push([Math.cos(r) * radius, -Math.sin(r) * radius]);
        }
    }

    test(other) {
        for (const [px, py] of this.pts) {
            if (other.isWithin(this.posX + px, this.posY + py)) return true;
        }
        return false;
    }

    isWithin(x, y) {
        let hits = 0;
        for (let a = 0; a < 8; a++) {
            const [ax, ay] = this.pts[a];
            const [bx, by] = this.pts[(a + 1) % 8];
            if (edgeTest(this.posX + ax, this.posY + ay,
                         this.posX + bx, this.posY + by, x, y)) hits++;
        }
        return hits === 8;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.posX + this.pts[0][0], this.posY + this.pts[0][1]);
        for (let a = 1; a < 8; a++) {
            ctx.lineTo(this.posX + this.pts[a][0], this.posY + this.pts[a][1]);
        }
        ctx.closePath();
        ctx.fill();
    }
}

// ---------------------------------------------------------------------------
// Simulation driver
// ---------------------------------------------------------------------------

const canvas  = document.getElementById('canvas');
const ctx2d   = canvas.getContext('2d');
const shapes  = [];
const grid    = new SpatialGrid(MAX_SEARCH_RANGE);

// Pre-allocated render buckets — cleared and refilled each frame
const byType  = [[], [], [], []];

let paused   = false;
let lastTime = 0;
let fpsSmooth = 0;

function rand() { return Math.random() * 2 - 1; }

function spawnBatch(count, cx, cy, scatter = 2) {
    for (let i = 0; i < count; i++) {
        const x = (cx ?? rand()) + (scatter < 2 ? (Math.random() - 0.5) * scatter : 0);
        const y = (cy ?? rand()) + (scatter < 2 ? (Math.random() - 0.5) * scatter : 0);
        const wx = Math.max(-1, Math.min(1, x));
        const wy = Math.max(-1, Math.min(1, y));
        switch (i % 4) {
            case 0: shapes.push(new Triangle (wx, wy, MAX_SHAPE_SIZE)); break;
            case 1: shapes.push(new Rectangle(wx, wy, MAX_SHAPE_SIZE)); break;
            case 2: shapes.push(new Hexagon  (wx, wy, MAX_SHAPE_SIZE)); break;
            case 3: shapes.push(new Octagon  (wx, wy, MAX_SHAPE_SIZE)); break;
        }
    }
}

function resizeCanvas() {
    const s = Math.min(window.innerWidth, window.innerHeight);
    canvas.width  = s;
    canvas.height = s;
    // Restore solid background after canvas reset clears it
    ctx2d.fillStyle = '#0d0d0d';
    ctx2d.fillRect(0, 0, s, s);
}

function frame(now) {
    // Smoothed FPS
    if (lastTime > 0) {
        const inst = 1000 / (now - lastTime);
        fpsSmooth  = fpsSmooth * 0.9 + inst * 0.1;
    }
    lastTime = now;

    if (!paused) {
        // Phase 1 — advance all positions
        for (const s of shapes) s.move();

        // Phase 2 — rebuild spatial grid
        grid.clear();
        for (const s of shapes) grid.insert(s);

        // Phase 3 — find attractors and resolve collisions
        for (const s of shapes) s.findNeighbors(grid);
    }

    // --- Render ---

    // Trail effect: semi-transparent overlay fades old positions over ~25 frames
    ctx2d.fillStyle = 'rgba(13,13,13,0.22)';
    ctx2d.fillRect(0, 0, canvas.width, canvas.height);

    // World-to-canvas transform: world [-1,1] → canvas with Y-up
    const hw = canvas.width  / 2;
    const hh = canvas.height / 2;
    ctx2d.setTransform(hw, 0, 0, -hh, hw, hh);

    // Bucket shapes by type so we can set fillStyle + shadowColor once per type
    for (let t = 0; t < 4; t++) byType[t].length = 0;
    for (const s of shapes) byType[s.type].push(s);

    ctx2d.shadowBlur = 7;
    for (let t = 0; t < 4; t++) {
        ctx2d.fillStyle   = COLORS[t];
        ctx2d.shadowColor = COLORS[t];
        for (const s of byType[t]) s.draw(ctx2d);
    }
    ctx2d.shadowBlur = 0;

    // Restore identity transform for UI
    ctx2d.setTransform(1, 0, 0, 1, 0, 0);

    // Stats
    document.getElementById('fps').textContent   = Math.round(fpsSmooth);
    document.getElementById('count').textContent = shapes.length;
    for (let t = 0; t < 4; t++) {
        const el = document.getElementById(`count-${t}`);
        if (el) el.textContent = byType[t].length;
    }

    requestAnimationFrame(frame);
}

// --- Input ---

window.addEventListener('resize', resizeCanvas);

// Click to spawn a cluster near the cursor
canvas.addEventListener('click', (e) => {
    const r   = canvas.getBoundingClientRect();
    const wx  = ((e.clientX - r.left)  / canvas.width)  * 2 - 1;
    const wy  = 1 - ((e.clientY - r.top) / canvas.height) * 2;
    spawnBatch(20, wx, wy, 0.05);
});

// Spacebar to pause / resume
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        paused = !paused;
        document.getElementById('btn-pause').textContent = paused ? 'resume' : 'pause';
    }
});

document.getElementById('btn-spawn').addEventListener('click', () => spawnBatch(200));
document.getElementById('btn-remove').addEventListener('click', () => { shapes.splice(-Math.min(200, shapes.length)); });
document.getElementById('btn-clear').addEventListener('click', () => {
    shapes.length = 0;
    // Full clear so trails don't linger on an empty canvas
    ctx2d.fillStyle = '#0d0d0d';
    ctx2d.fillRect(0, 0, canvas.width, canvas.height);
});
document.getElementById('btn-pause').addEventListener('click', () => {
    paused = !paused;
    document.getElementById('btn-pause').textContent = paused ? 'resume' : 'pause';
});

// --- Boot ---

resizeCanvas();
spawnBatch(200);
requestAnimationFrame(frame);
