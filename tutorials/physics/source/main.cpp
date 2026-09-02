//--------------------------------------------------------------------
//
//	main.cpp
//
//	Sora Development
//

#include "System\Setting.h"
#include "Project\Sensing\Sensing.h"
//--------------------------------------------------------------------

#ifdef COMMAND_PROMPT
	int main()
#else
	int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nShowCmd)
#endif
{
	World world;
	
	if (world.initSystem(DEMO_NAME, 800, 600))
	{
		world.run();
	}

	return 0;
}
//--------------------------------------------------------------------