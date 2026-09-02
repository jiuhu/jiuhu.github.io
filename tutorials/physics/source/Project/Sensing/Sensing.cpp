//--------------------------------------------------------------------
//
//	Sensing.cpp
//
//	Sora Development
//

#include "Sensing.h"
#include "System\D3D9\D9Texture.h"
#include "Utilities\Math.h"
#include "resource\resource.h"
//--------------------------------------------------------------------

enum GUI_WIDGET
{
	BUTTON_ROTATION_MODE,
	BUTTON_SENSORY_RANGE,
	SLIDER_SENSORY_RANGE,
	SLIDER_FRONT_SENSORY_ANGLE,
};
//--------------------------------------------------------------------

enum ROTATION_MODE
{
	CLICK_ROTATE,
	MOVE_ROTATE,
	ANIME_ROTATE,

	TOTAL_MODE
};
ROTATION_MODE rotationMode = CLICK_ROTATE;
//--------------------------------------------------------------------

char * rotationModeMSG[3] = 
{
	"Click to Rotate",
	"Move to Rotate",
	"Rotate Animation"
};
//--------------------------------------------------------------------

bool World::init()
{
	m_targetAngle = 0.0f;
	m_isRotating = false;

	m_texture.loadTextureFromResource(IDB_BMP);
	m_spriteGuard.setTexture(&m_texture);
	m_spriteGuard.setCenter(32.0f, 32.0f);
	m_agent.setGfxSprite(m_spriteGuard);

	SoraRC rc;
	GetClientRect(getWindowHandle(), &rc);
	int x = rc.width();
	int y = rc.height();

	m_agent.setPosition(x / 2.0f, y / 2.0f);

	int w = GUI_BUTTON_WIDTH + 32;
	int h = GUI_BUTTON_HEIGHT + 16;
	x -= w + GUI_BORDER_OFFSET;
	y -= h + GUI_BORDER_OFFSET;
	addButton(BUTTON_ROTATION_MODE, rotationModeMSG[rotationMode], x, y, w, h);
	
	y -= h + GUI_BORDER_OFFSET;
	addButton(BUTTON_SENSORY_RANGE, m_agent.getSensoryModeMsg(), x, y, w, h);

    m_sldSensory = addSlider(SLIDER_SENSORY_RANGE, 10, 30, (int)m_agent.m_sensoryRadius / 10, 200, 500);
	m_sldSensory->SetVisible(false);

    m_sldSensoryAngle = addSlider(SLIDER_FRONT_SENSORY_ANGLE, 30, 110, 90, 200, 470);
	m_sldSensoryAngle->SetVisible(false);

	m_playerPosition.x = 0.0f;
	m_playerPosition.y = 0.0f;
	m_mousePosition.x = 0.0f;
	m_mousePosition.y = 0.0f;

	return true;
}
//--------------------------------------------------------------------

void World::render()
{
	drawFormattedText(0, 0, "Position : (%.0f, %.0f)", m_agent.m_position.x, m_agent.m_position.y);
	drawFormattedText(0, 32, "Angle : %.2f (%.2f)", toDegree(m_agent.m_angleRadian), m_agent.m_angleRadian);
	drawFormattedText(0, 64, "Heading : (%.2f, %.2f)", m_agent.m_heading.x, m_agent.m_heading.y);
	drawFormattedText(400, 0, "Mouse : (%.0f, %.0f)", m_mousePosition.x, m_mousePosition.y);
	drawFormattedText(400, 32, "Player : (%.0f, %.0f)", m_playerPosition.x, m_playerPosition.y);

	if (m_agent.getSensoryMode())
	{
		drawFormattedText(0, 500, "Sensory Radius : %.2f", m_agent.m_sensoryRadius);
		if (m_agent.isSensoryMode(FRONT_SENSORY))
			drawFormattedText(0, 470, "Sensory Angle : %.2f", m_agent.m_sensoryAngle);
	}

	m_agent.draw();
}
//--------------------------------------------------------------------

void World::update()
{
	if (rotationMode == ANIME_ROTATE)
	{
		if (m_isRotating)
		{
			float newAngle = m_agent.m_angleRadian;
			if (m_targetAngle - newAngle > D3DX_PI)
			{
				newAngle -= 0.1f;
			}
			else if (newAngle - m_targetAngle > D3DX_PI)
			{
				newAngle += 0.1f;
			}
			else if (newAngle > m_targetAngle)
			{
				newAngle -= 0.1f;
			}
			else
			{
				newAngle += 0.1f;
			}
			float dist = newAngle - m_targetAngle;
			if (dist > -0.1f && dist < 0.1f)
			{
				newAngle = m_targetAngle;
				m_isRotating = false;
			}
			if (newAngle > TWO_PI)
				newAngle -= TWO_PI;
			else if (newAngle < 0)
				newAngle += TWO_PI;
			
			m_agent.updateAngle(newAngle);
		}
	}
}
//--------------------------------------------------------------------

void World::guiEvent(UINT eventID, int controlID, CDXUTControl * control, void * userContext)
{
    switch(controlID)
    {
	case BUTTON_ROTATION_MODE:
		rotationMode = (ROTATION_MODE)(rotationMode + 1);
		if (rotationMode == TOTAL_MODE) rotationMode = CLICK_ROTATE;
		((CDXUTButton *)control)->SetText(rotationModeMSG[rotationMode]);
		break;

	case BUTTON_SENSORY_RANGE:
		m_agent.nextSensoryMode();
		switch (m_agent.getSensoryMode())
		{
		case FULL_SENSORY:
			m_sldSensory->SetVisible(false);
			m_sldSensoryAngle->SetVisible(false);
			break;

		case ROUND_SENSORY:
			m_agent.genFullSensory();
			m_sldSensory->SetVisible(true);
			break;

		case FRONT_SENSORY:
			m_agent.genFrontSensory();
			m_sldSensoryAngle->SetVisible(true);
			break;
		}
		((CDXUTButton *)control)->SetText(m_agent.getSensoryModeMsg());
		break;

	case SLIDER_SENSORY_RANGE:
		m_agent.updateSensoryRange(m_sldSensory->GetValue() * 10.0f);
		if (m_agent.isSensoryMode(ROUND_SENSORY))
			m_agent.genFullSensory();
		else if (m_agent.isSensoryMode(FRONT_SENSORY))
			m_agent.genFrontSensory();
		break;

	case SLIDER_FRONT_SENSORY_ANGLE:
		m_agent.m_sensoryAngle = toRadian(m_sldSensoryAngle->GetValue());
		m_agent.genFrontSensory();
		break;
	}
}
//--------------------------------------------------------------------

void World::onMouseButton(int button, bool isDown, LPARAM lParam)
{
	if (button == VK_LBUTTON && isDown)
	{
		m_playerPosition.x = LOWORD(lParam);
		m_playerPosition.y = HIWORD(lParam);

		if (m_agent.isSensoryMode(ROUND_SENSORY))
		{
			if (!m_agent.isInSensoryRangeSQ(m_playerPosition))
				return;
		}
		else if (m_agent.isSensoryMode(FRONT_SENSORY))
		{
			if (!m_agent.isInSensoryFrontRange(m_playerPosition))
				return;
		}

		if (rotationMode == CLICK_ROTATE)
		{
			m_agent.updateAngle(findAngle(m_agent, m_playerPosition));
		}
		else if (rotationMode == ANIME_ROTATE)
		{
			m_targetAngle = findAngle(m_agent, m_playerPosition);
			m_isRotating = true;
		}
	}
}
//--------------------------------------------------------------------

void World::onMouseMove(int x, int y, int dx, int dy)
{
	m_mousePosition.x = (float)x;
	m_mousePosition.y = (float)y;
	if (rotationMode == MOVE_ROTATE)
	{
		m_playerPosition = m_mousePosition;
		if (m_agent.isSensoryMode(ROUND_SENSORY))
		{
			if (!m_agent.isInSensoryRangeSQ(m_playerPosition))
				return;
		}
		else if (m_agent.isSensoryMode(FRONT_SENSORY))
		{
			if (!m_agent.isInSensoryRangeSQ(m_playerPosition))
				return;
		}
		m_agent.updateAngle(findAngle(m_agent, m_playerPosition));
	}
}
//--------------------------------------------------------------------

void World::renderLines()
{
	m_agent.drawSensoryRange();
}
//--------------------------------------------------------------------