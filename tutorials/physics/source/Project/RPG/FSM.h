//--------------------------------------------------------------------
//
//	FSM.h
//
//	Sora Development
//

#ifndef _SORA_SENSING_H
#define _SORA_SENSING_H

#include "resource\resource.h"
#ifndef _SORA_D9SYSTEM_H
	#include "System\D3D9\D9System.h"
#endif
#include "RPG\EnemyCharacter.h"
//--------------------------------------------------------------------

using namespace sora;
//--------------------------------------------------------------------

enum GUI_WIDGET
{
	SLIDER_PLAYER_HP = 0,
	SLIDER_PLAYER_DAMAGE,
	SLIDER_ENEMY_HP,
	SLIDER_ENEMY_DAMAGE,
	SLIDER_CRITICAL_HP,
	SLIDER_HIGH_HP,
	SLIDER_ENCOUNTER_CHANCE,
	SLIDER_SIMULATION_TURN,
	TOTAL_SLIDERS,

	BUTTON_NEXT_TURN = 100,
	BUTTON_PREV_TURN,
	BUTTON_SIMULATE_ALL,
	TOTAL_BUTTONS
};
//--------------------------------------------------------------------

static const int NUM_SLIDERS = TOTAL_SLIDERS;
static const int NUM_BUTTONS = TOTAL_BUTTONS - BUTTON_NEXT_TURN;
//--------------------------------------------------------------------

static const float FRAME_OFFSET = 32.0f;
static const int SPRITE_SIZE = 64;
//--------------------------------------------------------------------

static const int ANIME_FRAME = 8;
//--------------------------------------------------------------------

static D3DCOLOR COLOR_RED = D3DCOLOR_XRGB(192, 0, 0);
static D3DCOLOR COLOR_YELLOW = D3DCOLOR_XRGB(192, 192, 0);
static const LONG HEALTH_BAR_HEIGHT = 32;
static const LONG PANEL_HEIGHT = 96;
//--------------------------------------------------------------------

static D9Texture g_texture;
//--------------------------------------------------------------------

class Entity
{
public:
	D3DXVECTOR3 m_position;
	//--------------------------------------------------------------------

	void setPosition(float x, float y)
	{
		m_position.x = x;
		m_position.y = y;
		m_position.z = 0.0f;
	}
	//--------------------------------------------------------------------
};
//--------------------------------------------------------------------

class ResizeableEntity : public Entity
{
public:
	SoraRC m_size;
	//--------------------------------------------------------------------

	void setSize(LONG w, LONG h)
	{
		m_size.set(0, 0, w, h);
	}
	//--------------------------------------------------------------------
};
//--------------------------------------------------------------------

class Bar : public ResizeableEntity
{
public:
	D3DCOLOR m_color;
	//--------------------------------------------------------------------

	void draw()
	{
		D9Sprite::get()->draw(g_texture, &m_size, NULL, &m_position, m_color);
	}
	//--------------------------------------------------------------------
};
//--------------------------------------------------------------------

class Portrait : public Entity
{
public:
	D9Texture m_texture;
	//--------------------------------------------------------------------

	void setTexture(const char * const fileName)
	{
		m_texture.loadTextureFromFile(fileName, SPRITE_SIZE, SPRITE_SIZE);
	}
	//--------------------------------------------------------------------

	void draw()
	{
		D9Sprite::get()->draw(m_texture, &m_position);
	}
	//--------------------------------------------------------------------
};
//--------------------------------------------------------------------

class Panel : public Bar
{
public:
	Bar m_healthBar;
	Portrait m_portrait;
	//--------------------------------------------------------------------

	void set(float x, float y, LONG w, LONG h, D3DCOLOR color, const char * const portrait)
	{
		setPosition(x, y);
		setSize(w, h);
		m_color = color;

		m_portrait.setTexture(portrait);
		m_portrait.setPosition(FRAME_OFFSET + GUI_BORDER_OFFSET, m_position.y + GUI_BORDER_OFFSET);

		m_healthBar.setPosition(m_portrait.m_position.x + SPRITE_SIZE + GUI_BORDER_OFFSET, m_portrait.m_position.y);

		m_size.set(0, 0, w, h);
	}
	//--------------------------------------------------------------------

	void updateHealtBar(LONG w, bool isCrictical)
	{
		m_healthBar.setSize(w, HEALTH_BAR_HEIGHT);
		m_healthBar.m_color = (isCrictical) ? COLOR_YELLOW : COLOR_RED;
	}
	//--------------------------------------------------------------------

	void draw()
	{
		Bar::draw();
		m_portrait.draw();
		m_healthBar.draw();
	}
	//--------------------------------------------------------------------
};
//--------------------------------------------------------------------

#include <vector>
class AnimeFrame
{
public:
	D9Texture m_texture;
	std::vector<ResizeableEntity> m_frames;
	int m_currentFrame = 0;
	//--------------------------------------------------------------------

	void setTexture(int resourceID)
	{
		m_texture.loadTextureFromResource(resourceID);
	}
	//--------------------------------------------------------------------

	void addFrame(float x, float y, SoraRC rect)
	{
		ResizeableEntity frame;
		frame.setPosition(x, y);
		frame.m_size = rect;
		m_frames.push_back(frame);
	}
	//--------------------------------------------------------------------

	void nextFrame()
	{
		++m_currentFrame;
		if (m_currentFrame == m_frames.size())
			m_currentFrame = 0;
	}
	//--------------------------------------------------------------------

	void draw()
	{
		D9Sprite::get()->draw(m_texture, &(m_frames[m_currentFrame].m_size), &(m_frames[m_currentFrame].m_position));
	}
	//--------------------------------------------------------------------
};
//--------------------------------------------------------------------

class World : public D9System
{
public:

	World();
	
	/*
		This function is called to initialize the World.
	*/
	bool init();

	/*
		This function is called to draw the scene.
	*/
	void render();

	void update();

	void start();

	void reset();

	void end();

	void CALLBACK guiEvent(UINT eventID, int controlID, CDXUTControl * control, void * userContext);
	
private:

	PlayingCharacter m_player;
	EnemyCharacter m_enemy;
	Panel m_playerInfo;
	Panel m_enemyInfo;
	//--------------------------------------------------------------------

	enum APPLICATION_STATE
	{
		STATE_MENU = 0,
		STATE_SIMULATION,
		STATE_END
	};
	APPLICATION_STATE m_applicationState;
	//--------------------------------------------------------------------

	int m_simulationTurn;
	int m_currentTurn;

	void processCurrentTurn();
	void proceedToNextTurn();
	//--------------------------------------------------------------------

	CDXUTSlider * m_sliders[NUM_SLIDERS];
	CDXUTButton * m_buttons[NUM_BUTTONS];
	//--------------------------------------------------------------------

	void guardHPSlider(int hp, bool isUpperBound);
	//--------------------------------------------------------------------
	
	void toggleSettingControls(bool isVisible)
	{
		for (int i = 0; i < NUM_SLIDERS; ++i)
			m_sliders[i]->SetVisible(isVisible);
	}
	//--------------------------------------------------------------------

	void toggleSimsButtonControls(bool isVisible)
	{
		for (int i = 0; i < NUM_BUTTONS; ++i)
			m_buttons[i]->SetVisible(isVisible);
	}
	//--------------------------------------------------------------------
};
//--------------------------------------------------------------------

#endif