//--------------------------------------------------------------------
//
//	Scroll.h
//
//	Sora Development
//

#ifndef _SORA_SCROLL_H
#define _SORA_SCROLL_H

#include "System\D3D9\D9System.h"
#include "Project\common\Agent.h"
//--------------------------------------------------------------------

using namespace sora;
//--------------------------------------------------------------------

class World : public D9System
{
public:

	World();
	~World();
	
	/*
		This function is called to initialize the World.
	*/
	bool init();

	/*
		This function is called to draw the scene.
	*/
	void render();

	void update();

	void onKeyPressed(char key, bool isDown);

	void CALLBACK guiEvent(UINT eventID, int controlID, CDXUTControl * control, void * userContext);

	virtual void start() {}
	virtual void reset() {}

private:

	enum
	{
		P1 = 0,
		P2,

		TOTAL_PLAYER
	};
	//--------------------------------------------------------------------

	D9Texture m_bgTextures[4];

	D3DXVECTOR2 g_worldBoundary;
	//--------------------------------------------------------------------
};
//--------------------------------------------------------------------

#endif