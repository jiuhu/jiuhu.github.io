//--------------------------------------------------------------------
//
//	Object.h
//
//	Sora Development
//

#ifndef _SORA_OBJECT_H
#define _SORA_OBJECT_H

#ifndef _SORA_SORAD9_H
#include "System\D3D9\D9System.h"
#endif
//--------------------------------------------------------------------

namespace sora
{
	class D9Texture;
	//--------------------------------------------------------------------

	class GfxSprite
	{
	public:

		GfxSprite()
			:	m_texture(nullptr),
				m_center(0.0f, 0.0f, 0.0f)
		{	/*	Empty	*/	}
		//--------------------------------------------------------------------

		void setTexture(D9Texture * texture)
		{
			m_texture = texture;
		}
		//--------------------------------------------------------------------

		void setCenter(float x, float y)
		{
			m_center.x = x;
			m_center.y = y;
		}
		//--------------------------------------------------------------------

		virtual void draw() const;

	protected:
		D9Texture * m_texture;
		D3DXVECTOR3 m_center;
	};
	//--------------------------------------------------------------------

	class ColoredSprite : public GfxSprite
	{
	public:
		void setColor(BYTE r, BYTE g, BYTE b)
		{
			m_color = D3DCOLOR_XRGB(r, g, b);
		}
		//--------------------------------------------------------------------

		void draw() const;

	protected:
		D3DCOLOR m_color;
	};
	//--------------------------------------------------------------------

	class AnimatedSprite : public GfxSprite
	{
	public:
		void setRect(LONG l, LONG t, LONG r, LONG b)
		{
			m_rc.set(l, t, r, b);
		}
		//--------------------------------------------------------------------

		void draw() const;

	protected:
		SoraRC m_rc;
	};
	//--------------------------------------------------------------------

	class Object
	{
	public:
		Object::Object()
			:	m_radius(16.0f),
				m_radiusSQ(m_radius * m_radius),
				m_position(0.0f, 0.0f),
				m_gfx(nullptr),
				m_alive(true)
		{	/*	Empty	*/ }
		//--------------------------------------------------------------------

		void setPosition(float x, float y)
		{
			m_position.x = x;
			m_position.y = y;
		}
		//--------------------------------------------------------------------

		void setPosition(const D3DXVECTOR2 &position)
		{
			m_position = position;
		}
		//--------------------------------------------------------------------

		void setRadius(float radius)
		{
			m_radius = radius;
			m_radiusSQ = radius * radius;
		}
		//--------------------------------------------------------------------

		float getRadius() const
		{
			return m_radius;
		}
		//--------------------------------------------------------------------

		float getRadiusSQ() const
		{
			return m_radiusSQ;
		}
		//--------------------------------------------------------------------

		void setGfxSprite(const GfxSprite &gfx)
		{
			m_gfx = &gfx;
		}
		//--------------------------------------------------------------------

		virtual void draw() const
		{
			sora::D9RendererInstance::get()->translation(m_position);
			m_gfx->draw();
		}
		//--------------------------------------------------------------------

		void dead()
		{
			m_alive = false;
		}
		//--------------------------------------------------------------------

		void alive()
		{
			m_alive = true;
		}
		//--------------------------------------------------------------------

		bool isDead() const
		{
			return !m_alive;
		}
		//--------------------------------------------------------------------

		bool isAlive() const
		{
			return m_alive;
		}
		//--------------------------------------------------------------------

		D3DXVECTOR2 m_position;
	
	protected:
		const GfxSprite * m_gfx;

		bool m_alive;

	private:
		float m_radius;
		float m_radiusSQ;

	};
	//--------------------------------------------------------------------

	static bool isCollide(const Object &obj1, const Object &obj2)
	{
		float x = (obj2.m_position.x - obj1.m_position.x);
		float y = (obj2.m_position.y - obj1.m_position.y);
		float distance = (x * x) + (y * y);
		if (obj1.getRadiusSQ() + obj2.getRadiusSQ() > distance)
			return true;
		return false;
	}
	//--------------------------------------------------------------------

	enum MOVING_STATUS
	{
		IDLE = 0,
		ACCELERATING,
		DECELERATING,

		TOTAL_STATUS
	};
	//--------------------------------------------------------------------

	static char * MovingStatusMsg[] =
	{
		"IDLE",
		"ACCELERATING",
		"DECELERATING",
	};
	//--------------------------------------------------------------------

	class MovableObject : public Object
	{
	public:

		MovableObject::MovableObject()
			:	m_acceleration(0.0f, 0.0f),
				m_heading(0.0f, 0.0f),
				m_forceAccum(0.0f, 0.0f),
				m_topSpeed(100.0f),
				m_damping(0.7f),
				m_mass(1.0f),
				m_angleRadian(0.0f),
				m_velocity(0.0f, 0.0f),
				m_status(IDLE)
		{	/*	Empty	*/	}
		//--------------------------------------------------------------------

		void integrate(float duration);

		void updateAngle(float angle)
		{
			m_angleRadian = angle;
			updateHeading();
		}
		//--------------------------------------------------------------------

		void draw() const
		{
			sora::D9RendererInstance::get()->transformation(m_position, m_angleRadian);
			m_gfx->draw();
		}
		//--------------------------------------------------------------------

		D3DXVECTOR2 m_acceleration;

		D3DXVECTOR2 m_heading;

		D3DXVECTOR2 m_forceAccum;

		float m_damping;

		float m_mass;

		float m_topSpeed;

		float m_angleRadian;

		D3DXVECTOR2 m_velocity;
		//--------------------------------------------------------------------

		bool isIdle() const
		{
			return (m_status == IDLE);
		}
		//--------------------------------------------------------------------

		bool isMoving() const
		{
			return (m_status != IDLE);
		}
		//--------------------------------------------------------------------

		MOVING_STATUS getStatus() const
		{
			return m_status;
		}
		//--------------------------------------------------------------------

		char * getStatusMsg() const
		{
			return MovingStatusMsg[m_status];
		}
		//--------------------------------------------------------------------

		void setStatus(MOVING_STATUS status)
		{
			m_status = status;
		}
		//--------------------------------------------------------------------

	protected:
		MOVING_STATUS m_status;
		//--------------------------------------------------------------------

		void updateHeading()
		{
			m_heading.x = sin(m_angleRadian);

		#ifdef _SORA_SORAD9_H
			m_heading.y = -cos(m_angleRadian);
		#else
			m_heading.y = cos(m_angleRadian);
		#endif
		}
		//--------------------------------------------------------------------
	};
	//--------------------------------------------------------------------

	const float g_bounceEffect = -0.3f;
	//--------------------------------------------------------------------

	static bool isWorldCollide(MovableObject &object, const D3DXVECTOR2 &worldBoundary)
	{
		if (object.m_position.x < 0)
		{
			return true;
		}
		else if (object.m_position.x > worldBoundary.x)
		{
			return true;
		}
		if (object.m_position.y < 0)
		{
			return true;
		}
		else if (object.m_position.y > worldBoundary.y)
		{
			return true;
		}

		return false;
	}
	//--------------------------------------------------------------------
}
//--------------------------------------------------------------------

#endif