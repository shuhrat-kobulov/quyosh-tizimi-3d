// The Sun: its surface is drawn live in a GLSL shader from fbm noise, wrapped
// in a Fresnel corona, with billboard glow sprites on top.
import * as THREE from 'three';
import { makeGlowSprite } from '../utils/textures.js';
import { smoothstep } from '../utils/noise.js';

const SIMPLEX = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}

float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

float fbm(vec3 p){
  float f = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++){
    f += a * snoise(p);
    p *= 2.02;
    a *= 0.5;
  }
  return f;
}
`;

export function createSun(radius) {
  const group = new THREE.Group();
  group.name = 'sun';

  /* --- Photosphere --- */
  const coreMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec3 vPos;
      varying vec3 vNormal;
      varying vec3 vView;
      void main(){
        vPos = position;
        vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: SIMPLEX + /* glsl */ `
      uniform float uTime;
      varying vec3 vPos;
      varying vec3 vNormal;
      varying vec3 vView;

      void main(){
        vec3 p = normalize(vPos);

        // Two convection layers: slow large cells plus fast granulation
        float slow = fbm(p * 2.6 + vec3(0.0, uTime * 0.045, 0.0));
        float fast = fbm(p * 7.5 + vec3(uTime * 0.12, 0.0, uTime * 0.09) + slow * 0.7);
        float n = slow * 0.62 + fast * 0.38;
        float heat = smoothstep(-0.55, 0.75, n);

        vec3 deep  = vec3(0.62, 0.11, 0.02);
        vec3 mid   = vec3(1.00, 0.42, 0.06);
        vec3 hot   = vec3(1.00, 0.82, 0.32);
        vec3 white = vec3(1.00, 0.97, 0.86);

        vec3 col = mix(deep, mid, smoothstep(0.0, 0.45, heat));
        col = mix(col, hot, smoothstep(0.4, 0.78, heat));
        col = mix(col, white, smoothstep(0.88, 1.0, heat));

        // Limb darkening - the edges fall off slightly
        float limb = pow(max(dot(normalize(vNormal), normalize(vView)), 0.0), 0.42);
        col *= 0.48 + 0.52 * limb;

        // Hot rim at the edge
        col += vec3(1.0, 0.42, 0.08) * pow(1.0 - limb, 3.0) * 0.45;

        gl_FragColor = vec4(col * 1.06, 1.0);
      }
    `,
  });

  const core = new THREE.Mesh(new THREE.SphereGeometry(radius, 96, 96), coreMat);
  core.userData.key = 'sun';
  group.add(core);

  /* --- Corona --- */
  // On a backside shell a plain Fresnel term puts the brightest point at the
  // outer edge, which reads as a hard-edged bubble. So the curve is inverted:
  // brightness peaks at the photosphere edge and falls to zero outward.
  const CORONA_SCALE = 1.5;
  const rimMin = 1 - Math.sqrt(1 - 1 / (CORONA_SCALE * CORONA_SCALE));

  const coronaMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uRimMin: { value: rimMin } },
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vPos;
      varying vec3 vView;
      void main(){
        vPos = position;
        vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: SIMPLEX + /* glsl */ `
      uniform float uTime;
      uniform float uRimMin;
      varying vec3 vNormal;
      varying vec3 vPos;
      varying vec3 vView;
      void main(){
        float rim = 1.0 - abs(dot(normalize(vNormal), normalize(vView)));
        float t = clamp((1.0 - rim) / max(1.0 - uRimMin, 1e-4), 0.0, 1.0);
        float a = pow(t, 5.0);

        // The corona is not smooth - noise gives it tongues
        float flare = 0.88 + 0.22 * fbm(normalize(vPos) * 5.0 + vec3(uTime * 0.2));
        vec3 col = mix(vec3(1.0, 0.86, 0.52), vec3(1.0, 0.36, 0.06), 1.0 - t);
        gl_FragColor = vec4(col, a * 0.62 * flare);
      }
    `,
  });
  const corona = new THREE.Mesh(new THREE.SphereGeometry(radius * CORONA_SCALE, 64, 64), coronaMat);
  group.add(corona);

  /* --- Billboard glow: a dense core plus a wide soft halo --- */
  function glowSprite(scale, opacity, stops) {
    const sp = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowSprite(256, stops),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity,
      })
    );
    sp.scale.setScalar(radius * scale);
    return sp;
  }

  const glowCore = glowSprite(2.9, 0.5, [
    [0.0, 'rgba(255,240,206,0.95)'],
    [0.16, 'rgba(255,186,86,0.62)'],
    [0.40, 'rgba(255,124,34,0.18)'],
    [1.0, 'rgba(255,110,24,0)'],
  ]);
  const glowHalo = glowSprite(7.5, 0.18, [
    [0.0, 'rgba(255,168,64,0.55)'],
    [0.28, 'rgba(255,120,36,0.16)'],
    [1.0, 'rgba(255,100,20,0)'],
  ]);
  group.add(glowCore, glowHalo);

  /* --- Light source --- */
  const light = new THREE.PointLight(0xfff2dd, 3.1, 0, 0); // decay = 0: the whole system is lit evenly
  group.add(light);

  return {
    group,
    core,
    light,
    // The wide halo looks good from afar but swamps the screen up close, so
    // its strength is tied to camera distance.
    update(t, camDist) {
      coreMat.uniforms.uTime.value = t;
      coronaMat.uniforms.uTime.value = t;

      const pulse = Math.sin(t * 0.7) * 0.04;
      glowCore.material.opacity = 0.18 + 0.30 * smoothstep(radius * 3, radius * 14, camDist) + pulse;
      // The wide halo only appears when viewed from a distance
      glowHalo.material.opacity = 0.19 * smoothstep(radius * 8, radius * 22, camDist) + pulse * 0.3;
    },
  };
}
