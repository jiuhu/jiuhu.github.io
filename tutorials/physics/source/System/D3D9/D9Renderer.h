//--------------------------------------------------------------------
//
//	D9Renderer.h
//
//	Sora Development
//


/**	Revision History

		Rev 1.0		26 Oct 2010		Define D9Renderer class

*/


#ifndef _SORA_D9RENDERER_H
#define _SORA_D9RENDERER_H

#include "System\Setting.h"

#ifndef _SORA_WIN_H
	#include "System\SoraWindow.h"
#endif

#ifndef _SORA_D9TEXTURE_H
	#include "D9Texture.h"
#endif

#ifndef _SORA_D9FONT_H
	#include "D9Font.h"
#endif

#ifndef NO_DXUT
	#ifndef DXUT_GUI_H
		#include "DXUT\DXUTgui.h"
	#endif
#endif

#ifndef _SORA_SINGLETON_H
	#include "Utilities\Singleton.h"
#endif

#ifndef _VECTOR_
	#include <vector>
#endif
//--------------------------------------------------------------------

namespace sora
{
	class D9Renderer
	{
	public:
		enum FONT_TYPE
		{
			FONT_SYSTEM = 0,
			FONT_ABOUT
		};
		//--------------------------------------------------------------------

		D9Renderer();
		~D9Renderer();
		//--------------------------------------------------------------------

		bool init(const HWND &hWnd);

		//----------------------------------------
		//	D3D9Device
		//----------------------------------------

		LPDIRECT3DDEVICE9 getDevice() const
		{
			return m_d3dDevice;
		}
		//--------------------------------------------------------------------
		
		void renderBegin()
		{
			m_d3dDevice->Clear(0, NULL, D3DCLEAR_TARGET, m_colorBack, 1.0f, 0);
			m_d3dDevice->BeginScene();
		}
		//--------------------------------------------------------------------

		void renderEnd()
		{
			m_d3dDevice->EndScene();
			m_d3dDevice->Present(NULL, NULL, NULL, NULL);
		}
		//--------------------------------------------------------------------
		
		void renderAbout();
		bool fullscreen(bool isFullscreen);

		//----------------------------------------
		//	D3DXSPRITE
		//----------------------------------------

		/*
			Return the reference to the sprite object.
		*/
		LPD3DXSPRITE getSprite() const
		{
			return m_d3dxSprite;
		}
		//--------------------------------------------------------------------

		void beginSprite()
		{
			resetTransformation();
			m_d3dxSprite->Begin(D3DXSPRITE_ALPHABLEND);
		}
		//--------------------------------------------------------------------

		void endSprite()
		{
			m_d3dxSprite->End();
		}
		//--------------------------------------------------------------------

		void draw(const D9Texture &texture, D3DCOLOR color = whiteColor) const
		{
			m_d3dxSprite->Draw(texture.getTexture(), NULL, NULL, NULL, color);
		}
		//--------------------------------------------------------------------

		void draw(const D9Texture &texture, const D3DXVECTOR3 * position, D3DCOLOR color = whiteColor) const
		{
			m_d3dxSprite->Draw(texture.getTexture(), NULL, NULL, position, color);
		}
		//--------------------------------------------------------------------

		void draw(const D9Texture &texture, const D3DXVECTOR2 * position, D3DCOLOR color = whiteColor) const
		{
			m_d3dxSprite->Draw(texture.getTexture(), NULL, NULL, &D3DXVECTOR3(position->x, position->y, 0.0), color);
		}
		//--------------------------------------------------------------------

		void draw(const D9Texture &texture, const RECT * srcRect, const D3DXVECTOR3 * center, const D3DXVECTOR3 * position, D3DCOLOR color = whiteColor) const
		{
			m_d3dxSprite->Draw(texture.getTexture(), srcRect, center, position, color);
		}
		//--------------------------------------------------------------------

		void draw(const D9Texture &texture, const RECT * srcRect, const D3DXVECTOR3 * center, const D3DXVECTOR2 &translation, float rotation, D3DCOLOR color = whiteColor)
		{
			transformation(translation, rotation);
			m_d3dxSprite->Draw(texture.getTexture(), srcRect, center, NULL, color);
		}
		//--------------------------------------------------------------------

		//----------------------------------------
		//	Sprite Transformation
		//----------------------------------------

		void setTransformation(const D3DXMATRIX &matrix) const
		{
			m_d3dxSprite->SetTransform(&matrix);
		}
		//--------------------------------------------------------------------

		void resetTransformation() const
		{
			m_d3dxSprite->SetTransform(&m_identity);
		}
		//--------------------------------------------------------------------

		void updateTransformation()
		{
			D3DXMATRIX * current;
			m_d3dxSprite->GetTransform(current);
			m_matrix *= (*current);
			m_d3dxSprite->SetTransform(&m_matrix);
		}
		//--------------------------------------------------------------------

		void translation(const D3DXVECTOR2 &translation)
		{
			D3DXMatrixTransformation2D(&m_matrix, NULL, NULL, NULL, NULL, 0.0f, &translation);
			setTransformation(m_matrix);
		}
		//--------------------------------------------------------------------

		void scale(const D3DXVECTOR2 &scale)
		{
			D3DXMatrixTransformation2D(&m_matrix, NULL, NULL, &scale, NULL, NULL, NULL);
			setTransformation(m_matrix);
		}
		//--------------------------------------------------------------------

		void rotation(float rotation, const D3DXVECTOR2 * rotationCenter = NULL)
		{
			D3DXMatrixTransformation2D(&m_matrix, NULL, NULL, NULL, rotationCenter, rotation, NULL);
			setTransformation(m_matrix);
		}
		//--------------------------------------------------------------------

		void transformation(const D3DXVECTOR2 &translation, float rotation, const D3DXVECTOR2 * rotationCenter = NULL)
		{
			D3DXMatrixTransformation2D(&m_matrix, NULL, NULL, NULL, rotationCenter, rotation, &translation);
			setTransformation(m_matrix);
		}
		//--------------------------------------------------------------------

		void transformation(const D3DXVECTOR2 &translation, const D3DXVECTOR2 &scale)
		{
			D3DXMatrixTransformation2D(&m_matrix, NULL, NULL, &scale, NULL, NULL, &translation);
			setTransformation(m_matrix);
		}
		//--------------------------------------------------------------------

		void transformation(const D3DXVECTOR2 &translation, const D3DXVECTOR2 &scale, float rotation, const D3DXVECTOR2 * rotationCenter = NULL)
		{
			D3DXMatrixTransformation2D(&m_matrix, NULL, NULL, &scale, rotationCenter, rotation, &translation);
			setTransformation(m_matrix);
		}
		//--------------------------------------------------------------------

		//----------------------------------------
		//	Text Rendering
		//----------------------------------------

		D9Font * getSystemFont()
		{
			return m_fontList[FONT_SYSTEM];
		}
		//--------------------------------------------------------------------

		D9Font * addFont(LPCTSTR faceName, int size, bool bold = false, bool italic = false);
		//--------------------------------------------------------------------	

		//----------------------------------------
		//	D3DXLINE
		//----------------------------------------
		
	#ifdef RENDER_LINE

		/*
		Return the reference to the line object.
		*/
		LPD3DXLINE getLine() const
		{
			return m_d3dxLine;
		}
		//--------------------------------------------------------------------

		void renderLineList(D3DXVECTOR2 * lineVertices, int lineCount, const D3DCOLOR &color = whiteColor)
		{
			m_d3dxLine->Draw(lineVertices, lineCount, color);
		}
		//--------------------------------------------------------------------
	#endif

		//----------------------------------------
		//	DXUT
		//----------------------------------------
		
	#ifndef NO_DXUT
		CDXUTDialogResourceManager * getDialogResourceManager()
		{
			return &m_dialogResourceManager;
		}
		//--------------------------------------------------------------------	
	#endif

	private:

		LPDIRECT3DDEVICE9 m_d3dDevice;

		//	Reference to the sprite object.
		LPD3DXSPRITE m_d3dxSprite;

		//	A list of references to font objects.
		std::vector<D9Font *> m_fontList;

	#ifdef RENDER_LINE
		//	Reference to the line object.
		LPD3DXLINE m_d3dxLine;
	#endif
		
	#ifndef NO_DXUT
		CDXUTDialogResourceManager m_dialogResourceManager;
	#endif

		D3DXMATRIX m_matrix, m_identity;

		D3DCOLOR m_colorBack;
		//--------------------------------------------------------------------

		LPDIRECT3DVERTEXBUFFER9 m_pVB;
		D9Font * m_fontAbout;
		D3DCOLOR m_colorAbout;
		void initAbout(int width, int height);
		//--------------------------------------------------------------------
	};
	//--------------------------------------------------------------------

	typedef Singleton<D9Renderer> D9RendererInstance;
	//--------------------------------------------------------------------
}
//--------------------------------------------------------------------
#endif