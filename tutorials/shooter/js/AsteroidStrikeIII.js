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

var g_asteroidStrikeIII = new AsteroidStrikeIII();
g_asteroidStrikeIII.Start();
//--------------------------------------------------------------------

function resetAsteroidStrikeIII() {
    g_asteroidStrikeIII.Reset();
}
//--------------------------------------------------------------------

function AsteroidStrikeIII() {
    var m_space = new Space();
    var m_shell = new Shell();
    var m_canvas = null;
    var m_context = null;
    var m_id = null;
    //--------------------------------------------------------------------
    this.Start = function () {
        m_canvas = m_shell.GetCanvas("cvsAsteroidStrikeIII");
        if (m_canvas) {
            m_context = m_canvas.getContext("2d");
            m_context = m_canvas.getContext("2d");
            if (m_context != null) {
                m_space.Init();
                m_id = setInterval(this.Frame, 16);
            }
        }
    };
    //--------------------------------------------------------------------
    this.Reset = function () {
        clearInterval(m_id);
        m_space.Reset();
        m_id = setInterval(this.Frame, 16);
    };
    //--------------------------------------------------------------------
    this.Frame = function () {
        m_context.clearRect(0, 0, m_canvas.width, m_canvas.height);
        m_context.save();
        m_space.Update();
        m_context.restore();

        if (m_space.Over())
            clearInterval(m_id);
    };
    //--------------------------------------------------------------------

    function Space() {
        var m_bgImg = null;
        var m_entityRadius = 0;
        var m_entityOffset = 0;
        var m_playerImg = null;
        var m_playerPosition = { x: 0, y: 0 };
        var m_playerHP = g_myShipHP;
        var m_bulletList = [];
        var m_bulletRadius = 0;
        var m_bulletOffset = 0;
        var m_shootCounter = 0;
        var m_prevShootStatus = 0;
        var m_chargedBulletWidth = 0;
        var m_chargedBulletHeight = 0;
        var m_chargedBulletOffsetX = 0;
        var m_chargedBulletOffsetY = 0;
        var m_chargedStatus = 0;
        var m_asteroidImg = null;
        var m_asteroidList = [];
        var m_asteroidSpawnCounter = 0;
        var m_explosionImg = null;
        var m_explosionList = [];
        var m_explosionSize = 0;
        var m_explosionOffset = 0;
        var m_textMargin = 0;
        var m_timeReamining = g_survivingTime;
        var m_score = 0;
        var m_isOver = false;
        var m_prevTime = getTimeInMilli();
        var m_currentType = null;
        var m_turret = null;
        var m_wrapCooldown = 0;
        var m_animate = 50;
        var m_wrapAnimation = { x: 0, y: 0, timer: 0 };
        //--------------------------------------------------------------------
        this.Over = function () {
            return m_isOver;
        };
        //--------------------------------------------------------------------
        this.Init = function () {
            m_bgImg = new Image();
            GenStars(m_canvas, m_bgImg);

            m_entityRadius = 16;
            m_entityOffset = -m_entityRadius;

            m_playerImg = new Image();
            m_playerImg.src = "texture/player.png";
            m_playerPosition.x = m_canvas.width / 2;
            m_playerPosition.y = m_canvas.height - (m_entityRadius * 2);

            m_bulletRadius = 8;
            m_bulletOffset = -m_bulletRadius / 2;

            m_chargedBulletWidth = 16;
            m_chargedBulletHeight = 32;
            m_chargedBulletOffsetX = -8;
            m_chargedBulletOffsetY = -32;

            m_asteroidImg = new Image();
            m_asteroidImg.src = "texture/asteroid.png";

            m_explosionImg = new Image();
            m_explosionImg.src = "texture/explosion.png";
            m_explosionSize = 64;
            m_explosionOffset = -32;

            m_textMargin = m_canvas.width - 100;
            m_context.font = "14px Comic Sans MS";

            m_currentType = g_shootType;

            m_turret = new Turret();
            m_turret.InitTurret(Rand(20, m_canvas.width - 20), 0);
        };
        //--------------------------------------------------------------------
        this.Reset = function () {
            m_context.font = "14px Comic Sans MS";
            m_playerPosition.x = m_canvas.width / 2;
            m_playerPosition.y = m_canvas.height - (m_entityRadius * 2);
            m_playerHP = g_myShipHP;
            m_asteroidSpawnCounter = 0;
            m_timeReamining = g_survivingTime;
            m_score = 0;
            m_chargedStatus = 0;
            m_bulletList = [];
            m_asteroidList = [];
            m_explosionList = [];
            m_isOver = false;
            m_prevTime = getTimeInMilli();
            m_currentType = g_shootType;

            m_turret.Reset();
        };
        //--------------------------------------------------------------------
        this.Update = function () {
            this.UpdateBackground();

            this.UpdateInput();

            this.UpdateBullet();

            this.UpdateAsteroids();

            this.UpdateTurrets();

            this.UpdateExplosion();

            this.UpdateInput();

            m_context.setTransform(1, 0, 0, 1, m_playerPosition.x, m_playerPosition.y);
            m_context.drawImage(m_playerImg, m_entityOffset, m_entityOffset);

            this.UpdateOnScreenInfo();
        };
        //--------------------------------------------------------------------
        var offsetY = 0;
        this.UpdateBackground = function () {
            var currentHeight = m_canvas.height - offsetY;
            m_context.drawImage(m_bgImg, 0, 0, m_canvas.width, currentHeight, 0, offsetY, m_canvas.width, currentHeight);

            m_context.drawImage(m_bgImg, 0, currentHeight, m_canvas.width, offsetY, 0, 0, m_canvas.width, offsetY);

            offsetY += g_scrollSpeed;
            if (offsetY > m_canvas.height) offsetY -= m_canvas.height;
        };
        //--------------------------------------------------------------------
        var released = 1;
        var up0 = 0, down0 = 0, left0 = 0, right0 = 0;
        this.UpdateInput = function () {
            var up = m_shell.IsKeyPressed(INPUT.UP);
            var down = m_shell.IsKeyPressed(INPUT.DOWN);
            var left = m_shell.IsKeyPressed(INPUT.LEFT);
            var right = m_shell.IsKeyPressed(INPUT.RIGHT);

            if (up || down || left || right) {
                var speed = 0;
                if (released && m_wrapCooldown == 0 &&
                    up == up0 && down == down0 &&
                    left == left0 && right == right0) {
                    m_wrapCooldown = g_wrapRate;
                    speed = g_wrapDistance;
                    m_wrapAnimation.x = m_playerPosition.x;
                    m_wrapAnimation.y = m_playerPosition.y;
                    m_wrapAnimation.timer = m_animate;
                } else {
                    speed = g_shipSpeed;
                    up0 = up;
                    down0 = down;
                    left0 = left;
                    right0 = right;
                    released = 0;
                }
                if (up) {
                    this.MoveY(-speed);
                } else if (down) {
                    this.MoveY(speed);
                }
                if (left) {
                    this.MoveX(-speed);
                } else if (right) {
                    this.MoveX(speed);
                }
            } else {
                released = 1;
            }

            if (m_wrapCooldown)
                m_wrapCooldown--;

            var shoot = m_shell.IsKeyPressed(INPUT.BTN_A);
            this.Shoot(shoot);
        };
        //--------------------------------------------------------------------
        this.UpdateTurrets = function () {
            m_playerHP += m_turret.UpdateFixedTurret(m_playerPosition, m_entityRadius);
        };
        //--------------------------------------------------------------------
        this.UpdateAsteroids = function () {
            if (!m_asteroidSpawnCounter) {
                this.SpawnAsteroid();
                m_asteroidSpawnCounter = g_asteroidSpawnRate;
            } else {
                m_asteroidSpawnCounter--;
            }

            for (var i = m_asteroidList.length; i--;) {
                var asteroid = m_asteroidList[i];
                asteroid.x += asteroid.vx;
                asteroid.y += asteroid.vy;
                if (asteroid.y > m_canvas.height) {
                    m_asteroidList.splice(i, 1);
                } else if (CollideEntity(asteroid.x, asteroid.y, m_entityRadius, m_playerPosition.x, m_playerPosition.y, m_entityRadius)) {
                    this.AddExplosion(asteroid.x, asteroid.y);
                    m_asteroidList.splice(i, 1);
                    m_playerHP -= g_asteroidDamage;
                } else {
                    m_context.setTransform(1, 0, 0, 1, asteroid.x, asteroid.y);
                    m_context.drawImage(m_asteroidImg, m_entityOffset, m_entityOffset);
                }
            }
        };
        //--------------------------------------------------------------------
        this.UpdateBullet = function () {
            var infoY = 42;
            for (var i = m_bulletList.length; i--;) {
                var bullet = m_bulletList[i];
                bullet.y -= g_bulletSpeed;
                if (bullet.y < 0) {
                    m_bulletList.splice(i, 1);
                } else {
                    m_context.fillStyle = "red";
                    m_context.setTransform(1, 0, 0, 1, bullet.x, bullet.y);
                    if (m_currentType == "auto") {
                        m_context.fillRect(m_bulletOffset, m_bulletOffset, m_bulletRadius, m_bulletRadius);
                    } else {
                        if (bullet.status < g_maxCharge) {
                            m_context.fillRect(m_bulletOffset, m_bulletOffset, m_bulletRadius, m_bulletRadius);
                        } else {
                            m_context.fillStyle = "blue";
                            m_context.fillRect(m_chargedBulletOffsetX, m_chargedBulletOffsetY, m_chargedBulletWidth, m_chargedBulletHeight);
                            if (bullet.chargedHitCounter > 1) {
                                m_context.setTransform(1, 0, 0, 1, 0, 0);
                                m_context.fillStyle = "red";
                                m_context.fillText(bullet.chargedHitCounter + " Hits!", m_textMargin, infoY);
                                infoY += 14;
                            }
                        }
                    }
                    if (m_turret.m_alive) {
                        if (CollideEntity(m_turret.x, m_turret.y, m_entityRadius, bullet.x, bullet.y, m_bulletRadius)) {
                            this.AddExplosion(m_turret.x, m_turret.y);
                            m_turret.m_alive = 0;
                            if (m_currentType == "charge" && bullet.status == g_maxCharge) {
                                bullet.chargedHitCounter++;
                                m_score += bullet.chargedHitCounter;
                            } else {
                                m_bulletList.splice(i, 1);
                            }
                            m_score += 5;
                            break;
                        }
                    }
                    for (var j = m_asteroidList.length; j--;) {
                        var asteroid = m_asteroidList[j];
                        if (CollideEntity(asteroid.x, asteroid.y, m_entityRadius, bullet.x, bullet.y, m_bulletRadius)) {
                            this.AddExplosion(asteroid.x, asteroid.y);
                            m_asteroidList.splice(j, 1);
                            if (m_currentType == "charge" && bullet.status == g_maxCharge) {
                                bullet.chargedHitCounter++;
                                m_score += bullet.chargedHitCounter;
                            } else {
                                m_bulletList.splice(i, 1);
                                m_score++;
                                break;
                            }
                        }
                    }
                }
            }
        };
        //--------------------------------------------------------------------
        this.UpdateExplosion = function () {
            for (var i = m_explosionList.length; i--;) {
                var explosion = m_explosionList[i];
                explosion.frame++;
                if (explosion.frame > 10) {
                    explosion.tx += m_explosionSize;
                    explosion.frame = 0;
                }
                if (explosion.tx > m_explosionImg.width) {
                    explosion.alive = 0;
                }
                if (explosion.alive) {
                    m_context.setTransform(1, 0, 0, 1, explosion.x, explosion.y);
                    m_context.drawImage(m_explosionImg, explosion.tx, 0, m_explosionSize, m_explosionSize, m_explosionOffset, m_explosionOffset, m_explosionSize, m_explosionSize);
                } else {
                    m_explosionList.splice(i, 1);
                }
            }
        };
        //--------------------------------------------------------------------
        this.UpdateOnScreenInfo = function () {
            m_context.fillStyle = "red";
            m_context.setTransform(1, 0, 0, 1, 0, 0);
            m_context.fillText("Survive " + m_timeReamining, m_textMargin, 14);
            m_context.fillText("Score " + m_score, m_textMargin, 28);
            m_context.fillText("HP ", 5, 14);
            m_context.fillText("Wrap", 5, 30);

            if (m_currentType == "charge") {
                m_context.fillText("CG ", 5, 46);
                if (m_chargedStatus == g_maxCharge)
                    m_context.fillStyle = "blue";
                m_context.fillRect(40, 32, m_chargedStatus, 14);
            }

            if (m_wrapAnimation.timer) {
                m_context.strokeStyle = "aqua";
                m_context.beginPath();
                m_context.arc(m_wrapAnimation.x, m_wrapAnimation.y, m_wrapAnimation.timer / 10, 0, TWO_PI);
                m_context.stroke();
                m_wrapAnimation.timer--;
            }
            m_context.fillStyle = "blue";
            m_context.fillRect(40, 16, m_wrapCooldown * 5, 14);

            var currentTime = getTimeInMilli();
            if (currentTime - m_prevTime > 1000) {
                if (m_timeReamining > 0)
                    m_timeReamining--;
                m_prevTime = currentTime;
            }

            if (m_timeReamining == 0) {
                m_isOver = true;
                m_context.font = "40px Comic Sans MS";
                m_context.fillText("You win!", 100, m_canvas.height / 2);
            } else if (m_playerHP <= 0) {
                m_isOver = true;
                m_context.font = "40px Comic Sans MS";
                m_context.fillText("Game Over!", 100, m_canvas.height / 2);
            } else {
                if (m_playerHP < 25)
                    m_context.fillStyle = "yellow";
                else
                    m_context.fillStyle = "red";
                m_context.fillRect(40, 2, m_playerHP, 14);
            }
        };
        //--------------------------------------------------------------------
        this.MoveX = function (move) {
            m_playerPosition.x += move;
            if (m_playerPosition.x > m_canvas.width + m_entityOffset) {
                m_playerPosition.x = m_canvas.width + m_entityOffset;
            } else if (m_playerPosition.x < m_entityRadius) {
                m_playerPosition.x = m_entityRadius;
            }
        };
        //--------------------------------------------------------------------
        this.MoveY = function (move) {
            m_playerPosition.y += move;
            if (m_playerPosition.y > m_canvas.height + m_entityOffset) {
                m_playerPosition.y = m_canvas.height + m_entityOffset;
            } else if (m_playerPosition.y < m_entityRadius) {
                m_playerPosition.y = m_entityRadius;
            }
        };
        //--------------------------------------------------------------------
        this.Shoot = function (shoot) {
            var bullet = null;
            if (m_currentType == "auto") {
                if (shoot) {
                    if (!m_prevShootStatus || !m_shootCounter) {
                        bullet = { x: m_playerPosition.x, y: m_playerPosition.y };
                        m_shootCounter = g_autofireRate;
                    }
                    m_shootCounter--;
                }
                m_prevShootStatus = shoot;
            } else {
                if (shoot && m_chargedStatus < g_maxCharge) {
                    m_chargedStatus++;
                } else if (!shoot && m_chargedStatus > 0) {
                    bullet = { x: m_playerPosition.x, y: m_playerPosition.y, status: m_chargedStatus, chargedHitCounter: 0 };
                    m_chargedStatus = 0;
                }
            }

            if (bullet) m_bulletList.push(bullet);
        };
        //--------------------------------------------------------------------
        this.SpawnAsteroid = function () {
            var asteroid = {
                x: Rand(m_entityRadius, m_canvas.width - m_entityRadius), y: m_entityOffset,
                vx: 0, vy: 0,
            };
            if (Rand(0, 1) == 0) {
                var directionX = m_playerPosition.x - asteroid.x;
                var directionY = m_playerPosition.y - asteroid.y;
                var distance = Math.sqrt(directionX * directionX + directionY * directionY);
                asteroid.vx = directionX / distance * g_asteroidSpeed;
                asteroid.vy = directionY / distance * g_asteroidSpeed;
            } else {
                asteroid.vx = 0;
                asteroid.vy = g_asteroidSpeed;
            }
            m_asteroidList.push(asteroid);
        };
        //--------------------------------------------------------------------
        this.AddExplosion = function (ex, ey) {
            var explosion = { x: ex, y: ey, alive: 1, frame: 0, tx: 0 };
            m_explosionList.push(explosion);
        };
        //--------------------------------------------------------------------
    };
    //--------------------------------------------------------------------

    var Aim = [
        { c: 0.8, s: -0.6 },
        { c: 1, s: 0 },
        { c: 0.8, s: 0.6 },
    ];
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
        var m_bulletList = [];
        var m_bulletSize = 0;
        var m_bulletOffset = 0;
        this.m_alive = 1;
        var respawnCounter = 30;
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
        this.Reset = function () {
            m_bulletList = [];
            this.aiming = 0;
            this.step = 1;
            this.counter = 0;
            this.m_alive = 1;
            var respawnCounter = 30;
            this.x = Rand(20, m_canvas.width - 20);
            this.y = 0;
        }
        //--------------------------------------------------------------------
        this.UpdateFixedTurret = function (playerPosition, entityRadius) {
            if (this.m_alive) {
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
                m_context.setTransform(this.c, this.s, -this.s, this.c, this.x, this.y);
                m_context.drawImage(turretImg, -16, -16);
            } else {
                if (respawnCounter) {
                    respawnCounter--;
                } else {
                    this.m_alive = 1;
                    this.x = Rand(20, m_canvas.width - 20);
                    this.y = 0;
                    respawnCounter = 30;
                }
            }
            var dm = 0;
            m_context.fillStyle = "white";
            for (var i = m_bulletList.length; i-- > 0;) {
                var bullet = m_bulletList[i];
                bullet.x += bullet.vx;
                bullet.y += bullet.vy + g_scrollSpeed;
                if (bullet.x < 0 || bullet.x > m_canvas.width || bullet.y > m_canvas.height) {
                    m_bulletList.splice(i, 1);
                } else if (CollideEntity(bullet.x, bullet.y, m_bulletSize, playerPosition.x, playerPosition.y, entityRadius)) {
                    m_space.AddExplosion(bullet.x, bullet.y);
                    m_bulletList.splice(i, 1);
                    dm = -1;
                } else {
                    m_context.setTransform(1, 0, 0, 1, bullet.x, bullet.y);
                    m_context.fillRect(m_bulletOffset, m_bulletOffset, m_bulletSize, m_bulletSize);
                }
            }


            this.y += g_scrollSpeed;
            if (this.y > m_canvas.height) this.m_alive = 0;

            return dm;
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