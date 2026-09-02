//--------------------------------------------------------------------
//
//	D9Font.cpp
//
//	Sora Development
//


#include "D9Font.h"
#include "D9System.h"
#include "Utilities\Helper.h"
//--------------------------------------------------------------------

namespace sora
{
	LPD3DXSPRITE D9Font::g_fontSprite = nullptr;
	//--------------------------------------------------------------------

	bool D9Font::create(LPDIRECT3DDEVICE9 d3dDevice, LPCTSTR faceName, int size, bool bold, bool italic)
	{
		HRESULT hr = D3DXCreateFont(	d3dDevice,
										size,
										0,
										bold,
										1,
										italic,
										DEFAULT_CHARSET,
										OUT_TT_ONLY_PRECIS,
										DEFAULT_QUALITY,
										DEFAULT_PITCH | FF_DONTCARE,
										faceName,
										&m_font
										);

		printHRMessage(hr, "D3DXCreateFont");

		return true;
	}
	//--------------------------------------------------------------------

	void D9Font::drawFormattedText(int x, int y, LPCTSTR format, ...)
	{
		char * strBuffer = nullptr;
		formatMessage(strBuffer, format);

		drawText(x, y, strBuffer);

		delete[] strBuffer;
	}
	//--------------------------------------------------------------------

	void D9Font::drawFormattedText(int x, int y, D3DCOLOR color, LPCTSTR format, ...)
	{
		char * strBuffer = nullptr;
		formatMessage(strBuffer, format);

		drawText(x, y, strBuffer, color);

		delete[] strBuffer;
	}
	//--------------------------------------------------------------------
}
//--------------------------------------------------------------------