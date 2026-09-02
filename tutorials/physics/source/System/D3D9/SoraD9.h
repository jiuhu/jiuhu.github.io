//--------------------------------------------------------------------
//
//	SoraD9.h
//
//	Sora Development
//


/**	Revision History

		Rev 1.0		19 Oct 2013		Define SoraD9

*/

#ifndef _SORA_SORAD9_H
#define _SORA_SORAD9_H

#ifndef __D3DX9_H__

	#define D3D_DEBUG_INFO
	#include <d3dx9.h>
	//--------------------------------------------------------------------

	#pragma comment(lib, "d3d9.lib")
	#pragma comment(lib, "d3dx9.lib")
	//--------------------------------------------------------------------

#endif

namespace sora
{
	inline void safeRelease(LPUNKNOWN * device)
	{
		if ((*device))
		{
			(*device)->Release();
			(*device) = nullptr;
		}
	}
	//--------------------------------------------------------------------

	static const D3DCOLOR whiteColor = D3DCOLOR_XRGB(255, 255, 255);
	//--------------------------------------------------------------------

	void printHRMessage(HRESULT hr, LPCTSTR message);
	//--------------------------------------------------------------------

	void printFormattedHRMessage(HRESULT hr, LPCTSTR format, ...);
	//--------------------------------------------------------------------

	struct SoraRC : public RECT
	{
		SoraRC()
		{
			left = 0;
			top = 0;
			right = 0;
			bottom = 0;
		}
		//--------------------------------------------------------------------

		SoraRC(LONG l, LONG t, LONG r, LONG b)
		{
			left = l;
			top = t;
			right = r;
			bottom = b;
		}
		//--------------------------------------------------------------------

		LONG width() const
		{
			return right - left;
		}
		//--------------------------------------------------------------------

		LONG height() const
		{
			return bottom - top;
		}
		//--------------------------------------------------------------------

		void set(LONG l, LONG t, LONG r, LONG b)
		{
			left = l;
			top = t;
			right = r;
			bottom = b;
		}
		//--------------------------------------------------------------------
	};
	//--------------------------------------------------------------------
}
//--------------------------------------------------------------------

#endif