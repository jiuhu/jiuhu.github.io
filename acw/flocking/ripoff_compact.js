/*
    Copyright (C) 2009-2010, 2013, Ewe, YS (Team Water)

    Flocking AI variant — TheftShips move as a boid flock.
    One ship per wave is the leader (full state machine).
    All others are followers (separation + cohesion + alignment).
*/

// ─── Constants ────────────────────────────────────────────────────────────────

var FLOCKING_THIEF      = 0;
var FLOCKING_FIGHTER    = 1;
var FLOCKING_AGGRESSIVE = 2;

// ─── Entity hierarchy ─────────────────────────────────────────────────────────

Animation.prototype = new Entity();
function Animation() {
    this.m_frame = 1;
    this.m_maxFrame;
    this.m_currentFrame = 1;
}

Explosion.prototype = new Animation();
function Explosion() {
    var tx = 0;
    this.InitExplosion = function (x, y, radius, image, maxFrame) {
        this.x = x; this.y = y;
        this.m_radius  = radius * 2;
        this.offset    = -radius;
        this.m_image   = image;
        this.m_id      = g_world.count++;
        this.m_alive   = 1;
        this.m_maxFrame = maxFrame;
    };
    this.Draw = function () {
        g_context.setTransform(1, 0, 0, 1, this.x, this.y);
        g_context.drawImage(this.m_image, tx, 0, this.m_radius, this.m_radius,
                            this.offset, this.offset, this.m_radius, this.m_radius);
        this.m_frame++;
        if (this.m_frame > FRAME_RATE) { tx += this.m_radius; this.m_currentFrame++; this.m_frame = 0; }
        if (this.m_currentFrame === this.m_maxFrame) { this.Sleep(); }
    };
}

function Controller() {
    this.m_ship; this.m_down;
    this.SetShip          = function (ship) { this.m_down = false; this.m_ship = ship; };
    this.Down             = function () { this.m_down = true; };
    this.QueryDownStatus  = function () { return this.m_down; };
}

// ─── Player controller (unchanged) ────────────────────────────────────────────

P1Controller.prototype = new Controller();
function P1Controller() {
    var prevShot = 0;
    this.OnUpdate = function () {
        if (this.m_ship.QueryAlive()) {
            if (input.UP)    this.m_ship.Accelerate(1);
            if (input.RIGHT) this.m_ship.Steer(0.1);
            else if (input.LEFT) this.m_ship.Steer(-0.1);
            if (input.SHOOT && !prevShot) this.m_ship.Shoot();
            prevShot = input.SHOOT;
        }
    };
}

// ─── Flocking AI controller ───────────────────────────────────────────────────

FlockingAIController.prototype = new Controller();
function FlockingAIController() {
    var m_ship      = null;
    var m_isLeader  = false;
    var m_aiType    = FLOCKING_THIEF;
    var m_target    = null;
    var m_retreatX  = 0;
    var m_retreatY  = 0;
    var m_state     = null;
    var self        = this;

    // ── Boid behaviours ──────────────────────────────────────────────────────

    var separation = function () {
        var fx = 0, fy = 0;
        var zone = SHIP_RADIUS * 3.5;
        var thieves = g_world.m_thiefs;
        for (var i = thieves.length; i--;) {
            var o = thieves[i];
            if (o.m_id === m_ship.m_id || !o.m_alive) continue;
            var dx = m_ship.x - o.x, dy = m_ship.y - o.y;
            var dSq = dx * dx + dy * dy;
            if (dSq > 0 && dSq < zone * zone) {
                var d = Math.sqrt(dSq);
                var w = (zone - d) / zone;      // linear falloff
                fx += (dx / d) * w;
                fy += (dy / d) * w;
            }
        }
        return { x: fx, y: fy };
    };

    // Alignment: average heading of all thieves (weighted by leader's heading)
    var alignment = function () {
        var leader = g_world.m_flockLeader;
        if (leader && leader.m_alive) return leader.m_rotation;
        // fallback: average all thieves
        var sum = 0, count = 0;
        var thieves = g_world.m_thiefs;
        for (var i = thieves.length; i--;) {
            if (thieves[i].m_id !== m_ship.m_id && thieves[i].m_alive) {
                sum += thieves[i].m_rotation; count++;
            }
        }
        return count > 0 ? sum / count : m_ship.m_rotation;
    };

    // Cohesion: target position is leader position
    var cohesion = function () {
        var leader = g_world.m_flockLeader;
        if (leader && leader.m_alive) return { x: leader.x, y: leader.y };
        return { x: DimViewCentral.x, y: DimViewCentral.y };
    };

    // Seek a world position. Leaders go directly; followers apply boid forces.
    var seekPos = function (tx, ty) {
        if (m_isLeader) {
            m_ship.Pilot(1.0, GetVectorAngle(m_ship.x, m_ship.y, tx, ty));
        } else {
            var sep = separation();
            var SEP_SCALE = 55;
            var cx = tx + sep.x * SEP_SCALE;
            var cy = ty + sep.y * SEP_SCALE;
            var angle = GetVectorAngle(m_ship.x, m_ship.y, cx, cy);
            // Alignment: nudge heading toward leader's heading
            var leaderRot = alignment();
            var delta = leaderRot - angle;
            while (delta >  PI) delta -= TWO_PI;
            while (delta < -PI) delta += TWO_PI;
            angle += delta * 0.18;
            m_ship.Pilot(1.0, angle);
        }
    };

    // ── Utility ──────────────────────────────────────────────────────────────

    var selectNearest = function (list) {
        var best = list[0];
        var bestDSq = DistanceSq(m_ship.x, m_ship.y, best.x, best.y);
        for (var i = 1; i < list.length; i++) {
            var dSq = DistanceSq(m_ship.x, m_ship.y, list[i].x, list[i].y);
            if (dSq < bestDSq) { best = list[i]; bestDSq = dSq; }
        }
        return best;
    };

    var broadcast = function (fn) {
        var ctrls = g_world.m_flockControllers;
        for (var i = ctrls.length; i--;) {
            if (ctrls[i] !== self) fn(ctrls[i]);
        }
    };

    // ── Leader states ─────────────────────────────────────────────────────────

    var stateNavigate = function () {
        var untagged = [], alivePlayers = [];
        for (var i = g_world.m_diamonds.length; i--;) {
            var d = g_world.m_diamonds[i];
            if (!d.QueryTag() && d.QueryAlive()) untagged.push(d);
        }
        for (var i = g_world.m_players.length; i--;) {
            if (g_world.m_players[i].QueryAlive()) alivePlayers.push(g_world.m_players[i]);
        }

        if (m_aiType === FLOCKING_THIEF) {
            if (untagged.length > 0) {
                m_target = selectNearest(untagged);
                m_target.Tag();
                m_state = stateFoundDiamond;
                return;
            }
        } else if (m_aiType === FLOCKING_FIGHTER) {
            if (alivePlayers.length > 0) {
                m_target = selectNearest(alivePlayers);
                broadcast(function (c) { c.cmdAttack(m_target); });
                m_state = stateFoundPlayer;
                return;
            } else if (untagged.length > 0) {
                m_target = selectNearest(untagged);
                m_target.Tag();
                m_state = stateFoundDiamond;
                return;
            }
        } else { // FLOCKING_AGGRESSIVE
            if (alivePlayers.length > 0) {
                m_target = selectNearest(alivePlayers);
                broadcast(function (c) { c.cmdAttack(m_target); });
                m_state = stateFoundPlayer;
                return;
            }
        }
        seekPos(DimViewCentral.x, DimViewCentral.y);
    };

    var stateFoundDiamond = function () {
        if (!m_target || !m_target.QueryAlive()) {
            m_state = stateNavigate;
            return;
        }
        var dist = Distance(m_ship.x, m_ship.y, m_target.x, m_target.y);
        if (dist <= m_ship.m_radius * 1.5) {
            m_state = stateHookDiamond;
            return;
        }
        seekPos(m_target.x, m_target.y);
    };

    var stateHookDiamond = function () {
        if (!m_target || !m_target.QueryAlive()) {
            m_state = stateNavigate;
            return;
        }
        m_target.Hook(m_ship);
        m_retreatX = m_ship.x;
        m_retreatY = (m_ship.y > DimViewCentral.y)
            ? DimView.top    - SHIP_RADIUS * 3
            : DimView.bottom + SHIP_RADIUS * 3;
        m_state = stateRunWithDiamond;
    };

    var stateRunWithDiamond = function () {
        if (Distance(m_ship.x, m_ship.y, m_retreatX, m_retreatY) <= m_ship.m_radius) {
            m_state = stateMissionComplete;
            return;
        }
        seekPos(m_retreatX, m_retreatY);
    };

    var stateFoundPlayer = function () {
        if (!m_target || !m_target.QueryAlive()) {
            broadcast(function (c) { c.cmdFollowLeader(); });
            m_state = stateNavigate;
            return;
        }
        if (Distance(m_ship.x, m_ship.y, m_target.x, m_target.y) < m_ship.m_sensorRange) {
            m_state = stateAttack;
            return;
        }
        seekPos(m_target.x, m_target.y);
    };

    var stateAttack = function () {
        if (m_target && m_target.QueryAlive()) {
            m_ship.ShootRequest();
            seekPos(m_target.x, m_target.y);
        } else {
            m_target = null;
            broadcast(function (c) { c.cmdFollowLeader(); });
            m_state = stateNavigate;
        }
    };

    var stateMissionComplete = function () {
        m_ship.Sleep();
        self.Down();
    };

    // ── Follower states ───────────────────────────────────────────────────────

    var stateFollowLeader = function () {
        var c = cohesion();
        seekPos(c.x, c.y);
    };

    var stateFollowerAttack = function () {
        if (m_target && m_target.QueryAlive()) {
            m_ship.ShootRequest();
            var sep = separation();
            var cx = m_target.x + sep.x * 55;
            var cy = m_target.y + sep.y * 55;
            m_ship.Pilot(1.0, GetVectorAngle(m_ship.x, m_ship.y, cx, cy));
        } else {
            m_target = null;
            m_state = stateFollowLeader;
        }
    };

    // ── Public interface ──────────────────────────────────────────────────────

    this.InitFlocking = function (ship, aiType, isLeader) {
        m_ship     = ship;
        m_aiType   = aiType;
        m_isLeader = isLeader;
        this.m_down = false;
        m_state = isLeader ? stateNavigate : stateFollowLeader;
    };

    this.OnUpdate = function () {
        if (m_ship.QueryAlive()) {
            m_state.call(self);
        } else {
            self.Down();
        }
    };

    // Commands broadcast from leader to followers
    this.cmdAttack      = function (target) { m_target = target; m_state = stateFollowerAttack; };
    this.cmdFollowLeader = function ()       { m_target = null;   m_state = stateFollowLeader;  };

    // Promote this follower to leader (called when the leader dies)
    this.promoteToLeader = function () {
        m_isLeader = true;
        m_state    = stateNavigate;
        g_world.m_flockLeader = m_ship;
    };
}

// ─── Entity classes (unchanged from ripoff_compact) ───────────────────────────

function Entity() {
    this.x = 0; this.y = 0; this.m_type; this.m_id; this.m_image; this.m_radius; this.offset; this.m_alive; this.m_tag;
    this.InitEntity = function (x, y, radius, image) {
        this.x = x; this.y = y; this.m_radius = radius; this.offset = -radius;
        this.m_image = image; this.m_id = g_world.count++; this.m_alive = 1; this.m_tag = false;
    };
    this.OnUpdate   = function (stepSize) {};
    this.Draw       = function () { g_context.setTransform(1, 0, 0, 1, this.x, this.y); g_context.drawImage(this.m_image, this.offset, this.offset); };
    this.Sleep      = function () { this.m_alive = false; };
    this.Wake       = function () { this.m_alive = true; };
    this.QueryAlive = function () { return this.m_alive; };
    this.HasCollided = function (target) {
        if (!this.m_alive || !target.m_alive) return false;
        if (this.m_id === target.m_id) return false;
        return Distance(this.x, this.y, target.x, target.y) < (this.m_radius + target.m_radius);
    };
    this.Tag    = function () { this.m_tag = true; };
    this.Untag  = function () { this.m_tag = false; };
    this.QueryTag = function () { return this.m_tag; };
    this.OnCollide = function (entity) {};
}

RigidBody.prototype = new Entity();
function RigidBody() {
    this.m_mass = 1; this.m_drag = 0.8; this.m_velocity; this.m_rotation = 0; this.c = 1; this.s = 0; this.m_totalForce; this.m_maxSpeed;
    this.InitRigidBody = function (x, y, radius, image) {
        this.InitEntity(x, y, radius, image);
        this.m_totalForce = new Vector2();
        this.m_velocity   = new Vector2();
        this.SetRotation(0);
    };
    this.SetRotation = function (r) { this.m_rotation = r; this.c = Math.cos(r); this.s = Math.sin(r); };
    this.Rotate = function (r) {
        r += this.m_rotation;
        if (r > TWO_PI) r -= TWO_PI;
        else if (r < 0) r += TWO_PI;
        this.SetRotation(r);
    };
    this.Move = function (stepSize) {
        if (this.m_totalForce.Length() < EPSILON) {
            var l = this.m_velocity.Length();
            if (this.m_drag > l) this.m_velocity.Zero();
            else this.UpdateVelocity(l, l - this.m_drag * stepSize);
        } else {
            var step = stepSize / this.m_mass;
            this.m_velocity.Update(this.m_totalForce.x * step, -this.m_totalForce.y * step);
        }
        var len = this.m_velocity.Length();
        if (len > this.m_maxSpeed) this.UpdateVelocity(len, this.m_maxSpeed);
        this.x += this.m_velocity.x * stepSize;
        this.y += this.m_velocity.y * stepSize;
        this.m_totalForce.Zero();
    };
    this.UpdateVelocity = function (length, speed) {
        this.m_velocity.Mul(length > EPSILON ? speed / length : speed / EPSILON);
    };
    this.Draw = function () {
        if (this.QueryAlive()) {
            g_context.setTransform(this.c, this.s, -this.s, this.c, this.x, this.y);
            g_context.drawImage(this.m_image, this.offset, this.offset);
        }
    };
}

Ship.prototype = new RigidBody();
function Ship() {
    this.m_bullets; this.m_speed;
    this.Accelerate = function (a) { this.m_totalForce.Update(a * this.m_speed * this.s, a * this.m_speed * this.c); };
    this.Steer      = function (r) { this.Rotate(r); };
}

GuardianShip.prototype = new Ship();
function GuardianShip() {
    var m_respawnTime = 60;
    this.m_respawnPoint; this.m_respawnRotation; this.m_respawnTimer;
    this.InitGuardianShip = function (x, y, radius, image) {
        this.InitRigidBody(x, y, radius, image);
        this.m_type = Entity.PLAYER_SHIP;
        this.m_respawnPoint = new Vector2();
        this.m_respawnPoint.Set(x, y);
        this.m_respawnRotation = PI + HALF_PI;
        this.m_bullets = new Array();
        for (var i = PLAYER_BULLET_COUNT; i-- > 0;) this.m_bullets.push(g_world.SpawnBullet(Entity.PLAYER_BULLET));
        this.m_speed    = PLAYER_SPEED;
        this.m_maxSpeed = SHIP_MAX_SPEED;
        this.Sleep();
    };
    this.Shoot = function () {
        for (var i = PLAYER_BULLET_COUNT; i-- > 0;) {
            var b = this.m_bullets[i];
            if (!b.QueryAlive()) {
                b.x = this.x; b.y = this.y;
                b.SetRotation(this.m_rotation);
                b.m_velocity.Set(b.m_speed * b.s, b.m_speed * -b.c);
                b.Wake();
                break;
            }
        }
    };
    this.OnUpdate = function (stepSize) {
        if (!this.QueryAlive()) {
            this.m_respawnTimer++;
            if (this.m_respawnTimer > m_respawnTime) this.Spawn();
        }
    };
    this.OnCollide = function (entity) {
        if (entity.m_type === Entity.ENEMY_SHIP || entity.m_type === Entity.ENEMY_BULLET) {
            this.Kill();
            g_world.AddExplosion(this.x, this.y);
        }
    };
    this.OnOutOfBounds = function () {
        if (this.x > DimView.right)  { this.x = DimView.right;  this.m_velocity.x = -this.m_velocity.x; }
        else if (this.x < DimView.left) { this.x = DimView.left; this.m_velocity.x = -this.m_velocity.x; }
        if (this.y > DimView.bottom)    { this.y = DimView.bottom; this.m_velocity.y = -this.m_velocity.y; }
        else if (this.y < DimView.top)  { this.y = DimView.top;  this.m_velocity.y = -this.m_velocity.y; }
    };
    this.Kill  = function () { this.Sleep(); this.m_respawnTimer = 0; };
    this.Spawn = function () {
        this.x = this.m_respawnPoint.x; this.y = this.m_respawnPoint.y;
        this.m_velocity.Zero(); this.m_totalForce.Zero();
        this.SetRotation(this.m_respawnRotation);
        this.Wake();
    };
}

TheftShip.prototype = new Ship();
function TheftShip() {
    this.m_isPiloting; this.m_pilotRotation; this.m_pilotAcceleration; this.m_steerRate; this.m_shootRequest; this.m_shootCoolDown; this.m_sensorRange;
    this.InitTheftShip = function (x, y, radius, image, level) {
        this.InitRigidBody(x, y, radius, image);
        this.m_bullets       = new Array();
        this.m_type          = Entity.ENEMY_SHIP;
        this.m_maxSpeed      = THEIF_MAX_SPEED[level];
        this.m_speed         = THEIF_SPEED[level];
        this.m_isPiloting    = false;
        this.m_pilotRotation = 0;
        this.m_shootRequest  = false;
        this.m_steerRate     = 0.1;
        this.m_shootCoolDown = SHIP_SHOOT_RATE;
        this.m_sensorRange   = THEIF_SENSOR * radius;
    };
    this.Pilot     = function (a, r) { this.m_isPiloting = true; this.m_pilotAcceleration = a; this.m_pilotRotation = r; };
    this.StopPilot = function ()     { this.m_isPiloting = false; };
    this.OnUpdate  = function (stepSize) {
        if (this.m_isPiloting) {
            this.Accelerate(this.m_pilotAcceleration);
            var d = this.m_pilotRotation - this.m_rotation;
            if ((d > 0.1 && d < PI) || d < -PI) this.Steer( this.m_steerRate);
            else if (d < -0.1 || d > PI)         this.Steer(-this.m_steerRate);
        }
        if (this.m_shootRequest) {
            this.m_shootCoolDown++;
            if (this.m_shootCoolDown > SHIP_SHOOT_RATE) {
                this.Shoot();
                this.m_shootCoolDown = 0;
                this.m_shootRequest  = false;
            }
        }
    };
    this.Shoot = function () {
        var b = g_world.SpawnBullet(Entity.ENEMY_BULLET);
        b.x = this.x; b.y = this.y;
        b.SetRotation(this.m_rotation);
        b.m_velocity.Set(b.m_speed * b.s, b.m_speed * -b.c);
        b.Wake();
        this.m_bullets.push(b);
    };
    this.OnCollide    = function (entity) {
        if (entity.m_type === Entity.PLAYER_SHIP || entity.m_type === Entity.PLAYER_BULLET) {
            this.Kill();
            g_world.AddExplosion(this.x, this.y);
        }
    };
    this.OnOutOfBounds = function () {};
    this.Kill          = function () { this.Sleep(); };
    this.ShootRequest  = function () { this.m_shootRequest = true; };
    this.CancelShootRequest = function () { this.m_shootRequest = false; };
}

Bullet.prototype = new RigidBody();
function Bullet() {
    this.InitBullet = function (x, y, radius, image, type) {
        this.InitRigidBody(x, y, radius, image);
        this.m_type     = type;
        this.m_drag     = 0;
        this.m_speed    = BULLET_SPEED;
        this.m_maxSpeed = BULLET_SPEED;
    };
    this.OnCollide = function (entity) {
        if (this.m_type === Entity.PLAYER_BULLET && entity.m_type === Entity.ENEMY_SHIP) { g_world.Score(); this.Sleep(); }
        else if (this.m_type === Entity.ENEMY_BULLET && entity.m_type === Entity.PLAYER_SHIP) { this.Sleep(); }
    };
    this.OnOutOfBounds = function () { this.Sleep(); };
}

Diamond.prototype = new RigidBody();
function Diamond() {
    this.m_hooker;
    this.InitDiamond = function (x, y, radius, image, type) {
        this.InitRigidBody(x, y, radius, image);
        this.m_type = type;
        this.m_hook = false;
    };
    this.OnUpdate = function (stepSize) {
        if (this.m_hooker) {
            this.SetRotation(this.m_hooker.m_rotation);
            this.x = this.m_hooker.x;
            this.y = this.m_hooker.y > DimViewCentral.y
                ? this.m_hooker.y - DIAMOND_RADIUS
                : this.m_hooker.y + DIAMOND_RADIUS;
        }
    };
    this.Hook    = function (hooker) { this.m_hooker = hooker; };
    this.Untag   = function () { this.m_tag = false; this.m_hooker = 0; };
    this.OnOutOfBounds = function () { this.Sleep(); };
}

// ─── Image manager (local textures) ──────────────────────────────────────────

function ImageManager() {
    this.m_backgroundImg = new Image(); this.m_playerImg    = new Image();
    this.m_bulletImg     = new Image(); this.m_explosionImg = new Image();
    this.m_thiefImg      = new Image(); this.m_diamondImg   = new Image();
    this.Init = function () {
        this.m_playerImg.src    = 'texture/player.png';
        this.m_bulletImg.src    = 'texture/bullet.png';
        this.m_explosionImg.src = 'texture/explosion.png';
        this.m_thiefImg.src     = 'texture/thief.png';
        this.m_diamondImg.src   = 'texture/diamond.png';
    };
}

// ─── Globals ──────────────────────────────────────────────────────────────────

var g_imageManager = new ImageManager();
var g_world        = new World();
var g_states       = new States();
var g_canvas       = null;
var g_context      = null;

function Start() { var shell = new Shell(); shell.Init(); shell.Run(); }

// ─── Math utilities ───────────────────────────────────────────────────────────

var EPSILON  = 0.00000001;
var PI       = 3.142;
var TWO_PI   = PI * 2;
var HALF_PI  = PI / 2;

function Rand(min, max) { return Math.floor(Math.random() * max + min + 1); }
function DistanceSq(mx, my, tx, ty) { var lx = tx - mx, ly = ty - my; return lx*lx + ly*ly; }
function Distance(mx, my, tx, ty) { return Math.sqrt(DistanceSq(mx, my, tx, ty)); }

this.GetVectorAngle = function (mx, my, tx, ty) {
    var nx = tx - mx, ny = ty - my;
    var a  = Math.atan(ny / nx) + HALF_PI;
    if (nx < 0) a += PI;
    return a;
};

function Vector2() {
    this.x = 0; this.y = 0;
    this.Zero      = function () { this.x = 0; this.y = 0; };
    this.Set       = function (x, y) { this.x = x; this.y = y; };
    this.Update    = function (x, y) { this.x += x; this.y += y; };
    this.Add       = function (v) { this.x += v.x; this.y += v.y; };
    this.Mul       = function (c) { this.x *= c; this.y *= c; };
    this.Div       = function (c) { this.x /= c; this.y /= c; };
    this.Length    = function () { return Math.sqrt(this.x*this.x + this.y*this.y); };
    this.Normalise = function () { var l = this.Length(); if (l < EPSILON) l = EPSILON; this.x /= l; this.y /= l; };
}

// ─── Entity types, physics ────────────────────────────────────────────────────

var Entity = { PLAYER_SHIP: 0, PLAYER_BULLET: 1, ENEMY_SHIP: 2, ENEMY_BULLET: 3, DIAMOND: 4, EXPLOSION: 5 };

function OutOfBound(entity) {
    return entity.y + entity.m_radius > DimView.bottom ||
           entity.x + entity.m_radius > DimView.right  ||
           entity.x - entity.m_radius < DimView.left   ||
           entity.y - entity.m_radius < DimView.top;
}

function PhysicsWorld() {
    var m_entities = [], m_collisionPair = [0, 0, 0, 0];
    this.AddCollisionPair    = function (a, b) { m_collisionPair[a] |= 1 << b; m_collisionPair[b] |= 1 << a; };
    this.CanCollide          = function (a, b) { return (m_collisionPair[a] & (1 << b)) !== 0; };
    this.AddPhysicsEntity    = function (e)    { m_entities.push(e); };
    this.Clear               = function ()     { while (m_entities.length) m_entities.pop(); };
    this.OnUpdate = function (stepSize) {
        for (var i = m_entities.length; i--;) {
            var e = m_entities[i];
            e.OnUpdate(stepSize);
            if (e.QueryAlive()) {
                e.Move(stepSize);
                if (OutOfBound(e)) e.OnOutOfBounds();
                e.Draw();
            } else {
                if (e.m_type === Entity.ENEMY_SHIP || e.m_type === Entity.DIAMOND || e.m_type === Entity.ENEMY_BULLET)
                    m_entities.splice(i, 1);
            }
        }
        for (var i = m_entities.length; i--;) {
            for (var j = i; j--;) {
                if (this.CanCollide(m_entities[i].m_type, m_entities[j].m_type) &&
                    m_entities[i].HasCollided(m_entities[j])) {
                    m_entities[i].OnCollide(m_entities[j]);
                    m_entities[j].OnCollide(m_entities[i]);
                }
            }
        }
    };
}

// ─── Game constants ───────────────────────────────────────────────────────────

var DimClient = {x:0,y:0}, DimView = {top:0,bottom:0,left:0,right:0}, DimViewCentral = {x:0,y:0};
var MAX_RATE = 4, FRAME_RATE = 4;
var PLAYER_SPEED   = 1,   SHIP_MAX_SPEED  = 8;
var THEIF_SPEED    = [0.2, 0.5, 0.8, 1],   THEIF_MAX_SPEED = [3, 5, 7, 8];
var THEIF_SENSOR   = 8,   BULLET_SPEED    = 10;
var SHIP_RADIUS    = 32,  DIAMOND_RADIUS  = 16, BULLET_RADIUS = 8, EXPLOSION_RADIUS = 32;
var PHASE_PER_ROUND = 8,  SHIP_SHOOT_RATE = 60, PLAYER_BULLET_COUNT = 6;
var LEVELING       = [10, 25, 50, 0];
var SPAWN_OFFSET   = SHIP_RADIUS * 3, SPAWN_RATE = 36;

// ─── Shell (input + loop) ─────────────────────────────────────────────────────

var keys  = {W:87,A:65,S:83,D:68,LEFT:37,RIGHT:39,UP:38,DOWN:40,SPACE:32,ENTER:13,ESCAPE:27,F5:116};
var mouse = {LEFT:0,MIDDLE:1,RIGHT:2};
var input = {X:0,Y:0,LEFT:0,RIGHT:0,UP:0,DOWN:0,SHOOT:0,START:0,END:0};

function Shell() {
    this.Init = function () {
        window.addEventListener('resize', this.Resize, false);
        g_canvas = document.getElementById('CanvasPrototype');
        if (g_canvas) {
            g_canvas.addEventListener('keydown',    this.KeyDown);
            g_canvas.addEventListener('keyup',      this.KeyUp);
            g_canvas.addEventListener('mousedown',  this.MouseDown);
            g_canvas.addEventListener('mouseup',    this.MouseUp);
            g_canvas.addEventListener('touchstart', this.TouchStart);
            g_canvas.addEventListener('touchend',   this.TouchEnd);
            g_canvas.setAttribute('tabindex', '0');
            g_canvas.focus({ preventScroll: true });
            g_context = g_canvas.getContext('2d');
            this.Resize();
            g_states.Init();
        }
    };
    this.Resize = function () {
        var w = window.innerWidth, h = window.innerHeight;
        g_canvas.width  = w; g_canvas.height = h;
        DimClient.x = w; DimClient.y = h;
        DimView.bottom = h; DimView.right = w;
        DimViewCentral.x = w / 2; DimViewCentral.y = h / 2;
    };
    this.Run   = function () { if (g_context) setInterval(this.Frame, 23); };
    this.Frame = function () {
        g_context.clearRect(0, 0, g_canvas.width, g_canvas.height);
        g_context.save();
        g_states.m_currentState();
        g_context.restore();
    };
    this.KeyUp = function (e) {
        switch (e.keyCode) {
            case keys.W: case keys.UP:    input.UP    = 0; break;
            case keys.S: case keys.DOWN:  input.DOWN  = 0; break;
            case keys.A: case keys.LEFT:  input.LEFT  = 0; break;
            case keys.D: case keys.RIGHT: input.RIGHT = 0; break;
            case keys.SPACE:  input.SHOOT = 0; break;
            case keys.ENTER:  input.START = 0; break;
            case keys.ESCAPE: input.END   = 0; break;
        }
    };
    this.KeyDown = function (e) {
        if (e.keyCode === keys.F5) return;
        switch (e.keyCode) {
            case keys.W: case keys.UP:    input.UP    = 1; input.DOWN  = 0; break;
            case keys.S: case keys.DOWN:  input.DOWN  = 1; input.UP    = 0; break;
            case keys.A: case keys.LEFT:  input.LEFT  = 1; input.RIGHT = 0; break;
            case keys.D: case keys.RIGHT: input.RIGHT = 1; input.LEFT  = 0; break;
            case keys.SPACE:  input.SHOOT = 1; break;
            case keys.ENTER:  input.START = 1; break;
            case keys.ESCAPE: input.END   = 1; break;
        }
        e.preventDefault();
    };
    this.MouseDown = function (e) { if (e.button === mouse.LEFT) { input.SHOOT = 1; input.X = e.clientX; input.Y = e.clientY; } };
    this.MouseUp   = function (e) { if (e.button === mouse.LEFT) input.SHOOT = 0; };
    this.TouchStart = function () { input.SHOOT = 1; input.START = 1; };
    this.TouchEnd   = function () { input.SHOOT = 0; input.START = 0; };
}

// ─── States ───────────────────────────────────────────────────────────────────

function States() {
    this.m_currentState = null;
    this.Init = function () {
        g_imageManager.Init();
        g_world.Init();
        g_context.fillStyle = 'rgb(200,10,10)';
        g_context.font      = '32px monospace';
        g_states.GameOver();
    };
    this.StartGame = function () {
        g_context.font = '20px monospace';
        g_states.m_currentState = g_states.GameState;
        g_world.Reset();
    };
    this.GameOver = function () { g_states.m_currentState = g_states.GameOverState; };
    this.GameOverState = function () {
        g_context.drawImage(g_imageManager.m_backgroundImg, 0, 0);
        g_context.fillStyle = 'rgb(200,10,10)';
        g_context.fillText('Press Enter to start', DimViewCentral.x - 160, DimViewCentral.y - 32);
        g_context.fillText('Up to accelerate  Left/Right to rotate  Space to shoot',
                           DimViewCentral.x - 310, DimViewCentral.y + 16);
        if (input.START) g_states.StartGame();
    };
    this.GameState = function () { g_world.Update(); };
}

// ─── World ────────────────────────────────────────────────────────────────────

function World() {
    var m_physicsWorld = new PhysicsWorld();
    this.m_players  = []; this.m_thiefs  = []; this.m_diamonds = [];
    var m_controllers = [], m_explosion = [];
    this.m_flockLeader      = null;   // reference to the current leader TheftShip
    this.m_flockControllers = [];     // all FlockingAIController instances this wave

    var m_level = 1, m_score = 0, m_round = 1, m_phase = 0;
    var m_currentThreshold = 0, m_spawnTimer, m_isSpawning, m_gameOver;
    this.count;

    this.Init = function () {
        this.count = 0;
        this.GenStars();
        m_physicsWorld.AddCollisionPair(Entity.PLAYER_SHIP,   Entity.ENEMY_SHIP);
        m_physicsWorld.AddCollisionPair(Entity.PLAYER_SHIP,   Entity.ENEMY_BULLET);
        m_physicsWorld.AddCollisionPair(Entity.PLAYER_BULLET, Entity.ENEMY_SHIP);
        m_physicsWorld.AddCollisionPair(Entity.DIAMOND,       Entity.ENEMY_SHIP);
    };

    this.GenStars = function () {
        g_context.clearRect(0, 0, g_canvas.width, g_canvas.height);
        g_context.fillStyle = 'black';
        g_context.fillRect(0, 0, DimView.right, DimView.bottom);
        g_context.fillStyle = 'white';
        var sd = 32;
        for (var y = 0; y < DimView.bottom; y += sd)
            for (var x = 0; x < DimView.right; x += sd)
                g_context.fillRect(x + Rand(0, sd), y + Rand(0, sd), 1, 1);
        g_imageManager.m_backgroundImg.src = g_canvas.toDataURL();
        g_context.clearRect(0, 0, g_canvas.width, g_canvas.height);
    };

    this.AddEntity   = function (e) { m_physicsWorld.AddPhysicsEntity(e); };
    this.SpawnBullet = function (type) {
        var b = new Bullet();
        b.InitBullet(0, 0, BULLET_RADIUS, g_imageManager.m_bulletImg, type);
        m_physicsWorld.AddPhysicsEntity(b);
        b.Sleep();
        return b;
    };

    this.Reset = function () {
        this.count = 0;
        m_level = 1; m_currentThreshold = LEVELING[0]; m_score = 0;
        m_round = 1; m_phase = 0; m_spawnTimer = 0; m_isSpawning = true; m_gameOver = false;
        this.m_flockLeader = null; this.m_flockControllers = [];
        this.GenDiamond();

        var player = new GuardianShip();
        this.AddEntity(player);
        player.InitGuardianShip(DimView.right - SHIP_RADIUS, DimViewCentral.y, SHIP_RADIUS, g_imageManager.m_playerImg);
        this.m_players.push(player);
        player.Spawn();

        var ctrl = new P1Controller();
        ctrl.SetShip(player);
        m_controllers.push(ctrl);
    };

    this.GenDiamond = function () {
        var step = DIAMOND_RADIUS * 2.5;
        var ox = DimViewCentral.x - step * 1.5, oy = DimViewCentral.y - step * 1.5;
        for (var i = 0; i < 9; i++) {
            var d = new Diamond();
            d.InitDiamond(ox + (i % 3) * step, oy + Math.floor(i / 3) * step,
                          DIAMOND_RADIUS, g_imageManager.m_diamondImg, Entity.DIAMOND);
            d.SetRotation(Rand(0, TWO_PI));
            this.m_diamonds.push(d);
            m_physicsWorld.AddPhysicsEntity(d);
        }
    };

    this.EndGame = function () {
        m_physicsWorld.Clear();
        while (m_explosion.length)             m_explosion.pop();
        while (this.m_thiefs.length)           this.m_thiefs.pop();
        while (this.m_diamonds.length)         this.m_diamonds.pop();
        while (this.m_players.length)          this.m_players.pop();
        while (m_controllers.length)           m_controllers.pop();
        this.m_flockControllers = [];
        this.m_flockLeader = null;
    };

    this.Update = function () {
        this.DrawBackground();
        m_spawnTimer++;
        if (m_spawnTimer > SPAWN_RATE && this.m_thiefs.length === 0) {
            m_spawnTimer = 0; m_isSpawning = true;
        }
        if (m_isSpawning) this.SpawnPhase();
        for (var i = m_controllers.length; i--;) m_controllers[i].OnUpdate();
        this.UpdateEntities(1);
        this.UpdateExplosion();
        if (m_gameOver) this.EndGame();
    };

    this.DrawBackground = function () {
        g_context.drawImage(g_imageManager.m_backgroundImg, 0, 0);
        g_context.fillText('Score ' + m_score, 0, 24);
        g_context.fillText('Level ' + m_level, 0, 48);
        g_context.fillText('Round ' + m_round, 0, 72);
        // Show flock state hint
        var leader = this.m_flockLeader;
        if (leader && leader.m_alive) {
            g_context.fillText('Flock leader alive', 0, 96);
        } else {
            g_context.fillText('No leader', 0, 96);
        }
    };

    this.UpdateEntities = function (stepSize) {
        m_physicsWorld.OnUpdate(stepSize);

        // Remove dead thieves; check if leader died
        for (var i = this.m_thiefs.length; i--;) {
            if (!this.m_thiefs[i].QueryAlive()) {
                if (this.m_thiefs[i] === this.m_flockLeader) {
                    this.m_flockLeader = null;
                }
                this.m_thiefs.splice(i, 1);
            }
        }

        // Leader election: promote first alive follower if leader is gone
        if (!this.m_flockLeader && this.m_flockControllers.length > 0) {
            for (var i = 0; i < this.m_flockControllers.length; i++) {
                if (!this.m_flockControllers[i].QueryDownStatus()) {
                    this.m_flockControllers[i].promoteToLeader();
                    break;
                }
            }
        }

        for (var i = this.m_diamonds.length; i--;) {
            if (!this.m_diamonds[i].QueryAlive()) this.m_diamonds.splice(i, 1);
        }
        for (var i = m_controllers.length; i--;) {
            if (m_controllers[i].QueryDownStatus()) m_controllers.splice(i, 1);
        }
        // Clean up downed flock controllers
        for (var i = this.m_flockControllers.length; i--;) {
            if (this.m_flockControllers[i].QueryDownStatus()) this.m_flockControllers.splice(i, 1);
        }
        if (this.m_diamonds.length === 0) { g_states.GameOver(); m_gameOver = true; }
    };

    this.AddExplosion = function (x, y) {
        var e = new Explosion();
        e.InitExplosion(x, y, EXPLOSION_RADIUS, g_imageManager.m_explosionImg, 5);
        m_explosion.push(e);
    };

    this.UpdateExplosion = function () {
        for (var i = m_explosion.length; i--;) {
            if (m_explosion[i].QueryAlive()) m_explosion[i].Draw();
            else m_explosion.splice(i, 1);
        }
    };

    this.SpawnPhase = function () {
        m_phase++;
        if (m_phase > PHASE_PER_ROUND) { m_phase = 1; m_round++; }
        var sx, sy;
        switch (Rand(0, 5)) {
            case 0: sx = DimView.left   - SPAWN_OFFSET; sy = DimView.top    - SPAWN_OFFSET; break;
            case 1: sx = DimViewCentral.x;              sy = DimView.top    - SPAWN_OFFSET; break;
            case 2: sx = DimView.right  + SPAWN_OFFSET; sy = DimView.top    - SPAWN_OFFSET; break;
            case 3: sx = DimView.left   - SPAWN_OFFSET; sy = DimView.bottom + SPAWN_OFFSET; break;
            case 4: sx = DimViewCentral.x;              sy = DimView.bottom + SPAWN_OFFSET; break;
            case 5: sx = DimView.right  + SPAWN_OFFSET; sy = DimView.bottom + SPAWN_OFFSET; break;
        }
        var count = m_round + 1;
        var angle = TWO_PI / count;
        // Clear previous wave's flock controllers
        this.m_flockControllers = [];
        this.m_flockLeader = null;
        for (var i = count; i-- > 0;) {
            var isLeader = (i === count - 1); // first of the wave is leader
            this.SpawnThief(
                sx + Math.cos(angle * i) * SHIP_RADIUS,
                sy + Math.sin(angle * i) * SHIP_RADIUS,
                isLeader
            );
        }
        m_isSpawning = false;
    };

    this.SpawnThief = function (x, y, isLeader) {
        var ship = new TheftShip();
        ship.InitTheftShip(x, y, SHIP_RADIUS, g_imageManager.m_thiefImg, m_level);
        // AI type: mix, but base it on round
        var aiTypes = [FLOCKING_THIEF, FLOCKING_FIGHTER, FLOCKING_AGGRESSIVE];
        var aiType  = aiTypes[Rand(0, 2) % 3];

        var ctrl = new FlockingAIController();
        ctrl.InitFlocking(ship, aiType, isLeader);

        if (isLeader) this.m_flockLeader = ship;

        this.AddEntity(ship);
        this.m_thiefs.push(ship);
        this.m_flockControllers.push(ctrl);
        m_controllers.push(ctrl);
    };

    this.Score = function () {
        m_score++;
        if (m_score === m_currentThreshold) {
            m_currentThreshold = LEVELING[m_level];
            m_level++;
        }
    };
}
