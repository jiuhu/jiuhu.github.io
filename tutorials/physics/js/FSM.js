/*
    Copyright (C) 2009-2013 Ewe, YS (Waterpine Studio)

    FSM — RPG State Machine Simulation
    Ported from C++ Sora Physics Tutorial / RPG / FSM.cpp

    The enemy uses a Finite State Machine:
      PATROL → (detect player?) → ENCOUNTER
      ENCOUNTER → (critical HP?) → ESCAPE  |  → attack
      ESCAPE → (detected again?) → ENCOUNTER  |  → REST
      REST → (high HP?) → PATROL  |  → resting (heal)

    UI controls are injected into the #side-panel div in demo.html.
*/

var g_fsm = new FSMSim();
g_fsm.Start();
//--------------------------------------------------------------------

// ---- PlayingCharacter ----
function PlayingCharacter(maxHP, damage) {
    this.maxHP = maxHP || 10;
    this.hp = this.maxHP;
    this.damage = damage || 3;
}
PlayingCharacter.prototype.setMaxHP = function (v) { this.maxHP = v; this.hp = v; };
PlayingCharacter.prototype.setDamage = function (v) { this.damage = v; };
PlayingCharacter.prototype.getHP = function () { return this.hp; };
PlayingCharacter.prototype.getMaxHP = function () { return this.maxHP; };
PlayingCharacter.prototype.getDamage = function () { return this.damage; };
PlayingCharacter.prototype.isDead = function () { return this.hp <= 0; };
PlayingCharacter.prototype.fullHealth = function () { this.hp = this.maxHP; };
PlayingCharacter.prototype.damaged = function (d) { this.hp -= d; if (this.hp < 0) this.hp = 0; };
PlayingCharacter.prototype.heal = function () { if (this.hp < this.maxHP) this.hp++; };
PlayingCharacter.prototype.reset = function () { this.maxHP = 10; this.hp = 10; this.damage = 3; };
//--------------------------------------------------------------------

// ---- EnemyCharacter ----
var STATE = { PATROL: 0, ENCOUNTER: 1, ESCAPE: 2, REST: 3, DEAD: 4 };
var STATE_MSG = ['PATROL', 'ENCOUNTER', 'ESCAPE', 'REST', 'DEAD'];

var g_criticalHP = 3;
var g_highHP = 8;
var g_encounterChance = 50;

function EnemyCharacter() {
    PlayingCharacter.call(this, 10, 3);
    this.state = STATE.PATROL;
    this.log = '';
}
EnemyCharacter.prototype = Object.create(PlayingCharacter.prototype);
EnemyCharacter.prototype.constructor = EnemyCharacter;

EnemyCharacter.prototype.getStateMsg = function () { return STATE_MSG[this.state]; };
EnemyCharacter.prototype.isDead = function () { return this.state === STATE.DEAD; };
EnemyCharacter.prototype.initialState = function () { this.state = STATE.PATROL; this.fullHealth(); };
EnemyCharacter.prototype.reset = function () { PlayingCharacter.prototype.reset.call(this); this.state = STATE.PATROL; };

EnemyCharacter.prototype.changeState = function (newState) {
    this.log += 'Change State : ' + STATE_MSG[this.state] + ' → ' + STATE_MSG[newState] + '\n';
    this.state = newState;
};

EnemyCharacter.prototype.detectPlayer = function () {
    var roll = randInt(0, 100);
    this.log += 'Sense : Detecting player... (Roll: ' + roll + ')\n';
    if (roll < g_encounterChance) {
        this.log += 'Think : Detect player\n';
        return true;
    }
    this.log += 'Think : Didn\'t detect player\n';
    return false;
};

EnemyCharacter.prototype.criticalHealth = function () {
    this.log += 'Sense : Reviewing my HP\n';
    if (this.hp > g_criticalHP) { this.log += 'Think : My HP is high\n'; return true; }
    this.log += 'Think : My HP is low\n';
    return false;
};

EnemyCharacter.prototype.highHealth = function () {
    this.log += 'Sense : Reviewing my HP\n';
    if (this.hp > g_highHP) { this.log += 'Think : My HP is high\n'; return true; }
    this.log += 'Think : My HP is low\n';
    return false;
};

EnemyCharacter.prototype.update = function (player) {
    this.log = 'Current State : ' + this.getStateMsg() + '\n';

    switch (this.state) {
        case STATE.PATROL:
            if (this.detectPlayer()) {
                if (player.isDead()) player.fullHealth();
                this.changeState(STATE.ENCOUNTER);
                this.log += 'Action : Get ready for encounter\n';
            } else {
                this.log += 'Action : I\'m patroling\n';
            }
            break;

        case STATE.ENCOUNTER:
            if (this.criticalHealth()) {
                // attack
                this.log += 'Action : Attack!!!\n';
                player.damaged(this.damage);
                this.damaged(player.damage);
                if (player.isDead()) {
                    this.log += 'Sense : I defeated the player\n';
                    this.changeState(STATE.REST);
                }
                if (PlayingCharacter.prototype.isDead.call(this)) {
                    this.changeState(STATE.DEAD);
                    this.log += 'Think : I\'m dead\n';
                }
            } else {
                this.changeState(STATE.ESCAPE);
                this.log += 'Action : Flee\n';
            }
            break;

        case STATE.ESCAPE:
            if (this.detectPlayer()) {
                this.changeState(STATE.ENCOUNTER);
                this.log += 'Action : Get ready for encounter\n';
            } else {
                this.changeState(STATE.REST);
                this.log += 'Action : Get ready for some rest\n';
            }
            break;

        case STATE.REST:
            if (this.highHealth()) {
                this.changeState(STATE.PATROL);
                this.log += 'Action : Get ready for patroling\n';
            } else {
                this.log += 'Action : I\'m resting\n';
                if (this.hp < this.maxHP) this.hp++;
            }
            break;
    }

    return this.log;
};
//--------------------------------------------------------------------

// ---- FSMSim ----
function FSMSim() {
    var m_canvas = null;
    var m_context = null;
    var m_space = null;
    //--------------------------------------------------------------------
    this.Start = function () {
        m_canvas = document.getElementById('cvsFSM');
        if (!m_canvas) return;
        m_context = m_canvas.getContext('2d');
        m_space = new Space();
        m_space.Init();
        setInterval(this.Frame, 16);
    };
    //--------------------------------------------------------------------
    this.Frame = function () {
        m_context.clearRect(0, 0, m_canvas.width, m_canvas.height);
        m_context.save();
        m_space.Draw();
        m_context.restore();
    };
    //--------------------------------------------------------------------

    function Space() {
        var m_player = new PlayingCharacter(10, 3);
        var m_enemy = new EnemyCharacter();
        var m_playerImg = null;
        var m_enemyImg = null;

        var m_appState = 'MENU'; // MENU | SIM | END
        var m_simTurns = 10;
        var m_currentTurn = 1;
        var m_selectedMsg = 0;
        var m_messages = ['New Simulation'];

        // Sliders / buttons
        var m_panel = null;
        //--------------------------------------------------------------------

        function makeSlider(label, id, min, max, val) {
            var row = document.createElement('div');
            row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:.72rem;color:#aac;';
            var lbl = document.createElement('span');
            lbl.style.cssText = 'flex:1;min-width:130px;';
            lbl.id = id + '_lbl';
            lbl.textContent = label + ': ' + val;
            var inp = document.createElement('input');
            inp.type = 'range';
            inp.id = id;
            inp.min = min;
            inp.max = max;
            inp.value = val;
            inp.style.cssText = 'width:100px;accent-color:#4af;';
            inp.addEventListener('input', function () {
                document.getElementById(id + '_lbl').textContent = label + ': ' + inp.value;
                onSliderChange(id, parseInt(inp.value, 10));
            });
            row.appendChild(lbl);
            row.appendChild(inp);
            return row;
        }
        //--------------------------------------------------------------------

        function makeButton(text, id, cb) {
            var btn = document.createElement('button');
            btn.id = id;
            btn.textContent = text;
            btn.style.cssText = [
                'padding:6px 12px;background:rgba(20,40,80,.8);',
                'border:1px solid rgba(80,140,220,.3);border-radius:6px;',
                'color:#adf;font:11px monospace;cursor:pointer;',
                'transition:background .15s;'
            ].join('');
            btn.addEventListener('mouseenter', function () { btn.style.background = 'rgba(40,80,160,.8)'; });
            btn.addEventListener('mouseleave', function () { btn.style.background = 'rgba(20,40,80,.8)'; });
            btn.addEventListener('click', cb);
            return btn;
        }
        //--------------------------------------------------------------------

        function onSliderChange(id, val) {
            switch (id) {
                case 'sld_player_hp': guardHP(val, false); m_player.setMaxHP(val); break;
                case 'sld_player_dmg': m_player.setDamage(val); break;
                case 'sld_enemy_hp': guardHP(val, false); m_enemy.setMaxHP(val); break;
                case 'sld_enemy_dmg': m_enemy.setDamage(val); break;
                case 'sld_critical_hp': guardHP(val, true); g_criticalHP = val; break;
                case 'sld_high_hp': guardHP(val, true); g_highHP = val; break;
                case 'sld_encounter': g_encounterChance = val; break;
                case 'sld_sim_turns': m_simTurns = val; break;
            }
        }
        //--------------------------------------------------------------------

        function guardHP(hp, isUpperBound) {
            if (isUpperBound) {
                // critical/high can't exceed player/enemy max HP
            } else {
                // max HP can't go below critical/high
                if (hp < g_criticalHP) {
                    g_criticalHP = hp;
                    setSlider('sld_critical_hp', hp);
                }
                if (hp < g_highHP) {
                    g_highHP = hp;
                    setSlider('sld_high_hp', hp);
                }
            }
        }
        //--------------------------------------------------------------------

        function setSlider(id, val) {
            var el = document.getElementById(id);
            if (el) { el.value = val; }
            var lbl = document.getElementById(id + '_lbl');
            if (lbl) lbl.textContent = lbl.textContent.replace(/: \d+/, ': ' + val);
        }
        //--------------------------------------------------------------------

        function processCurrentTurn() {
            var msg = 'Turn : ' + m_currentTurn + '\n' + m_enemy.update(m_player);
            m_messages.push(msg);
        }
        //--------------------------------------------------------------------

        function startSim() {
            m_appState = 'SIM';
            m_currentTurn = 1;
            m_selectedMsg = 0;
            m_messages = ['New Simulation'];
            m_player.fullHealth();
            m_enemy.initialState();
            togglePanel(false);
            toggleSimControls(true);
        }
        //--------------------------------------------------------------------

        function endSim() {
            m_appState = 'MENU';
            m_currentTurn = 1;
            m_selectedMsg = 0;
            m_messages = ['New Simulation'];
            m_player.fullHealth();
            m_enemy.initialState();
            togglePanel(true);
            toggleSimControls(false);
            var btn = document.getElementById('btn_sim_all');
            if (btn) btn.textContent = 'Simulate All';
        }
        //--------------------------------------------------------------------

        function togglePanel(show) {
            var section = document.getElementById('fsm_settings');
            if (section) section.style.display = show ? 'block' : 'none';
        }
        //--------------------------------------------------------------------

        function toggleSimControls(show) {
            var s = show ? 'inline-block' : 'none';
            ['btn_next', 'btn_prev', 'btn_sim_all'].forEach(function (id) {
                var el = document.getElementById(id);
                if (el) el.style.display = s;
            });
        }
        //--------------------------------------------------------------------

        function proceedToNextTurn() {
            m_selectedMsg++;
            if (m_selectedMsg === m_currentTurn) {
                processCurrentTurn();
                m_currentTurn++;
                if (m_currentTurn > m_simTurns || m_enemy.isDead()) {
                    m_appState = 'END';
                    var btn = document.getElementById('btn_sim_all');
                    if (btn) btn.textContent = 'End';
                }
            }
        }
        //--------------------------------------------------------------------

        this.Init = function () {
            m_playerImg = new Image();
            m_playerImg.src = 'texture/player.png';
            m_enemyImg = new Image();
            m_enemyImg.src = 'texture/enemy.png';

            var panel = document.getElementById('side-panel');
            if (!panel) return;
            panel.style.display = 'flex';

            m_panel = panel;
            panel.innerHTML = '';
            panel.style.cssText = [
                'display:flex;flex-direction:column;gap:8px;',
                'width:280px;min-width:240px;padding:16px;',
                'background:rgba(6,8,20,.9);border-left:1px solid rgba(80,140,220,.15);',
                'overflow-y:auto;flex-shrink:0;'
            ].join('');

            var title = document.createElement('div');
            title.textContent = 'SIMULATION SETTINGS';
            title.style.cssText = 'font:.7rem monospace;letter-spacing:.1em;color:#556;margin-bottom:4px;';
            panel.appendChild(title);

            var settings = document.createElement('div');
            settings.id = 'fsm_settings';
            settings.appendChild(makeSlider('Player HP', 'sld_player_hp', 5, 50, m_player.getMaxHP()));
            settings.appendChild(makeSlider('Player Damage', 'sld_player_dmg', 1, 10, m_player.getDamage()));
            settings.appendChild(makeSlider('Enemy HP', 'sld_enemy_hp', 5, 50, m_enemy.getMaxHP()));
            settings.appendChild(makeSlider('Enemy Damage', 'sld_enemy_dmg', 1, 10, m_enemy.getDamage()));
            settings.appendChild(makeSlider('Critical HP', 'sld_critical_hp', 3, 25, g_criticalHP));
            settings.appendChild(makeSlider('High HP', 'sld_high_hp', 5, 50, g_highHP));
            settings.appendChild(makeSlider('Encounter Chance', 'sld_encounter', 0, 100, g_encounterChance));
            settings.appendChild(makeSlider('Simulation Turns', 'sld_sim_turns', 10, 50, m_simTurns));
            panel.appendChild(settings);

            var sep = document.createElement('hr');
            sep.style.cssText = 'border:none;border-top:1px solid rgba(80,140,220,.12);margin:4px 0;';
            panel.appendChild(sep);

            var btnRow = document.createElement('div');
            btnRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;';
            var btnNext = makeButton('Next Turn', 'btn_next', function () { if (m_selectedMsg < m_simTurns) proceedToNextTurn(); });
            var btnPrev = makeButton('Prev Turn', 'btn_prev', function () { if (m_selectedMsg > 1) m_selectedMsg--; });
            var btnSimAll = makeButton('Simulate All', 'btn_sim_all', function () {
                if (m_appState === 'END') { endSim(); return; }
                while (m_currentTurn <= m_simTurns && !m_enemy.isDead()) {
                    processCurrentTurn();
                    m_currentTurn++;
                    m_selectedMsg++;
                }
                m_appState = 'END';
                var btn = document.getElementById('btn_sim_all');
                if (btn) btn.textContent = 'End';
            });
            btnRow.appendChild(btnNext);
            btnRow.appendChild(btnPrev);
            btnRow.appendChild(btnSimAll);
            panel.appendChild(btnRow);
            toggleSimControls(false);

            // Start/Reset button in canvas bar injected via CSS class
            // We add a "Start" button to the panel as well
            var btnStart = makeButton('Start', 'btn_start', startSim);
            var btnReset = makeButton('Reset', 'btn_reset', function () {
                m_player.reset();
                m_enemy.reset();
                setSlider('sld_player_hp', m_player.getMaxHP());
                setSlider('sld_player_dmg', m_player.getDamage());
                setSlider('sld_enemy_hp', m_enemy.getMaxHP());
                setSlider('sld_enemy_dmg', m_enemy.getDamage());
                g_criticalHP = 3; setSlider('sld_critical_hp', 3);
                g_highHP = 8; setSlider('sld_high_hp', 8);
                g_encounterChance = 50; setSlider('sld_encounter', 50);
                m_simTurns = 10; setSlider('sld_sim_turns', 10);
                endSim();
            });
            var startRow = document.createElement('div');
            startRow.style.cssText = 'display:flex;gap:6px;margin-top:4px;';
            startRow.appendChild(btnStart);
            startRow.appendChild(btnReset);
            panel.appendChild(startRow);
        };
        //--------------------------------------------------------------------

        function drawHP(label, hp, maxHP, isCritical, x, y) {
            var barW = m_canvas.width - x - 8;
            var barH = 18;
            // background
            m_context.fillStyle = '#111';
            m_context.fillRect(x, y, barW, barH);
            // fill
            var ratio = Math.max(0, hp) / maxHP;
            m_context.fillStyle = isCritical ? '#c00' : '#0a0';
            m_context.fillRect(x, y, Math.round(barW * ratio), barH);
            // border
            m_context.strokeStyle = 'rgba(80,140,220,.3)';
            m_context.lineWidth = 1;
            m_context.strokeRect(x, y, barW, barH);
            // text
            m_context.font = '11px monospace';
            m_context.fillStyle = '#eef';
            m_context.fillText(label + ' HP: ' + Math.max(0, hp) + ' / ' + maxHP, x + 4, y + 13);
        }
        //--------------------------------------------------------------------
        this.Draw = function () {
            m_context.fillStyle = '#06080f';
            m_context.fillRect(0, 0, m_canvas.width, m_canvas.height);

            var w = m_canvas.width;
            var h = m_canvas.height;
            var sprSize = 44;
            var barX = 8 + sprSize + 8;

            if (m_appState === 'MENU') {
                if (m_playerImg && m_playerImg.complete)
                    m_context.drawImage(m_playerImg, w - 56, 8, 48, 48);
                if (m_enemyImg && m_enemyImg.complete)
                    m_context.drawImage(m_enemyImg, w - 56, 64, 48, 48);

                m_context.font = '12px monospace';
                m_context.fillStyle = 'rgba(180,220,255,0.85)';
                var items = [
                    'Player HP       : ' + m_player.getMaxHP(),
                    'Player Damage   : ' + m_player.getDamage(),
                    'Enemy HP        : ' + m_enemy.getMaxHP(),
                    'Enemy Damage    : ' + m_enemy.getDamage(),
                    'HP Critical Level : ' + g_criticalHP,
                    'HP High Level   : ' + g_highHP,
                    'Encounter Chance : ' + g_encounterChance + '%',
                    'Simulation Turns : ' + m_simTurns,
                ];
                for (var i = 0; i < items.length; i++)
                    m_context.fillText(items[i], 12, 28 + i * 22);

                m_context.fillStyle = 'rgba(80,120,180,0.7)';
                m_context.font = '11px monospace';
                m_context.fillText('Configure settings on the right, then press Start.', 12, h - 10);
            } else {
                // Player row
                if (m_playerImg && m_playerImg.complete)
                    m_context.drawImage(m_playerImg, 8, 8, sprSize, sprSize);
                drawHP('Player', m_player.getHP(), m_player.getMaxHP(),
                    m_player.getHP() <= g_criticalHP, barX, 18);

                // Enemy row
                if (m_enemyImg && m_enemyImg.complete)
                    m_context.drawImage(m_enemyImg, 8, 58, sprSize, sprSize);
                drawHP('Enemy', m_enemy.hp, m_enemy.getMaxHP(),
                    m_enemy.hp <= g_criticalHP, barX, 68);

                // Turn / state info
                drawHUD(m_context, 12, 116, 'Turn : ' + (m_currentTurn - 1));
                drawHUD(m_context, 12, 134, 'State : ' + m_enemy.getStateMsg());

                // Turn log
                var msg = m_messages[m_selectedMsg] || '';
                var lines = msg.split('\n');
                m_context.font = '11px monospace';
                m_context.fillStyle = 'rgba(180,220,255,0.85)';
                var ty = 154;
                for (var li = 0; li < lines.length; li++) {
                    if (lines[li]) {
                        m_context.fillText(lines[li], 12, ty);
                        ty += 16;
                    }
                }

                if (m_appState === 'END') {
                    m_context.font = 'bold 16px monospace';
                    m_context.fillStyle = m_enemy.isDead() ? '#4f4' : '#f44';
                    m_context.fillText(
                        m_enemy.isDead() ? 'Enemy Defeated!' : 'Simulation Complete',
                        12, h - 8
                    );
                }
            }
        };
        //--------------------------------------------------------------------
    }
    //--------------------------------------------------------------------
}
//--------------------------------------------------------------------
