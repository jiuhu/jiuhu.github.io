//--------------------------------------------------------------------
//
//	FSM.cpp
//
//	Sora Development
//

#include "FSM.h"
#include "System\D3D9\D9Texture.h"
#include <iostream>
#include <vector>
#include <sstream>
#include "Utilities\Helper.h"
//--------------------------------------------------------------------

std::vector<std::string> g_messageList;
std::stringstream g_currentMessage;
SoraRC messagePosition;
int g_selectedMessage = 0;
//--------------------------------------------------------------------

//--------------------------------------------------------------------

World::World()
	:	m_applicationState(STATE_MENU),
		m_simulationTurn(10),
		m_currentTurn(1)
{
	sora::generateSeed();
}
//--------------------------------------------------------------------

bool World::init()
{
	g_texture.loadTextureFromResource(IDB_BMP);

	SoraRC rc;
	GetClientRect(getWindowHandle(), &rc);
	int width = rc.width();

	//	FSM Sims Init
	
	LONG panelWidth = (LONG)(width - FRAME_OFFSET - FRAME_OFFSET - GUI_BUTTON_WIDTH - GUI_BORDER_OFFSET);
	m_playerInfo.set(FRAME_OFFSET, FRAME_OFFSET, panelWidth, PANEL_HEIGHT, D3DCOLOR_XRGB(0, 128, 128), "img/player.png");
	
	float enemyTop = (float)rc.bottom - PANEL_HEIGHT - SPRITE_SIZE;
	m_enemyInfo.set(FRAME_OFFSET, enemyTop, panelWidth, PANEL_HEIGHT, D3DCOLOR_XRGB(192, 128, 0), "img/enemy.png");

	//	Menu init
	m_sliders[SLIDER_PLAYER_HP] = addSlider(SLIDER_PLAYER_HP, 5, 50, m_player.getMaxHP(), 200, 0);
	m_sliders[SLIDER_PLAYER_DAMAGE] = addSlider(SLIDER_PLAYER_DAMAGE, 1, 10, m_enemy.getDamage(), 200, 30);
	m_sliders[SLIDER_ENEMY_HP] = addSlider(SLIDER_ENEMY_HP, 5, 50, m_enemy.getMaxHP(), 200, 60);
	m_sliders[SLIDER_ENEMY_DAMAGE] = addSlider(SLIDER_ENEMY_DAMAGE, 1, 10, m_enemy.getDamage(), 200, 90);
	m_sliders[SLIDER_CRITICAL_HP] = addSlider(SLIDER_CRITICAL_HP, 3, 25, PlayingCharacter::getCriticalHP(), 200, 120);
	m_sliders[SLIDER_HIGH_HP] = addSlider(SLIDER_HIGH_HP, 5, 50, PlayingCharacter::getHighHP(), 200, 150);
	m_sliders[SLIDER_ENCOUNTER_CHANCE] = addSlider(SLIDER_ENCOUNTER_CHANCE, 0, 100, EnemyCharacter::getEncounterChance(), 200, 180);
	m_sliders[SLIDER_SIMULATION_TURN] = addSlider(SLIDER_SIMULATION_TURN, 10, 50, m_simulationTurn, 200, 210);

	int buttonCounter = 0;

	int x = 32;
	int y = (int)(m_enemyInfo.m_position.y) + m_enemyInfo.m_size.bottom + GUI_BORDER_OFFSET;
	m_buttons[buttonCounter] = addButton(BUTTON_NEXT_TURN, "Next Turn", x, y);
	m_buttons[buttonCounter++]->SetVisible(false);

	x += GUI_BUTTON_WIDTH + GUI_BUTTON_DISTANCE;
	m_buttons[buttonCounter] = addButton(BUTTON_PREV_TURN, "Previous Turn", x, y);
	m_buttons[buttonCounter++]->SetVisible(false);

	x += GUI_BUTTON_WIDTH + GUI_BUTTON_DISTANCE;
	m_buttons[buttonCounter] = addButton(BUTTON_SIMULATE_ALL, "Simulate All", x, y);
	m_buttons[buttonCounter++]->SetVisible(false);

	messagePosition.set((LONG)m_playerInfo.m_position.x,
		(LONG)m_playerInfo.m_size.bottom + SPRITE_SIZE + GUI_BORDER_OFFSET,
		(LONG)m_playerInfo.m_size.right,
		(LONG)m_playerInfo.m_size.bottom + 256);
	
	g_messageList.reserve(10);
	g_messageList.push_back("New Simulation");

	return true;
}
//--------------------------------------------------------------------

void World::render()
{
	if (m_applicationState == STATE_MENU)
	{
		drawFormattedText(0, 0, "Player HP : %d", m_player.getMaxHP());
		drawFormattedText(0, 30, "Player Damage : %d", m_player.getDamage());
		drawFormattedText(0, 60, "Enemy HP : %d", m_enemy.getMaxHP());
		drawFormattedText(0, 90, "Enemy Damage : %d", m_enemy.getDamage());
		drawFormattedText(0, 120, "HP Critical Level : %d", PlayingCharacter::getCriticalHP());
		drawFormattedText(0, 150, "HP High Level : %d", PlayingCharacter::getHighHP());
		drawFormattedText(0, 180, "Encounter Chance : %d", EnemyCharacter::getEncounterChance());
		drawFormattedText(0, 210, "Simulation Turn : %d", m_simulationTurn);
	}
	else
	{
		drawFormattedText(0, 0, "Current turn : %d", m_currentTurn - 1);

		m_playerInfo.draw();
		m_enemyInfo.draw();

		drawText(messagePosition, g_messageList[g_selectedMessage].c_str());
	}
}
//--------------------------------------------------------------------

void World::update()
{
}
//--------------------------------------------------------------------

void World::start()
{
	m_applicationState = STATE_SIMULATION;
	toggleSettingControls(false);
	toggleSimsButtonControls(true);

	m_enemyInfo.updateHealtBar(m_enemy.getMaxHP() * 10, false);
	m_playerInfo.updateHealtBar(m_player.getMaxHP() * 10, false);
}
//--------------------------------------------------------------------

void World::reset()
{
	m_player.reset();
	m_sliders[SLIDER_PLAYER_HP]->SetValue(m_player.getMaxHP());
	m_sliders[SLIDER_PLAYER_DAMAGE]->SetValue(m_player.getDamage());
	
	m_enemy.reset();
	m_sliders[SLIDER_ENEMY_HP]->SetValue(m_enemy.getMaxHP());
	m_sliders[SLIDER_ENEMY_DAMAGE]->SetValue(m_enemy.getDamage());
	
	m_simulationTurn = 10;
	m_sliders[SLIDER_SIMULATION_TURN]->SetValue(m_simulationTurn);

	end();
}
//--------------------------------------------------------------------

void World::end()
{
	m_applicationState = STATE_MENU;
	toggleSettingControls(true);
	toggleSimsButtonControls(false);
	m_buttons[2]->SetText("Simulate All");

	m_currentTurn = 1;
	m_player.fullHealth();
	m_enemy.initialState();

	g_selectedMessage = 0;
	g_messageList.clear();
	g_messageList.push_back("New Simulation");
}
//--------------------------------------------------------------------

void World::proceedToNextTurn()
{
	g_selectedMessage++;
	if (g_selectedMessage == m_currentTurn) 
	{
		processCurrentTurn();
		m_currentTurn++;
		if (m_currentTurn > m_simulationTurn || (m_enemy.isDead()))
		{
			m_applicationState = STATE_END;
			m_buttons[2]->SetText("End");
		}
	}
}
//--------------------------------------------------------------------

void World::processCurrentTurn()
{
	g_currentMessage.str("");
	g_currentMessage << "Turn : " << m_currentTurn << "\n";
	g_currentMessage << m_enemy.update(m_player);
	g_messageList.push_back(g_currentMessage.str());

	int hp = m_enemy.getHP();
	m_enemyInfo.updateHealtBar(hp * 10, (hp <= PlayingCharacter::getCriticalHP()));
	
	hp = m_player.getHP();
	m_playerInfo.updateHealtBar(hp * 10, (hp <= PlayingCharacter::getCriticalHP()));
}
//--------------------------------------------------------------------

void World::guardHPSlider(int hp, bool isUpperBound)
{
	if (isUpperBound)
	{
		if (hp > m_player.getMaxHP())
		{
			m_player.setMaxHP(hp);
			m_sliders[SLIDER_PLAYER_HP]->SetValue(hp);
		}
		if (hp > m_enemy.getMaxHP())
		{
			m_enemy.setMaxHP(hp);
			m_sliders[SLIDER_ENEMY_HP]->SetValue(hp);
		}
	}
	else
	{
		if (hp < PlayingCharacter::getCriticalHP())
		{
			PlayingCharacter::setCriticalHP(hp);
			m_sliders[SLIDER_CRITICAL_HP]->SetValue(hp);
		}
		if (hp < PlayingCharacter::getHighHP())
		{
			PlayingCharacter::setHighHP(hp);
			m_sliders[SLIDER_HIGH_HP]->SetValue(hp);
		}
	}
}
//--------------------------------------------------------------------

void World::guiEvent(UINT eventID, int controlID, CDXUTControl * control, void * userContext)
{
	int hp;
    switch(controlID)
    {
	case SLIDER_PLAYER_HP:
		hp = ((CDXUTSlider *)control)->GetValue();
		m_player.setMaxHP(hp);
		guardHPSlider(hp, false);
		break;

	case SLIDER_PLAYER_DAMAGE:
		m_player.setDamage(((CDXUTSlider *)control)->GetValue());
		break;

	case SLIDER_ENEMY_HP:
		hp = ((CDXUTSlider *)control)->GetValue();
		m_enemy.setMaxHP(hp);
		guardHPSlider(hp, false);
		break;

	case SLIDER_ENEMY_DAMAGE:
		m_enemy.setDamage(((CDXUTSlider *)control)->GetValue());
		break;

	case SLIDER_CRITICAL_HP:
		hp = ((CDXUTSlider *)control)->GetValue();
		PlayingCharacter::setCriticalHP(hp);
		guardHPSlider(hp, true);
		break;

	case SLIDER_HIGH_HP:
		hp = ((CDXUTSlider *)control)->GetValue();
		PlayingCharacter::setHighHP(hp);
		guardHPSlider(hp, true);
		break;

	case SLIDER_ENCOUNTER_CHANCE:
		EnemyCharacter::setEncounterChance(((CDXUTSlider *)control)->GetValue());
		break;

	case SLIDER_SIMULATION_TURN:
		m_simulationTurn = ((CDXUTSlider *)control)->GetValue();
		break;

	case BUTTON_NEXT_TURN:
		if (g_selectedMessage < m_simulationTurn) proceedToNextTurn();
		break;

	case BUTTON_PREV_TURN:
		if (g_selectedMessage > 1) g_selectedMessage--;
		break;

	case BUTTON_SIMULATE_ALL:
		if (m_applicationState == STATE_END)
		{
			m_systemState = SYSTEM_STATE::STATE_IDLE;
			m_controlButton->SetText("Start");
			end();
		}
		else
		{
			while (m_currentTurn <= m_simulationTurn && (!m_enemy.isDead()))
			{
				processCurrentTurn();
				m_currentTurn++;
				g_selectedMessage++;
			}
			m_applicationState = STATE_END;
			m_buttons[2]->SetText("End");
		}
		break;

	}
}
//--------------------------------------------------------------------