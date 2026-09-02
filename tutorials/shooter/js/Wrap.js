/*
    Copyright (C) 2009-2013 Ewe, YS (Waterpine Studio)

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

var g_wrap = new Wrap();
g_wrap.Start();
//--------------------------------------------------------------------

function Wrap() {
    var m_space = new Space();
    var m_shell = new Shell();
    var m_canvas = null;
    var m_context = null;
    //--------------------------------------------------------------------
    this.Start = function () {
        m_canvas = m_shell.GetCanvas("cvsWrap");
        if (m_canvas) {
            m_context = m_canvas.getContext("2d");
            if (m_context != null) {
                m_space.Init();
                setInterval(this.Frame, 16);
            }
        }
    };
    //--------------------------------------------------------------------
    this.Frame = function () {
        m_context.clearRect(0, 0, m_canvas.width, m_canvas.height);
        m_context.save();
        m_space.Update();
        m_space.Draw();
        m_context.restore();
    };
    //--------------------------------------------------------------------

    function Space() {
        var m_bgImg = null;
        var m_playerImg = null;
        var m_playerPosition = { x: 0, y: 0 };
        var m_playerSize = 0;
        var m_playerRadius = 0;
        var m_wrapCooldown = 0;
        var m_animate = 50;
        var m_wrapAnimation = { x: 0, y: 0, timer: 0 };
        //--------------------------------------------------------------------
        this.Init = function () {
            m_bgImg = new Image();
            GenStars(m_canvas, m_bgImg);

            m_playerImg = new Image();
            m_playerImg.src = "texture/player.png";
            m_playerSize = 32;
            m_playerRadius = m_playerSize / 2;
            m_playerPosition.x = (m_canvas.width / 2) - m_playerRadius;
            m_playerPosition.y = (m_canvas.height / 2) - m_playerRadius;
        };
        //--------------------------------------------------------------------
        var released = 1;
        var up0 = 0, down0 = 0, left0 = 0, right0 = 0;
        var wrapTime = 0;
        this.Update = function () {
            var up = m_shell.IsKeyPressed(INPUT.UP);
            var down = m_shell.IsKeyPressed(INPUT.DOWN);
            var left = m_shell.IsKeyPressed(INPUT.LEFT);
            var right = m_shell.IsKeyPressed(INPUT.RIGHT);

            if (up || down || left || right) {
                var speed = 0;
                if (released && wrapTime && m_wrapCooldown == 0 &&
                    up == up0 && down == down0 &&
                    left == left0 && right == right0) {
                    m_wrapCooldown = g_wrapRate;
                    speed = g_wrapDistance;
                    m_wrapAnimation.x = m_playerPosition.x + m_playerRadius;
                    m_wrapAnimation.y = m_playerPosition.y + m_playerRadius;
                    m_wrapAnimation.timer = m_animate;
                } else {
                    speed = g_shipSpeed;
                    up0 = up;
                    down0 = down;
                    left0 = left;
                    right0 = right;
                    released = 0;
                    wrapTime = 10;
                }
                if (up && 0 <= m_playerPosition.y) {
                    m_playerPosition.y -= speed;
                    if (m_playerPosition.y < 0) {
                        m_playerPosition.y = 0;
                    }
                } else if (down && (m_playerPosition.y + m_playerSize) <= m_canvas.height) {
                    m_playerPosition.y += speed;
                    if ((m_playerPosition.y + m_playerSize) > m_canvas.height) {
                        m_playerPosition.y = m_canvas.height - m_playerSize;
                    }
                }
                if (left && 0 <= m_playerPosition.x) {
                    m_playerPosition.x -= speed;
                    if (m_playerPosition.x < 0) {
                        m_playerPosition.x = 0;
                    }
                } else if (right && (m_playerPosition.x + m_playerSize) <= m_canvas.width) {
                    m_playerPosition.x += speed;
                    if ((m_playerPosition.x + m_playerSize) > m_canvas.width) {
                        m_playerPosition.x = m_canvas.width - m_playerSize;
                    }
                }
            } else {
                released = 1;
            }
            if (wrapTime)
                wrapTime--;

            if (m_wrapCooldown)
                m_wrapCooldown--;
        };
        //--------------------------------------------------------------------
        this.Draw = function () {
            m_context.drawImage(m_bgImg, 0, 0);
            if (m_wrapAnimation.timer) {
                m_context.strokeStyle = "aqua";
                m_context.beginPath();
                m_context.arc(m_wrapAnimation.x, m_wrapAnimation.y, m_wrapAnimation.timer / 10, 0, TWO_PI);
                m_context.stroke();
                m_wrapAnimation.timer--;
            }
            m_context.font = "14px Comic Sans MS";
            m_context.fillText("Wrap Cool Down", 0, 14);
            m_context.fillStyle = "red";
            m_context.fillRect(120, 0, m_wrapCooldown * 5, 16);
            m_context.drawImage(m_playerImg, m_playerPosition.x, m_playerPosition.y);
        };
        //--------------------------------------------------------------------
    };
    //--------------------------------------------------------------------
};
//--------------------------------------------------------------------
