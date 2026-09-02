//--------------------------------------------------------------------
//
//	D9Texture.cpp
//
//	Sora Development
//


#include "D9Texture.h"
#include "D9Renderer.h"
//--------------------------------------------------------------------

namespace sora
{
	DWORD colorKey = D3DCOLOR_XRGB(95, 95, 95);
	//--------------------------------------------------------------------

	void D9Texture::loadTextureFromFile(LPCTSTR fileName, int width, int height)
	{
		HRESULT hr = D3DXCreateTextureFromFileEx(	D9RendererInstance::get()->getDevice(),
													fileName, 
													width, 
													height,
													1, 
													0, 
													D3DFMT_A8R8G8B8, 
													D3DPOOL_MANAGED,
													D3DX_DEFAULT, 
													D3DX_DEFAULT, 
													colorKey, 
													NULL, 
													NULL, 
													&m_texture
													);

		printFormattedHRMessage(hr, "D3DXCreateTextureFromFileEx ( %s )", fileName);
	}
	//--------------------------------------------------------------------

	void D9Texture::loadTextureFromResource(int resourceID, int width, int height)
	{
		HRESULT hr = D3DXCreateTextureFromResourceEx(	D9RendererInstance::get()->getDevice(),
														NULL, 
														MAKEINTRESOURCE(resourceID),
														width, 
														height, 
														1, 
														0, 
														D3DFMT_A8R8G8B8, 
														D3DPOOL_MANAGED,
														D3DX_DEFAULT, 
														D3DX_DEFAULT, 
														colorKey, 
														NULL, 
														NULL, 
														&m_texture);

		printFormattedHRMessage(hr, "D3DXCreateTextureFromFileEx ( %d )", resourceID);
	}
	//--------------------------------------------------------------------

	void D9Texture::loadTextureFromMemory(LPVOID data, UINT size)
	{
		HRESULT hr = D3DXCreateTextureFromFileInMemory(	D9RendererInstance::get()->getDevice(),
														data,
														size,
														&m_texture);

		printHRMessage(hr, "loadTextureFromMemory");
	}
	//--------------------------------------------------------------------
}
//--------------------------------------------------------------------