//--------------------------------------------------------------------
//
//	D9System.h
//
//	Sora Development
//


/**	Revision History

		Rev 1.0		19 Oct 2013		Define Direct3D9 window


*/


#ifndef _SORA_D9SYSTEM_H
#define _SORA_D9SYSTEM_H

#ifndef _SORA_CORESYSTEM_H
	#include "System\CoreSystem.h"
#endif

#ifndef _SORA_D9RENDERER_H
	#include "D9Renderer.h"
#endif
//--------------------------------------------------------------------

namespace sora
{
#ifndef NO_DXUT
	const int GUI_BUTTON_WIDTH		= 96;
	const int GUI_BUTTON_HEIGHT		= 32;
	const int GUI_SLIDER_WIDTH		= 192;
	const int GUI_SLIDER_HEIGHT		= 24;
	const int GUI_BUTTON_DISTANCE	= GUI_BUTTON_HEIGHT + 8;
	const int GUI_BORDER_OFFSET		= 16;
	//--------------------------------------------------------------------

	#ifdef USE_DEFAULT_GUI
		enum GUI_WIDGET_DEFAULT
		{
			BUTTON_CONTROL = 1000,
			BUTTON_PAUSE,
		};

		enum SYSTEM_STATE
		{
			STATE_IDLE = 0,
			STATE_RUNNING,
			STATE_PAUSE
		};
	#endif
		//--------------------------------------------------------------------
#endif

	class D9System : public CoreSystem
	{
	public:
	
		/*
			Constructor.
		*/
		D9System();
	
		/*
			Destructor.
		*/
		virtual ~D9System();

		bool initSystem(LPCSTR name, USHORT width, USHORT height);
		void run();

		virtual bool init() = 0;
		virtual void update() = 0;
		virtual void render() = 0;
	
		//----------------------------------------
		//	Sprite Rendering
		//----------------------------------------

		void drawSprite(const D9Texture & texture, const D3DXVECTOR3 * position)
		{
			m_renderer->draw(texture, NULL, NULL, position, whiteColor);
		}
		//--------------------------------------------------------------------

		void drawSprite(const D9Texture & texture, const RECT * srcRect, const D3DXVECTOR3 * center, const D3DXVECTOR3 * position, D3DCOLOR color)
		{
			m_renderer->draw(texture, srcRect, center, position, color);
		}
		//--------------------------------------------------------------------		
		
		//----------------------------------------
		//	Text Rendering
		//----------------------------------------

		void drawText(int x, int y, LPCTSTR message)
		{
			m_fontSystem->drawText(x, y, message);
		}
		//--------------------------------------------------------------------	

		void drawText(RECT &rect, LPCTSTR message)
		{
			m_fontSystem->drawText(rect, message);
		}
		//--------------------------------------------------------------------	

		void drawText(const D3DXVECTOR2 &position, LPCTSTR message)
		{
			m_fontSystem->drawText((int)position.x, (int)position.y, message);
		}
		//--------------------------------------------------------------------	

		void drawFormattedText(int x, int y, LPCTSTR format, ...);
		//--------------------------------------------------------------------	

		//----------------------------------------
		//	Line Rendering
		//----------------------------------------
		
	#ifdef RENDER_LINE
		virtual void renderLines() = 0;

		void renderLineList(D3DXVECTOR2 * lineVertices, int lineCount, const D3DCOLOR &color = whiteColor)
		{
			m_renderer->renderLineList(lineVertices, lineCount, color);
		}
		//--------------------------------------------------------------------
	#endif

		//----------------------------------------
		//	DXUT GUI
		//----------------------------------------
		
#ifndef NO_DXUT
		bool initGUI();

		CDXUTControl * getControl(int ID)
		{
			return m_dialog.GetControl(ID);
		}
		//--------------------------------------------------------------------

		CDXUTButton * addButton(int ID, CHAR * text, int x, int y, int width = GUI_BUTTON_WIDTH, int height = GUI_BUTTON_HEIGHT, UINT hotKey = 0U)
		{
			CDXUTButton * created = nullptr;
			m_dialog.AddButton(ID, text, x, y, width, height, hotKey, false, &created);
			return created;
		}
		//--------------------------------------------------------------------

		CDXUTComboBox * addComboBox(int ID, int x, int y, int width = 128, int height = 24, UINT hotKey = 0U)
		{
			CDXUTComboBox * created = nullptr;
			m_dialog.AddComboBox(ID, x, y, width, height, hotKey, false, &created);
			return created;
		}
		//--------------------------------------------------------------------

		CDXUTSlider * addSlider(int ID, int min, int max, int value, int x, int y, int width = GUI_SLIDER_WIDTH, int height = GUI_SLIDER_HEIGHT)
		{
			CDXUTSlider * created = nullptr;
			m_dialog.AddSlider(ID, x, y, width, height, min, max, value, false, &created);
			return created;
		}
		//--------------------------------------------------------------------

#ifdef USE_DEFAULT_GUI
	#ifndef NO_CONTROL_BUTTON
		CDXUTButton * m_controlButton;

		//virtual void start() = 0;
		//virtual void reset() = 0;
	#endif
	#ifndef NO_PAUSE_BUTTON
		CDXUTButton * m_pauseButton;
	#endif
		SYSTEM_STATE m_systemState;

		void CALLBACK defaultGUIEvent(UINT eventID, int controlID, CDXUTControl * control, void * userContext);
		//--------------------------------------------------------------------
#endif
		virtual void CALLBACK guiEvent(UINT eventID, int controlID, CDXUTControl * control, void * userContext);
#endif
		
	private:

		D9Renderer * m_renderer;
		D9Font * m_fontSystem;
		//--------------------------------------------------------------------

		D3DXMATRIX m_matrix, m_identity, m_current;
		//--------------------------------------------------------------------
		
		//----------------------------------------
		//	DXUT GUI
		//----------------------------------------
		
#ifndef NO_DXUT
		CDXUTDialogResourceManager * m_dialogResourceManager;
		CDXUTDialog m_dialog;
		//--------------------------------------------------------------------
#endif

		/*
			This function is called to handle messages from window procedure.
		*/
		virtual LRESULT messageHandler(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam);
		//--------------------------------------------------------------------

	};
	//--------------------------------------------------------------------
}
//--------------------------------------------------------------------

#endif