/*
    Copyright (C) 2009-2013 Ewe, YS (Waterpine Studio)

    Sensing — Rotation Modes & Sensory Field Demo
    Ported from C++ Sora Physics Tutorial / Sensing.cpp

    Controls:
      Mouse click  — Rotate toward click (within sensory range)
      Mouse move   — Rotate toward mouse (Move to Rotate mode)
      Q            — Cycle rotation mode  (Click → Move → Animate)
      E            — Cycle sensory mode   (Full → Round → Front)
*/

var g_sensing = new Sensing();
g_sensing.Start();
//--------------------------------------------------------------------

function Sensing() {
    var m_shell = new Shell();
    var m_canvas = null;
    var m_context = null;
    var m_space = null;
    //--------------------------------------------------------------------
    this.Start = function () {
        m_canvas = m_shell.GetCanvas('cvsSensing');
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
        var m_targetAngle = 0.0;
        var m_isRotating = false;
        var m_mousePos = { x: 0, y: 0 };
        var m_clickPos = { x: 0, y: 0 };

        var ROTATION_MODE = { CLICK: 0, MOVE: 1, ANIME: 2 };
        var ROTATION_MSG = ['Click to Rotate', 'Move to Rotate', 'Rotate Animation'];
        var rotationMode = ROTATION_MODE.CLICK;
        //--------------------------------------------------------------------

        function canRotateToward(targetPos) {
            if (m_agent.sensoryMode === SENSORY.ROUND) {
                var dx = targetPos.x - m_agent.position.x;
                var dy = targetPos.y - m_agent.position.y;
                return dx * dx + dy * dy < m_agent.sensoryRadiusSQ;
            }
            if (m_agent.sensoryMode === SENSORY.FRONT) {
                var east = m_agent.angleRadian + m_agent.sensoryAngle;
                if (east > TWO_PI) east -= TWO_PI;
                var west = east - m_agent.sensoryAngle * 2;
                east -= 0.1; west += 0.1;
                var ddx = targetPos.x - m_agent.position.x;
                var ddy = targetPos.y - m_agent.position.y;
                var fa = getAngle(ddx, ddy);
                if (ddx < 0) fa = (west < 0) ? -fa : TWO_PI - fa;
                if (fa < east && fa > west) {
                    var distSQ = ddx * ddx + ddy * ddy;
                    return distSQ < m_agent.sensoryRadiusSQ;
                }
                return false;
            }
            return true; // FULL_SENSORY — always
        }
        //--------------------------------------------------------------------

        this.Init = function () {
            m_bgImg = genStarField(m_canvas);

            m_agent.setPosition(m_canvas.width * 0.5, m_canvas.height * 0.5);
            m_agent.radius = 22;
            m_agent.color = '#80a020';
            m_agent.sensoryRadius = 160;
            m_agent.sensoryRadiusSQ = 160 * 160;
            m_agent.sensoryAngle = HALF_PI;

            // Mouse events
            m_canvas.addEventListener('click', function (e) {
                var r = m_canvas.getBoundingClientRect();
                var mx = e.clientX - r.left;
                var my = e.clientY - r.top;
                m_clickPos.x = mx;
                m_clickPos.y = my;

                if (!canRotateToward(m_clickPos)) return;

                if (rotationMode === ROTATION_MODE.CLICK) {
                    m_agent.updateAngle(findAngle(m_agent.position, m_clickPos));
                } else if (rotationMode === ROTATION_MODE.ANIME) {
                    m_targetAngle = findAngle(m_agent.position, m_clickPos);
                    m_isRotating = true;
                }
            });
            //--------------------------------------------------------------------
            m_canvas.addEventListener('mousemove', function (e) {
                var r = m_canvas.getBoundingClientRect();
                m_mousePos.x = e.clientX - r.left;
                m_mousePos.y = e.clientY - r.top;

                if (rotationMode === ROTATION_MODE.MOVE) {
                    m_clickPos.x = m_mousePos.x;
                    m_clickPos.y = m_mousePos.y;
                    if (canRotateToward(m_clickPos))
                        m_agent.updateAngle(findAngle(m_agent.position, m_clickPos));
                }
            });
            //--------------------------------------------------------------------
            m_canvas.addEventListener('keydown', function (e) {
                if (e.keyCode === KEYS.Q) {
                    rotationMode = (rotationMode + 1) % 3;
                    m_isRotating = false;
                    e.preventDefault();
                }
                if (e.keyCode === KEYS.E) {
                    m_agent.nextSensoryMode();
                    e.preventDefault();
                }
            }, true);
        };
        //--------------------------------------------------------------------
        this.Update = function () {
            if (rotationMode === ROTATION_MODE.ANIME && m_isRotating) {
                var a = m_agent.angleRadian;
                if (m_targetAngle - a > Math.PI) a -= 0.1;
                else if (a - m_targetAngle > Math.PI) a += 0.1;
                else if (a > m_targetAngle) a -= 0.1;
                else a += 0.1;
                var dist = a - m_targetAngle;
                if (dist > -0.1 && dist < 0.1) { a = m_targetAngle; m_isRotating = false; }
                if (a > TWO_PI) a -= TWO_PI;
                else if (a < 0) a += TWO_PI;
                m_agent.updateAngle(a);
            }
        };
        //--------------------------------------------------------------------
        this.Draw = function () {
            m_context.drawImage(m_bgImg, 0, 0);

            // sensory overlay
            m_agent.drawSensoryRange(m_context);

            // click target dot
            if (m_clickPos.x !== 0 || m_clickPos.y !== 0) {
                m_context.beginPath();
                m_context.arc(m_clickPos.x, m_clickPos.y, 4, 0, TWO_PI);
                m_context.fillStyle = 'rgba(255,200,60,0.7)';
                m_context.fill();
            }

            m_agent.draw(m_context);

            // HUD
            drawHUD(m_context, 10, 18, 'Position : (' + Math.round(m_agent.position.x) + ', ' + Math.round(m_agent.position.y) + ')');
            drawHUD(m_context, 10, 36, 'Angle    : ' + (m_agent.angleRadian / Math.PI * 180).toFixed(1) + '°  (' + m_agent.angleRadian.toFixed(2) + ' rad)');
            drawHUD(m_context, 10, 54, 'Heading  : (' + m_agent.heading.x.toFixed(2) + ', ' + m_agent.heading.y.toFixed(2) + ')');
            drawHUD(m_context, 10, 72, 'Mouse    : (' + Math.round(m_mousePos.x) + ', ' + Math.round(m_mousePos.y) + ')');
            drawHUD(m_context, 10, 90, 'Target   : (' + Math.round(m_clickPos.x) + ', ' + Math.round(m_clickPos.y) + ')');

            if (m_agent.sensoryMode !== SENSORY.FULL) {
                drawHUD(m_context, 10, m_canvas.height - 48, 'Sensory Radius : ' + m_agent.sensoryRadius.toFixed(0));
                if (m_agent.sensoryMode === SENSORY.FRONT)
                    drawHUD(m_context, 10, m_canvas.height - 30, 'Sensory Angle  : ' + (m_agent.sensoryAngle / Math.PI * 180).toFixed(0) + '°');
            }

            // mode badges
            var bx = m_canvas.width - 200;
            drawHUD(m_context, bx, 20, 'Rotate  : ' + ROTATION_MSG[rotationMode], '#7af');
            drawHUD(m_context, bx, 38, 'Sensory : ' + SENSORY_MSG[m_agent.sensoryMode], '#7af');

            drawHUD(m_context, 10, m_canvas.height - 12,
                'Q — Rotation mode   E — Sensory mode   Click/Move to aim',
                'rgba(80,120,180,0.6)');
        };
        //--------------------------------------------------------------------
    }
    //--------------------------------------------------------------------
}
//--------------------------------------------------------------------
