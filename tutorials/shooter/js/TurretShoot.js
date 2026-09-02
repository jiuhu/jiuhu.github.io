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

var g_turretShoot = new TurretShoot();
g_turretShoot.Start();
//--------------------------------------------------------------------

function TurretShoot() {
    var m_space = new Space();
    var m_shell = new Shell();
    var m_canvas = null;
    var m_context = null;
    //--------------------------------------------------------------------
    this.Start = function () {
        m_canvas = m_shell.GetCanvas("cvsTurretShoot");
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
        var m_playerRadius = 0;
        var m_turret;
        //--------------------------------------------------------------------
        this.Init = function () {
            m_bgImg = new Image();
            GenStars(m_canvas, m_bgImg);

            m_playerImg = new Image();
            m_playerImg.src = "texture/player.png";
            m_playerRadius = 32;
            m_playerPosition.x = (m_canvas.width / 2) - 16;
            m_playerPosition.y = (m_canvas.height / 2) - 16;

            m_turret = new Turret();
            m_turret.InitTurret((m_canvas.width / 2), 100);
        };
        //--------------------------------------------------------------------
        this.Update = function () {
            if (m_shell.IsKeyPressed(INPUT.UP) && 0 <= m_playerPosition.y) {
                m_playerPosition.y -= g_shipSpeed;
            } else if (m_shell.IsKeyPressed(INPUT.DOWN) && (m_playerPosition.y + m_playerRadius) <= m_canvas.height) {
                m_playerPosition.y += g_shipSpeed;
            }
            if (m_shell.IsKeyPressed(INPUT.LEFT) && 0 <= m_playerPosition.x) {
                m_playerPosition.x -= g_shipSpeed;
            } else if (m_shell.IsKeyPressed(INPUT.RIGHT) && (m_playerPosition.x + m_playerRadius) <= m_canvas.width) {
                m_playerPosition.x += g_shipSpeed;
            }

            m_turret.UpdateFixedTurret();
        };
        //--------------------------------------------------------------------
        this.Draw = function () {
            m_context.drawImage(m_bgImg, 0, 0);
            m_context.drawImage(m_playerImg, m_playerPosition.x, m_playerPosition.y);

            m_turret.Draw();
        };
        //--------------------------------------------------------------------
    };
    //--------------------------------------------------------------------

    function Turret() {
        this.x = 0;
        this.y = 0;
        this.c = 1;
        this.s = 0;
        this.aiming = 0;
        this.step = 1;
        this.counter = 0;
        this.turretImg;
        var Aim = [
            { c: 0.8, s: -0.6 },
            { c: 1, s: 0 },
            { c: 0.8, s: 0.6 },
        ];
        var m_bulletList = [];
        var m_bulletSize = 0;
        var m_bulletOffset = 0;
        //--------------------------------------------------------------------
        this.InitTurret = function (mx, my) {
            this.x = mx;
            this.y = my;

            turretImg = new Image();
            turretImg.src = "texture/turret.png";

            m_bulletSize = 8;
            m_bulletOffset = -4;
        }
        //--------------------------------------------------------------------
        this.UpdateFixedTurret = function () {
            if (!this.counter) {
                this.aiming += this.step;
                if (this.aiming == 2) {
                    this.step = -1;
                } else if (this.aiming == 0) {
                    this.step = 1;
                }
                this.c = Aim[this.aiming].c;
                this.s = Aim[this.aiming].s;
                this.Shoot();
                this.counter = g_turretShootRate;
            } else {
                this.counter--;
            }
        }
        //--------------------------------------------------------------------
        this.Draw = function () {

            for (var i = m_bulletList.length; i-- > 0;) {
                var bullet = m_bulletList[i];
                bullet.x += bullet.vx;
                bullet.y += bullet.vy;
                if (bullet.x < 0 || bullet.x > m_canvas.width || bullet.y > m_canvas.height) {
                    m_bulletList.splice(i, 1);
                } else {
                    m_context.setTransform(1, 0, 0, 1, bullet.x, bullet.y);
                    m_context.fillRect(m_bulletOffset, m_bulletOffset, m_bulletSize, m_bulletSize);
                }
            }

            m_context.setTransform(this.c, this.s, -this.s, this.c, this.x, this.y);
            m_context.drawImage(turretImg, -16, -16);
        }
        //--------------------------------------------------------------------
        this.Shoot = function () {
            var bullet = {
                x: this.x,
                y: this.y,
                vx: -this.s,
                vy: this.c,
            };
            m_bulletList.push(bullet);
        };
        //--------------------------------------------------------------------
    }
    //--------------------------------------------------------------------
};
//--------------------------------------------------------------------