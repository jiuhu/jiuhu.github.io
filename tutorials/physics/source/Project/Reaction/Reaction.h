//--------------------------------------------------------------------
//
//	Reaction.h
//
//	Sora Development
//

#ifndef _SORA_MOTION_H
#define _SORA_MOTION_H

#include "System\D3D9\D9System.h"
#include "Project\common\Agent.h"
//--------------------------------------------------------------------

using namespace sora;
//--------------------------------------------------------------------

class Player
{
public:
	Agent m_agent;
	ColoredSprite m_gfx;

	void init()
	{
		m_agent.setGfxSprite(m_gfx);
	}
	//--------------------------------------------------------------------

	void draw()
	{
		m_agent.draw();
	}
	//--------------------------------------------------------------------

	void update(const D3DXVECTOR2& boundary);
	//--------------------------------------------------------------------
};
//--------------------------------------------------------------------

class Enemy : public Player
{
public:

	void update(const D3DXVECTOR2& boundary, const Player &player);
	//--------------------------------------------------------------------
};
//--------------------------------------------------------------------

class World : public D9System
{
public:

	World();
	~World();
	
	/*
		This function is called to initialize the World.
	*/
	bool init();

	/*
		This function is called to draw the scene.
	*/
	void render();

	void renderLines();

	void update();

	void onKeyPressed(char key, bool isDown);

	void CALLBACK guiEvent(UINT eventID, int controlID, CDXUTControl * control, void * userContext);

private:

	D9Texture m_texture;

	Player m_player;
	Enemy m_enemy;
	//--------------------------------------------------------------------
	
	D3DXVECTOR2 g_worldBoundary;
	//--------------------------------------------------------------------

	CDXUTSlider * m_sldSensory;
	CDXUTSlider * m_sldSensoryAngle;
	//--------------------------------------------------------------------
};
//--------------------------------------------------------------------

#endif