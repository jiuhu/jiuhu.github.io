//--------------------------------------------------------------------
//
//	CoreSystem.cpp
//
//	Sora Development
//


#include "CoreSystem.h"
#include <windowsx.h>
#include "Utilities/Debug.h"
//--------------------------------------------------------------------

namespace sora
{
	LPCSTR CLASS_NAME = "SORA";
	const DWORD SORA_WINDOW_STYLE = WS_OVERLAPPED | WS_CAPTION | WS_SYSMENU | WS_MINIMIZEBOX;
	//--------------------------------------------------------------------

	CoreSystem * self = nullptr;
	//--------------------------------------------------------------------

	LRESULT WINAPI WindowProcedure(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam)
	{
		return self->messageHandler(hWnd, msg, wParam, lParam);
	}
	//--------------------------------------------------------------------

	CoreSystem::CoreSystem()
		:	m_defaultWidth(800),
			m_defaultHeight(600),
			m_hWnd(nullptr),
			m_specialKey(0),
			m_isAbout(false)
	{
		detectMemoryLeak();
		self = this;
	}
	//--------------------------------------------------------------------

	CoreSystem::~CoreSystem()
	{
		UnregisterClass(CLASS_NAME, GetModuleHandle(NULL));

		m_hWnd = nullptr;
	}
	//--------------------------------------------------------------------

	bool CoreSystem::createWindow(LPCSTR name, USHORT width, USHORT height)
	{
		WNDCLASSEX wc;
		memset(&wc, 0, sizeof(WNDCLASSEX));

		wc.cbSize			= sizeof(WNDCLASSEX);
        wc.hCursor			= LoadCursor(NULL, IDC_ARROW);
        wc.hIcon			= LoadIcon(NULL, IDI_APPLICATION);
		wc.hInstance		= GetModuleHandle(NULL);
		wc.lpfnWndProc		= WindowProcedure;
		wc.lpszClassName	= CLASS_NAME;
		wc.style			= CS_OWNDC | CS_HREDRAW | CS_VREDRAW;
		
		if (!RegisterClassEx(&wc))
		{
			debugMsg("Failed to register windows class\n");
			return false;
		}

		m_defaultWidth = width;
		m_defaultHeight = height;

		m_hWnd = CreateWindowEx(	0, 
									wc.lpszClassName, 
									name, 
									WS_VISIBLE | SORA_WINDOW_STYLE,
									100, 
									100, 
									m_defaultWidth, 
									m_defaultHeight, 
									NULL, 
									NULL, 
									wc.hInstance, 
									NULL
									);
		
		//SetCursorPos(100, 100);
		
		return true;
	}
	//--------------------------------------------------------------------

	bool CoreSystem::isRunning()
	{
		static MSG msg;
		if (PeekMessage(&msg, NULL, 0, 0, PM_REMOVE))
		{
			if (msg.message == WM_QUIT) return false;
			TranslateMessage(&msg);
			DispatchMessage(&msg);
		}

		return true;
	}
	//--------------------------------------------------------------------
	
	LRESULT CoreSystem::messageHandler(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam)
	{
		static POINT prevCoord = {100, 100};
		int x, y;
		switch(msg)
		{
		case WM_DESTROY:
			PostQuitMessage(0);
			break;

		case WM_KEYDOWN:
			switch (wParam)
			{
			case VK_ESCAPE:
				PostQuitMessage(0);
				break;

			case 'H':
				if ((m_specialKey ^ 1) == 0)
					m_isAbout = !m_isAbout;
				break;

			case VK_CONTROL:
				m_specialKey |= 1;
				break;

			case VK_SHIFT:
				m_specialKey |= 2;
				break;

			default:
				onKeyPressed(wParam, true);
			}
			break;

		case WM_KEYUP:
			switch (wParam)
			{
			case VK_CONTROL:
				m_specialKey &= 0;
				break;

			case VK_SHIFT:
				m_specialKey &= 2;
				break;

			default:
				onKeyPressed(wParam, false);
			}
			break;

		case WM_LBUTTONDOWN:
			onMouseButton(VK_LBUTTON, true, lParam);
			break;
		case WM_RBUTTONDOWN:
			onMouseButton(VK_RBUTTON, true, lParam);
			break;
		case WM_MBUTTONDOWN:
			onMouseButton(VK_MBUTTON, true, lParam);
			break;

		case WM_LBUTTONUP:
			onMouseButton(VK_LBUTTON, false, lParam);
			break;
		case WM_RBUTTONUP:
			onMouseButton(VK_RBUTTON, false, lParam);
			break;
		case WM_MBUTTONUP:
			onMouseButton(VK_MBUTTON, false, lParam);
			break;

		case WM_MOUSEMOVE:
			x = GET_X_LPARAM(lParam);
			y = GET_Y_LPARAM(lParam);
			onMouseMove(x, y, x - prevCoord.x, y - prevCoord.y);
			prevCoord.x = x;
			prevCoord.y = y;
			break;
			
		case WM_MOUSEWHEEL:            
			onMouseWheel((short)HIWORD(wParam) / 120);
			break;

		default:
			break;
		}

		return DefWindowProc(hWnd, msg, wParam, lParam);
	}
	//--------------------------------------------------------------------

	void CoreSystem::onKeyPressed(char key, bool isDown)
	{
		//	Empty
	}
	//--------------------------------------------------------------------

	void CoreSystem::onMouseButton(int button, bool isDown, LPARAM lParam)
	{
		//	Empty
	}
	//--------------------------------------------------------------------

	void CoreSystem::onMouseMove(int x, int y, int dx, int dy)
	{
		//	Empty
	}
	//--------------------------------------------------------------------

	void CoreSystem::onMouseWheel(short wheelMovement)
	{
		//	Empty
	}
	//--------------------------------------------------------------------
}
//--------------------------------------------------------------------