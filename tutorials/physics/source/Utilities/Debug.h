//--------------------------------------------------------------------
//
//	Debug.h
//
//	Sora Development
//


/**	Revision History

		Rev	1.0		16 Mar 2010		Define basic functions
			1.01	28 Jan 2012		Change to inline functions
			1.02	21 Dec 2012		Add Log file

*/

#ifndef _SORA_DEBUG_H
#define _SORA_DEBUG_H

#include <cstdio>
#include <cstdarg>

#ifdef _DEBUG

	//	This directive enable name of the file and the line number where the leaked memory is first allocated.
	//	For CRT malloc function
	#define _CRTDBG_MAP_ALLOC
	#include <crtdbg.h>

	//	For C++ new operator
	#ifndef DBG_NEW
		#define DBG_NEW new ( _NORMAL_BLOCK , __FILE__ , __LINE__ )
		#define new DBG_NEW
	#endif

#endif
//--------------------------------------------------------------------

namespace sora 
{
	/*
		This function is called to print out message on the console.
		print "\n" explicitly.
	*/
	#ifdef UNICODE
		#define outputMsg outputMsgW 
	#else
		#define outputMsg outputMsgA
	#endif
	//--------------------------------------------------------------------

	inline void outputMsgA(const char * const format, ...) 
	{
		va_list args; 
		va_start(args, format);
		vprintf(format, args); 
		va_end(args);
	}
	//--------------------------------------------------------------------

	inline void outputMsgW(const wchar_t * const format, ...) 
	{ 
		va_list args; 
		va_start(args, format);
		vwprintf(format, args);
		va_end(args);
	}
	//--------------------------------------------------------------------

	#ifdef _DEBUG

		/*
			This function is called to print out message on DEBUG version only.
			print "\n" explicitly.
		*/
		#ifdef UNICODE
			#define debugMsg outputMsgW 
		#else
			#define debugMsg outputMsgA
		#endif

		/*
			This function is called to detect memory leaks.
			Call this function only once in a project.
		*/
		inline void detectMemoryLeak() 
		{
			_CrtSetDbgFlag(_CRTDBG_ALLOC_MEM_DF | _CRTDBG_LEAK_CHECK_DF);
		}
		//--------------------------------------------------------------------

		/*
			This function is called to dump memory statistics at the moment.
		*/
		inline void dumpMemoryStatistics() 
		{
			_CrtMemState state;
			_CrtMemCheckpoint(&state);
			_CrtMemDumpStatistics(&state);
		}
		//--------------------------------------------------------------------

	#else

		#define debugMsg
		#define debugMsgW 
		#define debugMsgA

		#define detectMemoryLeak()

		#define dumpMemoryStatistics()

	#endif
	//--------------------------------------------------------------------
}
//--------------------------------------------------------------------

#endif