#pragma once

#ifndef __D3DX9MATH_H__
	#include <d3dx9math.h>
#endif
//--------------------------------------------------------------------

const float TWO_PI = D3DX_PI * 2.0f;
const float HALF_PI = D3DX_PI / 2.0f;
//--------------------------------------------------------------------

inline float toDegree(float radian)
{
	return radian / D3DX_PI * 180.0f;
}
//--------------------------------------------------------------------

template<class T>
inline float toRadian(T degree)
{
	return degree / 180.0f * D3DX_PI;
}
//--------------------------------------------------------------------

const D3DXVECTOR2 UP(0.0f, -1.0f);
const float UP_LENGTH = D3DXVec2Length(&UP);
//--------------------------------------------------------------------

inline float getAngle(const D3DXVECTOR2 &vec) 
{
	// To calculate the radian between 2 vectors
	// cos(theta) = p . q / |p| * |q|

	// calculate p dot q
	float pDotQ = D3DXVec2Dot(&vec, &UP);

	// length of p multiply with length of q
	float lengths = D3DXVec2Length(&vec) * UP_LENGTH;
	if (lengths < 0.0001f) lengths = 0.1f;
	//else lengths = sqrt(lengths);

	// calculate the theta value
	float value = pDotQ / lengths;
	if (value > 1.0f) value = 1.0f;
	else if (value < -1.0f) value = -1.0f;
				
	return acos(value);
}
//--------------------------------------------------------------------