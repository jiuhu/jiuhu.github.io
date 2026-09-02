//--------------------------------------------------------------------
//
//	D9System.cpp
//
//	Sora Development
//


#include "resource\resource.h"
#include "D9System.h"
#include "Utilities\Helper.h"
#include "Utilities/Debug.h"
//--------------------------------------------------------------------

namespace sora
{
	D9System * d9System = nullptr;
	//--------------------------------------------------------------------

	D9System::D9System()
#ifdef USE_DEFAULT_GUI
		:	m_systemState(STATE_IDLE)
	#ifndef NO_CONTROL_BUTTON
			, m_controlButton(nullptr)
	#endif
	#ifndef NO_PAUSE_BUTTON
			, m_pauseButton(nullptr)
	#endif
#endif
	{
		d9System = this;
	#ifdef NO_CONTROL_BUTTON
		m_systemState = STATE_RUNNING;
	#endif

		m_renderer = D9RendererInstance::get();
	}
	//--------------------------------------------------------------------

	D9System::~D9System()
	{		
	}
	//--------------------------------------------------------------------
	
	bool D9System::initSystem(LPCSTR name, USHORT width, USHORT height)
	{
		createWindow(name, width, height);
		
		m_renderer->init(getWindowHandle());
		
	#ifndef NO_DXUT
		initGUI();
	#endif

		m_fontSystem = m_renderer->getSystemFont();
		
		init();
	
		return true;
	}
	//--------------------------------------------------------------------

	void D9System::run()
	{
		while (isRunning())
		{
			update();

			m_renderer->renderBegin();

			m_renderer->beginSprite();

			render();

			m_renderer->endSprite();

		#ifdef RENDER_LINE
			renderLines();
		#endif
			
		#ifndef NO_DXUT
			m_dialog.OnRender(1.0f);
		#endif

			if (m_isAbout) m_renderer->renderAbout();

			m_renderer->renderEnd();
		}
	}
	//--------------------------------------------------------------------

	void D9System::drawFormattedText(int x, int y, LPCTSTR format, ...)
	{
		char * strBuffer = nullptr;
		formatMessage(strBuffer, format);

		drawText(x, y, strBuffer);
		delete [] strBuffer;
	}
	//--------------------------------------------------------------------
	
	LRESULT D9System::messageHandler(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam)
	{
	#ifndef NO_DXUT
		if (m_dialogResourceManager->MsgProc(hWnd, msg, wParam, lParam)) return 0;
	
		if (m_dialog.MsgProc(hWnd, msg, wParam, lParam)) return 0;
	#endif

		return CoreSystem::messageHandler(hWnd, msg, wParam, lParam);
	}
	//--------------------------------------------------------------------
	
#ifndef NO_DXUT
	void CALLBACK OnGUIEvent(UINT eventID, int controlID, CDXUTControl * control, void * userContext)
	{
	#ifdef USE_DEFAULT_GUI
		d9System->defaultGUIEvent(eventID, controlID, control, userContext);
	#else
		d9System->guiEvent(eventID, controlID, control, userContext);
	#endif
	}
	//--------------------------------------------------------------------

	void CALLBACK D9System::guiEvent(UINT eventID, int controlID, CDXUTControl * control, void * userContext)
	{
		//	Empty
	}
	//--------------------------------------------------------------------
	
	#ifdef USE_DEFAULT_GUI
	
	void CALLBACK D9System::defaultGUIEvent(UINT eventID, int controlID, CDXUTControl * control, void * userContext)
	{
		switch(controlID)
		{
	#ifndef NO_CONTROL_BUTTON
		case BUTTON_CONTROL:
			switch (m_systemState)
			{
			case STATE_IDLE:
				m_systemState = STATE_RUNNING;
				m_controlButton->SetText("Reset");
				//start();
				break;
			case STATE_RUNNING:
			case STATE_PAUSE:
				m_systemState = STATE_IDLE;
				m_controlButton->SetText("Start");
				//reset();
				break;
			}
			break;
	#endif

	#ifndef NO_PAUSE_BUTTON
		case BUTTON_PAUSE:
			switch (m_systemState)
			{
		#ifndef NO_CONTROL_BUTTON
			case STATE_IDLE:
				break;
		#endif
			case STATE_RUNNING:
				m_systemState = STATE_PAUSE;
				m_pauseButton->SetText("Resume");
				break;
			case STATE_PAUSE:
				m_systemState = STATE_RUNNING;
				m_pauseButton->SetText("Pause");
				break;
			}
			break;
	#endif

		default:
			guiEvent(eventID, controlID, control, userContext);
			break;
		}
	}
	//--------------------------------------------------------------------
#endif

	bool D9System::initGUI()
	{
		m_dialogResourceManager = m_renderer->getDialogResourceManager();
		m_dialog.Init(m_dialogResourceManager);

		m_dialog.SetCallback(OnGUIEvent);

	#ifdef USE_DEFAULT_GUI
		int x = m_dialog.GetWidth() - GUI_BUTTON_WIDTH - GUI_BORDER_OFFSET;
		int y = m_dialog.GetHeight() - GUI_BUTTON_HEIGHT - GUI_BORDER_OFFSET;

		#ifndef NO_PAUSE_BUTTON
			m_pauseButton = addButton(BUTTON_PAUSE, "Pause", x, y);
			y -= GUI_BUTTON_DISTANCE;
		#endif

		#ifndef NO_CONTROL_BUTTON
			m_controlButton = addButton(BUTTON_CONTROL, "Start", x, y);
		#endif
	#endif

		return true;
	}
	//--------------------------------------------------------------------
#endif
}
//--------------------------------------------------------------------