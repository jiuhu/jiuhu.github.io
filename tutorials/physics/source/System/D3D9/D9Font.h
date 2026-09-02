//--------------------------------------------------------------------
//
//	D9Font.h
//
//	Sora Development
//


/**	Revision History

		Rev 26 Oct 2010		Define D9Font class

*/


#ifndef _SORA_D9FONT_H
#define _SORA_D9FONT_H

#ifndef _SORA_SORAD9_H
	#include "SoraD9.h"
#endif
//--------------------------------------------------------------------

namespace sora
{
	class D9Font
	{
	public:

		D9Font::D9Font()
			:	m_font(nullptr)
		{	/*	Empty	*/	}
		//--------------------------------------------------------------------

		D9Font::D9Font(LPDIRECT3DDEVICE9 d3dDevice, LPCTSTR faceName, int size, bool bold = false, bool italic = false)
		{
			create(d3dDevice, faceName, size, bold, italic);
		}
		//--------------------------------------------------------------------

		D9Font::~D9Font()
		{
			safeRelease((LPUNKNOWN *)&m_font);
		}
		//--------------------------------------------------------------------

		bool create(LPDIRECT3DDEVICE9 d3dDevice, LPCTSTR faceName, int size, bool bold = false, bool italic = false);
		//--------------------------------------------------------------------

		void preloadText(const char * const message)
		{
			m_font->PreloadText(message, strlen(message));
		}
		//--------------------------------------------------------------------

		void drawText(LPCTSTR message, D3DCOLOR color = whiteColor)
		{
			m_font->DrawText(g_fontSprite, message, -1, &m_fontRC, 0, color);
		}
		//--------------------------------------------------------------------

		void drawText(int x, int y, LPCTSTR message, D3DCOLOR color = whiteColor)
		{
			int count = strlen(message);
			setFontRC(x, y, count * 20, 20);
			m_font->DrawText(g_fontSprite, message, count, &m_fontRC, 0, color);
		}
		//--------------------------------------------------------------------

		void drawText(RECT &rect, LPCTSTR message, D3DCOLOR color = whiteColor)
		{
			m_font->DrawText(g_fontSprite, message, -1, &rect, 0, color);
		}
		//--------------------------------------------------------------------

		void drawFormattedText(int x, int y, LPCTSTR format, ...);
		void drawFormattedText(int x, int y, D3DCOLOR color, LPCTSTR format, ...);
		//--------------------------------------------------------------------
		
		void setFontRC(int x, int y, int width, int height)
		{
			m_fontRC.set(x, y, x + width, y + height);
		}
		//--------------------------------------------------------------------
		
		void lost()
		{
			m_font->OnLostDevice();
		}
		//--------------------------------------------------------------------
		
		void reset()
		{
			m_font->OnResetDevice();
		}
		//--------------------------------------------------------------------

		/*
		Set reference to a given sprite.
		*/
		static void setSprite(LPD3DXSPRITE sprite)
		{
			g_fontSprite = sprite;
		}
		//--------------------------------------------------------------------

	private:
		//	Reference to the texture.
		LPD3DXFONT m_font;

		SoraRC m_fontRC;

		static LPD3DXSPRITE g_fontSprite;
	};
	//--------------------------------------------------------------------
}
//--------------------------------------------------------------------
#endif