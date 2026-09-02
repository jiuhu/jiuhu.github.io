//--------------------------------------------------------------------
//
//	Agent.h
//
//	Sora Development
//

#ifndef _SORA_AGENT_H
#define _SORA_AGENT_H

#include "Object.h"
//--------------------------------------------------------------------

namespace sora
{
	enum SENSORY_MODE
	{
		FULL_SENSORY = 0,
		ROUND_SENSORY,
		FRONT_SENSORY,

		TOTAL_SENSORY
	};
	//--------------------------------------------------------------------

	class Agent : public MovableObject
	{
	public:
		Agent();

		void rotate(float radian);

		void moving(float duration);
		void accelerate(float accelerateForce);
		void decelerate(float duration);
		void breaking();
		void transform();

		void updateSensoryRange(float newRange)
		{
			m_sensoryRadius = newRange;
			m_sensoryRadiusSQ = m_sensoryRadius * m_sensoryRadius;
		}
		//--------------------------------------------------------------------
		
		void genRoundSensory();
		void genFrontSensory();
		void genSensory()
		{
			(m_sensoryMode == ROUND_SENSORY) ? genRoundSensory() : genFrontSensory();
		}
		//--------------------------------------------------------------------

		void updateAngle(float newAngle);
		bool isInSensoryRangeSQ(const D3DXVECTOR2 &targetPosition);
		bool isInSensoryFrontRange(const D3DXVECTOR2 &targetPosition);
		bool isInSensoryRangeSQ(const Agent &targetAgent);
		bool isInSensoryFrontRange(const Agent &targetAgent);
		//--------------------------------------------------------------------

		void drawSensoryRange() const;
		char * getSensoryModeMsg() const;
		//--------------------------------------------------------------------

		SENSORY_MODE getSensoryMode() const
		{
			return m_sensoryMode;
		}
		//--------------------------------------------------------------------

		bool isSensoryMode(SENSORY_MODE mode) const
		{
			return (m_sensoryMode == mode);
		}
		//--------------------------------------------------------------------

		void setSensoryMode(SENSORY_MODE mode)
		{
			m_sensoryMode = mode;
		}
		//--------------------------------------------------------------------

		void nextSensoryMode()
		{
			m_sensoryMode = (SENSORY_MODE)(m_sensoryMode + 1);
			if (m_sensoryMode == TOTAL_SENSORY) m_sensoryMode = FULL_SENSORY;
		}
		//--------------------------------------------------------------------

		void bounce(D3DXVECTOR2 &impact)
		{
			m_position += impact;
		}
		//--------------------------------------------------------------------

		void worldCollision(const D3DXVECTOR2 &worldBoundary)
		{
			D3DXVECTOR2 bounce(1.0f, 1.0f);
			if (m_position.x < 0)
			{
				m_position.x = 0;
				bounce.x = g_bounceEffect;
			}
			else if (m_position.x > worldBoundary.x)
			{
				m_position.x = worldBoundary.x;
				bounce.x = g_bounceEffect;
			}
			if (m_position.y < 0)
			{
				m_position.y = 0;
				bounce.y = g_bounceEffect;
			}
			else if (m_position.y > worldBoundary.y)
			{
				m_position.y = worldBoundary.y;
				bounce.y = g_bounceEffect;
			}

			m_velocity.x *= bounce.x;
			m_velocity.y *= bounce.y;
		}
		//--------------------------------------------------------------------

		void smoothRotation(float targetAngle);
		//--------------------------------------------------------------------

		float m_decelerate;
		float m_sensoryRadius;
		float m_sensoryRadiusSQ;
		float m_sensoryAngle;
		SENSORY_MODE m_sensoryMode;
		//--------------------------------------------------------------------
	};
	//--------------------------------------------------------------------

	float findAngle(const Agent &agent, const D3DXVECTOR2 &targetPosition);
	static float findAngle(const Agent &agent, const Agent &targetAgent)
	{
		return findAngle(agent, targetAgent.m_position);
	}
	//--------------------------------------------------------------------

	static bool isInSensoryRangeSQ(float sensoryRadiusSQ, const D3DXVECTOR2 &my, const D3DXVECTOR2 &target)
	{
		D3DXVECTOR2 out;
		D3DXVec2Subtract(&out, &target, &my);
		float rangeSQ = D3DXVec2LengthSq(&out);
		return (rangeSQ < sensoryRadiusSQ);
	}
	//--------------------------------------------------------------------
}
//--------------------------------------------------------------------

#endif