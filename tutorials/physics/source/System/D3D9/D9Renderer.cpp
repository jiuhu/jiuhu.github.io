//--------------------------------------------------------------------
//
//	D9Renderer.cpp
//
//	Sora Development
//


#include "D9Renderer.h"
#include "Utilities/Helper.h"
//--------------------------------------------------------------------

namespace sora
{
	struct COLOR_VERTEX
	{
		FLOAT x, y, z, rhw;
		DWORD color;
	};
	//--------------------------------------------------------------------

	const DWORD D3DFVF_COLOR_VERTEX = D3DFVF_XYZRHW | D3DFVF_DIFFUSE;
	//--------------------------------------------------------------------

	const LPCTSTR aboutMsg = "(C) 2013 SORA Development Studio.\n" \
		"   By Ewe, Yee Seong.\n" \
		"   Powered by Sora D9, featuring DXUT.\n" \
		"\nSpecial thanks to " \
		"\nMicrosoft Visual Studio 2013, Visual C++.\n" \
		"   Microsoft Windows SDK\n" \
		"   Microsoft DirectX SDK (June 2010).\n" \
		"      Direct3D 9\n" \
		"      D3DX utility library\n" \
		"      DXUT GUI\n" \
		"\n\n\n" \
		"(Ctrl + H to close this easter egg.)";
	//--------------------------------------------------------------------

	D9Renderer::D9Renderer()
		:	m_d3dDevice(nullptr),
			m_d3dxSprite(nullptr),
	#ifdef RENDER_LINE
			m_d3dxLine(nullptr),
	#endif
			m_pVB(nullptr)
	{
		D3DXMatrixIdentity(&m_identity);
	}
	//--------------------------------------------------------------------

	D9Renderer::~D9Renderer()
	{
		deallocateVector(m_fontList);
		safeRelease((LPUNKNOWN *)&m_pVB);
	#ifdef RENDER_LINE
		safeRelease((LPUNKNOWN *)&m_d3dxLine);
	#endif
		safeRelease((LPUNKNOWN *)&m_d3dxSprite);
		safeRelease((LPUNKNOWN *)&m_d3dDevice);
	}
	//--------------------------------------------------------------------

	bool D9Renderer::init(const HWND &hWnd)
	{
		LPDIRECT3D9 direct3D9 = Direct3DCreate9(D3D_SDK_VERSION);

		D3DPRESENT_PARAMETERS d3dPP;
		ZeroMemory(&d3dPP, sizeof(d3dPP));

		SoraRC frontBufferRC;
		GetClientRect(hWnd, &frontBufferRC);

		d3dPP.Windowed = true;
		d3dPP.SwapEffect = D3DSWAPEFFECT_DISCARD;
		d3dPP.BackBufferFormat = D3DFMT_X8R8G8B8;
		d3dPP.BackBufferCount = 1;
		d3dPP.BackBufferWidth = frontBufferRC.width();
		d3dPP.BackBufferHeight = frontBufferRC.height();
		d3dPP.hDeviceWindow = hWnd;

		HRESULT hr = direct3D9->CreateDevice(	D3DADAPTER_DEFAULT,
												D3DDEVTYPE_HAL,
												hWnd,
												D3DCREATE_SOFTWARE_VERTEXPROCESSING,
												&d3dPP,
												&m_d3dDevice
												);

		if (FAILED(hr))
		{
			printHRMessage(hr, "direct3D9 CreateDevice");
			return false;
		}

		hr = D3DXCreateSprite(m_d3dDevice, &m_d3dxSprite);

		if (FAILED(hr))
		{
			printHRMessage(hr, "D3DXCreateSprite");
			return false;
		}
		
		D9Font::setSprite(m_d3dxSprite);
		m_fontList.push_back(new D9Font(m_d3dDevice, "Arial", 20));

	#ifdef RENDER_LINE
		hr = D3DXCreateLine(m_d3dDevice, &m_d3dxLine);
		if (FAILED(hr))
		{
			printHRMessage(hr, "D3DXCreateLine");
			return false;
		}
	#endif

		initAbout(d3dPP.BackBufferWidth, d3dPP.BackBufferHeight);
		
	#ifndef NO_DXUT
		hr = m_dialogResourceManager.OnD3D9CreateDevice(m_d3dDevice, m_d3dxSprite);

		if (FAILED(hr))
		{
			printHRMessage(hr, "m_dialogResourceManager OnD3D9CreateDevice");
			return false;
		}

		hr = m_dialogResourceManager.OnD3D9ResetDevice();

		if (FAILED(hr))
		{
			printHRMessage(hr, "m_dialogResourceManager OnD3D9ResetDevice");
			return false;
		}
	#endif

		m_colorBack = D3DCOLOR_XRGB(0, 150, 255);

		return true;
	}
	//--------------------------------------------------------------------

	void D9Renderer::initAbout(int width, int height)
	{
		HRESULT hr = m_d3dDevice->CreateVertexBuffer(	4 * sizeof(COLOR_VERTEX),
														0,
														D3DFVF_COLOR_VERTEX,
														D3DPOOL_DEFAULT,
														&m_pVB,
														NULL
														);

		float w = (float)width;
		float h = (float)height;
		DWORD color = D3DCOLOR_RGBA(95, 95, 95, 128);
		COLOR_VERTEX vertices[] =
		{
			{ 0.0f, 0.0f, 0.0f, 1.0f, color }, // x, y, z, rhw, color
			{ w, 0.0f, 0.0f, 1.0f, color },
			{ 0.0f, h, 0.0f, 1.0f, color },
			{ w, h, 0.0f, 1.0f, color },
		};
		VOID * tmpVertices;
		hr = m_pVB->Lock(0, sizeof(vertices), (void**)&tmpVertices, 0);
		memcpy(tmpVertices, vertices, sizeof(vertices));
		hr = m_pVB->Unlock();

		m_fontAbout = new D9Font(m_d3dDevice, "Tahoma", 30);
		m_fontAbout->preloadText(aboutMsg);
		m_fontAbout->setFontRC(0, 0, width, height);
		m_fontList.push_back(m_fontAbout);

		m_colorAbout = D3DCOLOR_XRGB(255, 255, 0);
	}
	//--------------------------------------------------------------------

	bool D9Renderer::fullscreen(bool isFullscreen)
	{
		LPDIRECT3DSWAPCHAIN9 swapChain;
		HRESULT hr = m_d3dDevice->GetSwapChain(0, &swapChain);
		if (FAILED(hr))
		{
			printHRMessage(hr, "GetSwapChain");
			return false;
		}
		
		D3DPRESENT_PARAMETERS d3dPP;
		hr = swapChain->GetPresentParameters(&d3dPP);
		if (FAILED(hr))
		{
			printHRMessage(hr, "GetPresentParameters");
			return false;
		}

		d3dPP.Windowed = !isFullscreen;
		//d3dPP.BackBufferWidth = 800;
		//d3dPP.BackBufferHeight = 600;
		//d3dPP.FullScreen_RefreshRateInHz = 60;

		std::for_each(m_fontList.begin(), m_fontList.end(), [](D9Font* &font){ font->lost(); });
#ifdef RENDER_LINE
		hr = m_d3dxLine->OnLostDevice();
		if (FAILED(hr))
		{
			printHRMessage(hr, "Device Reset");
		}
#endif
		//m_dialogResourceManager.OnD3D9LostDevice();
		hr = m_d3dxSprite->OnLostDevice();

		hr = m_d3dDevice->Reset(&d3dPP);
		if (FAILED(hr))
		{
			printHRMessage(hr, "Device Reset");
		}

		//hr = m_dialogResourceManager.OnD3D9ResetDevice();
		//if (FAILED(hr))
		//{
		//	printHRMessage(hr, "m_dialogResourceManager OnD3D9ResetDevice");
		//}

		//m_d3dxSprite->OnResetDevice();
		std::for_each(m_fontList.begin(), m_fontList.end(), [](D9Font* &font){ font->reset(); });
#ifdef RENDER_LINE
		m_d3dxLine->OnResetDevice();
#endif

		return (hr == S_OK);
	}
	//--------------------------------------------------------------------

	void D9Renderer::renderAbout()
	{
		m_d3dDevice->SetRenderState(D3DRS_ALPHABLENDENABLE, TRUE);
		m_d3dDevice->SetRenderState(D3DRS_SRCBLEND, D3DBLEND_SRCCOLOR);
		m_d3dDevice->SetRenderState(D3DRS_DESTBLEND, D3DBLEND_SRCCOLOR);

		m_d3dDevice->SetStreamSource(0, m_pVB, 0, sizeof(COLOR_VERTEX));
		m_d3dDevice->SetFVF(D3DFVF_COLOR_VERTEX);
		m_d3dDevice->DrawPrimitive(D3DPT_TRIANGLESTRIP, 0, 2);

		beginSprite();
		m_fontAbout->drawText(aboutMsg, m_colorAbout);
		endSprite();
	}
	//--------------------------------------------------------------------
	
	D9Font * D9Renderer::addFont(LPCTSTR faceName, int size, bool bold, bool italic)	
	{
		D9Font * newFont = new D9Font(m_d3dDevice, faceName, size, bold, italic);
		m_fontList.push_back(newFont);
		return newFont;
	}
	//--------------------------------------------------------------------
}
//--------------------------------------------------------------------