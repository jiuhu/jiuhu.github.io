//--------------------------------------------------------------------
//
//	Scroll.cpp
//
//	Sora Development
//

#include "Scroll.h"
#include "System\D3D9\D9Texture.h"
#include "Utilities\Helper.h"
#include "Utilities\Math.h"
#include "resource\resource.h"
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
	g_worldBoundary.x = (float)(rc.right - rc.left);
	g_worldBoundary.y = (float)(rc.bottom - rc.top);

	m_bgTextures[0].loadTextureFromResource(IDB_BMP);
	
	
	return true;
}
//--------------------------------------------------------------------

void World::render()
{
}
//--------------------------------------------------------------------

void World::update()
{
}
//--------------------------------------------------------------------

void World::onKeyPressed(char key, bool isDown)
{
	//if (isDown)
	//{
	//	switch (key)
	//	{
	//	}
	//}
	//else
	//{
	//}
}
//--------------------------------------------------------------------

void CALLBACK World::guiEvent(UINT eventID, int controlID, CDXUTControl * control, void * userContext)
{
	//switch (controlID)
	//{
	//case COMBO:
	//	break;
	//}
}
//--------------------------------------------------------------------