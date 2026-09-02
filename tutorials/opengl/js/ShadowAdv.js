'use strict';
(function() {
  const gl = makeGL('cvsShadowAdv', {stencil:true});
  if (!gl) return;
  gl.enable(gl.DEPTH_TEST);

  const progPhong = makeProgram(gl, VS_PHONG, FS_PHONG);
  const progFlat  = makeProgram(gl, VS_FLAT, FS_FLAT);

  const sph = genSphere(1, 24, 24);
  const sphPos=buf(gl,sph.verts), sphNrm=buf(gl,sph.norms), sphIdx=ibuf(gl,sph.idx);

  const B=10;
  const planeV = [
    -B,-B,-B, -B,-B,B,  B,-B,B,  B,-B,-B,
     B,B,-B,  B,-B,-B, -B,-B,-B, -B,B,-B,
    -B,-B,B, -B,B,B,   -B,B,-B,  -B,-B,-B,
     B,-B,B,  B,B,B,    B,B,-B,   B,-B,-B,
  ];
  const planeN = [
    0,1,0, 0,1,0, 0,1,0, 0,1,0,
    0,0,1, 0,0,1, 0,0,1, 0,0,1,
    1,0,0, 1,0,0, 1,0,0, 1,0,0,
    -1,0,0,-1,0,0,-1,0,0,-1,0,0,
  ];
  const planeColors = [
    [0.8,0,0],[0,0.8,0],[0,0,0.8],[0.8,0.8,0],
  ];
  const planeP=buf(gl,planeV), planeNB=buf(gl,planeN);
  const planeI=ibuf(gl,[0,1,2,0,2,3, 4,5,6,4,6,7, 8,9,10,8,10,11, 12,13,14,12,14,15]);

  const state={angle:0};

  function draw(ts) {
    state.angle = ts*0.001;
    const sx = Math.cos(state.angle)*5, sz=Math.sin(state.angle)*5;
    const lp=[0,5,0];

    gl.clearColor(0.2,0.2,0.6,1);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT|gl.STENCIL_BUFFER_BIT);
    const aspect=gl.canvas.width/gl.canvas.height;
    const proj=stdProj(aspect);
    const view=m4.translate(0,0,-20);

    for (let f=0; f<4; f++) {
      gl.useProgram(progPhong);
      const faceModel=m4.identity();
      gl.uniformMatrix4fv(gl.getUniformLocation(progPhong,'uModel'),false,faceModel);
      gl.uniformMatrix4fv(gl.getUniformLocation(progPhong,'uMVP'),false,m4.multiply(proj,m4.multiply(view,faceModel)));
      gl.uniform3fv(gl.getUniformLocation(progPhong,'uLightPos'),lp);
      gl.uniform4f(gl.getUniformLocation(progPhong,'uLightDiffuse'),1,1,1,1);
      const c=planeColors[f];
      gl.uniform3fv(gl.getUniformLocation(progPhong,'uObjectColor'),c);
      attrib(gl,progPhong,'aPos',planeP,3); attrib(gl,progPhong,'aNormal',planeNB,3);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,planeI);
      gl.drawElements(gl.TRIANGLES,6,gl.UNSIGNED_SHORT,f*6*2);
    }

    const sphModel=m4.translate(sx,0,sz);
    gl.useProgram(progPhong);
    gl.uniformMatrix4fv(gl.getUniformLocation(progPhong,'uModel'),false,sphModel);
    gl.uniformMatrix4fv(gl.getUniformLocation(progPhong,'uMVP'),false,m4.multiply(proj,m4.multiply(view,sphModel)));
    gl.uniform3f(gl.getUniformLocation(progPhong,'uObjectColor'),1,1,1);
    attrib(gl,progPhong,'aPos',sphPos,3); attrib(gl,progPhong,'aNormal',sphNrm,3);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,sphIdx);
    gl.drawElements(gl.TRIANGLES,sph.idx.length,gl.UNSIGNED_SHORT,0);

    const smFloor = m4.shadowY0(lp[0], lp[1]+B, lp[2]);
    const smFloorFull = m4.multiply(m4.translate(0,-B,0), m4.multiply(smFloor, m4.translate(sx, B, sz)));
    gl.useProgram(progFlat);
    gl.disable(gl.DEPTH_TEST);
    gl.uniformMatrix4fv(gl.getUniformLocation(progFlat,'uMVP'),false,m4.multiply(proj,m4.multiply(view,smFloorFull)));
    gl.uniform3f(gl.getUniformLocation(progFlat,'uColor'),0.15,0.15,0.15);
    attrib(gl,progFlat,'aPos',sphPos,3);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,sphIdx);
    gl.drawElements(gl.TRIANGLES,sph.idx.length,gl.UNSIGNED_SHORT,0);
    gl.enable(gl.DEPTH_TEST);
  }

  function frame(ts) {
    draw(ts);
    requestAnimationFrame(frame);
  }
  frame(0);
})();
