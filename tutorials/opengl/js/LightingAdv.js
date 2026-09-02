'use strict';
(function() {
  const gl = makeGL('cvsLightingAdv');
  if (!gl) return;
  gl.enable(gl.DEPTH_TEST);

  const prog = makeProgram(gl, VS_PHONG_SPOT, FS_PHONG_SPOT);
  const progFlat = makeProgram(gl, VS_FLAT, FS_FLAT);

  const sph = genSphere(1, 20, 20);
  const sphPos = buf(gl,sph.verts), sphNrm = buf(gl,sph.norms), sphIdx = ibuf(gl,sph.idx);
  const lsph = genSphere(0.1, 6, 6);
  const lsphPos = buf(gl,lsph.verts), lsphIdx = ibuf(gl,lsph.idx);

  const state = {h:0, v:0, lp:[0,0,3], cutoff:30, shape:1};

  function draw() {
    gl.clearColor(0,0.5,1,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const aspect = gl.canvas.width / gl.canvas.height;
    const proj = stdProj(aspect);
    const base = m4.translate(0,0,-5);
    const model = m4.multiply(m4.rotateY(state.h*Math.PI/180), m4.rotateX(state.v*Math.PI/180));
    const mvp = m4.multiply(proj, m4.multiply(base, model));
    const lp = state.lp;

    gl.useProgram(prog);
    gl.uniformMatrix4fv(gl.getUniformLocation(prog,'uMVP'),false,mvp);
    gl.uniformMatrix4fv(gl.getUniformLocation(prog,'uModel'),false,model);
    gl.uniform3fv(gl.getUniformLocation(prog,'uLightPos'),lp);
    gl.uniform3f(gl.getUniformLocation(prog,'uLightDir'),0,0,-1);
    gl.uniform1f(gl.getUniformLocation(prog,'uCutoff'),Math.cos(state.cutoff*Math.PI/180));
    gl.uniform4f(gl.getUniformLocation(prog,'uDiffuse0'),0.2,1,1,1);
    gl.uniform4f(gl.getUniformLocation(prog,'uDiffuse1'),0.2,1,0,1);
    gl.uniform3f(gl.getUniformLocation(prog,'uLight1Pos'),0,5,0);
    attrib(gl,prog,'aPos',sphPos,3); attrib(gl,prog,'aNormal',sphNrm,3);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,sphIdx);
    gl.drawElements(gl.TRIANGLES,sph.idx.length,gl.UNSIGNED_SHORT,0);

    const lmvp = m4.multiply(proj, m4.multiply(base, m4.translate(lp[0],lp[1],lp[2])));
    gl.useProgram(progFlat);
    gl.uniformMatrix4fv(gl.getUniformLocation(progFlat,'uMVP'),false,lmvp);
    gl.uniform3f(gl.getUniformLocation(progFlat,'uColor'),1,1,0);
    attrib(gl,progFlat,'aPos',lsphPos,3);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,lsphIdx);
    gl.drawElements(gl.TRIANGLES,lsph.idx.length,gl.UNSIGNED_SHORT,0);
  }
  draw();
  document.getElementById('cvsLightingAdv').addEventListener('keydown', e => {
    switch(e.key) {
      case 'a': case 'A': state.h+=10; break;
      case 'd': case 'D': state.h-=10; break;
      case 's': case 'S': state.v+=10; break;
      case 'w': case 'W': state.v-=10; break;
      case ',': state.cutoff=Math.max(0,state.cutoff-1); break;
      case '.': state.cutoff=Math.min(90,state.cutoff+1); break;
      case 'j': case 'J': state.lp[0]-=1; break;
      case 'l': case 'L': state.lp[0]+=1; break;
      case 'i': case 'I': state.lp[1]+=1; break;
      case 'k': case 'K': state.lp[1]-=1; break;
    }
    draw();
    e.preventDefault();
  });
})();
