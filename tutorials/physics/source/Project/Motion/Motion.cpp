//--------------------------------------------------------------------
//
//	Motion.cpp
//
//	Sora Development
//

#include "Motion.h"
#include "System\D3D9\D9Texture.h"
#include "Utilities\Helper.h"
#include "Utilities\Math.h"
#include "resource\resource.h"
//--------------------------------------------------------------------

const float PADDLE_FORCE = 200.0f;
const float BULLET_FORCE = 300.0f;
const float	ROTATE_STEP_CW = 0.1f;
const float	ROTATE_STEP_CCW = -ROTATE_STEP_CW;
const int COMBO = 0;
//--------------------------------------------------------------------

World::World()
{
}
//--------------------------------------------------------------------

World::~World()
{
}
//--------------------------------------------------------------------

bool World::init()
{
	sora::generateSeed();

	SoraRC rc;
	GetClientRect(getWindowHandle(), &rc);
	g_worldBoundary.x = (float)(rc.right - rc.left);
	g_worldBoundary.y = (float)(rc.bottom - rc.top);

	m_texture.loadTextureFromResource(IDB_BMP);
	m_agent.setPosition(g_worldBoundary.x * 0.5f, g_worldBoundary.y * 0.5f);
	m_spriteGuard.setCenter(32.0f, 32.0f);
	m_spriteGuard.setTexture(&m_texture);
	m_spriteGuard.setColor(128, 0, 32);
	m_agent.setRadius(32.0f);
	m_agent.setGfxSprite(m_spriteGuard);

	//m_players[P1].m_spriteGuard.setTexture(&m_texture);
	//m_players[P1].m_spriteGuard.setColor(128, 0, 32);
	//m_players[P1].m_agent.setPosition(g_worldBoundary.x * 0.25f, g_worldBoundary.y * 0.25f);
	//m_players[P1].init();

	//m_players[P2].m_spriteGuard.setTexture(&m_texture);
	//m_players[P2].m_spriteGuard.setColor(0, 128, 32);
	//m_players[P2].m_agent.setPosition(g_worldBoundary.x * 0.75f, g_worldBoundary.y * 0.75f);
	//m_players[P2].init();

	return true;
}
//--------------------------------------------------------------------

void World::render()
{	
	m_agent.draw();
}
//--------------------------------------------------------------------

void World::renderLines()
{
}
//--------------------------------------------------------------------

void World::update()
{
	if (m_agent.isMoving())
	{
		if (m_agent.getStatus() == ACCELERATING)
			m_agent.accelerate(PADDLE_FORCE);
		m_agent.moving(0.016f);
		m_agent.worldCollision(g_worldBoundary);
	}
}
//--------------------------------------------------------------------

void World::onKeyPressed(char key, bool isDown)
{
	if (isDown)
	{
		switch (key)
		{
		case VK_UP:
			m_agent.setStatus(ACCELERATING);
			break;

		case VK_DOWN:
			m_agent.breaking();
			break;

		case VK_LEFT:
			m_agent.rotate(ROTATE_STEP_CCW);
			break;

		case VK_RIGHT:
			m_agent.rotate(ROTATE_STEP_CW);
			break;
		}
	}
	else
	{
		switch (key)
		{
		case VK_UP:
			m_agent.setStatus(DECELERATING);
			break;
		}
	}
}
//--------------------------------------------------------------------