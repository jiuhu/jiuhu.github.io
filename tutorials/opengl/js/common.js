'use strict';

// ---------------------------------------------------------------------------
// Minimal mat4 library (column-major, same convention as OpenGL)
// ---------------------------------------------------------------------------
const m4 = {
  identity() {
    return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
  },
  multiply(a, b) {
    const r = new Float32Array(16);
    for (let row = 0; row < 4; row++)
      for (let col = 0; col < 4; col++)
        for (let k = 0; k < 4; k++)
          r[col*4+row] += a[k*4+row] * b[col*4+k];
    return r;
  },
  translate(tx, ty, tz) {
    const m = m4.identity();
    m[12]=tx; m[13]=ty; m[14]=tz;
    return m;
  },
  rotateX(rad) {
    const c=Math.cos(rad), s=Math.sin(rad), m=m4.identity();
    m[5]=c; m[6]=s; m[9]=-s; m[10]=c;
    return m;
  },
  rotateY(rad) {
    const c=Math.cos(rad), s=Math.sin(rad), m=m4.identity();
    m[0]=c; m[2]=-s; m[8]=s; m[10]=c;
    return m;
  },
  rotateZ(rad) {
    const c=Math.cos(rad), s=Math.sin(rad), m=m4.identity();
    m[0]=c; m[1]=s; m[4]=-s; m[5]=c;
    return m;
  },
  scale(sx, sy, sz) {
    const m=m4.identity();
    m[0]=sx; m[5]=sy; m[10]=sz;
    return m;
  },
  frustum(l, r, b, t, n, f) {
    const m = new Float32Array(16);
    m[0]  = 2*n/(r-l);
    m[5]  = 2*n/(t-b);
    m[8]  = (r+l)/(r-l);
    m[9]  = (t+b)/(t-b);
    m[10] = -(f+n)/(f-n);
    m[11] = -1;
    m[14] = -2*f*n/(f-n);
    return m;
  },
  perspective(fovY, aspect, near, far) {
    const t = near * Math.tan(fovY * 0.5);
    return m4.frustum(-t*aspect, t*aspect, -t, t, near, far);
  },
  lookAt(eye, center, up) {
    const z = norm3(sub3(eye, center));
    const x = norm3(cross3(up, z));
    const y = cross3(z, x);
    const m = m4.identity();
    m[0]=x[0]; m[1]=y[0]; m[2]=z[0];
    m[4]=x[1]; m[5]=y[1]; m[6]=z[1];
    m[8]=x[2]; m[9]=y[2]; m[10]=z[2];
    m[12]=-dot3(x,eye); m[13]=-dot3(y,eye); m[14]=-dot3(z,eye);
    return m;
  },
  normalMat3(m) {
    return new Float32Array([m[0],m[1],m[2], m[4],m[5],m[6], m[8],m[9],m[10]]);
  },
  shadowY0(lx, ly, lz) {
    const m = new Float32Array(16);
    m[0]=ly;  m[1]=0;  m[2]=0;  m[3]=0;
    m[4]=-lx; m[5]=0;  m[6]=-lz;m[7]=-1;
    m[8]=0;   m[9]=0;  m[10]=ly;m[11]=0;
    m[12]=0;  m[13]=0; m[14]=0; m[15]=ly;
    return m;
  },
};

function sub3(a,b){ return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; }
function cross3(a,b){ return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }
function dot3(a,b){ return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
function norm3(v){ const l=Math.sqrt(dot3(v,v)); return [v[0]/l,v[1]/l,v[2]/l]; }

// ---------------------------------------------------------------------------
// WebGL helpers
// ---------------------------------------------------------------------------
function makeGL(id, opts) {
  const canvas = document.getElementById(id);
  if (!canvas) return null;
  const gl = canvas.getContext('webgl', opts || {}) ||
             canvas.getContext('experimental-webgl', opts || {});
  if (!gl) { canvas.parentElement.querySelector('.demo-label').textContent += ' (no WebGL)'; }
  return gl;
}

function compileShader(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

function makeProgram(gl, vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, compileShader(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compileShader(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  return p;
}

function buf(gl, data) {
  const b = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  return b;
}

function ibuf(gl, data) {
  const b = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), gl.STATIC_DRAW);
  return b;
}

function attrib(gl, prog, name, buffer, size) {
  const loc = gl.getAttribLocation(prog, name);
  if (loc < 0) return;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
}

// ---------------------------------------------------------------------------
// Geometry generators
// ---------------------------------------------------------------------------
function genSphere(r, latB, lonB) {
  const verts=[], norms=[], uvs=[], idx=[];
  for (let lat=0; lat<=latB; lat++) {
    const th = lat*Math.PI/latB, st=Math.sin(th), ct=Math.cos(th);
    for (let lon=0; lon<=lonB; lon++) {
      const ph = lon*2*Math.PI/lonB;
      const x=Math.cos(ph)*st, y=ct, z=Math.sin(ph)*st;
      verts.push(r*x, r*y, r*z);
      norms.push(x, y, z);
      uvs.push(lon/lonB, lat/latB);
    }
  }
  for (let lat=0; lat<latB; lat++)
    for (let lon=0; lon<lonB; lon++) {
      const a=lat*(lonB+1)+lon, b=a+lonB+1;
      idx.push(a,b,a+1, b,b+1,a+1);
    }
  return {verts,norms,uvs,idx};
}

function genCylinder(r, h, segs) {
  const verts=[], norms=[], idx=[];
  for (let i=0; i<=segs; i++) {
    const a=i*2*Math.PI/segs, x=Math.cos(a), z=Math.sin(a);
    verts.push(r*x, 0, r*z,   r*x, h, r*z);
    norms.push(x, 0, z,   x, 0, z);
  }
  for (let i=0; i<segs; i++) {
    const a=i*2, b=a+1, c=a+2, d=a+3;
    idx.push(a,b,c, b,d,c);
  }
  return {verts,norms,idx};
}

function cubeVerts() {
  return {
    verts: new Float32Array([
      // bottom y=-1 (white)
      -1,-1, 1,  0,-1,0,  1,-1, 1,  0,-1,0,  1,-1,-1, 0,-1,0, -1,-1,-1, 0,-1,0,
      // top y=+1 (white)
       1, 1, 1,  0,1,0, -1, 1, 1,  0,1,0, -1, 1,-1, 0,1,0,  1, 1,-1,  0,1,0,
      // left x=-1 (black)
      -1, 1, 1, -1,0,0, -1,-1, 1, -1,0,0, -1,-1,-1,-1,0,0, -1, 1,-1, -1,0,0,
      // right x=+1 (blue)
       1,-1, 1,  1,0,0,  1, 1, 1,  1,0,0,  1, 1,-1, 1,0,0,  1,-1,-1,  1,0,0,
      // front z=+1 (green)
      -1, 1, 1,  0,0,1,  1, 1, 1,  0,0,1,  1,-1, 1, 0,0,1, -1,-1, 1,  0,0,1,
      // back z=-1 (red)
      -1,-1,-1,  0,0,-1, 1,-1,-1,  0,0,-1, 1, 1,-1, 0,0,-1,-1, 1,-1,  0,0,-1,
    ]),
    colors: [
      1,1,1, 1,1,1, 1,1,1, 1,1,1,
      1,1,1, 1,1,1, 1,1,1, 1,1,1,
      0,0,0, 0,0,0, 0,0,0, 0,0,0,
      0,0,1, 0,0,1, 0,0,1, 0,0,1,
      0,1,0, 0,1,0, 0,1,0, 0,1,0,
      1,0,0, 1,0,0, 1,0,0, 1,0,0,
    ],
    idx: [],
  };
}

function cubeIndices() {
  const idx=[];
  for (let f=0; f<6; f++) {
    const b=f*4;
    idx.push(b,b+1,b+2, b,b+2,b+3);
  }
  return idx;
}

// ---------------------------------------------------------------------------
// Shaders
// ---------------------------------------------------------------------------
const VS_COLOR = `
attribute vec3 aPos;
attribute vec3 aColor;
uniform mat4 uMVP;
varying vec3 vColor;
void main() {
  vColor = aColor;
  gl_Position = uMVP * vec4(aPos, 1.0);
}`;
const FS_COLOR = `
precision mediump float;
varying vec3 vColor;
void main() { gl_FragColor = vec4(vColor, 1.0); }`;

const VS_COLOR_ALPHA = `
attribute vec3 aPos;
attribute vec4 aColor;
uniform mat4 uMVP;
varying vec4 vColor;
void main() {
  vColor = aColor;
  gl_Position = uMVP * vec4(aPos, 1.0);
}`;
const FS_COLOR_ALPHA = `
precision mediump float;
varying vec4 vColor;
void main() { gl_FragColor = vColor; }`;

const VS_FLAT = `
attribute vec3 aPos;
uniform mat4 uMVP;
uniform vec3 uColor;
void main() { gl_Position = uMVP * vec4(aPos, 1.0); }`;
const FS_FLAT = `
precision mediump float;
uniform vec3 uColor;
void main() { gl_FragColor = vec4(uColor, 1.0); }`;

const VS_FLAT_ALPHA = `
attribute vec3 aPos;
uniform mat4 uMVP;
void main() { gl_Position = uMVP * vec4(aPos, 1.0); }`;
const FS_FLAT_ALPHA = `
precision mediump float;
uniform vec4 uColor;
void main() { gl_FragColor = uColor; }`;

const VS_PHONG = `
attribute vec3 aPos;
attribute vec3 aNormal;
uniform mat4 uMVP;
uniform mat4 uModel;
varying vec3 vNormal;
varying vec3 vFragPos;
void main() {
  vFragPos = (uModel * vec4(aPos, 1.0)).xyz;
  vNormal  = mat3(uModel[0].xyz, uModel[1].xyz, uModel[2].xyz) * aNormal;
  gl_Position = uMVP * vec4(aPos, 1.0);
}`;
const FS_PHONG = `
precision mediump float;
varying vec3 vNormal;
varying vec3 vFragPos;
uniform vec3 uLightPos;
uniform vec4 uLightDiffuse;
uniform vec3 uObjectColor;
void main() {
  vec3 n   = normalize(vNormal);
  vec3 l   = normalize(uLightPos - vFragPos);
  float d  = max(dot(n, l), 0.0);
  vec3 col = uObjectColor * (0.05 + d * uLightDiffuse.rgb);
  gl_FragColor = vec4(col, 1.0);
}`;

const VS_PHONG_SPOT = `
attribute vec3 aPos;
attribute vec3 aNormal;
uniform mat4 uMVP;
uniform mat4 uModel;
varying vec3 vNormal;
varying vec3 vFragPos;
void main() {
  vFragPos = (uModel * vec4(aPos, 1.0)).xyz;
  vNormal  = mat3(uModel[0].xyz, uModel[1].xyz, uModel[2].xyz) * aNormal;
  gl_Position = uMVP * vec4(aPos, 1.0);
}`;
const FS_PHONG_SPOT = `
precision mediump float;
varying vec3 vNormal;
varying vec3 vFragPos;
uniform vec3 uLightPos;
uniform vec3 uLightDir;
uniform float uCutoff;
uniform vec4 uDiffuse0;
uniform vec4 uDiffuse1;
uniform vec3 uLight1Pos;
void main() {
  vec3 n  = normalize(vNormal);
  vec3 l  = normalize(uLightPos - vFragPos);
  float cosA = dot(-l, normalize(uLightDir));
  float spot = (cosA > uCutoff) ? max(dot(n,l),0.0) : 0.0;
  vec3 l1 = normalize(uLight1Pos - vFragPos);
  float d1 = max(dot(n,l1),0.0);
  vec3 col = vec3(0.05) + spot * uDiffuse0.rgb + d1 * uDiffuse1.rgb;
  gl_FragColor = vec4(col, 1.0);
}`;

const VS_TEX = `
attribute vec3 aPos;
attribute vec2 aUV;
attribute vec3 aNormal;
uniform mat4 uMVP;
uniform mat4 uModel;
varying vec2 vUV;
varying vec3 vNormal;
varying vec3 vFragPos;
void main() {
  vUV      = aUV;
  vFragPos = (uModel * vec4(aPos,1.0)).xyz;
  vNormal  = mat3(uModel[0].xyz,uModel[1].xyz,uModel[2].xyz) * aNormal;
  gl_Position = uMVP * vec4(aPos, 1.0);
}`;
const FS_TEX = `
precision mediump float;
varying vec2 vUV;
varying vec3 vNormal;
varying vec3 vFragPos;
uniform sampler2D uTex;
uniform vec3 uLightPos;
void main() {
  vec3 n  = normalize(vNormal);
  vec3 l  = normalize(uLightPos - vFragPos);
  float d = max(dot(n,l), 0.0);
  vec4 tc = texture2D(uTex, vUV);
  gl_FragColor = vec4(tc.rgb * (0.2 + 0.8*d), tc.a);
}`;

// ---------------------------------------------------------------------------
// Procedural texture generators
// ---------------------------------------------------------------------------
function makeCheckerTex(gl, size, c0, c1) {
  const data = new Uint8Array(size*size*4);
  for (let y=0; y<size; y++)
    for (let x=0; x<size; x++) {
      const i=(y*size+x)*4;
      const c = ((x^y)&8) ? c1 : c0;
      data[i]=c[0]; data[i+1]=c[1]; data[i+2]=c[2]; data[i+3]=255;
    }
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,size,size,0,gl.RGBA,gl.UNSIGNED_BYTE,data);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  return t;
}

function makeEarthTex(gl) {
  const size=128, data=new Uint8Array(size*size*4);
  for (let y=0; y<size; y++)
    for (let x=0; x<size; x++) {
      const i=(y*size+x)*4;
      const u=x/size, v=y/size;
      const n = Math.sin(u*20)*Math.sin(v*10);
      const land = n > 0;
      data[i]  = land ? 34  : 30;
      data[i+1]= land ? 139 : 100;
      data[i+2]= land ? 34  : 200;
      data[i+3]=255;
    }
  const t=gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,t);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,size,size,0,gl.RGBA,gl.UNSIGNED_BYTE,data);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  return t;
}

// ---------------------------------------------------------------------------
// Shared projection
// ---------------------------------------------------------------------------
function stdProj(aspect) {
  return m4.frustum(-aspect, aspect, -1, 1, 1, 100);
}
