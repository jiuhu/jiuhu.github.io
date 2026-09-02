'use strict';
(function() {
  const gl = makeGL('cvsCube');
  if (!gl) return;
  gl.enable(gl.DEPTH_TEST);
  const prog = makeProgram(gl, VS_COLOR, FS_COLOR);

  const cInfo = cubeVerts();
  const idxData = cubeIndices();
  const numVerts = 24;
  const posFlat = [], colFlat = [];
  for (let v=0; v<numVerts; v++) {
    posFlat.push(cInfo.verts[v*6], cInfo.verts[v*6+1], cInfo.verts[v*6+2]);
    colFlat.push(cInfo.colors[v*3], cInfo.colors[v*3+1], cInfo.colors[v*3+2]);
  }
  const posBuf = buf(gl, posFlat);
  const colBuf = buf(gl, colFlat);
  const idxBuf = ibuf(gl, idxData);

  const state = {x:0, y:0, z:0, h:0, v:0};
  function draw() {
    gl.clearColor(0,0.5,1,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(prog);
    const aspect = gl.canvas.width / gl.canvas.height;
    const proj = stdProj(aspect);
    const base = m4.translate(0,0,-5);
    const model = m4.multiply(
      m4.translate(state.x, state.y, state.z),
      m4.multiply(m4.rotateY(state.h*Math.PI/180), m4.rotateX(state.v*Math.PI/180))
    );
    const mvp = m4.multiply(proj, m4.multiply(base, model));
    gl.uniformMatrix4fv(gl.getUniformLocation(prog,'uMVP'),false,mvp);
    attrib(gl,prog,'aPos',posBuf,3);
    attrib(gl,prog,'aColor',colBuf,3);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.drawElements(gl.TRIANGLES, idxData.length, gl.UNSIGNED_SHORT, 0);
  }
  draw();
  document.getElementById('cvsCube').addEventListener('keydown', e => {
    switch(e.key) {
      case 'ArrowLeft':  state.x -= 0.1; break;
      case 'ArrowRight': state.x += 0.1; break;
      case 'ArrowUp':    state.y += 0.1; break;
      case 'ArrowDown':  state.y -= 0.1; break;
      case 'PageUp':     state.z += 0.1; break;
      case 'PageDown':   state.z -= 0.1; break;
      case 'a': case 'A': state.h += 10; break;
      case 'd': case 'D': state.h -= 10; break;
      case 's': case 'S': state.v += 10; break;
      case 'w': case 'W': state.v -= 10; break;
    }
    draw();
    e.preventDefault();
  });
})();
