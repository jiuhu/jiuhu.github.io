#pragma once
//--------------------------------------------------------------------

#include "Object.h"
//--------------------------------------------------------------------

class Particle : public Object
{
public:
	Particle();
	~Particle();


	bool update(float duration);

//private:

	float m_life;
	D3DCOLOR m_color;
};
//--------------------------------------------------------------------