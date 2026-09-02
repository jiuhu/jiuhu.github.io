#include "Agent.h"
#include "System\D3D9\D9Renderer.h"
#include "Utilities\Math.h"
//--------------------------------------------------------------------

namespace sora
{
	char * sensoryModeMSG[3] =
	{
		"Full Sensory",
		"Round Sensory",
		"Front Sensory"
	};
	//--------------------------------------------------------------------

	char * Agent::getSensoryModeMsg() const
	{
		return sensoryModeMSG[m_sensoryMode];
	}
	//--------------------------------------------------------------------

	Agent::Agent()
		:	m_decelerate(0.3f),
			m_sensoryRadius(100.0f),
			m_sensoryRadiusSQ(m_sensoryRadius * m_sensoryRadius),
			m_sensoryAngle(HALF_PI),
			m_sensoryMode(FULL_SENSORY)
	{
		m_heading.y = -1.0f;
	}
	//--------------------------------------------------------------------

	void Agent::rotate(float radian)
	{
		m_angleRadian += radian;
		if (m_angleRadian < 0.0f)
			m_angleRadian += TWO_PI;
		else if (m_angleRadian > TWO_PI)
			m_angleRadian -= TWO_PI;

		updateHeading();
	}
	//--------------------------------------------------------------------

	void Agent::moving(float duration)
	{
		if (m_status == ACCELERATING)
		{
			m_acceleration = m_forceAccum;

			m_velocity += m_acceleration * duration;

			m_position += m_velocity * duration;

			m_velocity *= powf(m_damping, duration);
		}
		else
		{
			decelerate(duration);
			if (D3DXVec2LengthSq(&m_velocity) < 1)
				m_status = IDLE;
		}
		m_forceAccum.x = 0.0f;
		m_forceAccum.y = 0.0f;
	}
	//--------------------------------------------------------------------

	void Agent::accelerate(float accelerateForce)
	{
		m_status = ACCELERATING;
		m_forceAccum = m_heading * accelerateForce;
	}
	//--------------------------------------------------------------------

	void Agent::decelerate(float duration)
	{
		m_velocity *= powf(m_decelerate, duration);
		m_position += m_velocity * duration;
	}
	//--------------------------------------------------------------------

	void Agent::breaking()
	{
		m_status = IDLE;
		m_forceAccum.x = 0.0f;
		m_forceAccum.y = 0.0f;
		m_velocity.x = 0.0f;
		m_velocity.y = 0.0f;
	}
	//--------------------------------------------------------------------

	bool Agent::isInSensoryRangeSQ(const D3DXVECTOR2 &targetPosition)
	{
		D3DXVECTOR2 out;
		D3DXVec2Subtract(&out, &targetPosition, &m_position);
		float rangeSQ = D3DXVec2LengthSq(&out);
		return (rangeSQ < m_sensoryRadiusSQ);
	}
	//--------------------------------------------------------------------

	const int LINE_VERTICES = 30;
	D3DXVECTOR2 lineVertices[LINE_VERTICES];
	//--------------------------------------------------------------------

	void Agent::drawSensoryRange() const
	{
#ifdef RENDER_LINE
		if (m_sensoryMode != FULL_SENSORY)
			sora::D9RendererInstance::get()->renderLineList(lineVertices, LINE_VERTICES);
#endif
	}
	//--------------------------------------------------------------------

	void Agent::genRoundSensory()
	{
		float angleStep = TWO_PI / (LINE_VERTICES - 1);
		float angle = 0.0f;

		for (int i = 0; i < LINE_VERTICES; i++)
		{
			lineVertices[i].x = (m_position.x + sin(angle) * m_sensoryRadius) - 0.01f;
			lineVertices[i].y = (m_position.y + -cos(angle) * m_sensoryRadius) - 0.01f;
			angle += angleStep;
		}
	}
	//--------------------------------------------------------------------

	void Agent::genFrontSensory()
	{
		lineVertices[0] = m_position;
		int lastIndex = LINE_VERTICES - 1;
		lineVertices[lastIndex] = m_position;
		int centerIndex = (LINE_VERTICES / 2) - 1;
		float angleStep = m_sensoryAngle / (centerIndex);
		float angle = m_angleRadian;

		for (int i = centerIndex; i > 0; i--)
		{
			lineVertices[i].x = m_position.x + sin(angle) * m_sensoryRadius;
			lineVertices[i].y = m_position.y + -cos(angle) * m_sensoryRadius;
			angle += angleStep;
		}

		angle = m_angleRadian;
		for (int j = centerIndex + 1; j < lastIndex; j++)
		{
			lineVertices[j].x = m_position.x + sin(angle) * m_sensoryRadius;
			lineVertices[j].y = m_position.y + -cos(angle) * m_sensoryRadius;
			angle -= angleStep;
		}
	}
	//--------------------------------------------------------------------

	void Agent::updateAngle(float newAngle)
	{
		MovableObject::updateAngle(newAngle);
		if (m_sensoryMode == FRONT_SENSORY)
			genFrontSensory();
	}
	//--------------------------------------------------------------------

	void Agent::smoothRotation(float targetAngle)
	{
		float newAngle = m_angleRadian;
		if (targetAngle - newAngle > D3DX_PI)
		{
			newAngle -= 0.1f;
		}
		else if (newAngle - targetAngle > D3DX_PI)
		{
			newAngle += 0.1f;
		}
		else if (newAngle > targetAngle)
		{
			newAngle -= 0.1f;
		}
		else
		{
			newAngle += 0.1f;
		}

		float dist = newAngle - targetAngle;
		if (dist > -0.1f && dist < 0.1f)
		{
			newAngle = targetAngle;
		}

		if (newAngle > TWO_PI)
			newAngle -= TWO_PI;
		else if (newAngle < 0)
			newAngle += TWO_PI;

		updateAngle(newAngle);
	}
	//--------------------------------------------------------------------

	bool Agent::isInSensoryFrontRange(const D3DXVECTOR2 &targetPosition)
	{
		//	Find the boundary
		float east = m_angleRadian + m_sensoryAngle;
		if (east > TWO_PI) east -= TWO_PI;
		float west = east - (m_sensoryAngle * 2);
		east -= 0.1f;
		west += 0.1f;

		D3DXVECTOR2 out;
		D3DXVec2Subtract(&out, &targetPosition, &m_position);
		float frontAngle = getAngle(out);
		if (out.x < 0)
		{
			frontAngle = (west < 0) ? -frontAngle : TWO_PI - frontAngle;
		}

		if (frontAngle < east && frontAngle > west)
		{
			return isInSensoryRangeSQ(targetPosition);
		}
		else
			return false;
	}
	//--------------------------------------------------------------------

	float findAngle(const Agent &agent, const D3DXVECTOR2 &targetPosition)
	{
		D3DXVECTOR2 newHeading;
		D3DXVec2Subtract(&newHeading, &targetPosition, &agent.m_position);
		D3DXVec2Normalize(&newHeading, &newHeading);
		float angle = getAngle(newHeading);
		if (newHeading.x < 0)
			angle = TWO_PI - angle;

		return angle;
	}
	//--------------------------------------------------------------------

	bool Agent::isInSensoryRangeSQ(const Agent &targetAgent)
	{
		D3DXVECTOR2 out;
		D3DXVec2Subtract(&out, &targetAgent.m_position, &m_position);
		float rangeSQ = D3DXVec2LengthSq(&out);
		return (rangeSQ < m_sensoryRadiusSQ + targetAgent.getRadiusSQ());
	}
	//--------------------------------------------------------------------

	bool Agent::isInSensoryFrontRange(const Agent &targetAgent)
	{
		//	Find the boundary
		float east = m_angleRadian + m_sensoryAngle;
		if (east > TWO_PI) east -= TWO_PI;
		float west = east - (m_sensoryAngle * 2);
		east -= 0.1f;
		west += 0.1f;

		D3DXVECTOR2 out;
		D3DXVec2Subtract(&out, &targetAgent.m_position, &m_position);
		float frontAngle = getAngle(out);
		if (out.x < 0)
		{
			frontAngle = (west < 0) ? -frontAngle : TWO_PI - frontAngle;
		}

		if (frontAngle < east && frontAngle > west)
		{
			return isInSensoryRangeSQ(targetAgent);
		}
		else
			return false;
	}
	//--------------------------------------------------------------------
}
//--------------------------------------------------------------------