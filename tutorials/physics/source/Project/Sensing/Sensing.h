//--------------------------------------------------------------------
//
//	Sensing.h
//
//	Sora Development

#ifndef _SORA_SENSING_H
#define _SORA_SENSING_H

#include "System\D3D9\D9System.h"
#include "Project\common\Agent.h"
//--------------------------------------------------------------------

using namespace sora;
//--------------------------------------------------------------------

class World : public D9System
{
public:
	
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

	void CALLBACK guiEvent(UINT eventID, int controlID, CDXUTControl * control, void * userContext);

	void onMouseButton(int button, bool isDown, LPARAM lParam);

	void onMouseMove(int x, int y, int dx, int dy);

private:
	Agent m_agent;
	D9Texture m_texture;
	GfxSprite m_spriteGuard;

	float m_targetAngle;
	bool m_isRotating;
	
	D3DXVECTOR2 m_mousePosition;
	D3DXVECTOR2 m_playerPosition;

	CDXUTSlider * m_sldSensory;
	CDXUTSlider * m_sldSensoryAngle;
	//--------------------------------------------------------------------
};
//--------------------------------------------------------------------

#endif