#include "Object.h"
#include "System\D3D9\D9Renderer.h"
//--------------------------------------------------------------------

namespace sora
{
	void MovableObject::integrate(float duration)
	{
		m_acceleration = m_forceAccum;// / m_mass;

		m_velocity += m_acceleration * duration;

		m_position += m_velocity * duration;

		//m_velocity *= powf(m_damping, duration);

		m_forceAccum.x = 0.0f;
		m_forceAccum.y = 0.0f;
	}
	//--------------------------------------------------------------------

	void GfxSprite::draw() const
	{
		sora::D9RendererInstance::get()->draw(*m_texture, NULL, &m_center, NULL);
	}
	//--------------------------------------------------------------------

	void ColoredSprite::draw() const
	{
		sora::D9RendererInstance::get()->draw(*m_texture, NULL, &m_center, NULL, m_color);
	}
	//--------------------------------------------------------------------

	void AnimatedSprite::draw() const
	{
		sora::D9RendererInstance::get()->draw(*m_texture, &m_rc, &m_center, NULL);
	}
	//--------------------------------------------------------------------
}
//--------------------------------------------------------------------