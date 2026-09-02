'use strict';
(function() {
  const gl = makeGL('cvsProjection');
  if (!gl) return;
  const prog = makeProgram(gl, VS_COLOR, FS_COLOR);
  const posBuf = buf(gl, [ 0.5,-0.5,0,  0,0.5,0,  -0.5,-0.5,0 ]);
  const colBuf = buf(gl, [ 1,1,1, 1,1,1, 1,1,1 ]);
  const state = {x:0, y:0, z:0, angle:0};
  function draw() {
    gl.clearColor(0,0.5,1,1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog);
    const aspect = gl.canvas.width / gl.canvas.height;
    const proj = stdProj(aspect);
    const base = m4.translate(0,0,-5);
    const model = m4.multiply(m4.translate(state.x, state.y, state.z),
                              m4.rotateZ(state.angle * Math.PI/180));
    const mvp = m4.multiply(proj, m4.multiply(base, model));
    gl.uniformMatrix4fv(gl.getUniformLocation(prog,'uMVP'),false,mvp);
    attrib(gl,prog,'aPos',posBuf,3);
    attrib(gl,prog,'aColor',colBuf,3);
    gl.drawArrays(gl.TRIANGLES,0,3);
  }
  draw();
  document.getElementById('cvsProjection').addEventListener('keydown', e => {
    switch(e.key) {
      case 'ArrowLeft':  state.x -= 0.1; break;
      case 'ArrowRight': state.x += 0.1; break;
      case 'ArrowUp':    state.y += 0.1; break;
      case 'ArrowDown':  state.y -= 0.1; break;
      case 'PageUp':     state.z += 0.1; break;
      case 'PageDown':   state.z -= 0.1; break;
      case 'a': case 'A': state.angle += 10; break;
      case 's': case 'S': state.angle -= 10; break;
    }
    draw();
    e.preventDefault();
  });
})();
