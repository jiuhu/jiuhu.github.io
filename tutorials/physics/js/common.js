/*
    Copyright (C) 2009-2013 Ewe, YS (Waterpine Studio)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
*/

var TWO_PI = Math.PI * 2;
var HALF_PI = Math.PI / 2;
var BOUNCE_EFFECT = -0.3;
//--------------------------------------------------------------------

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
//--------------------------------------------------------------------

// Angle between vector (dx,dy) and UP direction (0,-1) in screen space.
// Returns [0, PI].
function getAngle(dx, dy) {
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.0001) return 0;
    var value = -dy / len; // dot with (0,-1)
    if (value > 1) value = 1;
    if (value < -1) value = -1;
    return Math.acos(value);
}
//--------------------------------------------------------------------

// Returns full [0, TWO_PI) angle from fromPos toward toPos.
function findAngle(fromPos, toPos) {
    var dx = toPos.x - fromPos.x;
    var dy = toPos.y - fromPos.y;
    var angle = getAngle(dx, dy);
    if (dx < 0) angle = TWO_PI - angle;
    return angle;
}
//--------------------------------------------------------------------

var KEYS = { W: 87, A: 65, S: 83, D: 68, LEFT: 37, RIGHT: 39, UP: 38, DOWN: 40, SPACE: 32, Q: 81, E: 69, TAB: 9 };
var INPUT = { LEFT: 0, RIGHT: 1, UP: 2, DOWN: 3, BTN_A: 4, BTN_B: 5 };
//--------------------------------------------------------------------

function Shell() {
    var m_input = [0, 0, 0, 0, 0, 0];
    var m_canvas = null;
    //--------------------------------------------------------------------
    this.GetCanvas = function (id) {
        m_canvas = document.getElementById(id);
        if (m_canvas) {
            m_canvas.setAttribute('tabindex', '0');
            m_canvas.addEventListener('keydown', this.KeyDown);
            m_canvas.addEventListener('keyup', this.KeyUp);
        }
        return m_canvas;
    };
    //--------------------------------------------------------------------
    this.IsKeyPressed = function (key) { return m_input[key]; };
    //--------------------------------------------------------------------
    this.KeyUp = function (e) {
        switch (e.keyCode) {
            case KEYS.W: case KEYS.UP: m_input[INPUT.UP] = 0; break;
            case KEYS.S: case KEYS.DOWN: m_input[INPUT.DOWN] = 0; break;
            case KEYS.A: case KEYS.LEFT: m_input[INPUT.LEFT] = 0; break;
            case KEYS.D: case KEYS.RIGHT: m_input[INPUT.RIGHT] = 0; break;
            case KEYS.SPACE: m_input[INPUT.BTN_A] = 0; break;
        }
    };
    //--------------------------------------------------------------------
    this.KeyDown = function (e) {
        switch (e.keyCode) {
            case KEYS.W: case KEYS.UP: m_input[INPUT.UP] = 1; m_input[INPUT.DOWN] = 0; break;
            case KEYS.S: case KEYS.DOWN: m_input[INPUT.DOWN] = 1; m_input[INPUT.UP] = 0; break;
            case KEYS.A: case KEYS.LEFT: m_input[INPUT.LEFT] = 1; m_input[INPUT.RIGHT] = 0; break;
            case KEYS.D: case KEYS.RIGHT: m_input[INPUT.RIGHT] = 1; m_input[INPUT.LEFT] = 0; break;
            case KEYS.SPACE: m_input[INPUT.BTN_A] = 1; break;
        }
        e.preventDefault();
    };
    //--------------------------------------------------------------------
}
//--------------------------------------------------------------------

var STATUS = { IDLE: 0, ACCELERATING: 1, DECELERATING: 2 };
var STATUS_MSG = ['IDLE', 'ACCELERATING', 'DECELERATING'];
var SENSORY = { FULL: 0, ROUND: 1, FRONT: 2 };
var SENSORY_MSG = ['Full Sensory', 'Round Sensory', 'Front Sensory'];
//--------------------------------------------------------------------

function Agent() {
    this.position = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.forceAccum = { x: 0, y: 0 };
    this.heading = { x: 0, y: -1 };
    this.angleRadian = 0;
    this.radius = 20;
    this.topSpeed = 200;
    this.damping = 0.7;
    this.decelerate = 0.3;
    this.status = STATUS.IDLE;
    this.color = '#f80';

    this.sensoryMode = SENSORY.FULL;
    this.sensoryRadius = 150;
    this.sensoryRadiusSQ = 150 * 150;
    this.sensoryAngle = HALF_PI;
}
//--------------------------------------------------------------------

Agent.prototype.setPosition = function (x, y) {
    this.position.x = x;
    this.position.y = y;
};
//--------------------------------------------------------------------

Agent.prototype.updateAngle = function (angle) {
    this.angleRadian = angle;
    this.heading.x = Math.sin(angle);
    this.heading.y = -Math.cos(angle);
};
//--------------------------------------------------------------------

Agent.prototype.rotate = function (radian) {
    var a = this.angleRadian + radian;
    if (a < 0) a += TWO_PI;
    else if (a > TWO_PI) a -= TWO_PI;
    this.updateAngle(a);
};
//--------------------------------------------------------------------

Agent.prototype.accelerate = function (force) {
    this.status = STATUS.ACCELERATING;
    this.forceAccum.x = this.heading.x * force;
    this.forceAccum.y = this.heading.y * force;
};
//--------------------------------------------------------------------

Agent.prototype.moving = function (dt) {
    if (this.status === STATUS.ACCELERATING) {
        this.velocity.x += this.forceAccum.x * dt;
        this.velocity.y += this.forceAccum.y * dt;
        var spd = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        if (spd > this.topSpeed) {
            var s = this.topSpeed / spd;
            this.velocity.x *= s; this.velocity.y *= s;
        }
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
        var damp = Math.pow(this.damping, dt);
        this.velocity.x *= damp; this.velocity.y *= damp;
    } else {
        var d = Math.pow(this.decelerate, dt);
        this.velocity.x *= d; this.velocity.y *= d;
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
        if (this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y < 1)
            this.status = STATUS.IDLE;
    }
    this.forceAccum.x = 0;
    this.forceAccum.y = 0;
};
//--------------------------------------------------------------------

Agent.prototype.breaking = function () {
    this.status = STATUS.IDLE;
    this.velocity.x = 0; this.velocity.y = 0;
    this.forceAccum.x = 0; this.forceAccum.y = 0;
};
//--------------------------------------------------------------------

Agent.prototype.worldCollision = function (boundary) {
    if (this.position.x < 0) {
        this.position.x = 0; this.velocity.x *= BOUNCE_EFFECT;
    } else if (this.position.x > boundary.x) {
        this.position.x = boundary.x; this.velocity.x *= BOUNCE_EFFECT;
    }
    if (this.position.y < 0) {
        this.position.y = 0; this.velocity.y *= BOUNCE_EFFECT;
    } else if (this.position.y > boundary.y) {
        this.position.y = boundary.y; this.velocity.y *= BOUNCE_EFFECT;
    }
};
//--------------------------------------------------------------------

Agent.prototype.smoothRotation = function (targetAngle) {
    var a = this.angleRadian;
    if (targetAngle - a > Math.PI) a -= 0.1;
    else if (a - targetAngle > Math.PI) a += 0.1;
    else if (a > targetAngle) a -= 0.1;
    else a += 0.1;
    var dist = a - targetAngle;
    if (dist > -0.1 && dist < 0.1) a = targetAngle;
    if (a > TWO_PI) a -= TWO_PI;
    else if (a < 0) a += TWO_PI;
    this.updateAngle(a);
};
//--------------------------------------------------------------------

Agent.prototype.nextSensoryMode = function () {
    this.sensoryMode = (this.sensoryMode + 1) % 3;
};
//--------------------------------------------------------------------

Agent.prototype.updateSensoryRange = function (r) {
    this.sensoryRadius = r;
    this.sensoryRadiusSQ = r * r;
};
//--------------------------------------------------------------------

Agent.prototype.isInSensoryRangeSQ = function (other) {
    var dx = other.position.x - this.position.x;
    var dy = other.position.y - this.position.y;
    return dx * dx + dy * dy < this.sensoryRadiusSQ + other.radius * other.radius;
};
//--------------------------------------------------------------------

Agent.prototype.isInSensoryFrontRange = function (other) {
    var east = this.angleRadian + this.sensoryAngle;
    if (east > TWO_PI) east -= TWO_PI;
    var west = east - this.sensoryAngle * 2;
    east -= 0.1; west += 0.1;
    var dx = other.position.x - this.position.x;
    var dy = other.position.y - this.position.y;
    var fa = getAngle(dx, dy);
    if (dx < 0) fa = (west < 0) ? -fa : TWO_PI - fa;
    if (fa < east && fa > west) return this.isInSensoryRangeSQ(other);
    return false;
};
//--------------------------------------------------------------------

Agent.prototype.isMoving = function () { return this.status !== STATUS.IDLE; };
Agent.prototype.isIdle = function () { return this.status === STATUS.IDLE; };
//--------------------------------------------------------------------

Agent.prototype.draw = function (ctx) {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.angleRadian);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(0, -this.radius);
    ctx.lineTo(this.radius * 0.65, this.radius * 0.7);
    ctx.lineTo(-this.radius * 0.65, this.radius * 0.7);
    ctx.closePath();
    ctx.fill();
    // outline
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
};
//--------------------------------------------------------------------

Agent.prototype.drawSensoryRange = function (ctx) {
    if (this.sensoryMode === SENSORY.FULL) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(0,220,180,0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    if (this.sensoryMode === SENSORY.ROUND) {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.sensoryRadius, 0, TWO_PI);
        ctx.stroke();
    } else {
        var start = this.angleRadian - this.sensoryAngle - HALF_PI;
        var end = this.angleRadian + this.sensoryAngle - HALF_PI;
        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y);
        ctx.arc(this.position.x, this.position.y, this.sensoryRadius, start, end);
        ctx.closePath();
        ctx.stroke();
    }
    ctx.restore();
};
//--------------------------------------------------------------------

function isCollide(a, b) {
    var dx = b.position.x - a.position.x;
    var dy = b.position.y - a.position.y;
    return dx * dx + dy * dy < a.radius * a.radius + b.radius * b.radius;
}
//--------------------------------------------------------------------

function drawHUD(ctx, x, y, text, color) {
    ctx.font = '13px monospace';
    ctx.fillStyle = color || 'rgba(180,220,255,0.85)';
    ctx.fillText(text, x, y);
}
//--------------------------------------------------------------------

function genStarField(canvas) {
    var offscreen = document.createElement('canvas');
    offscreen.width = canvas.width || 800;
    offscreen.height = canvas.height || 600;
    var ctx = offscreen.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);
    ctx.fillStyle = '#fff';
    var starStep = 32;
    for (var sy = 0; sy < offscreen.height; sy += starStep) {
        for (var sx = 0; sx < offscreen.width; sx += starStep) {
            ctx.fillRect(sx + randInt(0, starStep), sy + randInt(0, starStep), 1, 1);
        }
    }
    return offscreen;
}
//--------------------------------------------------------------------
