/* ------------------------------------------------------------------ *
 *  GLSL used by the floating layer.
 *
 *  Three small shaders, each doing something a stock material cannot:
 *  procedural stone veining, a fresnel-only glass that reads as an edge
 *  rather than a surface, and soft round motes without a texture fetch.
 * ------------------------------------------------------------------ */

/* Simplex-ish value noise + fbm. Cheap, tileable enough for a drifting
   object that is never seen close up, and no texture to download. */
const NOISE = /* glsl */ `
  vec3 hash3(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float vnoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(dot(hash3(i + vec3(0,0,0)), f - vec3(0,0,0)),
              dot(hash3(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
          mix(dot(hash3(i + vec3(0,1,0)), f - vec3(0,1,0)),
              dot(hash3(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
      mix(mix(dot(hash3(i + vec3(0,0,1)), f - vec3(0,0,1)),
              dot(hash3(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
          mix(dot(hash3(i + vec3(0,1,1)), f - vec3(0,1,1)),
              dot(hash3(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y),
      u.z);
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * vnoise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }
`

/* ---- Calacatta marble ---------------------------------------------
 * Veining is fbm domain-warped along one axis and then run through a
 * sharp falloff, which is what turns a smooth noise field into the thin
 * grey seams marble actually has. Lighting is a single key plus a wide
 * fill — enough to read as stone, far cheaper than a standard material.
 * ------------------------------------------------------------------ */
export const marbleShader = {
  uniforms: {
    uTime: { value: 0 },
    uOpacity: { value: 1 },
    uBase: { value: null }, // THREE.Color, set by the component
    uVein: { value: null },
    uWarp: { value: 1.0 },
  },
  vertexShader: /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vPos;
    varying vec3 vView;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPos = position;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vView = -mv.xyz;
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform float uTime;
    uniform float uOpacity;
    uniform float uWarp;
    uniform vec3 uBase;
    uniform vec3 uVein;
    varying vec3 vNormal;
    varying vec3 vPos;
    varying vec3 vView;
    ${NOISE}

    void main() {
      vec3 p = vPos * 1.7;
      // Warp the sample point before the ridge, so seams wander instead
      // of running straight around the sphere.
      vec3 q = p + vec3(fbm(p + uTime * 0.02), fbm(p.yzx - uTime * 0.015), 0.0) * uWarp;
      float n = fbm(q * 1.6);

      // Thin seams, not a grey field. fbm lands near zero over most of the
      // surface, so the band that counts as a vein has to be narrow — the
      // first cut of this used a wide one and turned the whole stone the
      // vein colour, which read as a dark blob rather than as marble.
      // Written as 1 - smoothstep so the edges stay in ascending order;
      // a descending pair is undefined in the GLSL spec and the drivers
      // that do accept it do not agree on the result.
      float vein = 1.0 - smoothstep(0.0, 0.11, abs(n));
      float dust = fbm(p * 9.0) * 0.03;

      vec3 col = mix(uBase, uVein, vein * 0.55) + dust;

      vec3 N = normalize(vNormal);
      vec3 V = normalize(vView);
      float key = max(dot(N, normalize(vec3(0.5, 0.85, 0.6))), 0.0);
      float fill = max(dot(N, normalize(vec3(-0.6, 0.2, 0.4))), 0.0);
      float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);

      // Stone is bright and low-contrast. Ambient carries most of it and
      // the key only shapes the form.
      col *= 0.86 + key * 0.3 + fill * 0.12;
      col += rim * 0.1;

      gl_FragColor = vec4(col, uOpacity);
    }
  `,
}

/* ---- fresnel glass -------------------------------------------------
 * Transparent everywhere except where the surface turns away from the
 * camera. The plane reads as a floating pane catching a light rather than
 * a tinted rectangle, which is the only way a glass element survives on a
 * near-white page without becoming the glassmorphism the brief rules out.
 * ------------------------------------------------------------------ */
export const glassShader = {
  uniforms: {
    uOpacity: { value: 1 },
    uEdge: { value: null },
    uCore: { value: null },
    uPower: { value: 2.4 },
  },
  vertexShader: /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vView;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vView = -mv.xyz;
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform float uOpacity;
    uniform float uPower;
    uniform vec3 uEdge;
    uniform vec3 uCore;
    varying vec3 vNormal;
    varying vec3 vView;
    varying vec2 vUv;

    void main() {
      float f = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), uPower);
      // Fade the pane's own border so it has no hard cut-off in space.
      vec2 d = abs(vUv - 0.5) * 2.0;
      float frame = (1.0 - smoothstep(0.72, 1.0, max(d.x, d.y)));
      float a = (0.06 + f * 0.9) * frame * uOpacity;
      gl_FragColor = vec4(mix(uCore, uEdge, f), a);
    }
  `,
}

/* ---- motes ---------------------------------------------------------
 * Dust in a light shaft. Round points made by discarding outside a
 * radius in the fragment shader — no sprite texture, no alpha atlas.
 * ------------------------------------------------------------------ */
export const motesShader = {
  uniforms: {
    uTime: { value: 0 },
    uOpacity: { value: 1 },
    uSize: { value: 26 },
    uColor: { value: null },
    uPixelRatio: { value: 1 },
  },
  vertexShader: /* glsl */ `
    uniform float uTime;
    uniform float uSize;
    uniform float uPixelRatio;
    attribute float aSeed;
    varying float vTwinkle;

    void main() {
      vec3 p = position;
      // Each mote drifts on its own slow figure, seeded off its index so
      // the field never pulses in unison.
      p.y += sin(uTime * 0.22 + aSeed * 6.283) * 0.55;
      p.x += cos(uTime * 0.17 + aSeed * 4.1) * 0.4;
      p.z += sin(uTime * 0.13 + aSeed * 2.7) * 0.3;

      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = uSize * uPixelRatio * (1.0 / -mv.z) * (0.5 + aSeed);
      vTwinkle = 0.45 + 0.55 * sin(uTime * 0.9 + aSeed * 12.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform float uOpacity;
    uniform vec3 uColor;
    varying float vTwinkle;

    void main() {
      vec2 c = gl_PointCoord - 0.5;
      float d = dot(c, c);
      if (d > 0.25) discard;
      float a = (1.0 - smoothstep(0.0, 0.25, d)) * vTwinkle * uOpacity;
      gl_FragColor = vec4(uColor, a);
    }
  `,
}
