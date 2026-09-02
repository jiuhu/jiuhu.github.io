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

var g_directionalShoot = new DirectionalShoot();
g_directionalShoot.Start();
//--------------------------------------------------------------------

function DirectionalShoot() {
    var m_space = new Space();
    var m_shell = new Shell();
    var m_canvas = null;
    var m_context = null;
    //--------------------------------------------------------------------
    this.Start = function () {
        m_canvas = m_shell.GetCanvas("cvsDirectionalShoot");
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
        var m_turretPosition = { x: 0, y: 0 };
        var m_turretAiming = { s: 0, c: 1 };
        var m_currentAimed = 0;
        var m_currentStep = 1;
        var m_turretShootCounter = 0;
        var m_turretImg;
        var Aim = [
            { c: 0.8, s: -0.6 },
            { c: 1, s: 0 },
            { c: 0.8, s: 0.6 },
        ];
        var m_bulletImg = null;
        var m_bulletList = [];
        var m_bulletSize = 0;
        var m_bulletOffset = 0;
        //--------------------------------------------------------------------
        this.Init = function () {
            m_bgImg = new Image();
            GenStars(m_canvas, m_bgImg);

            m_turretPosition.x = m_canvas.width / 2;
            m_turretPosition.y = 100;

            m_turretImg = new Image();
            m_turretImg.src = "texture/turret.png";

            m_bulletSize = 4;
            m_bulletOffset = -m_bulletSize;

            m_bulletImg = new Image();
            DrawCircle(m_context, m_bulletSize, m_bulletSize, m_bulletSize, "white");
            GenImageFromContext(m_context, m_bulletImg, m_bulletSize * 2, m_bulletSize * 2);

            m_context.clearRect(0, 0, m_canvas.width, m_canvas.height);
        };
        //--------------------------------------------------------------------
        this.Update = function () {
            if (!this.m_turretShootCounter) {
                m_currentAimed += m_currentStep;
                if (m_currentAimed == 2) {
                    m_currentStep = -1;
                } else if (m_currentAimed == 0) {
                    m_currentStep = 1;
                }
                m_turretAiming.c = Aim[m_currentAimed].c;
                m_turretAiming.s = Aim[m_currentAimed].s;
                this.Shoot();
                this.m_turretShootCounter = g_turretShootRate;
            } else {
                this.m_turretShootCounter--;
            }
        };
        //--------------------------------------------------------------------
        this.Draw = function () {
            m_context.drawImage(m_bgImg, 0, 0);

            for (var i = m_bulletList.length; i-- > 0;) {
                var bullet = m_bulletList[i];
                bullet.x += bullet.vx;
                bullet.y += bullet.vy;
                if (bullet.x < 0 || bullet.x > m_canvas.width || bullet.y > m_canvas.height) {
                    m_bulletList.splice(i, 1);
                } else {
                    m_context.setTransform(1, 0, 0, 1, bullet.x, bullet.y);
                    m_context.drawImage(m_bulletImg, m_bulletOffset, m_bulletOffset);
                }
            }

            m_context.setTransform(m_turretAiming.c, m_turretAiming.s, -m_turretAiming.s, m_turretAiming.c, m_turretPosition.x, m_turretPosition.y);
            m_context.drawImage(m_turretImg, -16, -16);
        };
        //--------------------------------------------------------------------
        this.Shoot = function () {
            var bullet = {
                x: m_turretPosition.x,
                y: m_turretPosition.y,
                vx: -m_turretAiming.s,
                vy: m_turretAiming.c,
            };
            m_bulletList.push(bullet);
        };
        //--------------------------------------------------------------------
    };
    //--------------------------------------------------------------------
};
//--------------------------------------------------------------------