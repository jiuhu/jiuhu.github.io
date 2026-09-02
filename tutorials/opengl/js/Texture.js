'use strict';
(function() {
  const gl = makeGL('cvsTexture');
  if (!gl) return;
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);

  const prog = makeProgram(gl, VS_TEX, FS_TEX);
  const tex = makeCheckerTex(gl, 64, [200,160,80], [60,40,10]);

  const qVerts = [
    -1,-1,0,  0,0,  0,0,1,
     1,-1,0,  1,0,  0,0,1,
     1, 1,0,  1,1,  0,0,1,
    -1, 1,0,  0,1,  0,0,1,
  ];
  const qPos=[], qUV=[], qNrm=[];
  for (let i=0; i<4; i++) {
    const b=i*8;
    qPos.push(qVerts[b],qVerts[b+1],qVerts[b+2]);
    qUV.push(qVerts[b+3],qVerts[b+4]);
    qNrm.push(qVerts[b+5],qVerts[b+6],qVerts[b+7]);
  }
  const qPBuf = buf(gl,qPos), qUBuf = buf(gl,qUV), qNBuf = buf(gl,qNrm);
  const qIdx = ibuf(gl,[0,1,2, 0,2,3]);

  function draw() {
    gl.clearColor(0,0.5,1,1);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.useProgram(prog);
    const aspect = gl.canvas.width/gl.canvas.height;
    const proj = stdProj(aspect);
    const base = m4.translate(0,0,-5);
    const model = m4.rotateY(60*Math.PI/180);
    const mvp = m4.multiply(proj, m4.multiply(base, model));
    gl.uniformMatrix4fv(gl.getUniformLocation(prog,'uMVP'),false,mvp);
    gl.uniformMatrix4fv(gl.getUniformLocation(prog,'uModel'),false,model);
    gl.uniform3f(gl.getUniformLocation(prog,'uLightPos'),0,0,3);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.uniform1i(gl.getUniformLocation(prog,'uTex'),0);
    attrib(gl,prog,'aPos',qPBuf,3);
    attrib(gl,prog,'aUV',qUBuf,2);
    attrib(gl,prog,'aNormal',qNBuf,3);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,qIdx);
    gl.drawElements(gl.TRIANGLES,6,gl.UNSIGNED_SHORT,0);
  }
  draw();
})();
