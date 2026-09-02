'use strict';

// ─── Constants ───────────────────────────────────────────────────────────────

const TILE_SIZE = 64;
const SPRITE_W  = 32; // unit sprite sheet cols are 32px wide  (4 frames × 32 = 128)
const SPRITE_H  = 48; // unit sprite sheet rows are 48px tall  (4 dirs  × 48 = 192)
const MAP_LEFT  = 32;
const MAP_TOP   = 32;
const COLS = 8, ROWS = 8;
const CENTER_X = COLS / 2; // 4 — P1 left of this, AI right
const MAX_UNITS = 5;

const P1 = 0, P2 = 1;

// Direction indices matching sprite sheet rows
const DIR = { SOUTH:0, WEST:1, EAST:2, NORTH:3 };

// Menu command indices
const CMD = { MOVE:0, ATTACK:1, SPELL:2, DEFEND:3, ITEM:4, END:5 };
const CMD_LABELS = ['Move','Attack','Spell','Defend','Item','End Turn'];

// Tile types
const TILE = { GRASS:0, WATER:1, ROAD:2 };

// Unit type stats (from unit.dat)
const UNIT_DEFS = [
  { type:0, name:'Militia',  hp:10, mp:0,  at:4, df:2, so:0, hr:0.95, er:0.25, sp:2 },
  { type:1, name:'Archer',   hp:8,  mp:0,  at:2, df:3, so:1, hr:1.0,  er:0.3,  sp:3 },
  { type:2, name:'Sorcerer', hp:5,  mp:10, at:1, df:1, so:3, hr:0.75, er:0.05, sp:2 },
];
const UNIT_TEXTURES = ['militia','archer','sorcerer'];

// Map data (from map.dat)
const MAP_DATA = [
  [0,0,0,1,1,0,0,0],
  [0,0,0,2,2,0,0,0],
  [0,0,0,1,1,0,0,0],
  [0,0,0,2,2,0,0,0],
  [0,0,0,2,2,0,0,0],
  [0,0,0,1,1,0,0,0],
  [0,0,0,2,2,0,0,0],
  [0,0,0,1,1,0,0,0],
];

// ─── Coordinate helpers ───────────────────────────────────────────────────────

function mapToAppX(mx) { return MAP_LEFT + mx * TILE_SIZE; }
function mapToAppY(my) { return MAP_TOP  + my * TILE_SIZE; }
function appToMapX(px) { return Math.floor((px - MAP_LEFT) / TILE_SIZE); }
function appToMapY(py) { return Math.floor((py - MAP_TOP)  / TILE_SIZE); }
function inMap(mx, my) { return mx >= 0 && mx < COLS && my >= 0 && my < ROWS; }

// ─── Asset loader ─────────────────────────────────────────────────────────────

const assets = {};

function loadAssets(names, base, cb) {
  let remaining = names.length;
  names.forEach(name => {
    const img = new Image();
    img.onload = () => { if (--remaining === 0) cb(); };
    img.onerror = () => { console.warn('missing asset:', name); if (--remaining === 0) cb(); };
    img.src = base + name + '.png';
    assets[name] = img;
  });
}

// ─── Tile ─────────────────────────────────────────────────────────────────────

class Tile {
  constructor(type) {
    this.type    = type;
    this.hasUnit = false;
    this.canMove = false; // move-range highlight flag
  }

  // Returns whether this tile can be entered for the given command
  checkMove(cmd) {
    if (cmd === CMD.MOVE) return this.type !== TILE.WATER && !this.hasUnit;
    if (cmd === CMD.ATTACK) return true;
    return false;
  }
}

// ─── Unit ─────────────────────────────────────────────────────────────────────

const STAGE = { NEW:0, MOVED:1, ATTACKED:2, DEFENDING:3, ENDTURN:4 };
const STAGE_LABEL = ['NEW','MOVED','ATTACKED','DEFENDING','ENDTURN'];

class Unit {
  constructor(id, type, owner) {
    const def    = UNIT_DEFS[type];
    this.id      = id;
    this.type    = type;
    this.owner   = owner;
    this.name    = def.name;
    this.maxHP   = def.hp;
    this.hp      = def.hp;
    this.maxMP   = def.mp;
    this.mp      = def.mp;
    this.attack  = def.at;
    this.defend  = def.df;
    this.sorcery = def.so;
    this.hitRate = def.hr;
    this.evade   = def.er;
    this.speed   = def.sp;
    this.mapX    = 0;
    this.mapY    = 0;
    this.stage   = STAGE.NEW;
    this.dead    = false;
  }

  setMapCoord(mx, my) { this.mapX = mx; this.mapY = my; }

  applyDamage(dmg) {
    this.hp -= dmg;
    if (this.hp <= 0) { this.hp = 0; this.dead = true; }
  }

  calculateAccuracy(targetEvade) {
    return Math.max(0, Math.min(1, this.hitRate - targetEvade));
  }
}

// ─── Player ───────────────────────────────────────────────────────────────────

class Player {
  constructor(id) {
    this.id       = id;
    this.units    = [];
    this.unmoved  = 0;
  }

  addUnit(unit) { this.units.push(unit); this.unmoved++; }

  newTurn() {
    this.unmoved = this.units.length;
    this.units.forEach(u => { u.stage = STAGE.NEW; });
  }

  unitEndTurn() { this.unmoved--; }

  killUnit(index) {
    this.units.splice(index, 1);
  }

  findUnitAt(mx, my) {
    return this.units.findIndex(u => u.mapX === mx && u.mapY === my);
  }
}

// ─── Map grid ─────────────────────────────────────────────────────────────────

class GameMap {
  constructor() {
    this.tiles = MAP_DATA.map(row => row.map(t => new Tile(t)));
    this.drawGrid = true;
  }

  tile(mx, my) {
    if (!inMap(mx, my)) return null;
    return this.tiles[my][mx];
  }

  resetMove() {
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++)
        this.tiles[y][x].canMove = false;
  }

  reset() {
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) {
        this.tiles[y][x].hasUnit = false;
        this.tiles[y][x].canMove = false;
      }
  }
}

// ─── BFS movement range ───────────────────────────────────────────────────────

function computeMoveRange(map, startX, startY, speed) {
  // Returns set of {mx,my} keys reachable within `speed` steps
  const reachable = new Set();
  const visited   = {};            // key → best remaining moves
  const queue     = [{ x: startX, y: startY, left: speed }];
  const dirs = [[0,-1],[0,1],[-1,0],[1,0]];

  while (queue.length) {
    const { x, y, left } = queue.shift();
    if (left === 0) continue;
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (!inMap(nx, ny)) continue;
      const t = map.tile(nx, ny);
      if (!t.checkMove(CMD.MOVE)) continue;
      const key = `${nx},${ny}`;
      const rem = left - 1;
      if (visited[key] !== undefined && visited[key] >= rem) continue;
      visited[key] = rem;
      reachable.add(key);
      queue.push({ x: nx, y: ny, left: rem });
    }
  }
  return reachable;
}

function computeAttackRange(startX, startY) {
  const set = new Set();
  const dirs = [[0,-1],[0,1],[-1,0],[1,0]];
  for (const [dx, dy] of dirs) {
    const nx = startX + dx, ny = startY + dy;
    if (inMap(nx, ny)) set.add(`${nx},${ny}`);
  }
  return set;
}

// ─── Easy AI ──────────────────────────────────────────────────────────────────

class EasyAI {
  constructor(difficulty) {
    // difficulty: 0=Easy, 1=Normal, 2=Hard — only affects unit count in setup
    this.difficulty = difficulty;
    this.index      = 0;
  }

  sqDist(ax, ay, bx, by) {
    return (ax-bx)*(ax-bx) + (ay-by)*(ay-by);
  }

  nearestOpponent(unit, opponents) {
    let minD = Infinity, nearest = 0;
    opponents.forEach((opp, i) => {
      const d = this.sqDist(unit.mapX, unit.mapY, opp.mapX, opp.mapY);
      if (d < minD) { minD = d; nearest = i; }
    });
    return { idx: nearest, dist: minD };
  }

  // Returns final {x, y} destination (greedy move toward target)
  greedyMove(unit, target, map) {
    let cx = unit.mapX, cy = unit.mapY;
    let left = unit.speed;
    const dirs = [[0,-1],[0,1],[-1,0],[1,0]];

    while (left > 0) {
      let best = null, bestDist = this.sqDist(cx, cy, target.mapX, target.mapY);
      for (const [dx, dy] of dirs) {
        const nx = cx + dx, ny = cy + dy;
        if (!inMap(nx, ny)) continue;
        const t = map.tile(nx, ny);
        if (!t.checkMove(CMD.MOVE)) continue;
        const d = this.sqDist(nx, ny, target.mapX, target.mapY);
        if (d < bestDist) { bestDist = d; best = { x: nx, y: ny }; }
      }
      if (!best) break;
      cx = best.x; cy = best.y;
      left--;
      if (bestDist <= 1) break;
    }
    return { x: cx, y: cy };
  }

  // Run one AI unit's turn; returns action descriptor
  runNext(aiPlayer, opponent, map) {
    if (this.index >= aiPlayer.units.length) return null;
    const unit = aiPlayer.units[this.index];
    const { idx, dist } = this.nearestOpponent(unit, opponent.units);
    const target = opponent.units[idx];
    this.index++;
    if (dist <= 1) {
      return { action: 'attack', unit, targetIdx: idx };
    } else {
      const dest = this.greedyMove(unit, target, map);
      return { action: 'move', unit, dest };
    }
  }

  reset() { this.index = 0; }

  allDone(aiPlayer) { return this.index >= aiPlayer.units.length; }
}

// ─── Flash message ────────────────────────────────────────────────────────────

class Flash {
  constructor() { this.msg = ''; this.timer = 0; }
  show(msg, frames = 90) { this.msg = msg; this.timer = frames; }
  update() { if (this.timer > 0) this.timer--; }
  active() { return this.timer > 0; }
}

// ─── End-turn animation state ─────────────────────────────────────────────────

// turn.png is 512×128, two 256×128 frames — P1 left, P2 right
class TurnAnim {
  constructor() { this.active = false; this.player = 0; this.frame = 0; this.maxFrames = 30; }
  start(player) { this.active = true; this.player = player; this.frame = 0; }
  update() { if (this.active && ++this.frame >= this.maxFrames) this.active = false; }
}

// ─── Game ─────────────────────────────────────────────────────────────────────

const GSTATE = { MENU:0, DIFFICULTY:1, PLACEMENT:2, GAME:3, GAMEOVER:4 };
const PHASE  = { SELECT:0, COMMAND:1, MOVE:2, ATTACK:3 };

class Game {
  constructor(canvas) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.gstate  = GSTATE.MENU;
    this.players = [new Player(P1), new Player(P2)];
    this.map     = new GameMap();
    this.flash   = new Flash();
    this.turnAnim = new TurnAnim();
    this.ai      = null;

    // Game settings
    this.gameType       = 'aigame'; // 'aigame' | 'hotseat'
    this.aiDifficulty   = 0;
    this.totalTurns     = 99;
    this.currentTurn    = 1;
    this.playerTurn     = P1;
    this.isOver         = false;
    this.winner         = -1;

    // Placement state
    this.placingPlayer    = P1;
    this.selectedUnitType = 0;

    // In-game selection
    this.phase          = PHASE.SELECT;
    this.selectedUnit   = null;  // Unit instance
    this.selectedPlayer = P1;
    this.moveRange      = new Set();
    this.attackRange    = new Set();
    this.hoveredTile    = { x:0, y:0 };
    this.hoveredUnit    = null;  // for info panel

    // AI timing
    this.aiDelay        = 0;

    // Mouse
    this.mouseX = 0;
    this.mouseY = 0;

    this._bindInput();
  }

  // ── Input ──────────────────────────────────────────────────────────────────

  _bindInput() {
    this.canvas.addEventListener('click',       e => this._onClick(e));
    this.canvas.addEventListener('contextmenu', e => { e.preventDefault(); this._onRightClick(); });
    this.canvas.addEventListener('mousemove',   e => this._onMouseMove(e));
    document.addEventListener('keydown',        e => this._onKey(e));
  }

  _canvasPos(e) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: Math.round((e.clientX - r.left) * (this.canvas.width  / r.width)),
      y: Math.round((e.clientY - r.top)  * (this.canvas.height / r.height))
    };
  }

  _onMouseMove(e) {
    const p = this._canvasPos(e);
    this.mouseX = p.x; this.mouseY = p.y;
    this.hoveredTile = { x: appToMapX(p.x), y: appToMapY(p.y) };
  }

  _onClick(e) {
    const p  = this._canvasPos(e);
    const mx = appToMapX(p.x), my = appToMapY(p.y);
    switch (this.gstate) {
      case GSTATE.MENU:       this._menuClick(p);       break;
      case GSTATE.DIFFICULTY: this._diffClick(p);       break;
      case GSTATE.PLACEMENT:  this._placementClick(mx, my, p); break;
      case GSTATE.GAME:       this._gameClick(mx, my, p);      break;
      case GSTATE.GAMEOVER:   this._enterMenu();        break;
    }
  }

  _onRightClick() {
    if (this.gstate !== GSTATE.GAME) return;
    this._cancelCommand();
  }

  _onKey(e) {
    if (this.gstate === GSTATE.GAME) {
      if (e.key === 'F1') { this.map.drawGrid = !this.map.drawGrid; e.preventDefault(); }
      if (e.key === 'F2') { this._tryEndPlayerTurn(); e.preventDefault(); }
      if (e.key === 'Escape') this._cancelCommand();
    }
  }

  // ── Main loop ──────────────────────────────────────────────────────────────

  update() {
    this.flash.update();
    this.turnAnim.update();

    if (this.gstate === GSTATE.GAME) {
      this._updateGame();
    }
  }

  _updateGame() {
    if (this.isOver) return;

    // AI turn
    if (this.gameType === 'aigame' && this.playerTurn === P2 && !this.turnAnim.active) {
      if (this.aiDelay > 0) { this.aiDelay--; return; }
      if (!this.ai.allDone(this.players[P2])) {
        const act = this.ai.runNext(this.players[P2], this.players[P1], this.map);
        if (act) this._executeAIAction(act);
        this.aiDelay = 30; // pause between AI actions
      } else {
        this.ai.reset();
        this._playerEndTurn();
      }
    }

    // Update hovered unit info
    const { x, y } = this.hoveredTile;
    this.hoveredUnit = null;
    for (const pl of this.players) {
      const idx = pl.findUnitAt(x, y);
      if (idx !== -1) { this.hoveredUnit = pl.units[idx]; break; }
    }
  }

  // ── Menu state ─────────────────────────────────────────────────────────────

  _menuClick(p) {
    // Buttons drawn at x=300, y starting 250, height 44, gap 10
    const bx = 250, bw = 300;
    const buttons = [
      { label: 'Single Player vs AI', y: 250 },
      { label: 'Hot Seat',            y: 304 },
      { label: 'Multiplayer (N/A)',   y: 358, disabled: true },
    ];
    for (let i = 0; i < buttons.length; i++) {
      const b = buttons[i];
      if (b.disabled) continue;
      if (p.x >= bx && p.x <= bx+bw && p.y >= b.y && p.y <= b.y+44) {
        if (i === 0) { this.gameType = 'aigame';   this.gstate = GSTATE.DIFFICULTY; }
        if (i === 1) { this.gameType = 'hotseat';  this._startPlacement(); }
      }
    }
  }

  _diffClick(p) {
    const bx = 250, bw = 300;
    const diffs = [
      { label: 'Easy',   y: 250, val: 0 },
      { label: 'Normal', y: 304, val: 1 },
      { label: 'Hard',   y: 358, val: 2 },
    ];
    for (const d of diffs) {
      if (p.x >= bx && p.x <= bx+bw && p.y >= d.y && p.y <= d.y+44) {
        this.aiDifficulty = d.val;
        this._startPlacement();
      }
    }
    // Back button
    if (p.x >= bx && p.x <= bx+bw && p.y >= 412 && p.y <= 456) {
      this.gstate = GSTATE.MENU;
    }
  }

  _enterMenu() {
    this.gstate     = GSTATE.MENU;
    this.players    = [new Player(P1), new Player(P2)];
    this.map        = new GameMap();
    this.isOver     = false;
    this.winner     = -1;
    this.currentTurn = 1;
    this.playerTurn  = P1;
  }

  // ── Placement state ────────────────────────────────────────────────────────

  _startPlacement() {
    this.players      = [new Player(P1), new Player(P2)];
    this.map          = new GameMap();
    this.placingPlayer = P1;
    this.selectedUnitType = 0;
    this.gstate = GSTATE.PLACEMENT;
  }

  _placementClick(mx, my, p) {
    // Click unit palette (right side, y=80..230)
    const palX = 580;
    for (let i = 0; i < 3; i++) {
      const ty = 80 + i * 70;
      if (p.x >= palX && p.x <= palX+180 && p.y >= ty && p.y <= ty+64) {
        this.selectedUnitType = i;
        return;
      }
    }

    // Ready button
    const readyY = 420;
    if (p.x >= palX && p.x <= palX+180 && p.y >= readyY && p.y <= readyY+44) {
      const placing = this.players[this.placingPlayer];
      if (placing.units.length === 0) {
        this.flash.show('Place at least one unit!');
        return;
      }
      if (this.gameType === 'aigame' && this.placingPlayer === P1) {
        this._aiGenerateUnits();
        this._beginGame();
      } else if (this.gameType === 'hotseat') {
        if (this.placingPlayer === P1) {
          this.placingPlayer = P2;
        } else {
          this._beginGame();
        }
      }
      return;
    }

    // Click on map
    if (!inMap(mx, my)) return;
    const t = this.map.tile(mx, my);
    const cur = this.players[this.placingPlayer];

    // Validate placement zone
    if (this.placingPlayer === P1 && mx >= CENTER_X) return;
    if (this.placingPlayer === P2 && mx <  CENTER_X) return;

    // Must be passable
    if (t.type === TILE.WATER) return;

    // Toggle: click occupied tile removes own unit
    const existIdx = cur.findUnitAt(mx, my);
    if (existIdx !== -1) {
      t.hasUnit = false;
      const removed = cur.units.splice(existIdx, 1)[0];
      cur.unmoved--;
      return;
    }

    // Must not exceed max
    if (cur.units.length >= MAX_UNITS) {
      this.flash.show(`Max ${MAX_UNITS} units per player`);
      return;
    }

    const u = new Unit(cur.units.length, this.selectedUnitType, this.placingPlayer);
    u.setMapCoord(mx, my);
    t.hasUnit = true;
    cur.addUnit(u);
  }

  _aiGenerateUnits() {
    const totalUnits = 4 + this.aiDifficulty;
    const p2 = this.players[P2];
    let placed = 0;
    let attempts = 0;
    while (placed < totalUnits && attempts < 1000) {
      attempts++;
      const mx = CENTER_X + Math.floor(Math.random() * CENTER_X);
      const my = Math.floor(Math.random() * ROWS);
      const t  = this.map.tile(mx, my);
      if (t.type === TILE.WATER || t.hasUnit) continue;
      const type = Math.floor(Math.random() * 3);
      const u = new Unit(placed, type, P2);
      u.setMapCoord(mx, my);
      t.hasUnit = true;
      p2.addUnit(u);
      placed++;
    }
  }

  _beginGame() {
    this.gstate      = GSTATE.GAME;
    this.currentTurn = 1;
    this.playerTurn  = P1;
    this.isOver      = false;
    this.phase       = PHASE.SELECT;
    this.selectedUnit = null;
    this.players[P1].newTurn();
    this.players[P2].newTurn();
    if (this.gameType === 'aigame') {
      this.ai = new EasyAI(this.aiDifficulty);
    }
    this.flash.show("Player 1's Turn", 90);
  }

  // ── Game click ─────────────────────────────────────────────────────────────

  _gameClick(mx, my, p) {
    if (this.isOver) return;
    if (this.gameType === 'aigame' && this.playerTurn === P2) return; // AI acts autonomously
    if (this.turnAnim.active) return;

    const inMapArea = inMap(mx, my);

    // Check command menu clicks (right panel)
    const cmdResult = this._checkCommandClick(p);
    if (cmdResult !== -1) {
      this._issueCommand(cmdResult);
      return;
    }

    // Map area clicks
    if (!inMapArea) return;

    if (this.phase === PHASE.SELECT || this.phase === PHASE.COMMAND) {
      // Try to select own unit
      const own = this.players[this.playerTurn];
      const idx = own.findUnitAt(mx, my);
      if (idx !== -1 && this.phase !== PHASE.COMMAND) {
        this._selectUnit(own.units[idx]);
        return;
      }
    }

    if (this.phase === PHASE.MOVE) {
      const key = `${mx},${my}`;
      if (this.moveRange.has(key)) {
        this._moveUnit(mx, my);
      } else {
        // Clicking non-highlighted tile cancels
        this._cancelCommand();
      }
      return;
    }

    if (this.phase === PHASE.ATTACK) {
      const key = `${mx},${my}`;
      if (this.attackRange.has(key)) {
        const oppPlayer = this.players[1 - this.playerTurn];
        const oppIdx = oppPlayer.findUnitAt(mx, my);
        if (oppIdx !== -1) {
          this._attackUnit(oppPlayer, oppIdx);
          return;
        }
      }
      this._cancelCommand();
    }
  }

  _checkCommandClick(p) {
    if (this.phase !== PHASE.COMMAND) return -1;
    // Must match _renderCommandMenu layout: rp=552, col1=560, col2=630, rows=[432,466,500]
    const col1x = 560, col2x = 630;
    const rows  = [432, 466, 500];
    const bw = 64, bh = 30;

    for (let row = 0; row < 3; row++) {
      const y = rows[row];
      if (p.y >= y && p.y <= y + bh) {
        if (p.x >= col1x && p.x <= col1x + bw) return row;     // MOVE,ATTACK,SPELL
        if (p.x >= col2x && p.x <= col2x + bw) return row + 3; // DEFEND,ITEM,END
      }
    }
    return -1;
  }

  _selectUnit(unit) {
    if (unit.stage === STAGE.ENDTURN) {
      this.flash.show('Unit already ended turn');
      return;
    }
    this.selectedUnit = unit;
    this.phase        = PHASE.COMMAND;
    this.moveRange    = new Set();
    this.attackRange  = new Set();
  }

  _issueCommand(cmd) {
    const unit = this.selectedUnit;
    if (!unit) return;

    switch (cmd) {
      case CMD.MOVE:
        if (unit.stage !== STAGE.NEW) { this.flash.show('Already moved'); return; }
        this.moveRange = computeMoveRange(this.map, unit.mapX, unit.mapY, unit.speed);
        this.phase     = PHASE.MOVE;
        break;
      case CMD.ATTACK:
        if (unit.stage >= STAGE.ATTACKED) { this.flash.show('Already attacked'); return; }
        this.attackRange = computeAttackRange(unit.mapX, unit.mapY);
        this.phase       = PHASE.ATTACK;
        break;
      case CMD.SPELL:
        this.flash.show('Spell not implemented');
        break;
      case CMD.DEFEND:
        unit.stage = STAGE.DEFENDING;
        this.players[this.playerTurn].unitEndTurn();
        this._afterUnitAction();
        break;
      case CMD.ITEM:
        this.flash.show('No items available');
        break;
      case CMD.END:
        unit.stage = STAGE.ENDTURN;
        this.players[this.playerTurn].unitEndTurn();
        this._afterUnitAction();
        break;
    }
  }

  _moveUnit(mx, my) {
    const unit = this.selectedUnit;
    this.map.tile(unit.mapX, unit.mapY).hasUnit = false;
    unit.setMapCoord(mx, my);
    this.map.tile(mx, my).hasUnit = true;
    unit.stage = STAGE.MOVED;
    this.moveRange = new Set();
    this.phase     = PHASE.COMMAND;
    this.flash.show('Moved');
  }

  _attackUnit(oppPlayer, oppIdx) {
    const attacker = this.selectedUnit;
    const defender = oppPlayer.units[oppIdx];
    const accuracy = attacker.calculateAccuracy(defender.evade);
    const roll     = Math.random();

    if (roll < accuracy) {
      const dmg = Math.max(1, attacker.attack - defender.defend);
      defender.applyDamage(dmg);
      this.flash.show(`Hit! ${dmg} damage`);
    } else {
      this.flash.show('Miss!');
    }

    attacker.stage = STAGE.ATTACKED;
    this.attackRange = new Set();
    this.phase = PHASE.COMMAND;

    if (defender.dead) {
      this.map.tile(defender.mapX, defender.mapY).hasUnit = false;
      oppPlayer.killUnit(oppIdx);
      this.flash.show('Enemy defeated!', 120);
      if (oppPlayer.units.length === 0) {
        this.winner = this.playerTurn;
        this.isOver = true;
        this.gstate = GSTATE.GAMEOVER;
      }
    }

    this.players[this.playerTurn].unitEndTurn();
    this._afterUnitAction();
  }

  _cancelCommand() {
    if (this.phase === PHASE.MOVE || this.phase === PHASE.ATTACK) {
      this.moveRange   = new Set();
      this.attackRange = new Set();
      this.phase       = PHASE.COMMAND;
    } else {
      this.selectedUnit = null;
      this.phase        = PHASE.SELECT;
    }
  }

  _afterUnitAction() {
    const cur = this.players[this.playerTurn];
    if (cur.unmoved <= 0) {
      this._playerEndTurn();
    } else {
      this.selectedUnit = null;
      this.phase        = PHASE.SELECT;
    }
  }

  _tryEndPlayerTurn() {
    this._playerEndTurn();
  }

  _playerEndTurn() {
    this.players[this.playerTurn].unmoved = 0;
    this.selectedUnit  = null;
    this.phase         = PHASE.SELECT;
    this.moveRange     = new Set();
    this.attackRange   = new Set();

    const wasTurn = this.playerTurn;
    this.playerTurn = 1 - this.playerTurn;

    if (wasTurn === P2) {
      this.currentTurn++;
      if (this.currentTurn >= this.totalTurns) {
        // Turn limit — determine winner by unit count
        const p1 = this.players[P1].units.length;
        const p2 = this.players[P2].units.length;
        this.winner = (p1 >= p2) ? P1 : P2;
        this.isOver = true;
        this.gstate = GSTATE.GAMEOVER;
        return;
      }
    }

    this.players[this.playerTurn].newTurn();

    if (this.gameType === 'aigame') {
      this.ai.reset();
      this.aiDelay = 40;
    }

    this.turnAnim.start(this.playerTurn);
    this.flash.show(`Player ${this.playerTurn + 1}'s Turn`, 90);
  }

  // ── AI action execution ────────────────────────────────────────────────────

  _executeAIAction(act) {
    if (act.action === 'move') {
      const u = act.unit;
      if (act.dest.x !== u.mapX || act.dest.y !== u.mapY) {
        this.map.tile(u.mapX, u.mapY).hasUnit = false;
        u.setMapCoord(act.dest.x, act.dest.y);
        this.map.tile(act.dest.x, act.dest.y).hasUnit = true;
        u.stage = STAGE.MOVED;
      }
      u.stage = STAGE.ENDTURN;
      this.players[P2].unitEndTurn();
    } else if (act.action === 'attack') {
      const attacker = act.unit;
      const defender = this.players[P1].units[act.targetIdx];
      if (!defender) return;
      const accuracy = attacker.calculateAccuracy(defender.evade);
      const roll = Math.random();
      if (roll < accuracy) {
        const dmg = Math.max(1, attacker.attack - defender.defend);
        defender.applyDamage(dmg);
        this.flash.show(`AI Hit! ${dmg} damage`, 60);
      } else {
        this.flash.show('AI Missed!', 60);
      }
      attacker.stage = STAGE.ATTACKED;
      attacker.stage = STAGE.ENDTURN;
      this.players[P2].unitEndTurn();

      if (defender.dead) {
        this.map.tile(defender.mapX, defender.mapY).hasUnit = false;
        this.players[P1].killUnit(act.targetIdx);
        if (this.players[P1].units.length === 0) {
          this.winner = P2;
          this.isOver = true;
          this.gstate = GSTATE.GAMEOVER;
        }
      }
    }
  }

  // ── Rendering ──────────────────────────────────────────────────────────────

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    switch (this.gstate) {
      case GSTATE.MENU:       this._renderMenu();       break;
      case GSTATE.DIFFICULTY: this._renderDifficulty(); break;
      case GSTATE.PLACEMENT:  this._renderPlacement();  break;
      case GSTATE.GAME:       this._renderGame();       break;
      case GSTATE.GAMEOVER:   this._renderGameOver();   break;
    }

    // Flash overlay
    if (this.flash.active()) {
      ctx.save();
      ctx.font = 'bold 18px sans-serif';
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(10, 8, ctx.measureText(this.flash.msg).width + 16, 30);
      ctx.fillStyle = '#fff';
      ctx.fillText(this.flash.msg, 18, 28);
      ctx.restore();
    }
  }

  _renderMenu() {
    const ctx = this.ctx;

    // Background
    if (assets['background'] && assets['background'].complete) {
      ctx.drawImage(assets['background'], 0, 0, this.canvas.width, this.canvas.height);
    } else {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Title
    ctx.save();
    ctx.font = 'bold 40px serif';
    ctx.fillStyle = '#e8c87a';
    ctx.textAlign = 'center';
    ctx.fillText('Tactics Game', this.canvas.width / 2, 160);
    ctx.font = '16px serif';
    ctx.fillStyle = '#aaa';
    ctx.fillText('MSc Games Programming — University of Hull', this.canvas.width / 2, 195);
    ctx.restore();

    const buttons = [
      { label: 'Single Player vs AI', y: 250, disabled: false },
      { label: 'Hot Seat (Local)',     y: 304, disabled: false },
      { label: 'Multiplayer (N/A)',    y: 358, disabled: true  },
    ];
    this._drawButtons(buttons);
  }

  _renderDifficulty() {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save();
    ctx.font = 'bold 32px serif';
    ctx.fillStyle = '#e8c87a';
    ctx.textAlign = 'center';
    ctx.fillText('Select Difficulty', this.canvas.width / 2, 180);
    ctx.restore();

    const buttons = [
      { label: 'Easy',   y: 250 },
      { label: 'Normal', y: 304 },
      { label: 'Hard',   y: 358 },
      { label: 'Back',   y: 412 },
    ];
    this._drawButtons(buttons);
  }

  _drawButtons(buttons) {
    const ctx = this.ctx;
    const bx = 250, bw = 300, bh = 44;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '20px sans-serif';
    for (const b of buttons) {
      ctx.fillStyle = b.disabled ? '#333' : '#2d4a7a';
      ctx.fillRect(bx, b.y, bw, bh);
      ctx.strokeStyle = b.disabled ? '#555' : '#6ea8d8';
      ctx.strokeRect(bx, b.y, bw, bh);
      ctx.fillStyle = b.disabled ? '#666' : '#fff';
      ctx.fillText(b.label, bx + bw / 2, b.y + bh * 0.65);
    }
    ctx.restore();
  }

  _renderPlacement() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0d1b2a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this._renderMap(false);
    this._renderPlacingZone();
    this._renderUnits();
    this._renderPlacementUI();
  }

  _renderPlacingZone() {
    const ctx = this.ctx;
    // Highlight valid placement zone
    const minCol = this.placingPlayer === P1 ? 0 : CENTER_X;
    const maxCol = this.placingPlayer === P1 ? CENTER_X : COLS;
    ctx.fillStyle = 'rgba(100,200,100,0.15)';
    for (let x = minCol; x < maxCol; x++) {
      for (let y = 0; y < ROWS; y++) {
        const t = this.map.tile(x, y);
        if (t.type !== TILE.WATER) {
          ctx.fillRect(mapToAppX(x), mapToAppY(y), TILE_SIZE, TILE_SIZE);
        }
      }
    }
  }

  _renderPlacementUI() {
    const ctx = this.ctx;
    const palX = 578;

    ctx.save();
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(`Player ${this.placingPlayer + 1} Placement`, palX, 36);

    const cur = this.players[this.placingPlayer];
    ctx.fillStyle = '#aaa';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Units: ${cur.units.length} / ${MAX_UNITS}`, palX, 56);
    ctx.fillText('Click unit type, then tile', palX, 74);

    // Unit palette
    const texNames = ['militia','archer','sorcerer'];
    for (let i = 0; i < 3; i++) {
      const ty = 80 + i * 70;
      const selected = (this.selectedUnitType === i);
      ctx.fillStyle = selected ? '#2d4a7a' : '#1a2a3a';
      ctx.fillRect(palX, ty, 180, 64);
      ctx.strokeStyle = selected ? '#6ea8d8' : '#345';
      ctx.lineWidth = selected ? 2 : 1;
      ctx.strokeRect(palX, ty, 180, 64);

      // Unit sprite: first frame (SOUTH, frame 0) = sx=0,sy=0
      const tex = assets[texNames[i]];
      if (tex && tex.complete) {
        ctx.drawImage(tex, 0, 0, SPRITE_W, SPRITE_H, palX + 2, ty, 64, 64);
      }

      const def = UNIT_DEFS[i];
      ctx.fillStyle = '#ddd';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(def.name, palX + 70, ty + 18);
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#aaa';
      ctx.fillText(`HP:${def.hp} AT:${def.at} DF:${def.df} SP:${def.sp}`, palX + 70, ty + 36);
    }

    // Ready button
    const readyY = 420;
    ctx.fillStyle = cur.units.length > 0 ? '#2d7a4a' : '#333';
    ctx.fillRect(palX, readyY, 180, 44);
    ctx.strokeStyle = cur.units.length > 0 ? '#6ed89a' : '#555';
    ctx.strokeRect(palX, readyY, 180, 44);
    ctx.fillStyle = cur.units.length > 0 ? '#fff' : '#666';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Ready', palX + 90, readyY + 28);
    ctx.restore();
  }

  _renderGame() {
    const ctx = this.ctx;
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this._renderMap(true);
    this._renderIndicators();
    this._renderUnits();
    this._renderCursor();
    this._renderGameUI();
    this._renderTurnAnim();
  }

  _renderMap(renderGrid) {
    const ctx = this.ctx;
    const mapImg = assets['map'];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const t    = this.map.tiles[y][x];
        const px   = mapToAppX(x), py = mapToAppY(y);
        if (mapImg && mapImg.complete) {
          // map.png: 192×64, tiles at sx=type*64, sy=0
          ctx.drawImage(mapImg, t.type * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE, px, py, TILE_SIZE, TILE_SIZE);
        } else {
          const colors = ['#4a7a3a','#3a6aaa','#9a8a7a'];
          ctx.fillStyle = colors[t.type] || '#888';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    if (renderGrid && this.map.drawGrid) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(mapToAppX(x), MAP_TOP);
        ctx.lineTo(mapToAppX(x), mapToAppY(ROWS));
        ctx.stroke();
      }
      for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(MAP_LEFT, mapToAppY(y));
        ctx.lineTo(mapToAppX(COLS), mapToAppY(y));
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  _renderIndicators() {
    const ctx    = this.ctx;
    const cursor = assets['cursor'];

    for (const key of this.moveRange) {
      const [mx, my] = key.split(',').map(Number);
      if (cursor && cursor.complete) {
        ctx.drawImage(cursor, 64, 0, TILE_SIZE, TILE_SIZE, mapToAppX(mx), mapToAppY(my), TILE_SIZE, TILE_SIZE);
      } else {
        ctx.fillStyle = 'rgba(80,120,255,0.45)';
        ctx.fillRect(mapToAppX(mx), mapToAppY(my), TILE_SIZE, TILE_SIZE);
      }
    }

    for (const key of this.attackRange) {
      const [mx, my] = key.split(',').map(Number);
      if (cursor && cursor.complete) {
        ctx.drawImage(cursor, 128, 0, TILE_SIZE, TILE_SIZE, mapToAppX(mx), mapToAppY(my), TILE_SIZE, TILE_SIZE);
      } else {
        ctx.fillStyle = 'rgba(255,80,80,0.45)';
        ctx.fillRect(mapToAppX(mx), mapToAppY(my), TILE_SIZE, TILE_SIZE);
      }
    }
  }

  _renderUnits() {
    const ctx = this.ctx;
    const cursor = assets['cursor'];
    const texNames = ['militia','archer','sorcerer'];
    const ownerColors = ['#3af','#f73'];

    for (let pi = 0; pi < 2; pi++) {
      const pl = this.players[pi];
      for (const unit of pl.units) {
        const px = mapToAppX(unit.mapX), py = mapToAppY(unit.mapY);

        // Owner cursor below unit (cursor.png row 1: sy=64, sx = owner*64)
        if (cursor && cursor.complete) {
          ctx.drawImage(cursor, unit.owner * TILE_SIZE, TILE_SIZE, TILE_SIZE, TILE_SIZE, px, py, TILE_SIZE, TILE_SIZE);
        } else {
          ctx.fillStyle = ownerColors[unit.owner] + '55';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        }

        // Unit sprite: SOUTH direction, frame 0 for static; grey out if ENDTURN
        const tex = assets[texNames[unit.type]];
        if (tex && tex.complete) {
          if (unit.stage === STAGE.ENDTURN || unit.stage === STAGE.DEFENDING) {
            ctx.save();
            ctx.globalAlpha = 0.5;
          }
          ctx.drawImage(tex, 0, 0, SPRITE_W, SPRITE_H, px, py, TILE_SIZE, TILE_SIZE);
          if (unit.stage === STAGE.ENDTURN || unit.stage === STAGE.DEFENDING) {
            ctx.restore();
          }
        } else {
          ctx.fillStyle = ownerColors[unit.owner];
          ctx.fillRect(px+8, py+8, TILE_SIZE-16, TILE_SIZE-16);
          ctx.fillStyle = '#fff';
          ctx.font = '10px sans-serif';
          ctx.fillText(unit.name[0], px + TILE_SIZE/2 - 4, py + TILE_SIZE/2 + 4);
        }

        // HP bar
        const barW = TILE_SIZE - 4;
        const hpW  = Math.max(0, Math.round(barW * unit.hp / unit.maxHP));
        ctx.fillStyle = '#333';
        ctx.fillRect(px + 2, py + TILE_SIZE - 6, barW, 4);
        ctx.fillStyle = unit.hp / unit.maxHP > 0.5 ? '#4d4' : unit.hp / unit.maxHP > 0.25 ? '#da4' : '#d44';
        ctx.fillRect(px + 2, py + TILE_SIZE - 6, hpW, 4);
      }
    }

    // Highlight selected unit
    if (this.selectedUnit) {
      const u  = this.selectedUnit;
      const px = mapToAppX(u.mapX), py = mapToAppY(u.mapY);
      ctx.save();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth   = 2;
      ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      ctx.restore();
    }
  }

  _renderCursor() {
    const ctx    = this.ctx;
    const cursor = assets['cursor'];
    const { x, y } = this.hoveredTile;
    if (!inMap(x, y)) return;
    const px = mapToAppX(x), py = mapToAppY(y);
    if (cursor && cursor.complete) {
      ctx.drawImage(cursor, 0, 0, TILE_SIZE, TILE_SIZE, px, py, TILE_SIZE, TILE_SIZE);
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
    }
  }

  _renderGameUI() {
    const ctx = this.ctx;
    const rp  = 552; // right panel x start

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(rp, 0, this.canvas.width - rp, this.canvas.height);

    // Turn / game info
    ctx.fillStyle = '#e8c87a';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`Turn: ${this.currentTurn} / ${this.totalTurns}`, rp + 8, 24);

    const pty = this.playerTurn;
    ctx.fillStyle = pty === P1 ? '#5af' : '#fa5';
    ctx.fillText(`Player ${pty + 1}'s Turn`, rp + 8, 44);

    const cur = this.players[pty];
    ctx.fillStyle = '#ccc';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Units ready: ${Math.max(0, cur.unmoved)} / ${cur.units.length}`, rp + 8, 64);

    // Hovered unit info (or selected)
    const infoUnit = this.selectedUnit || this.hoveredUnit;
    if (infoUnit) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px sans-serif';
      const ownerLabel = infoUnit.owner === P1 ? ' (P1)' : ' (P2)';
      ctx.fillText(infoUnit.name + ownerLabel, rp + 8, 100);
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#ccc';
      const lines = [
        `HP: ${infoUnit.hp} / ${infoUnit.maxHP}`,
        `MP: ${infoUnit.mp} / ${infoUnit.maxMP}`,
        `AT: ${infoUnit.attack}   DF: ${infoUnit.defend}`,
        `SO: ${infoUnit.sorcery}  SP: ${infoUnit.speed}`,
        `HR: ${(infoUnit.hitRate*100).toFixed(0)}%  ER: ${(infoUnit.evade*100).toFixed(0)}%`,
        `Coord: (${infoUnit.mapX}, ${infoUnit.mapY})`,
        `Stage: ${STAGE_LABEL[infoUnit.stage]}`,
      ];
      lines.forEach((ln, i) => ctx.fillText(ln, rp + 8, 120 + i * 18));
    }

    // Phase label
    const phaseLabels = ['Select Unit','Choose Command','Select Tile to Move','Select Target'];
    ctx.fillStyle = '#8df';
    ctx.font = '12px sans-serif';
    ctx.fillText(phaseLabels[this.phase], rp + 8, 260);

    // Command menu (only when unit is selected)
    if (this.selectedUnit && this.phase === PHASE.COMMAND) {
      this._renderCommandMenu(rp);
    }

    // Hint
    ctx.fillStyle = '#555';
    ctx.font = '11px sans-serif';
    ctx.fillText('Right-click / Esc: cancel', rp + 8, this.canvas.height - 46);
    ctx.fillText('F1: toggle grid   F2: end turn', rp + 8, this.canvas.height - 30);

    ctx.restore();
  }

  _renderCommandMenu(rp) {
    const ctx   = this.ctx;
    const cmdImg = assets['command'];
    // Layout: 2 columns (MOVE/ATTACK/SPELL left, DEFEND/ITEM/END right)
    // Each button 64×30, gap 4
    const col1 = 560, col2 = 630; // must match _checkCommandClick
    const rows = [432, 466, 500];
    const bw = 64, bh = 30;

    const cmds = [
      [CMD.MOVE, CMD.DEFEND],
      [CMD.ATTACK, CMD.ITEM],
      [CMD.SPELL, CMD.END],
    ];

    for (let row = 0; row < 3; row++) {
      const y = rows[row];
      for (let col = 0; col < 2; col++) {
        const cmdIdx = cmds[row][col];
        const x = col === 0 ? col1 : col2;
        if (cmdImg && cmdImg.complete) {
          // command.png: 128×192, unselected at sx=0, selected at sx=64
          // Each button row: sy = cmdIdx * 32
          ctx.drawImage(cmdImg, 0, cmdIdx * 32, 64, 32, x, y, bw, bh);
        } else {
          ctx.fillStyle = '#2d4a7a';
          ctx.fillRect(x, y, bw, bh);
          ctx.strokeStyle = '#6ea8d8';
          ctx.strokeRect(x, y, bw, bh);
          ctx.fillStyle = '#fff';
          ctx.font = '11px sans-serif';
          ctx.fillText(CMD_LABELS[cmdIdx], x + 4, y + 19);
        }
      }
    }
  }

  _renderTurnAnim() {
    if (!this.turnAnim.active) return;
    const ctx  = this.ctx;
    const turn = assets['turn'];
    const prog = this.turnAnim.frame / this.turnAnim.maxFrames;
    const alpha = prog < 0.3 ? prog / 0.3 : prog > 0.7 ? (1 - prog) / 0.3 : 1;

    ctx.save();
    ctx.globalAlpha = alpha;
    const lbl = `Player ${this.turnAnim.player + 1}'s Turn`;

    if (turn && turn.complete) {
      // turn.png: 512×128, P1 at sx=0, P2 at sx=256, each 256×128
      const sx = this.turnAnim.player * 256;
      const dw = 256, dh = 128;
      const dx = (this.canvas.width - dw) / 2;
      const dy = (this.canvas.height - dh) / 2;
      ctx.drawImage(turn, sx, 0, 256, 128, dx, dy, dw, dh);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(200, 220, 400, 80);
      ctx.fillStyle = this.turnAnim.player === P1 ? '#5af' : '#fa5';
      ctx.font = 'bold 32px serif';
      ctx.textAlign = 'center';
      ctx.fillText(lbl, this.canvas.width / 2, 270);
    }
    ctx.restore();
  }

  _renderGameOver() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0d1b2a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 48px serif';
    ctx.fillStyle = '#e8c87a';
    const txt = this.winner === -1 ? 'Draw!' : `Player ${this.winner + 1} Wins!`;
    ctx.fillText(txt, this.canvas.width / 2, 200);

    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Click anywhere to return to menu', this.canvas.width / 2, 280);
    ctx.restore();
  }
}

// ─── Entry point ──────────────────────────────────────────────────────────────

window.addEventListener('load', () => {
  const canvas = document.getElementById('game');
  canvas.width  = 800;
  canvas.height = 576;

  const ASSET_NAMES = ['map','militia','archer','sorcerer','cursor','command','turn'];

  loadAssets(ASSET_NAMES, 'assets/', () => {
    // Also try background separately (jpg)
    const bg = new Image();
    bg.onload = () => { assets['background'] = bg; };
    bg.src = 'assets/background.jpg';

    const game = new Game(canvas);

    let last = 0;
    function loop(ts) {
      if (ts - last >= 16) {
        last = ts;
        game.update();
        game.render();
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  });
});
