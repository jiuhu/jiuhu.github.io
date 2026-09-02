//--------------------------------------------------------------------
//
//	Singleton.h
//
//	Sora Development
//


/**	Revision History

		Rev	1.0		14 Nov 2013		Define singleton class

*/

#ifndef _SORA_SINGLETON_H
#define _SORA_SINGLETON_H

#ifdef SORA_MULTITHREAD_ENABLE
#include <mutex>
#endif
//--------------------------------------------------------------------

namespace sora 
{
	template<class T>
	class Singleton
	{
	public:

		/*
			Get the instance of the class.
		*/
		static T * get()
		{
			static CleanUp cleanup;
		#ifdef SORA_MULTITHREAD_ENABLE
			std:::lock_guard<mutex> guard(m_mutex);
		#endif
			if (m_instance == nullptr) m_instance = new T();
			return m_instance;
		}

	private:

		static T * m_instance;

	#ifdef SORA_MULTITHREAD_ENABLE
		static std::mutex m_mutex;
	#endif

		Singleton();
		~Singleton();
		Singleton(const Singleton&);
		Singleton& operator=(const Singleton&);

		/*
			USe for automated cleanning.
			Ref: Professional C++
		*/
		friend class CleanUp;
		class CleanUp
		{
		public:
			~CleanUp()
			{
			#ifdef SORA_MULTITHREAD_ENABLE
				std:::lock_guard<mutex> guard(m_mutex);
			#endif
				if (m_instance) delete m_instance;
				m_instance = nullptr;
			}
			//--------------------------------------------------------------------
		};
		//--------------------------------------------------------------------
	};
	//--------------------------------------------------------------------

	template<class T>
	T * Singleton<T>::m_instance = nullptr;

	//std::mutex m_mutex;
}
//--------------------------------------------------------------------

#endif