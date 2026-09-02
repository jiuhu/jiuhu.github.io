/*
    Copyright (C) 2009-2013 Ewe, YS (Waterpine Studio)

    Motion — Agent Locomotion Demo
    Ported from C++ Sora Physics Tutorial / Motion.cpp

    Controls:
      Up / W      — Thrust forward
      Left / A    — Rotate counter-clockwise
      Right / D   — Rotate clockwise
      Down / S    — Brake
*/

var g_motion = new Motion();
g_motion.Start();
//--------------------------------------------------------------------

function Motion() {
    var m_shell = new Shell();
    var m_canvas = null;
    var m_context = null;
    var m_space = null;
    //--------------------------------------------------------------------
    this.Start = function () {
        m_canvas = m_shell.GetCanvas('cvsMotion');
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
        var m_bgImg = null;
        var m_agent = new Agent();
        var m_boundary = { x: 0, y: 0 };

        var PADDLE_FORCE = 200.0;
        var ROTATE_STEP = 0.1;
        //--------------------------------------------------------------------
        this.Init = function () {
            m_boundary.x = m_canvas.width - 1;
            m_boundary.y = m_canvas.height - 1;

            m_bgImg = genStarField(m_canvas);

            m_agent.setPosition(m_canvas.width * 0.5, m_canvas.height * 0.5);
            m_agent.radius = 22;
            m_agent.color = '#e04000';
            m_agent.topSpeed = 250;
            m_agent.damping = 0.7;
        };
        //--------------------------------------------------------------------
        this.Update = function () {
            if (m_shell.IsKeyPressed(INPUT.LEFT)) m_agent.rotate(-ROTATE_STEP);
            if (m_shell.IsKeyPressed(INPUT.RIGHT)) m_agent.rotate(ROTATE_STEP);

            if (m_shell.IsKeyPressed(INPUT.UP)) {
                m_agent.accelerate(PADDLE_FORCE);
            } else if (m_shell.IsKeyPressed(INPUT.DOWN)) {
                m_agent.status = STATUS.DECELERATING;
            } else if (m_agent.status === STATUS.ACCELERATING) {
                m_agent.status = STATUS.DECELERATING;
            }

            if (m_agent.isMoving()) {
                if (m_agent.status === STATUS.ACCELERATING)
                    m_agent.accelerate(PADDLE_FORCE);
                m_agent.moving(0.016);
                m_agent.worldCollision(m_boundary);
            }
        };
        //--------------------------------------------------------------------
        this.Draw = function () {
            // background
            m_context.drawImage(m_bgImg, 0, 0);

            // agent
            m_agent.draw(m_context);

            // HUD
            var spd = Math.sqrt(m_agent.velocity.x * m_agent.velocity.x + m_agent.velocity.y * m_agent.velocity.y);
            drawHUD(m_context, 10, 18, 'Position : (' + Math.round(m_agent.position.x) + ', ' + Math.round(m_agent.position.y) + ')');
            drawHUD(m_context, 10, 36, 'Heading  : (' + m_agent.heading.x.toFixed(2) + ', ' + m_agent.heading.y.toFixed(2) + ')');
            drawHUD(m_context, 10, 54, 'Angle    : ' + (m_agent.angleRadian / Math.PI * 180).toFixed(1) + '°');
            drawHUD(m_context, 10, 72, 'Speed    : ' + spd.toFixed(1));
            drawHUD(m_context, 10, 90, 'Status   : ' + STATUS_MSG[m_agent.status]);

            // controls hint
            drawHUD(m_context, 10, m_canvas.height - 12,
                '↑ Thrust   ← → Rotate   ↓ Brake',
                'rgba(80,120,180,0.6)');
        };
        //--------------------------------------------------------------------
    }
    //--------------------------------------------------------------------
}
//--------------------------------------------------------------------
