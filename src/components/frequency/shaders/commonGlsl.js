export const commonGlsl = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_frequency;
uniform float u_amplitude;
uniform float u_waveType;
uniform float u_audioData[32];
uniform int u_visualStyle;
uniform int u_colorPalette;
uniform float u_speed;
uniform float u_intensity;
uniform float u_complexity;
uniform float u_symmetry;
uniform float u_bloom;
uniform float u_binauralEnabled;
uniform float u_binauralFreq;
uniform float u_isochronicEnabled;
uniform float u_isochronicFreq;
uniform float u_isochronicDepth;
uniform vec2 u_touchPoints[5];
uniform float u_touchCount;
uniform vec2 u_dragVelocity;

#define PI 3.14159265359
#define TAU 6.28318530718

vec3 paletteCyber(float t) {
  vec3 a = vec3(0.5, 0.5, 0.5);
  vec3 b = vec3(0.5, 0.5, 0.5);
  vec3 c = vec3(1.0, 1.0, 1.0);
  vec3 d = vec3(0.0, 0.33, 0.67);
  return a + b * cos(TAU * (c * t + d));
}

vec3 paletteFire(float t) {
  vec3 a = vec3(0.5, 0.5, 0.5);
  vec3 b = vec3(0.5, 0.5, 0.5);
  vec3 c = vec3(1.0, 0.7, 0.4);
  vec3 d = vec3(0.0, 0.15, 0.20);
  return a + b * cos(TAU * (c * t + d));
}

vec3 paletteNature(float t) {
  vec3 a = vec3(0.5, 0.5, 0.5);
  vec3 b = vec3(0.5, 0.5, 0.5);
  vec3 c = vec3(1.0, 1.0, 0.5);
  vec3 d = vec3(0.80, 0.90, 0.30);
  return a + b * cos(TAU * (c * t + d));
}

vec3 paletteOcean(float t) {
  vec3 a = vec3(0.5, 0.5, 0.5);
  vec3 b = vec3(0.5, 0.5, 0.5);
  vec3 c = vec3(1.0, 1.0, 1.0);
  vec3 d = vec3(0.30, 0.20, 0.20);
  return a + b * cos(TAU * (c * t + d));
}

vec3 paletteSunset(float t) {
  vec3 a = vec3(0.5, 0.5, 0.5);
  vec3 b = vec3(0.5, 0.5, 0.5);
  vec3 c = vec3(2.0, 1.0, 0.0);
  vec3 d = vec3(0.50, 0.20, 0.25);
  return a + b * cos(TAU * (c * t + d));
}

vec3 paletteNeon(float t) {
  vec3 a = vec3(0.5, 0.5, 0.5);
  vec3 b = vec3(0.5, 0.5, 0.5);
  vec3 c = vec3(1.0, 1.0, 1.0);
  vec3 d = vec3(0.0, 0.10, 0.20);
  return a + b * cos(TAU * (c * t + d));
}

vec3 paletteAurora(float t) {
  vec3 a = vec3(0.5, 0.5, 0.5);
  vec3 b = vec3(0.5, 0.5, 0.5);
  vec3 c = vec3(1.0, 1.0, 0.5);
  vec3 d = vec3(0.25, 0.4, 0.55);
  return a + b * cos(TAU * (c * t + d));
}

vec3 paletteLava(float t) {
  vec3 a = vec3(0.5, 0.2, 0.1);
  vec3 b = vec3(0.5, 0.4, 0.2);
  vec3 c = vec3(1.0, 0.7, 0.4);
  vec3 d = vec3(0.0, 0.05, 0.1);
  return a + b * cos(TAU * (c * t + d));
}

vec3 paletteIce(float t) {
  vec3 a = vec3(0.7, 0.8, 0.9);
  vec3 b = vec3(0.3, 0.3, 0.3);
  vec3 c = vec3(1.0, 1.0, 1.0);
  vec3 d = vec3(0.5, 0.6, 0.7);
  return a + b * cos(TAU * (c * t + d));
}

vec3 paletteCandy(float t) {
  vec3 a = vec3(0.8, 0.5, 0.7);
  vec3 b = vec3(0.3, 0.4, 0.3);
  vec3 c = vec3(1.0, 0.8, 1.0);
  vec3 d = vec3(0.0, 0.25, 0.33);
  return a + b * cos(TAU * (c * t + d));
}

vec3 paletteGalaxy(float t) {
  vec3 a = vec3(0.5, 0.3, 0.6);
  vec3 b = vec3(0.5, 0.5, 0.5);
  vec3 c = vec3(1.0, 0.8, 1.2);
  vec3 d = vec3(0.3, 0.2, 0.5);
  return a + b * cos(TAU * (c * t + d));
}

vec3 getColor(float t) {
  if (u_colorPalette == 0) return paletteCyber(t);
  if (u_colorPalette == 1) return paletteFire(t);
  if (u_colorPalette == 2) return paletteNature(t);
  if (u_colorPalette == 3) return paletteOcean(t);
  if (u_colorPalette == 4) return paletteSunset(t);
  if (u_colorPalette == 5) return paletteNeon(t);
  if (u_colorPalette == 6) return paletteAurora(t);
  if (u_colorPalette == 7) return paletteLava(t);
  if (u_colorPalette == 8) return paletteIce(t);
  if (u_colorPalette == 9) return paletteCandy(t);
  return paletteGalaxy(t);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p, float comp) {
  float value = 0.0;
  float amplitude = 0.5;
  float freq = 1.0;
  int iterations = int(comp * 6.0) + 2;
  for (int i = 0; i < 8; i++) {
    if (i >= iterations) break;
    value += amplitude * noise(p * freq);
    freq *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}
`;