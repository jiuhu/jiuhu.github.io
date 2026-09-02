//--------------------------------------------------------------------
//
//	D9Texture.h
//
//	Sora Development
//


/**	Revision History

		Rev 1.0		25 Jun 2010		Define D9Texture class
			1.01	20 Mar 2011		Redefine loadTextureFromFile function
			1.1		19 Oct 2013		Modify for JHD9

*/


#ifndef _SORA_D9TEXTURE_H
#define _SORA_D9TEXTURE_H

#ifndef _SORA_SORAD9_H
	#include "SoraD9.h"
#endif
//--------------------------------------------------------------------

namespace sora
{
	class D9Texture
	{
	public:
	
		D9Texture()
			:	m_texture(NULL)
		{
		}
		//--------------------------------------------------------------------

		/*
			Destructor
		*/
		~D9Texture()
		{
			safeRelease((LPUNKNOWN *)&m_texture);
		}
		//--------------------------------------------------------------------

		/*
			This function will load a texture from file.
		*/
		void loadTextureFromFile(LPCTSTR fileName, int width = D3DX_DEFAULT, int height = D3DX_DEFAULT);

		void loadTextureFromResource(int resourceID, int width = D3DX_DEFAULT, int height = D3DX_DEFAULT);

		void loadTextureFromMemory(LPVOID data, UINT size);

		/*
			Return a pointer to the texture.
		*/
		LPDIRECT3DTEXTURE9 getTexture() const
		{
			return m_texture;
		}
		//--------------------------------------------------------------------

	private:

		//	Reference to the texture.
		LPDIRECT3DTEXTURE9 m_texture;

	};
	//--------------------------------------------------------------------
}
//--------------------------------------------------------------------
#endif