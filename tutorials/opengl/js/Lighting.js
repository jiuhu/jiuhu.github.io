'use strict';
(function() {
  const gl = makeGL('cvsLighting');
  if (!gl) return;
  gl.enable(gl.DEPTH_TEST);

  const prog = makeProgram(gl, VS_PHONG, FS_PHONG);

  const sph = genSphere(1, 20, 20);
  const sphPos = buf(gl, sph.verts);
  const sphNrm = buf(gl, sph.norms);
  const sphIdx = ibuf(gl, sph.idx);

  const cyl = genCylinder(1, 2, 20);
  const cylPos = buf(gl, cyl.verts);
  const cylNrm = buf(gl, cyl.norms);
  const cylIdx = ibuf(gl, cyl.idx);

  const cInfo = cubeVerts(), idxData = cubeIndices();
  const numVerts = 24; const cubeP=[], cubeN=[];
  for (let v=0; v<numVerts; v++) {
    cubeP.push(cInfo.verts[v*6], cInfo.verts[v*6+1], cInfo.verts[v*6+2]);
    cubeN.push(cInfo.verts[v*6+3], cInfo.verts[v*6+4], cInfo.verts[v*6+5]);
  }
  const cubePBuf = buf(gl,cubeP), cubeNBuf = buf(gl,cubeN), cubeIBuf = ibuf(gl,idxData);

  const lsph = genSphere(0.15, 8, 8);
  const lsphPos = buf(gl,lsph.verts), lsphNrm = buf(gl,lsph.norms), lsphIdx = ibuf(gl,lsph.idx);

  const progFlat = makeProgram(gl, VS_FLAT, FS_FLAT);

  const state = {shape:0, h:0, v:0, lp:[0,3,0]};

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
    gl.uniform4f(gl.getUniformLocation(prog,'uLightDiffuse'),0.2,1,1,1);
    gl.uniform3f(gl.getUniformLocation(prog,'uObjectColor'),1,1,1);

    if (state.shape===0) {
      attrib(gl,prog,'aPos',cubePBuf,3); attrib(gl,prog,'aNormal',cubeNBuf,3);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,cubeIBuf);
      gl.drawElements(gl.TRIANGLES,idxData.length,gl.UNSIGNED_SHORT,0);
    } else if (state.shape===1) {
      attrib(gl,prog,'aPos',sphPos,3); attrib(gl,prog,'aNormal',sphNrm,3);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,sphIdx);
      gl.drawElements(gl.TRIANGLES,sph.idx.length,gl.UNSIGNED_SHORT,0);
    } else {
      const mm = m4.multiply(m4.multiply(proj, m4.multiply(base, model)), m4.translate(0,-1,0));
      gl.uniformMatrix4fv(gl.getUniformLocation(prog,'uMVP'),false,mm);
      attrib(gl,prog,'aPos',cylPos,3); attrib(gl,prog,'aNormal',cylNrm,3);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,cylIdx);
      gl.drawElements(gl.TRIANGLES,cyl.idx.length,gl.UNSIGNED_SHORT,0);
    }

    const lmvp = m4.multiply(proj, m4.multiply(base, m4.translate(lp[0],lp[1],lp[2])));
    gl.useProgram(progFlat);
    gl.uniformMatrix4fv(gl.getUniformLocation(progFlat,'uMVP'),false,lmvp);
    gl.uniform3f(gl.getUniformLocation(progFlat,'uColor'),1,1,0);
    attrib(gl,progFlat,'aPos',lsphPos,3);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,lsphIdx);
    gl.drawElements(gl.TRIANGLES,lsph.idx.length,gl.UNSIGNED_SHORT,0);
  }
  draw();
  document.getElementById('cvsLighting').addEventListener('keydown', e => {
    const lp = state.lp;
    switch(e.key) {
      case 't': case 'T': state.shape=(state.shape+1)%3; break;
      case 'a': case 'A': state.h+=10; break;
      case 'd': case 'D': state.h-=10; break;
      case 's': case 'S': state.v+=10; break;
      case 'w': case 'W': state.v-=10; break;
      case 'j': case 'J': lp[0]-=1; break;
      case 'l': case 'L': lp[0]+=1; break;
      case 'i': case 'I': lp[1]+=1; break;
      case 'k': case 'K': lp[1]-=1; break;
      case 'u': case 'U': lp[2]+=1; break;
      case 'o': case 'O': lp[2]-=1; break;
    }
    draw();
    e.preventDefault();
  });
})();
