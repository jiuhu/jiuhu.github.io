//--------------------------------------------------------------------
//
//	Motion.h
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
	ColoredSprite m_spriteGuard;

	void init()
	{
	}
	//--------------------------------------------------------------------

	void draw()
	{
		m_agent.draw();
	}
	//--------------------------------------------------------------------

	void update(const D3DXVECTOR2 &world, Object * obstacles);
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

private:

	D9Texture m_texture;
	Agent m_agent;
	ColoredSprite m_spriteGuard;
	//--------------------------------------------------------------------
	
	D3DXVECTOR2 g_worldBoundary;
	//--------------------------------------------------------------------
};
//--------------------------------------------------------------------

#endif