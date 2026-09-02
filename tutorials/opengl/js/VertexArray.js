'use strict';
(function() {
  const gl = makeGL('cvsVertexArray');
  if (!gl) return;
  const prog = makeProgram(gl, VS_COLOR, FS_COLOR);
  const verts = [-1,-1,0,  1,-1,0,  0,1,0];
  const colors= [0,1,0,  0,0,1,  1,0,0];
  const posBuf = buf(gl, verts);
  const colBuf = buf(gl, colors);
  function draw() {
    gl.clearColor(0,0.5,1,1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog);
    const aspect = gl.canvas.width / gl.canvas.height;
    const proj = stdProj(aspect);
    const view = m4.translate(0,0,-5);
    const mvp  = m4.multiply(proj, view);
    gl.uniformMatrix4fv(gl.getUniformLocation(prog,'uMVP'),false,mvp);
    attrib(gl,prog,'aPos',posBuf,3);
    attrib(gl,prog,'aColor',colBuf,3);
    gl.drawArrays(gl.TRIANGLES,0,3);
  }
  draw();
})();
