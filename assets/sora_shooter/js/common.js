/*
    Copyright (C) 2009-2013 Ewe, YS (Sora)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var TWO_PI = 2 * Math.PI;
//--------------------------------------------------------------------

function Rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
//--------------------------------------------------------------------

function getTimeInMilli() {
    return +new Date();
};
//--------------------------------------------------------------------

var keys = {
    W: 87,
    A: 65,
    S: 83,
    D: 68,
    LEFT: 37,
    RIGHT: 39,
    UP: 38,
    DOWN: 40,
    SPACE: 32,
    CTRL: 17,
};
//--------------------------------------------------------------------

var INPUT = {
    LEFT: 0,
    RIGHT: 1,
    UP: 2,
    DOWN: 3,
    BTN_A: 4,
    BTN_B: 5,
};
//--------------------------------------------------------------------

function Shell() {
    var m_input = [0, 0, 0, 0, 0, 0];
    //--------------------------------------------------------------------
    this.GetCanvas = function (name) {
        canvas = document.getElementById(name);
        if (canvas) {
            canvas.addEventListener("keydown", this.KeyDown);
            canvas.addEventListener("keyup", this.KeyUp);
        }
        return canvas;
    };
    //--------------------------------------------------------------------
    this.IsKeyPressed = function (key) {
        return m_input[key];
    };
    //--------------------------------------------------------------------
    this.KeyUp = function (e) {
        switch (e.keyCode) {
            case keys.W:
            case keys.UP:
                m_input[INPUT.UP] = 0;
                break;

            case keys.S:
            case keys.DOWN:
                m_input[INPUT.DOWN] = 0;
                break;

            case keys.A:
            case keys.LEFT:
                m_input[INPUT.LEFT] = 0;
                break;

            case keys.D:
            case keys.RIGHT:
                m_input[INPUT.RIGHT] = 0;
                break;

            case keys.SPACE:
                m_input[INPUT.BTN_A] = 0;
                break;

            case keys.CTRL:
                m_input[INPUT.BTN_B] = 0;
                break;
        }
    };
    //--------------------------------------------------------------------
    this.KeyDown = function (e) {
        switch (e.keyCode) {
            case keys.W:
            case keys.UP:
                m_input[INPUT.UP] = 1;
                m_input[INPUT.DOWN] = 0;
                break;

            case keys.S:
            case keys.DOWN:
                m_input[INPUT.DOWN] = 1;
                m_input[INPUT.UP] = 0;
                break;

            case keys.A:
            case keys.LEFT:
                m_input[INPUT.LEFT] = 1;
                m_input[INPUT.RIGHT] = 0;
                break;

            case keys.D:
            case keys.RIGHT:
                m_input[INPUT.RIGHT] = 1;
                m_input[INPUT.LEFT] = 0;
                break;

            case keys.SPACE:
                m_input[INPUT.BTN_A] = 1;
                break;

            case keys.CTRL:
                m_input[INPUT.BTN_B] = 1;
                break;
        }
        e.preventDefault();
    };
    //--------------------------------------------------------------------
};
//--------------------------------------------------------------------

function DrawCircle(context, x, y, radius, color) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI);
    context.fill();
};
//--------------------------------------------------------------------

function GenImageFromContext(context, img, width, height) {
    var imageData = context.getImageData(0, 0, width, height);

    var newCanvas = document.createElement("canvas");
    newCanvas.width = width;
    newCanvas.height = height;

    newCanvas.getContext("2d").putImageData(imageData, 0, 0);

    img.src = newCanvas.toDataURL();
};
//--------------------------------------------------------------------

function GenStars(canvas, img) {
    var width = canvas.width;
    var height = canvas.height;
    var context = canvas.getContext("2d");
    context.clearRect(0, 0, width, height);
    context.fillStyle = "black";
    context.fillRect(0, 0, width, height);
    context.fillStyle = "white";
    var starDist = 32;
    for (var y = 0; y < height; y += starDist) {
        for (var x = 0; x < width; x += starDist) {
            context.fillRect(x + Rand(0, starDist), y + Rand(0, starDist), 1, 1);
        }
    }
    img.src = canvas.toDataURL();
    context.clearRect(0, 0, width, height);
};
//--------------------------------------------------------------------

function elementAction(select, canvas) {
    canvas.focus();
    return parseInt(select.value, 10);
}
//--------------------------------------------------------------------

var g_shipSpeed = 2;
function shipSpeedAction(select, canvas) {
    g_shipSpeed = elementAction(select, canvas);
}
//--------------------------------------------------------------------

var g_bulletSpeed = 1;
function bulletSpeedAction(select, canvas) {
    g_bulletSpeed = elementAction(select, canvas);
}
//--------------------------------------------------------------------

var g_asteroidSpeed = 2;
function asteroidSpeedAction(select, canvas) {
    g_asteroidSpeed = elementAction(select, canvas);
}
//--------------------------------------------------------------------

var g_asteroidSpawnRate = 30;
function asteroidSpawnRateAction(select, canvas) {
    g_asteroidSpawnRate = elementAction(select, canvas);
}
//--------------------------------------------------------------------

var g_asteroidDamage = 1;
function asteroidDamageAction(select, canvas) {
    g_asteroidDamage = elementAction(select, canvas);
}
//--------------------------------------------------------------------

var g_survivingTime = 60;
function survivingTimeAction(select, canvas) {
    g_survivingTime = elementAction(select, canvas);
}
//--------------------------------------------------------------------

var g_autofireRate = 30;
function autofireAction(select, canvas) {
    g_autofireRate = Math.floor(60 / elementAction(select, canvas));
}
//--------------------------------------------------------------------

var g_turretShootRate = 30;
function turretShootAction(select, canvas) {
    g_turretShootRate = elementAction(select, canvas);
}
//--------------------------------------------------------------------

var g_wrapDistance = 100;
function wrapDistanceAction(select, canvas) {
    g_wrapDistance = elementAction(select, canvas);
}
//--------------------------------------------------------------------

var g_wrapRate = 30;
function wrapRateAction(select, canvas) {
    g_wrapRate = elementAction(select, canvas);
}
//--------------------------------------------------------------------

var g_maxCharge = 30;
function chargedBulletAction(select, canvas) {
    g_maxCharge = elementAction(select, canvas);
}
//--------------------------------------------------------------------

var g_minCharge = 15;
function chargedBulletMinAction(select, canvas) {
    g_minCharge = elementAction(select, canvas);
}
//--------------------------------------------------------------------

var g_fanBulletCount = 3;
function fanBulletAction(select, canvas) {
    g_fanBulletCount = elementAction(select, canvas);
}
//--------------------------------------------------------------------

var g_roundBulletCount = 6;
function roundBulletAction(select, canvas) {
    g_roundBulletCount = elementAction(select, canvas);
}
//--------------------------------------------------------------------

var g_bulletSplitRate = 30;
function bulletSplitRateAction(select, canvas) {
    g_bulletSplitRate = elementAction(select, canvas);
}
//--------------------------------------------------------------------

var g_bulletSplitType = "fan";
function bulletSplitTypeAction(select, canvas) {
    canvas.focus();
    g_bulletSplitType = select.value;
}
//--------------------------------------------------------------------

var g_shootType = "auto";
function shootTypeAction(select, canvas) {
    canvas.focus();
    g_shootType = select.value;
}
//--------------------------------------------------------------------

var g_scrollSpeed = 1;
function scrollSpeedAction(select, canvas) {
    g_scrollSpeed = elementAction(select, canvas);
}
//--------------------------------------------------------------------

var g_myShipHP = 100;
function myShipHPAction(select, canvas) {
    g_myShipHP = elementAction(select, canvas);
}
//--------------------------------------------------------------------

function SaveAsPNG(canvas) {
    var url = canvas.toDataURL("image/png");
    document.location.href = url.replace("image/png", "image/octet-stream");
}
//--------------------------------------------------------------------

function CollideEntity(ex1, ey1, r1, ex2, ey2, r2) {
    if (ex1 - r1 < ex2 + r2 && ex2 - r2 < ex1 + r1 && ey1 - r1 < ey2 + r2 && ey2 - r2 < ey1 + r1)
        return 1;
    return 0;
};
//--------------------------------------------------------------------
