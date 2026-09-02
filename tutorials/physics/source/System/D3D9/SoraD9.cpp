//--------------------------------------------------------------------
//
//	SoraD9.cpp
//
//	Sora Development
//


#include "SoraD9.h"
#include "Utilities\Helper.h"
//--------------------------------------------------------------------

namespace sora
{
	void printHRMessage(HRESULT hr, LPCTSTR message)
	{
		LPVOID lpMsgBuf;
		FormatMessage(	FORMAT_MESSAGE_ALLOCATE_BUFFER | FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_IGNORE_INSERTS,
						NULL,
						hr,
						MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT),
						(LPTSTR)&lpMsgBuf,
						0,
						NULL
						);

		debugMsg("%s : %s\n", message, lpMsgBuf);
	}
	//--------------------------------------------------------------------

	void printFormattedHRMessage(HRESULT hr, LPCTSTR format, ...)
	{
		char * strBuffer = nullptr;
		formatMessage(strBuffer, format);

		printHRMessage(hr, strBuffer);
		delete[] strBuffer;
	}
	//--------------------------------------------------------------------
}
//--------------------------------------------------------------------