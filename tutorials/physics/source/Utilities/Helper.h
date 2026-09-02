//--------------------------------------------------------------------
//
//	Helper.h
//
//	Sora Development
//


/**	Revision History

		Rev 1.0		10 Apr 2011		Define helper
			1.01	22 Apr 2011		Update safeDelete etc function
			1.02	10 Sep 2011		Added copyString function
			1.03	22 Nov 2012		Added file to string function

*/

#ifndef _SORA_HELPER_H
#define _SORA_HELPER_H

#include <string>
#include <sstream>
#include <fstream>
#include <vector>
#include <algorithm>
#include <functional>
#include <fstream>
#include <ctime>

#ifndef _SORA_DEBUG_H
	#include "Debug.h"
#endif
//--------------------------------------------------------------------

namespace sora
{
	/*
		Format a given string
		WARNING! There is no way this macro will clean the memory, use at own risks!
	*/
	#define											\
	formatMessage(strBuffer, format)				\
	{												\
		va_list args;								\
		va_start(args, format);						\
		int size = _vscprintf(format, args) + 1;	\
		strBuffer = new char[size];					\
		vsprintf_s(strBuffer, size, format, args);	\
		va_end(args);								\
	}
	//--------------------------------------------------------------------

	/*
		Random number functions.
	*/
	inline void generateSeed(unsigned int seed = time(0))
	{
		srand(seed);
	}
	//--------------------------------------------------------------------

	inline int randomNumber(int max)
	{
		return rand() % max;
	}
	//--------------------------------------------------------------------

	inline int randomNumber(int min, int max)
	{
		return (rand() % (max - min)) + min;
	}
	//--------------------------------------------------------------------

	/*
		Stream functions.
	*/

	/*
		This function is called to stream a data to a stringstream.
	*/
	template<class T>
	inline void stringToStream(const T &input, std::stringstream &output)
	{	
		output << input;
	}
	//--------------------------------------------------------------------

	/*
		This function is called to stream a data from a stringstream
	*/
	template<class T>
	inline void streamToValue(std::stringstream &input, T &output)
	{	
		input >> output;
	}
	//--------------------------------------------------------------------

	/*
		This function is called to an array of data from a stringstream
	*/
	template<class T>
	inline void streamToArray(std::stringstream &input, T * output, int index)
	{	
		for (int i = 0;i < index; i++)
			input >> output[i];
	}
	//--------------------------------------------------------------------

	/*
		This function is called to read a file into a string.
	*/
	inline void fileToString(const char * const fileName, std::string &buffer)
	{
		std::ifstream fin(fileName);
		buffer.assign((std::istreambuf_iterator<char>(fin)), std::istreambuf_iterator<char>());
	}
	//--------------------------------------------------------------------

	/*
		Memory deallocation functions.
	*/

	/*
		This function is called to safely deallocate a DMA object.
	*/
	template<class T>
	inline void safeDeleteArray(T * &dma) 
	{
	if (dma)
	{
		delete [] dma;
		dma = nullptr;
		}
	}
	//--------------------------------------------------------------------

	/*
		This function is called to safely deallocate a DMA object.
	*/
	template<class T>
	inline void safeDelete(T** &dmaObject) 
	{
	if (*dmaObject)
	{
		delete (*dmaObject);
		(*dmaObject) = nullptr;
		}
	}
	//--------------------------------------------------------------------

	/*
		This function is called to safely deallocate a DMA object.
	*/
	template<class T>
	inline void safeDelete(T * &dmaObject) 
	{
	//if (dmaObject)
	//{
		delete dmaObject;
		dmaObject = nullptr;
	//}
	}
	//--------------------------------------------------------------------

	/*
		This function is called to safely deallocate a pointer to an array of DMA objects.
	*/
	template<class T>
	inline void safeDeleteArray(T** &dmaArray, int size) 
	{
	if (dmaArray)
		{
			for (int i = 0; i < size; i++)
				safeDelete(dmaArray[i]);
			safeDeleteArray(dmaArray);
		}
	}
	//--------------------------------------------------------------------

	/*
		This function is called to safely deallocate a DMA object in a STL container.
	*/
	template<class T>
	inline void deallocateSTL(T * &dmaSTLObject) 
	{
		safeDelete(dmaSTLObject);
	}
	//--------------------------------------------------------------------

	/*
		This function is called to safely deallocate DMA objects in a vector.
	*/
	template<class T>
	inline void deallocateVector(std::vector<T *> &vectorList) 
	{
		//for (std::vector<T *>::iterator it = vectorList.begin(); it != vectorList.end(); ++it)
		//for (auto it = vectorList.begin(); it != vectorList.end(); ++it)
		//	deallocateSTL(*it);
		std::for_each(vectorList.begin(), vectorList.end(), [](T* &t){ deallocateSTL(t); });

		vectorList.clear();
	}
	//--------------------------------------------------------------------

	/*
		This function is defined to delete a DMA object.
	*/
	template<class T>
	struct deleteItem : public std::unary_function<const T *, void> 
	{
		void operator()(const T * state) 
		{ 
			delete state; 
		} 
	};
	//--------------------------------------------------------------------

	/*
		String functions.
	*/

	/*
		This function is called to convert a string to wstring.
	*/

	inline std::wstring stringToWstring(const std::string &input)
	{
		std::wstring output;
		size_t length = input.size() + 1;
		output.resize(length);

		size_t i;
		mbstowcs_s(&i, &output[0], length, &input[0], length);
			
		return output;
	}
	//--------------------------------------------------------------------

	inline void stringToWstring(const std::string &input, std::wstring &output)
	{
		output = stringToWstring(input);
	}
	//--------------------------------------------------------------------

	inline std::string wstringToString(const std::wstring &input)
	{
		std::string output;
		size_t length = input.size() + 1;
		output.resize(length);

		size_t i;
		wcstombs_s(&i, &output[0], length, &input[0], length);
			
		return output;
	}
	//--------------------------------------------------------------------

	inline void wstringToString(const std::wstring &input, std::string &output)
	{
		output = wstringToString(input);
	}
	//--------------------------------------------------------------------

	/*
		This function is called to copy char array.
		WARNING: required manual delete on destString.
	*/
	#ifdef UNICODE
		#define copyString copyStringW 
	#else
		#define copyString copyStringA
	#endif

	inline void copyStringA(char* &destString, const char * const srcString)
	{
		safeDelete(destString);
		size_t size = strlen(srcString) + 1;
		destString = new char[size];
		strcpy_s(destString, size, srcString);
	}
	//--------------------------------------------------------------------

	inline void copyStringW(wchar_t* &destString, const wchar_t * const srcString)
	{
		safeDelete(destString);
		size_t size = wcslen(srcString) + 1;
		destString = new wchar_t[size];
		wcscpy_s(destString, size, srcString);
	}
	//--------------------------------------------------------------------
	
	/*
		Time format functions.
	*/

	/*
		This function is called to split a time value into hour, minute and second.
	*/
	inline void splitTime(unsigned int time, unsigned int &hour, unsigned int &minute, unsigned int &second)
	{
		hour = time / 3600;

		time = time % 3600;
		minute = time / 60;

		second = time % 60;
	}
	//--------------------------------------------------------------------
}
//--------------------------------------------------------------------

#endif