/*
    Copyright (C) 2009-2013 Ewe, YS (Waterpine Studio)

    Reaction — AI Seek / Avoid / Pursuit Demo
    Ported from C++ Sora Physics Tutorial / Reaction.cpp

    Controls:
      Up / W      — Thrust forward (player)
      Left / A    — Rotate counter-clockwise (player)
      Right / D   — Rotate clockwise (player)
      Down / S    — Brake (player)
      Q           — Cycle AI reaction mode  (Seek → Avoid → Pursuit)
      E           — Cycle AI sensory mode   (Full → Round → Front)
*/

var g_reaction = new Reaction();
g_reaction.Start();
//--------------------------------------------------------------------

function Reaction() {
    var m_shell = new Shell();
    var m_canvas = null;
    var m_context = null;
    var m_space = null;
    //--------------------------------------------------------------------
    this.Start = function () {
        m_canvas = m_shell.GetCanvas('cvsReaction');
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
        var m_player = new Agent();
        var m_enemy = new Agent();
        var m_boundary = { x: 0, y: 0 };
        var m_targetAngle = 0.0;

        var REACTION_MODE = { SEEK: 0, AVOID: 1, PURSUIT: 2 };
        var REACTION_MSG = ['SEEK', 'AVOID', 'PURSUIT'];
        var reactionMode = REACTION_MODE.SEEK;

        var PADDLE_FORCE = 200.0;
        var ROTATE_STEP = 0.1;
        //--------------------------------------------------------------------
        this.Init = function () {
            m_boundary.x = m_canvas.width - 1;
            m_boundary.y = m_canvas.height - 1;

            m_bgImg = genStarField(m_canvas);

            // Player
            m_player.setPosition(m_canvas.width * 0.5, m_canvas.height * 0.5);
            m_player.radius = 22;
            m_player.color = '#e04000';
            m_player.topSpeed = 250;
            m_player.damping = 0.7;

            // Enemy
            m_enemy.setPosition(m_canvas.width * 0.15, m_canvas.height * 0.15);
            m_enemy.radius = 22;
            m_enemy.color = '#0080e0';
            m_enemy.topSpeed = 180;
            m_enemy.damping = 0.7;
            m_enemy.sensoryMode = SENSORY.ROUND;
            m_enemy.sensoryRadius = 200;
            m_enemy.sensoryRadiusSQ = 200 * 200;
            m_enemy.sensoryAngle = HALF_PI;
            m_enemy.updateAngle(findAngle(m_enemy.position, m_player.position));

            m_canvas.addEventListener('keydown', function (e) {
                if (e.keyCode === KEYS.Q) {
                    m_enemy.breaking();
                    reactionMode = (reactionMode + 1) % 3;
                    e.preventDefault();
                }
                if (e.keyCode === KEYS.E) {
                    m_enemy.breaking();
                    m_enemy.nextSensoryMode();
                    e.preventDefault();
                }
            }, true);
        };
        //--------------------------------------------------------------------

        function updatePlayer() {
            if (m_shell.IsKeyPressed(INPUT.LEFT)) m_player.rotate(-ROTATE_STEP);
            if (m_shell.IsKeyPressed(INPUT.RIGHT)) m_player.rotate(ROTATE_STEP);

            if (m_shell.IsKeyPressed(INPUT.UP)) {
                m_player.accelerate(PADDLE_FORCE);
            } else if (m_shell.IsKeyPressed(INPUT.DOWN)) {
                m_player.status = STATUS.DECELERATING;
            } else if (m_player.status === STATUS.ACCELERATING) {
                m_player.status = STATUS.DECELERATING;
            }

            if (m_player.isMoving()) {
                if (m_player.status === STATUS.ACCELERATING)
                    m_player.accelerate(PADDLE_FORCE);
                m_player.moving(0.016);
                m_player.worldCollision(m_boundary);
            }
        }
        //--------------------------------------------------------------------

        function updateEnemy() {
            var detected = false;

            if (m_enemy.sensoryMode === SENSORY.FULL) {
                detected = true;
                m_enemy.status = STATUS.ACCELERATING;
            } else if (m_enemy.sensoryMode === SENSORY.ROUND) {
                if (m_enemy.isInSensoryRangeSQ(m_player)) {
                    detected = true;
                    m_enemy.status = STATUS.ACCELERATING;
                }
            } else { // FRONT
                if (m_enemy.isInSensoryFrontRange(m_player)) {
                    detected = true;
                    m_enemy.status = STATUS.ACCELERATING;
                }
            }

            if (m_enemy.isMoving()) {
                if (detected) {
                    if (reactionMode === REACTION_MODE.PURSUIT) {
                        var aim = {
                            x: m_player.position.x + m_player.heading.x * m_player.radius,
                            y: m_player.position.y + m_player.heading.y * m_player.radius
                        };
                        m_targetAngle = findAngle(m_enemy.position, aim);
                    } else {
                        m_targetAngle = findAngle(m_enemy.position, m_player.position);
                        if (reactionMode === REACTION_MODE.AVOID) {
                            m_targetAngle += Math.PI;
                            if (m_targetAngle > TWO_PI) m_targetAngle -= TWO_PI;
                        }
                    }

                    m_enemy.smoothRotation(m_targetAngle);

                    if (isCollide(m_enemy, m_player)) {
                        m_enemy.status = STATUS.DECELERATING;
                    }
                } else {
                    m_enemy.smoothRotation(m_targetAngle);
                    m_enemy.status = STATUS.DECELERATING;
                }

                if (m_enemy.status === STATUS.ACCELERATING)
                    m_enemy.accelerate(PADDLE_FORCE);

                m_enemy.moving(0.016);
                m_enemy.worldCollision(m_boundary);
            }
        }
        //--------------------------------------------------------------------
        this.Update = function () {
            updatePlayer();
            updateEnemy();
        };
        //--------------------------------------------------------------------
        this.Draw = function () {
            m_context.drawImage(m_bgImg, 0, 0);

            // sensory overlay (enemy)
            m_enemy.drawSensoryRange(m_context);

            // draw agents
            m_player.draw(m_context);
            m_enemy.draw(m_context);

            // labels
            m_context.font = '11px monospace';
            m_context.fillStyle = '#f88';
            m_context.fillText('PLAYER', m_player.position.x - 22, m_player.position.y - 28);
            m_context.fillStyle = '#88f';
            m_context.fillText('AI', m_enemy.position.x - 8, m_enemy.position.y - 28);

            // HUD
            drawHUD(m_context, 10, 18, 'AI Status  : ' + STATUS_MSG[m_enemy.status]);
            drawHUD(m_context, 10, 36, 'AI Angle   : ' + (m_enemy.angleRadian / Math.PI * 180).toFixed(1) + '°');

            if (m_enemy.sensoryMode !== SENSORY.FULL)
                drawHUD(m_context, 10, 54, 'Sensory R  : ' + m_enemy.sensoryRadius.toFixed(0));
            if (m_enemy.sensoryMode === SENSORY.FRONT)
                drawHUD(m_context, 10, 72, 'Sensory A  : ' + (m_enemy.sensoryAngle / Math.PI * 180).toFixed(0) + '°');

            // mode badges
            var bx = m_canvas.width - 200;
            drawHUD(m_context, bx, 20, 'AI Mode  : ' + REACTION_MSG[reactionMode], '#7af');
            drawHUD(m_context, bx, 38, 'Sensory  : ' + SENSORY_MSG[m_enemy.sensoryMode], '#7af');

            drawHUD(m_context, 10, m_canvas.height - 12,
                '↑ Thrust   ← → Rotate   ↓ Brake   Q — AI mode   E — Sensory',
                'rgba(80,120,180,0.6)');
        };
        //--------------------------------------------------------------------
    }
    //--------------------------------------------------------------------
}
//--------------------------------------------------------------------
