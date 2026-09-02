'use strict';
(function() {
  const gl = makeGL('cvsTextureBlend');
  if (!gl) return;
  gl.enable(gl.DEPTH_TEST);

  const progPhong = makeProgram(gl, VS_PHONG, FS_PHONG);
  const progTex   = makeProgram(gl, VS_TEX,   FS_TEX);
  const progAlpha = makeProgram(gl, VS_FLAT_ALPHA, FS_FLAT_ALPHA);

  const earthTex = makeEarthTex(gl);

  const sph = genSphere(1, 20, 20);
  const sphPos=buf(gl,sph.verts), sphNrm=buf(gl,sph.norms),
        sphUV=buf(gl,sph.uvs), sphIdx=ibuf(gl,sph.idx);

  const qPos=buf(gl,[-1,-1,3, 1,-1,3, 1,1,3, -1,1,3]);
  const qIdx=ibuf(gl,[0,1,2,0,2,3]);

  const cInfo=cubeVerts(), idxData=cubeIndices();
  const numV=24; const cPos=[], cNrm=[];
  for(let v=0;v<numV;v++){
    cPos.push(cInfo.verts[v*6],cInfo.verts[v*6+1],cInfo.verts[v*6+2]);
    cNrm.push(cInfo.verts[v*6+3],cInfo.verts[v*6+4],cInfo.verts[v*6+5]);
  }
  const cPBuf=buf(gl,cPos), cNBuf=buf(gl,cNrm), cIBuf=ibuf(gl,idxData);

  const state={shape:1,blend:true,h:0,v:0};

  function draw() {
    gl.clearColor(0,0.5,1,1);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const aspect=gl.canvas.width/gl.canvas.height;
    const proj=stdProj(aspect);
    const base=m4.translate(0,0,-5);
    const model=m4.multiply(m4.rotateY(state.h*Math.PI/180),m4.rotateX(state.v*Math.PI/180));
    const mvp=m4.multiply(proj,m4.multiply(base,model));

    if (state.shape===1) {
      gl.useProgram(progTex);
      gl.uniformMatrix4fv(gl.getUniformLocation(progTex,'uMVP'),false,mvp);
      gl.uniformMatrix4fv(gl.getUniformLocation(progTex,'uModel'),false,model);
      gl.uniform3f(gl.getUniformLocation(progTex,'uLightPos'),0,0,3);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D,earthTex);
      gl.uniform1i(gl.getUniformLocation(progTex,'uTex'),0);
      attrib(gl,progTex,'aPos',sphPos,3);
      attrib(gl,progTex,'aUV',sphUV,2);
      attrib(gl,progTex,'aNormal',sphNrm,3);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,sphIdx);
      gl.drawElements(gl.TRIANGLES,sph.idx.length,gl.UNSIGNED_SHORT,0);
    } else {
      gl.useProgram(progPhong);
      gl.uniformMatrix4fv(gl.getUniformLocation(progPhong,'uMVP'),false,mvp);
      gl.uniformMatrix4fv(gl.getUniformLocation(progPhong,'uModel'),false,model);
      gl.uniform3f(gl.getUniformLocation(progPhong,'uLightPos'),0,0,3);
      gl.uniform4f(gl.getUniformLocation(progPhong,'uLightDiffuse'),1,1,1,1);
      gl.uniform3f(gl.getUniformLocation(progPhong,'uObjectColor'),1,0,0);
      attrib(gl,progPhong,'aPos',cPBuf,3); attrib(gl,progPhong,'aNormal',cNBuf,3);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,cIBuf);
      gl.drawElements(gl.TRIANGLES,idxData.length,gl.UNSIGNED_SHORT,0);
    }

    if (state.blend) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }
    gl.useProgram(progAlpha);
    gl.uniformMatrix4fv(gl.getUniformLocation(progAlpha,'uMVP'),false,mvp);
    gl.uniform4f(gl.getUniformLocation(progAlpha,'uColor'),1,0,0, state.blend?0.45:1.0);
    attrib(gl,progAlpha,'aPos',qPos,3);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,qIdx);
    gl.drawElements(gl.TRIANGLES,6,gl.UNSIGNED_SHORT,0);
    if (state.blend) gl.disable(gl.BLEND);
  }
  draw();
  document.getElementById('cvsTextureBlend').addEventListener('keydown', e => {
    switch(e.key) {
      case 'b': case 'B': state.blend=!state.blend; break;
      case 't': case 'T': state.shape=(state.shape+1)%2; break;
      case 'a': case 'A': state.h+=10; break;
      case 'd': case 'D': state.h-=10; break;
      case 's': case 'S': state.v+=10; break;
      case 'w': case 'W': state.v-=10; break;
    }
    draw();
    e.preventDefault();
  });
})();
