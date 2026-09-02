'use strict';
(function() {
  const gl = makeGL('cvsShadow', {stencil:true});
  if (!gl) return;
  gl.enable(gl.DEPTH_TEST);

  const progPhong = makeProgram(gl, VS_PHONG, FS_PHONG);
  const progFlat  = makeProgram(gl, VS_FLAT, FS_FLAT);

  const sph = genSphere(0.75, 24, 24);
  const sphPos=buf(gl,sph.verts), sphNrm=buf(gl,sph.norms), sphIdx=ibuf(gl,sph.idx);

  const floorV = [-5,0,-5, -5,0,5, 5,0,5, 5,0,-5];
  const floorN = [0,1,0, 0,1,0, 0,1,0, 0,1,0];
  const floorP=buf(gl,floorV), floorNB=buf(gl,floorN), floorI=ibuf(gl,[0,1,2,0,2,3]);

  const state = {lp:[-10,10,0], stencil:false};

  function draw() {
    gl.clearColor(0.2,0.2,0.6,1);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT|gl.STENCIL_BUFFER_BIT);
    const aspect=gl.canvas.width/gl.canvas.height;
    const proj=stdProj(aspect);
    const view=m4.lookAt([0,5,5],[0,0,0],[0,1,0]);
    const lp=state.lp;

    gl.useProgram(progPhong);
    const floor_model=m4.identity();
    gl.uniformMatrix4fv(gl.getUniformLocation(progPhong,'uModel'),false,floor_model);
    gl.uniformMatrix4fv(gl.getUniformLocation(progPhong,'uMVP'),false,m4.multiply(proj,m4.multiply(view,floor_model)));
    gl.uniform3fv(gl.getUniformLocation(progPhong,'uLightPos'),lp);
    gl.uniform4f(gl.getUniformLocation(progPhong,'uLightDiffuse'),1,1,1,1);
    gl.uniform3f(gl.getUniformLocation(progPhong,'uObjectColor'),0.6,0.5,0.4);
    attrib(gl,progPhong,'aPos',floorP,3); attrib(gl,progPhong,'aNormal',floorNB,3);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,floorI);
    gl.drawElements(gl.TRIANGLES,6,gl.UNSIGNED_SHORT,0);

    const sph_model=m4.translate(0,2,0);
    gl.uniformMatrix4fv(gl.getUniformLocation(progPhong,'uModel'),false,sph_model);
    gl.uniformMatrix4fv(gl.getUniformLocation(progPhong,'uMVP'),false,m4.multiply(proj,m4.multiply(view,sph_model)));
    gl.uniform3f(gl.getUniformLocation(progPhong,'uObjectColor'),1,1,1);
    attrib(gl,progPhong,'aPos',sphPos,3); attrib(gl,progPhong,'aNormal',sphNrm,3);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,sphIdx);
    gl.drawElements(gl.TRIANGLES,sph.idx.length,gl.UNSIGNED_SHORT,0);

    const shadowMat = m4.shadowY0(lp[0],lp[1],lp[2]);
    const shadow_model = m4.multiply(shadowMat, m4.translate(0,2,0));
    gl.useProgram(progFlat);
    gl.disable(gl.DEPTH_TEST);
    gl.uniformMatrix4fv(gl.getUniformLocation(progFlat,'uMVP'),false,
      m4.multiply(proj,m4.multiply(view,shadow_model)));
    gl.uniform3f(gl.getUniformLocation(progFlat,'uColor'),0.2,0.2,0.2);
    attrib(gl,progFlat,'aPos',sphPos,3);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,sphIdx);
    gl.drawElements(gl.TRIANGLES,sph.idx.length,gl.UNSIGNED_SHORT,0);
    gl.enable(gl.DEPTH_TEST);
  }

  function frame() {
    draw();
    requestAnimationFrame(frame);
  }
  frame();

  document.getElementById('cvsShadow').addEventListener('keydown', e => {
    switch(e.key) {
      case 'ArrowLeft':  state.lp[0]-=0.5; break;
      case 'ArrowRight': state.lp[0]+=0.5; break;
      case 's': case 'S': state.stencil=!state.stencil; break;
    }
    e.preventDefault();
  });
})();
