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

var g_asteroidStrikeI = new AsteroidStrikeI();
g_asteroidStrikeI.Start();
//--------------------------------------------------------------------

function resetAsteroidStrikeI() {
    g_asteroidStrikeI.Reset();
}
//--------------------------------------------------------------------

function AsteroidStrikeI() {
    var m_space = new Space();
    var m_shell = new Shell();
    var m_canvas = null;
    var m_context = null;
    var m_id = null;
    //--------------------------------------------------------------------
    this.Start = function () {
        m_canvas = m_shell.GetCanvas("cvsAsteroidStrikeI");
        if (m_canvas) {
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
        m_space.Draw();
        m_context.restore();

        if (m_space.Over())
            clearInterval(m_id);
    };
    //--------------------------------------------------------------------

    function Space() {
        var m_bgImg = null;
        var m_playerImg = null;
        var m_playerPosition = { x: 0, y: 0 };
        var m_playerRadius = 0;
        var m_playerOffset = 0;
        var m_playerHP = g_myShipHP;
        var m_asteroidImg = null;
        var m_asteroidList = [];
        var m_asteroidRadius = 0;
        var m_asteroidOffset = 0;
        var m_asteroidSpawnCounter = 0;
        var m_textMargin = 0;
        var m_timeReamining = g_survivingTime;
        var m_isOver = false;
        var m_prevTime = getTimeInMilli();
        //--------------------------------------------------------------------
        this.Over = function () {
            return m_isOver;
        };
        //--------------------------------------------------------------------
        this.Init = function () {
            m_bgImg = new Image();
            GenStars(m_canvas, m_bgImg);

            m_playerImg = new Image();
            m_playerImg.src = "texture/player.png";
            m_playerRadius = 16;
            m_playerOffset = -m_playerRadius;
            m_playerPosition.x = m_canvas.width / 2;
            m_playerPosition.y = m_canvas.height / 2;

            m_asteroidImg = new Image();
            m_asteroidImg.src = "texture/asteroid.png";
            m_asteroidRadius = 16;
            m_asteroidOffset = -16;

            m_textMargin = m_canvas.width - 100;
        };
        //--------------------------------------------------------------------
        this.Reset = function () {
            m_playerPosition.x = m_canvas.width / 2;
            m_playerPosition.y = m_canvas.height / 2;
            m_playerHP = g_myShipHP;
            m_asteroidSpawnCounter = 0;
            m_timeReamining = g_survivingTime;
            m_asteroidList = [];
            m_isOver = false;
            m_prevTime = getTimeInMilli();
        };
        //--------------------------------------------------------------------
        this.Update = function () {
            if (m_shell.IsKeyPressed(INPUT.UP)) {
                this.MoveY(-g_shipSpeed);
            } else if (m_shell.IsKeyPressed(INPUT.DOWN)) {
                this.MoveY(g_shipSpeed);
            }
            if (m_shell.IsKeyPressed(INPUT.RIGHT)) {
                this.MoveX(g_shipSpeed);
            } else if (m_shell.IsKeyPressed(INPUT.LEFT)) {
                this.MoveX(-g_shipSpeed);
            }

            if (!m_asteroidSpawnCounter) {
                var asteroid = { x: Rand(m_asteroidRadius, m_canvas.width - m_asteroidRadius), y: m_asteroidOffset };
                m_asteroidList.push(asteroid);
                m_asteroidSpawnCounter = g_asteroidSpawnRate;
            } else {
                m_asteroidSpawnCounter--;
            }
        };
        //--------------------------------------------------------------------
        this.Draw = function () {
            m_context.drawImage(m_bgImg, 0, 0);
            for (var i = m_asteroidList.length; i-- > 0;) {
                var asteroid = m_asteroidList[i];
                asteroid.y += g_asteroidSpeed;
                if (asteroid.y > m_canvas.height) {
                    m_asteroidList.splice(i, 1);
                } else if (CollideEntity(asteroid.x, asteroid.y, m_asteroidRadius, m_playerPosition.x, m_playerPosition.y, m_playerRadius)) {
                    m_asteroidList.splice(i, 1);
                    m_playerHP -= g_asteroidDamage;
                } else {
                    m_context.setTransform(1, 0, 0, 1, asteroid.x, asteroid.y);
                    m_context.drawImage(m_asteroidImg, m_asteroidOffset, m_asteroidOffset);
                }
            }
            m_context.setTransform(1, 0, 0, 1, m_playerPosition.x, m_playerPosition.y);
            m_context.drawImage(m_playerImg, m_playerOffset, m_playerOffset);

            var currentTime = getTimeInMilli();
            if (currentTime - m_prevTime > 1000) {
                if (m_timeReamining > 0)
                    m_timeReamining--;
                m_prevTime = currentTime;
            }

            m_context.font = "14px Comic Sans MS";
            m_context.fillStyle = "red";
            m_context.setTransform(1, 0, 0, 1, 0, 0);
            m_context.fillText("Survive " + m_timeReamining, m_textMargin, 14);
            m_context.fillText("HP ", 5, 14);

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
                m_context.fillRect(40, 2, m_playerHP, 14);
            }
        };
        //--------------------------------------------------------------------
        this.MoveX = function (move) {
            m_playerPosition.x += move;
            if (m_playerPosition.x > m_canvas.width + m_playerOffset) {
                m_playerPosition.x = m_canvas.width + m_playerOffset;
            } else if (m_playerPosition.x < m_playerRadius) {
                m_playerPosition.x = m_playerRadius;
            }
        };
        //--------------------------------------------------------------------
        this.MoveY = function (move) {
            m_playerPosition.y += move;
            if (m_playerPosition.y > m_canvas.height + m_playerOffset) {
                m_playerPosition.y = m_canvas.height + m_playerOffset;
            } else if (m_playerPosition.y < m_playerRadius) {
                m_playerPosition.y = m_playerRadius;
            }
        };
        //--------------------------------------------------------------------
    };
    //--------------------------------------------------------------------
};
//--------------------------------------------------------------------