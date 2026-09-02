//--------------------------------------------------------------------
//
//	Reaction.cpp
//
//	Sora Development
//

#include "Reaction.h"
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

enum GUI_WIDGET
{
	BUTTON_REACTION_MODE,
	BUTTON_SENSORY_RANGE,
	SLIDER_SENSORY_RANGE,
	SLIDER_FRONT_SENSORY_ANGLE,
};
//--------------------------------------------------------------------

enum REACTION_MODE
{
	SEEK,
	AVOID,
	PURSUIT,

	TOTAL_MODE
};
REACTION_MODE reactionMode = SEEK;
//--------------------------------------------------------------------

char * reactionModeMSG[3] =
{
	"SEEK",
	"AVOID",
	"PURSUIT"
};
//--------------------------------------------------------------------

float m_targetAngle;
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
	int x = rc.width();
	int y = rc.height();
	g_worldBoundary.x = (float)(x);
	g_worldBoundary.y = (float)(y);

	m_texture.loadTextureFromResource(IDB_BMP);

	m_player.m_agent.setPosition(g_worldBoundary.x * 0.5f, g_worldBoundary.y * 0.5f);
	m_player.m_agent.setRadius(64.0f);
	m_player.m_gfx.setCenter(32.0f, 32.0f);
	m_player.m_gfx.setTexture(&m_texture);
	m_player.m_gfx.setColor(128, 0, 32);
	m_player.init();

	m_enemy.m_agent.setPosition(g_worldBoundary.x * 0.15f, g_worldBoundary.y * 0.15f);
	m_enemy.m_agent.setRadius(64.0f);
	m_enemy.m_gfx.setCenter(32.0f, 32.0f);
	m_enemy.m_gfx.setTexture(&m_texture);
	m_enemy.m_gfx.setColor(0, 128, 32);
	m_enemy.init();
	m_enemy.m_agent.updateAngle(findAngle(m_enemy.m_agent, m_player.m_agent));
	m_enemy.m_agent.setSensoryMode(ROUND_SENSORY);
	m_enemy.m_agent.genRoundSensory();

	int w = GUI_BUTTON_WIDTH + 32;
	int h = GUI_BUTTON_HEIGHT + 16;
	x -= w + GUI_BORDER_OFFSET;
	y -= h + GUI_BORDER_OFFSET;
	addButton(BUTTON_SENSORY_RANGE, m_enemy.m_agent.getSensoryModeMsg(), x, y, w, h);

	y -= h + GUI_BORDER_OFFSET;
	addButton(BUTTON_REACTION_MODE, reactionModeMSG[reactionMode], x, y, w, h);

	m_sldSensory = addSlider(SLIDER_SENSORY_RANGE, 10, 30, (int)m_enemy.m_agent.m_sensoryRadius / 10, 200, 500);
	
	m_sldSensoryAngle = addSlider(SLIDER_FRONT_SENSORY_ANGLE, 30, 110, 90, 200, 470);
	m_sldSensoryAngle->SetVisible(false);

	return true;
}
//--------------------------------------------------------------------

void World::render()
{
	drawFormattedText(0, 0, "AI Agent Status : %s", m_enemy.m_agent.getStatusMsg());
	drawFormattedText(0, 30, "AI Agent Angle : %.2f", m_enemy.m_agent.m_angleRadian);
	if (m_enemy.m_agent.getSensoryMode())
	{
		drawFormattedText(0, 500, "Sensory Radius : %.2f", m_enemy.m_agent.m_sensoryRadius);
		if (m_enemy.m_agent.isSensoryMode(FRONT_SENSORY))
			drawFormattedText(0, 470, "Sensory Angle : %.2f", m_enemy.m_agent.m_sensoryAngle);
	}

	m_player.draw();
	m_enemy.draw();
}
//--------------------------------------------------------------------

void World::renderLines()
{
	m_enemy.m_agent.drawSensoryRange();
}
//--------------------------------------------------------------------

void World::update()
{
	m_player.update(g_worldBoundary);	
	m_enemy.update(g_worldBoundary, m_player);
}
//--------------------------------------------------------------------

void World::onKeyPressed(char key, bool isDown)
{
	if (isDown)
	{
		switch (key)
		{
		case VK_UP:
			Player;
			m_player.m_agent.setStatus(ACCELERATING);
			break;

		case VK_DOWN:
			m_player.m_agent.breaking();
			break;

		case VK_LEFT:
			m_player.m_agent.rotate(ROTATE_STEP_CCW);
			break;

		case VK_RIGHT:
			m_player.m_agent.rotate(ROTATE_STEP_CW);
			break;
		}
	}
	else
	{
		switch (key)
		{
		case VK_UP:
			m_player.m_agent.setStatus(DECELERATING);
			break;
		}
	}
}
//--------------------------------------------------------------------

void Player::update(const D3DXVECTOR2& boundary)
{
	if (m_agent.isMoving())
	{
		if (m_agent.getStatus() == ACCELERATING)
			m_agent.accelerate(PADDLE_FORCE);
		m_agent.moving(0.016f);
		m_agent.worldCollision(boundary);
	}
}
//--------------------------------------------------------------------

void Enemy::update(const D3DXVECTOR2& boundary, const Player &player)
{
	bool detected = false;
	if (m_agent.isSensoryMode(ROUND_SENSORY))
	{
		if (m_agent.isInSensoryRangeSQ(player.m_agent))
		{
			m_agent.setStatus(ACCELERATING);
			detected = true;
		}
	}
	else if (m_agent.isSensoryMode(FRONT_SENSORY))
	{
		if (m_agent.isInSensoryFrontRange(player.m_agent))
		{
			m_agent.setStatus(ACCELERATING);
			detected = true;
		}
	}
	else
	{
		m_agent.setStatus(ACCELERATING);
		detected = true;
	}

	if (m_agent.isMoving())
	{
		if (detected)
		{
			if (reactionMode == PURSUIT)
			{
				D3DXVECTOR2 aim = player.m_agent.m_position + player.m_agent.m_heading * player.m_agent.getRadius();
				m_targetAngle = findAngle(m_agent, aim);
			}
			else
			{
				m_targetAngle = findAngle(m_agent, player.m_agent);
				if (reactionMode == AVOID)
				{
					m_targetAngle += D3DX_PI;
					if (m_targetAngle > TWO_PI) m_targetAngle = TWO_PI;
					else if (m_targetAngle < 0.0f) m_targetAngle = 0.0f;
				}
			}

			m_agent.smoothRotation(m_targetAngle);

			if (isCollide(m_agent, player.m_agent))
			{
				m_agent.setStatus(DECELERATING);
			}
			else
			{
			}
		}
		else
		{
			m_agent.smoothRotation(m_targetAngle);
			m_agent.setStatus(DECELERATING);
		}

		if (m_agent.getStatus() == ACCELERATING)
			m_agent.accelerate(PADDLE_FORCE);

		m_agent.moving(0.016f);
		m_agent.worldCollision(boundary);
		m_agent.genSensory();
	}
}
//--------------------------------------------------------------------

void World::guiEvent(UINT eventID, int controlID, CDXUTControl * control, void * userContext)
{
	switch (controlID)
	{
	case BUTTON_REACTION_MODE:
		m_enemy.m_agent.breaking();
		reactionMode = (REACTION_MODE)(reactionMode + 1);
		if (reactionMode == TOTAL_MODE) reactionMode = (REACTION_MODE)0;
		((CDXUTButton *)control)->SetText(reactionModeMSG[reactionMode]);
		break;

	case BUTTON_SENSORY_RANGE:
		m_enemy.m_agent.breaking();
		m_enemy.m_agent.nextSensoryMode();
		switch (m_enemy.m_agent.getSensoryMode())
		{
		case FULL_SENSORY:
			m_sldSensory->SetVisible(false);
			m_sldSensoryAngle->SetVisible(false);
			break;

		case ROUND_SENSORY:
			m_enemy.m_agent.genRoundSensory();
			m_sldSensory->SetVisible(true);
			break;

		case FRONT_SENSORY:
			m_enemy.m_agent.genFrontSensory();
			m_sldSensoryAngle->SetVisible(true);
			break;
		}
		((CDXUTButton *)control)->SetText(m_enemy.m_agent.getSensoryModeMsg());
		break;

	case SLIDER_SENSORY_RANGE:
		m_enemy.m_agent.updateSensoryRange(m_sldSensory->GetValue() * 10.0f);
		if (m_enemy.m_agent.isSensoryMode(ROUND_SENSORY))
			m_enemy.m_agent.genRoundSensory();
		else if (m_enemy.m_agent.isSensoryMode(FRONT_SENSORY))
			m_enemy.m_agent.genFrontSensory();
		break;

	case SLIDER_FRONT_SENSORY_ANGLE:
		m_enemy.m_agent.m_sensoryAngle = toRadian(m_sldSensoryAngle->GetValue());
		m_enemy.m_agent.genFrontSensory();
		break;
	}
}
//--------------------------------------------------------------------