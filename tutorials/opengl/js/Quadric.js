'use strict';
(function() {
  const gl = makeGL('cvsQuadric');
  if (!gl) return;
  gl.enable(gl.DEPTH_TEST);

  const progColor = makeProgram(gl, VS_COLOR, FS_COLOR);
  const progFlat  = makeProgram(gl, VS_FLAT, FS_FLAT);

  const cInfo = cubeVerts();
  const idxData = cubeIndices();
  const numVerts = 24;
  const posFlat=[], colFlat=[];
  for (let v=0; v<numVerts; v++) {
    posFlat.push(cInfo.verts[v*6], cInfo.verts[v*6+1], cInfo.verts[v*6+2]);
    colFlat.push(cInfo.colors[v*3], cInfo.colors[v*3+1], cInfo.colors[v*3+2]);
  }
  const cubePos = buf(gl, posFlat);
  const cubeCol = buf(gl, colFlat);
  const cubeIdx = ibuf(gl, idxData);

  const sph = genSphere(1, 16, 16);
  const sphPos = buf(gl, sph.verts);
  const sphCol = buf(gl, sph.verts.map((_,i)=>i%3===0?0.8:i%3===1?0.8:0.8));
  const sphIdx = ibuf(gl, sph.idx);

  const cyl = genCylinder(1, 2, 20);
  const cylPos = buf(gl, cyl.verts);
  const cylCol = buf(gl, cyl.verts.map(()=>0.8));
  const cylIdx = ibuf(gl, cyl.idx);

  const state = {shape:0, wire:false, h:0, v:0};

  function draw() {
    gl.clearColor(0,0.5,1,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const aspect = gl.canvas.width / gl.canvas.height;
    const proj = stdProj(aspect);
    const base = m4.translate(0,0,-5);
    const model = m4.multiply(m4.rotateY(state.h*Math.PI/180), m4.rotateX(state.v*Math.PI/180));
    const mvp = m4.multiply(proj, m4.multiply(base, model));

    const prim = state.wire ? gl.LINES : gl.TRIANGLES;

    if (state.shape === 0) {
      gl.useProgram(progColor);
      gl.uniformMatrix4fv(gl.getUniformLocation(progColor,'uMVP'),false,mvp);
      attrib(gl,progColor,'aPos',cubePos,3);
      attrib(gl,progColor,'aColor',cubeCol,3);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIdx);
      gl.drawElements(prim, idxData.length, gl.UNSIGNED_SHORT, 0);
    } else if (state.shape === 1) {
      gl.useProgram(progFlat);
      gl.uniformMatrix4fv(gl.getUniformLocation(progFlat,'uMVP'),false,mvp);
      gl.uniform3f(gl.getUniformLocation(progFlat,'uColor'),0.8,0.8,0.8);
      attrib(gl,progFlat,'aPos',sphPos,3);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphIdx);
      gl.drawElements(prim, sph.idx.length, gl.UNSIGNED_SHORT, 0);
    } else {
      const t2 = m4.multiply(mvp, m4.translate(0,-1,0));
      gl.useProgram(progFlat);
      gl.uniformMatrix4fv(gl.getUniformLocation(progFlat,'uMVP'),false,t2);
      gl.uniform3f(gl.getUniformLocation(progFlat,'uColor'),0.8,0.8,0.8);
      attrib(gl,progFlat,'aPos',cylPos,3);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cylIdx);
      gl.drawElements(prim, cyl.idx.length, gl.UNSIGNED_SHORT, 0);
    }
  }
  draw();
  document.getElementById('cvsQuadric').addEventListener('keydown', e => {
    switch(e.key) {
      case 't': case 'T': state.shape=(state.shape+1)%3; break;
      case 'm': case 'M': state.wire=!state.wire; break;
      case 'a': case 'A': state.h+=10; break;
      case 'd': case 'D': state.h-=10; break;
      case 's': case 'S': state.v+=10; break;
      case 'w': case 'W': state.v-=10; break;
    }
    draw();
    e.preventDefault();
  });
})();
