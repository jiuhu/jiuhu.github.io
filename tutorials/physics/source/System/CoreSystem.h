//--------------------------------------------------------------------
//
//	CoreSystem.h
//
//	Sora Development
//


/**	Revision History

		Rev 1.0		08 Sep 2011		Define CoreSystem class
			1.1		18 Jun 2013		Modify Windows Procedure
			1.2		19 Oct 2013		Modify for JHD9

*/

#ifndef _SORA_CORESYSTEM_H
#define _SORA_CORESYSTEM_H

#ifndef _SORA_WIN_H
	#include "SoraWindow.h"
#endif
//--------------------------------------------------------------------

namespace sora
{
	enum INPUT_KEY
	{
		UP_KEY		= 1 << 0,
		DOWN_KEY	= 1 << 1,
		LEFT_KEY	= 1 << 2,
		RIGHT_KEY	= 1 << 3,
		A_KEY		= 1 << 4,
		B_KEY		= 1 << 5,
		X_KEY		= 1 << 6,
		Y_KEY		= 1 << 7,
	};
	//--------------------------------------------------------------------

	class KeyInputController
	{
	public:
		KeyInputController()
			:	m_keys(0),
				m_prevKeys(0)
		{	/*	Empty	*/	}
		//--------------------------------------------------------------------

		void keyDown(INPUT_KEY key)
		{
			m_keys |= key;
		}
		//--------------------------------------------------------------------

		void keyUp(INPUT_KEY key)
		{
			m_keys ^= key;
			m_prevKeys ^= key;
		}
		//--------------------------------------------------------------------
		
		bool isKeyPressed(INPUT_KEY key)
		{
			unsigned char button = (m_keys & key);
			bool status = button && !(m_prevKeys & key);
			m_prevKeys |= button;
			return status;
		}
		//--------------------------------------------------------------------
		
		bool isKeyHold(INPUT_KEY key) const
		{
			return (m_keys & key) > 0;
		}
		//--------------------------------------------------------------------
	
	private:
		unsigned char m_keys;
		unsigned char m_prevKeys;
		//--------------------------------------------------------------------
	};
	//--------------------------------------------------------------------

	class CoreSystem
	{
	public:
	
		/*
			Constructor with initialization process.
		*/
		CoreSystem();

		/*
			Destructor.
		*/
		virtual ~CoreSystem();

		/*
			This function is called to initialize windows shell.
		*/
		bool createWindow(LPCSTR name, USHORT width = 800, USHORT height = 600);

		/*
			This function is called to check is the window still running.
		*/
		bool isRunning();

		/*
			This function is called to end the window.
		*/
		void quit();

		/*
			This function is called to return the instance handle.
		*/
		HINSTANCE getInstanceHandle() const;

		/*
			This function is called to return the window handle.
		*/
		HWND getWindowHandle() const;

		/*
			This function is called to modify the window's name.
		*/
		void changeWindowName(LPCSTR name);

		/*
			This function is called to return the window's name.
		*/
		void getWindowName(char * const name) const;

		/*
			This function is called to return the window's size.
		*/
		void getWindowSize(USHORT &width, USHORT &height);

		/*
			This function is called to return the screen's size.
		*/
		void getScreenSize(USHORT &width, USHORT &height);

		/*
			This function is called to return the screen rect.
		*/
		//void getScreenRect();

		/*
			This function is called to get window width.
		*/
		USHORT getWidth() const;

		/*
			This function is called to get window height.
		*/
		USHORT getHeight() const;

		/*
			This function is called to toggle window's visibility.
		*/
		void toggleVisibility(bool isVisible);
		
		/*
			This function is called to handle messages from window procedure.
		*/
		virtual LRESULT messageHandler(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam);

		/*
			This function is called to handle key pressed event.
		*/
		virtual void onKeyPressed(char key, bool isDown);

		/*
			This function is called to handle mouse clicks event.
		*/
		virtual void onMouseButton(int button, bool isDown, LPARAM lParam);

		/*
			This function is called to handle WM_MOUSEMOVE event.
		*/
		virtual void onMouseMove(int x, int y, int dx, int dy);

		/*
			This function is called to handle WM_MOUSEWHEEL event.
		*/
		virtual void onMouseWheel(short wheelMovement);

	private:

		//	Window default width.
		USHORT m_defaultWidth;

		//	Window default height.
		USHORT m_defaultHeight;
	
		//	Window handle.
		HWND m_hWnd;

		//	Keep track of special key status.
		UCHAR m_specialKey;

	protected:
		bool m_isAbout;
	};
	//--------------------------------------------------------------------
	
	inline void CoreSystem::quit()
	{
		PostQuitMessage(0);
	}
	//--------------------------------------------------------------------

	inline HINSTANCE CoreSystem::getInstanceHandle() const
	{
		return GetModuleHandle(NULL);
	}
	//--------------------------------------------------------------------

	inline HWND CoreSystem::getWindowHandle() const
	{
		return m_hWnd;
	}
	//--------------------------------------------------------------------

	inline void CoreSystem::changeWindowName(LPCSTR name)
	{
		SetWindowText(m_hWnd, name);
	}
	//--------------------------------------------------------------------

	inline void CoreSystem::getWindowName(char * const name) const
	{
		GetWindowText(m_hWnd, name, 32);
	}
	//--------------------------------------------------------------------

	inline void CoreSystem::getWindowSize(USHORT &width, USHORT &height)
	{
		width = m_defaultWidth;
		height = m_defaultHeight;
	}
	//--------------------------------------------------------------------

	inline void CoreSystem::getScreenSize(USHORT &width, USHORT &height)
	{
		RECT rect;
		GetClientRect(m_hWnd, &rect);
		width = (USHORT)(rect.right - rect.left);
		height = (USHORT)(rect.bottom - rect.top);
	}
	//--------------------------------------------------------------------
	
	inline USHORT CoreSystem::getWidth() const
	{
		return m_defaultWidth;
	}
	//--------------------------------------------------------------------
		
	inline USHORT CoreSystem::getHeight() const
	{
		return m_defaultHeight;
	}
	//--------------------------------------------------------------------

	inline void CoreSystem::toggleVisibility(bool isVisible)
	{
		ShowWindow(m_hWnd, isVisible);
	}
	//--------------------------------------------------------------------
}
//--------------------------------------------------------------------

#endif