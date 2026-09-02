/*
    Copyright (C) 2009-2013 Ewe, YS (Waterpine Studio)

    Scroll — Parallax Background Scrolling Demo
    Ported from C++ Sora Physics Tutorial / Scroll.cpp
    (Original was a stub; implemented as a 4-layer parallax scroll)

    Controls:
      Arrow / WASD — Move agent
*/

var g_scroll = new Scroll();
g_scroll.Start();
//--------------------------------------------------------------------

function Scroll() {
    var m_shell = new Shell();
    var m_canvas = null;
    var m_context = null;
    var m_space = null;
    //--------------------------------------------------------------------
    this.Start = function () {
        m_canvas = m_shell.GetCanvas('cvsScroll');
        if (!m_canvas) return;
        m_context = m_canvas.getContext('2d');
        m_space = new Space();
        m_space.Init();
        setInterval(this.Frame, 16);
        m_canvas.focus();
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
        // 4 parallax layers with different speeds and star densities
        var LAYERS = [
            { speed: 0.10, starSize: 1, density: 80, color: 'rgba(80,90,120,0.4)', stars: [] },
            { speed: 0.25, starSize: 1, density: 50, color: 'rgba(120,130,160,0.6)', stars: [] },
            { speed: 0.50, starSize: 1.5, density: 30, color: 'rgba(160,170,200,0.8)', stars: [] },
            { speed: 1.00, starSize: 2, density: 15, color: 'rgba(220,230,255,1.0)', stars: [] },
        ];

        var m_player = new Agent();
        var m_boundary = { x: 0, y: 0 };
        var SHIP_SPEED = 3;

        // World offset (camera scrolls with player world position)
        var m_worldX = 0;
        var m_worldY = 0;
        //--------------------------------------------------------------------

        function genLayerStars(layer) {
            layer.stars = [];
            var worldSize = 4096;
            for (var i = 0; i < layer.density * 40; i++) {
                layer.stars.push({
                    x: Math.random() * worldSize - worldSize * 0.5,
                    y: Math.random() * worldSize - worldSize * 0.5
                });
            }
        }
        //--------------------------------------------------------------------
        this.Init = function () {
            m_boundary.x = m_canvas.width - 1;
            m_boundary.y = m_canvas.height - 1;

            for (var i = 0; i < LAYERS.length; i++) genLayerStars(LAYERS[i]);

            m_player.setPosition(m_canvas.width * 0.5, m_canvas.height * 0.5);
            m_player.radius = 18;
            m_player.color = '#e04000';
            m_player.topSpeed = 200;
            m_player.damping = 0.7;
        };
        //--------------------------------------------------------------------
        this.Update = function () {
            var vx = 0, vy = 0;
            if (m_shell.IsKeyPressed(INPUT.UP)) vy -= SHIP_SPEED;
            if (m_shell.IsKeyPressed(INPUT.DOWN)) vy += SHIP_SPEED;
            if (m_shell.IsKeyPressed(INPUT.LEFT)) vx -= SHIP_SPEED;
            if (m_shell.IsKeyPressed(INPUT.RIGHT)) vx += SHIP_SPEED;

            m_worldX += vx;
            m_worldY += vy;

            // Update player facing direction based on movement
            if (vx !== 0 || vy !== 0) {
                var angle = Math.atan2(vx, -vy); // atan2 in screen coords → our angle convention
                if (angle < 0) angle += TWO_PI;
                m_player.updateAngle(angle);
            }
        };
        //--------------------------------------------------------------------
        this.Draw = function () {
            var cx = m_canvas.width * 0.5;
            var cy = m_canvas.height * 0.5;

            // Black background
            m_context.fillStyle = '#000';
            m_context.fillRect(0, 0, m_canvas.width, m_canvas.height);

            // Draw each layer with parallax offset
            for (var l = 0; l < LAYERS.length; l++) {
                var layer = LAYERS[l];
                m_context.fillStyle = layer.color;
                var ox = (m_worldX * layer.speed) % m_canvas.width;
                var oy = (m_worldY * layer.speed) % m_canvas.height;

                for (var s = 0; s < layer.stars.length; s++) {
                    var star = layer.stars[s];
                    // Wrap star position on screen
                    var sx = ((star.x - m_worldX * layer.speed) % m_canvas.width + m_canvas.width * 2) % m_canvas.width;
                    var sy = ((star.y - m_worldY * layer.speed) % m_canvas.height + m_canvas.height * 2) % m_canvas.height;
                    m_context.fillRect(sx, sy, layer.starSize, layer.starSize);
                }
            }

            // Player always in center
            m_player.setPosition(cx, cy);
            m_player.draw(m_context);

            // HUD
            drawHUD(m_context, 10, 18, 'World   : (' + Math.round(m_worldX) + ', ' + Math.round(m_worldY) + ')');
            drawHUD(m_context, 10, 36, 'Layer speeds : 0.10 · 0.25 · 0.50 · 1.00');

            // Layer speed labels
            var layerColors = ['rgba(80,90,120,0.8)', 'rgba(120,130,160,0.9)', 'rgba(160,170,200,1)', 'rgba(220,230,255,1)'];
            var lx = m_canvas.width - 180;
            m_context.font = '11px monospace';
            for (var ll = 0; ll < LAYERS.length; ll++) {
                m_context.fillStyle = layerColors[ll];
                m_context.fillText('Layer ' + (ll + 1) + ' — speed ' + LAYERS[ll].speed.toFixed(2), lx, 20 + ll * 18);
            }

            drawHUD(m_context, 10, m_canvas.height - 12,
                'Arrow / WASD — Move',
                'rgba(80,120,180,0.6)');
        };
        //--------------------------------------------------------------------
    }
    //--------------------------------------------------------------------
}
//--------------------------------------------------------------------
