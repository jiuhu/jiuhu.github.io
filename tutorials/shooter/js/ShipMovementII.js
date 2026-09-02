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

var g_shipMovementII = new ShipMovementII();
g_shipMovementII.Start();
//--------------------------------------------------------------------

function ShipMovementII() {
    var m_space = new Space();
    var m_shell = new Shell();
    var m_canvas = null;
    var m_context = null;
    //--------------------------------------------------------------------
    this.Start = function () {
        m_canvas = m_shell.GetCanvas("cvsShipMovementII");
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
        //--------------------------------------------------------------------
        this.Init = function () {
            m_bgImg = new Image();
            GenStars(m_canvas, m_bgImg);

            m_playerImg = new Image();
            m_playerImg.src = "texture/player.png";
            m_playerRadius = 32;
            m_playerPosition.x = (m_canvas.width / 2) - 16;
            m_playerPosition.y = (m_canvas.height / 2) - 16;
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
        };
        //--------------------------------------------------------------------
        this.Draw = function () {
            m_context.drawImage(m_bgImg, 0, 0);
            m_context.drawImage(m_playerImg, m_playerPosition.x, m_playerPosition.y);
        };
        //--------------------------------------------------------------------
    };
    //--------------------------------------------------------------------
};
//--------------------------------------------------------------------