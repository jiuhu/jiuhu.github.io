'use strict';
(function() {
  const canvas = document.getElementById('cvsFont');
  const ctx = canvas.getContext('2d');

  function draw() {
    ctx.fillStyle = 'rgb(0,128,255)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    const cx = canvas.width/2, cy = canvas.height/2;

    ctx.font = 'bold 24px Courier New, monospace';
    ctx.fillStyle = 'rgba(204,204,0,1)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Hello World', cx, cy);

    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(120,160,200,0.7)';
    ctx.textAlign = 'center';
    ctx.fillText('wglUseFontBitmaps → canvas fillText', cx, cy + 36);
    ctx.restore();
  }
  draw();
})();
