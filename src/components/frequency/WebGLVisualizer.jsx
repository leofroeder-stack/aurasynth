import React, { useRef, useEffect } from 'react';

export default function WebGLVisualizer({ 
  frequency, 
  isPlaying, 
  waveType, 
  analyserNode,
  visualStyle = 'fractal',
  colorPalette = 'cyber',
  speed = 1,
  intensity = 1,
  complexity = 1,
  symmetry = 4,
  bloom = 0.5,
  motionBlur = 0,
  chromaticAberration = 0,
  noiseAmount = 0,
  pulseReactivity = 0.5
}) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const glRef = useRef(null);
  const programRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const prevFrameRef = useRef(null);
  const audioHistoryRef = useRef(new Float32Array(64).fill(0.5));

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true }) || canvas.getContext('experimental-webgl', { preserveDrawingBuffer: true });
    
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    glRef.current = gl;

    const vertexShaderSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision highp float;
      varying vec2 v_uv;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_frequency;
      uniform float u_amplitude;
      uniform float u_waveType;
      uniform float u_audioData[64];
      uniform float u_audioBass;
      uniform float u_audioMid;
      uniform float u_audioHigh;
      uniform float u_audioPeak;
      uniform int u_visualStyle;
      uniform int u_colorPalette;
      uniform float u_speed;
      uniform float u_intensity;
      uniform float u_complexity;
      uniform float u_symmetry;
      uniform float u_bloom;
      uniform float u_motionBlur;
      uniform float u_chromatic;
      uniform float u_noise;
      uniform float u_pulse;
      uniform float u_beatPulse;
      
      #define PI 3.14159265359
      #define TAU 6.28318530718
      
      // Improved noise functions
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
      
      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }
      
      float fbm(vec3 p, int octaves) {
        float value = 0.0;
        float amplitude = 0.5;
        float freq = 1.0;
        for (int i = 0; i < 8; i++) {
          if (i >= octaves) break;
          value += amplitude * snoise(p * freq);
          freq *= 2.0;
          amplitude *= 0.5;
        }
        return value;
      }
      
      // Color palettes with more variety
      vec3 paletteCyber(float t) {
        return 0.5 + 0.5 * cos(TAU * (t + vec3(0.0, 0.33, 0.67)));
      }
      
      vec3 paletteFire(float t) {
        vec3 a = vec3(0.5, 0.5, 0.5);
        vec3 b = vec3(0.5, 0.5, 0.5);
        vec3 c = vec3(1.0, 0.7, 0.4);
        vec3 d = vec3(0.0, 0.15, 0.20);
        return a + b * cos(TAU * (c * t + d));
      }
      
      vec3 paletteNature(float t) {
        return 0.5 + 0.5 * cos(TAU * (t + vec3(0.80, 0.90, 0.30)));
      }
      
      vec3 paletteOcean(float t) {
        vec3 a = vec3(0.5, 0.5, 0.5);
        vec3 b = vec3(0.5, 0.5, 0.5);
        vec3 c = vec3(1.0, 1.0, 1.0);
        vec3 d = vec3(0.30, 0.20, 0.20);
        return a + b * cos(TAU * (c * t + d));
      }
      
      vec3 paletteSunset(float t) {
        return 0.5 + 0.5 * cos(TAU * (t * vec3(2.0, 1.0, 0.0) + vec3(0.50, 0.20, 0.25)));
      }
      
      vec3 paletteNeon(float t) {
        return 0.5 + 0.5 * cos(TAU * (t + vec3(0.0, 0.10, 0.20)));
      }
      
      vec3 paletteVaporwave(float t) {
        return 0.5 + 0.5 * cos(TAU * (t + vec3(0.9, 0.3, 0.6)));
      }
      
      vec3 paletteAurora(float t) {
        return 0.5 + 0.5 * cos(TAU * (t + vec3(0.2, 0.7, 0.4)));
      }
      
      vec3 getColor(float t) {
        if (u_colorPalette == 0) return paletteCyber(t);
        if (u_colorPalette == 1) return paletteFire(t);
        if (u_colorPalette == 2) return paletteNature(t);
        if (u_colorPalette == 3) return paletteOcean(t);
        if (u_colorPalette == 4) return paletteSunset(t);
        if (u_colorPalette == 5) return paletteNeon(t);
        if (u_colorPalette == 6) return paletteVaporwave(t);
        return paletteAurora(t);
      }
      
      // Audio reactive helpers
      float getAudioBand(float band) {
        int idx = int(band * 63.0);
        return u_audioData[idx];
      }
      
      // Raymarching distance functions
      float sdSphere(vec3 p, float r) { return length(p) - r; }
      float sdBox(vec3 p, vec3 b) { vec3 d = abs(p) - b; return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0)); }
      float sdTorus(vec3 p, vec2 t) { vec2 q = vec2(length(p.xz)-t.x,p.y); return length(q)-t.y; }
      
      mat2 rot2D(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
      
      // Visual Styles
      vec3 styleFractal(vec2 uv, vec2 uv0, float time, float freqNorm) {
        vec3 finalColor = vec3(0.0);
        float pulse = 1.0 + u_beatPulse * u_pulse * 0.5;
        
        for (float i = 0.0; i < 4.0; i++) {
          uv = fract(uv * (1.0 + u_complexity * 0.5) * pulse) - 0.5;
          float d = length(uv) * exp(-length(uv0));
          
          float audioMod = getAudioBand(i / 4.0) * u_pulse;
          vec3 col = getColor(length(uv0) + i * 0.4 + time * 0.2 + freqNorm + audioMod);
          
          float wave;
          if (u_waveType < 0.5) {
            wave = sin(d * 8.0 * u_complexity + time * 2.0 + freqNorm * 10.0 + u_audioBass * 3.0);
          } else if (u_waveType < 1.5) {
            wave = sign(sin(d * 8.0 * u_complexity + time * 2.0 + freqNorm * 10.0));
          } else if (u_waveType < 2.5) {
            wave = fract(d * u_complexity + time * 0.5 + freqNorm) * 2.0 - 1.0;
          } else {
            wave = abs(fract(d * u_complexity + time * 0.5 + freqNorm) * 2.0 - 1.0) * 2.0 - 1.0;
          }
          
          d = wave * u_amplitude * u_intensity * (1.0 + audioMod);
          d = abs(d);
          d = pow(0.01 / d, 1.2);
          finalColor += col * d * (0.5 + u_audioBass * 0.5);
        }
        
        return finalColor;
      }
      
      vec3 styleVolumetric(vec2 uv, float time, float freqNorm) {
        vec3 ro = vec3(0.0, 0.0, -3.0);
        vec3 rd = normalize(vec3(uv, 1.0));
        
        float pulse = 1.0 + u_beatPulse * u_pulse;
        vec3 col = vec3(0.0);
        float t = 0.0;
        
        for (int i = 0; i < 64; i++) {
          vec3 p = ro + rd * t;
          
          p.xy *= rot2D(time * 0.3 * u_speed);
          p.xz *= rot2D(time * 0.2 * u_speed);
          
          float audioDisp = u_audioBass * 0.5 * u_pulse;
          float n = fbm(p * u_complexity + time * 0.5, int(u_complexity * 4.0) + 2);
          
          float d = sdTorus(p, vec2(1.0 + audioDisp, 0.3 + u_audioMid * 0.2 * u_pulse)) + n * 0.3;
          d = min(d, sdSphere(p, 0.5 + u_audioBass * 0.3 * u_pulse) + n * 0.2);
          
          if (d < 0.01) {
            float glow = exp(-t * 0.3) * u_intensity;
            col += getColor(t * 0.1 + freqNorm + n) * glow * 0.1;
          }
          
          t += max(0.02, abs(d) * 0.5);
          if (t > 10.0) break;
        }
        
        float glow = exp(-length(uv) * (2.0 - u_bloom)) * pulse;
        col += getColor(time * 0.1 + freqNorm) * glow * u_audioBass * 0.5;
        
        return col;
      }
      
      vec3 styleTunnel(vec2 uv, float time, float freqNorm) {
        float angle = atan(uv.y, uv.x);
        float radius = length(uv);
        
        float pulse = 1.0 + u_beatPulse * u_pulse * 0.3;
        float tunnelAngle = angle / TAU + 0.5;
        float tunnelDepth = 1.0 / (radius + 0.1);
        
        vec2 tunnelUV = vec2(tunnelAngle * u_symmetry, tunnelDepth - time * u_speed * pulse);
        
        float audioWave = 0.0;
        for (int i = 0; i < 8; i++) {
          float band = float(i) / 8.0;
          audioWave += sin(tunnelUV.y * (5.0 + float(i) * 2.0) - time * 2.0) * getAudioBand(band) * u_pulse;
        }
        
        float pattern = sin(tunnelUV.x * TAU * u_complexity) * sin(tunnelUV.y * 10.0 * u_complexity);
        pattern += sin(tunnelUV.x * TAU * 2.0 * u_complexity + time) * 0.5;
        pattern += audioWave * 0.3;
        
        float n = fbm(vec3(tunnelUV * 3.0, time * 0.3), 4);
        pattern += n * 0.5;
        
        vec3 col = getColor(pattern * 0.5 + time * 0.1 + freqNorm);
        col *= (1.0 - radius * 0.5) * u_intensity;
        
        float centerGlow = exp(-radius * (3.0 - u_bloom * 2.0)) * pulse;
        col += getColor(tunnelDepth * 0.1 + time * 0.2) * centerGlow;
        
        return col;
      }
      
      vec3 styleKaleidoscope(vec2 uv, float time, float freqNorm) {
        float angle = atan(uv.y, uv.x);
        float radius = length(uv);
        
        float pulse = 1.0 + u_beatPulse * u_pulse * 0.4;
        float segments = u_symmetry;
        angle = mod(angle, TAU / segments);
        angle = abs(angle - PI / segments);
        
        vec2 kalUV = vec2(cos(angle), sin(angle)) * radius;
        kalUV += time * u_speed * 0.2;
        kalUV *= pulse;
        
        float n = fbm(vec3(kalUV * 3.0 * u_complexity, time * 0.5), int(u_complexity * 5.0) + 2);
        
        float audioPattern = 0.0;
        for (int i = 0; i < 4; i++) {
          float band = float(i) / 4.0;
          audioPattern += sin(radius * (10.0 + float(i) * 5.0) - time * 3.0) * getAudioBand(band) * u_pulse;
        }
        n += audioPattern * 0.2;
        
        vec3 col = getColor(n + freqNorm + time * 0.1);
        col *= (1.0 + sin(radius * 10.0 * u_complexity - time * 2.0) * 0.3) * u_intensity;
        
        float glow = exp(-radius * (2.0 - u_bloom)) * pulse;
        col += getColor(time * 0.2 + u_audioBass) * glow;
        
        return col;
      }
      
      vec3 stylePlasma(vec2 uv, float time, float freqNorm) {
        float pulse = 1.0 + u_beatPulse * u_pulse * 0.5;
        vec2 c = uv * u_complexity * 3.0 * pulse;
        
        float v = 0.0;
        v += sin((c.x + time * u_speed) + u_audioBass * 2.0 * u_pulse);
        v += sin((c.y + time * u_speed) * 0.5 + u_audioMid * u_pulse);
        v += sin((c.x + c.y + time * u_speed) * 0.5);
        
        c += vec2(sin(time * u_speed * 0.3), cos(time * u_speed * 0.5)) * 2.0;
        v += sin(sqrt(c.x * c.x + c.y * c.y + 1.0) + time * u_speed + u_audioHigh * u_pulse);
        
        float n = fbm(vec3(uv * 2.0, time * 0.3), 4);
        v += n * 0.5;
        
        v = v * 0.5;
        
        vec3 col = getColor(v * 0.5 + freqNorm + time * 0.05);
        col *= u_intensity * (1.0 + u_audioBass * 0.3 * u_pulse);
        
        float glow = exp(-length(uv) * (2.0 - u_bloom)) * pulse;
        col += getColor(v + time * 0.1) * glow * 0.5;
        
        return col;
      }
      
      vec3 styleWaveform(vec2 uv, float time, float freqNorm) {
        vec3 col = vec3(0.0);
        float pulse = 1.0 + u_beatPulse * u_pulse * 0.3;
        
        for (float i = 0.0; i < 8.0; i++) {
          float offset = i * 0.12 - 0.42;
          float audioVal = getAudioBand(i / 8.0);
          
          float waveY = sin(uv.x * TAU * u_complexity * (1.0 + i * 0.2) + time * u_speed * 2.0 + i) * 0.2;
          waveY += sin(uv.x * TAU * 2.0 * u_complexity + time * u_speed * 3.0 + i * 0.5) * 0.08;
          waveY *= (audioVal + 0.3) * pulse;
          waveY += offset;
          
          float dist = abs(uv.y - waveY);
          float line = 0.008 / dist;
          line = pow(line, 1.3);
          
          float glowLine = 0.03 / dist * u_bloom;
          
          vec3 lineCol = getColor(i * 0.12 + time * 0.1 + freqNorm + audioVal * 0.5);
          col += lineCol * (line + glowLine) * u_intensity * 0.4;
        }
        
        float glow = exp(-length(uv) * (3.0 - u_bloom * 2.0)) * pulse;
        col += getColor(time * 0.2 + u_audioBass) * glow * 0.3;
        
        return col;
      }
      
      vec3 styleParticles(vec2 uv, float time, float freqNorm) {
        vec3 col = vec3(0.0);
        float pulse = 1.0 + u_beatPulse * u_pulse * 0.5;
        int numParticles = int(u_complexity * 15.0) + 10;
        
        for (int i = 0; i < 40; i++) {
          if (i >= numParticles) break;
          
          float fi = float(i);
          float band = mod(fi, 8.0) / 8.0;
          float audioVal = getAudioBand(band);
          
          float angle = fi * 2.399 + time * u_speed * (0.3 + audioVal * 0.5 * u_pulse);
          float dist = 0.3 + fi * 0.02 + sin(time + fi) * 0.1;
          dist *= pulse;
          
          vec2 particlePos = vec2(cos(angle), sin(angle)) * dist;
          particlePos += vec2(sin(fi * 174.2 + time * 0.5), cos(fi * 267.3 + time * 0.5)) * 0.2;
          
          float d = length(uv - particlePos);
          float size = 0.015 + audioVal * 0.02 * u_pulse;
          
          float particle = smoothstep(size, size * 0.3, d);
          float glow = size / d * 0.08 * u_bloom;
          
          vec3 particleCol = getColor(fi * 0.05 + time * 0.05 + freqNorm + audioVal);
          col += particleCol * (particle + glow) * u_intensity;
        }
        
        return col;
      }
      
      vec3 styleGeometric(vec2 uv, float time, float freqNorm) {
        vec3 col = vec3(0.0);
        float pulse = 1.0 + u_beatPulse * u_pulse * 0.4;
        
        float angle = atan(uv.y, uv.x);
        float radius = length(uv);
        
        float segments = u_symmetry;
        float segmentAngle = TAU / segments;
        angle = mod(angle + time * u_speed * 0.2, segmentAngle);
        
        for (float i = 1.0; i <= 6.0; i++) {
          float audioVal = getAudioBand((i - 1.0) / 6.0);
          float ringRadius = i * 0.15 * (0.8 + audioVal * 0.4 * u_pulse) * pulse;
          float ringWidth = 0.015 + audioVal * 0.01 * u_pulse;
          
          float ring = smoothstep(ringWidth, 0.0, abs(radius - ringRadius));
          
          float spoke = cos(angle * segments * i * u_complexity + time * u_speed) * 0.5 + 0.5;
          spoke = pow(spoke, 20.0);
          
          vec3 shapeCol = getColor(i * 0.15 + time * 0.1 + freqNorm + audioVal * 0.3);
          col += shapeCol * (ring * (0.5 + spoke * 0.5)) * u_intensity;
          
          float glowRing = exp(-abs(radius - ringRadius) * 30.0) * u_bloom * audioVal;
          col += shapeCol * glowRing * 0.3;
        }
        
        float centerGlow = exp(-radius * (4.0 - u_bloom * 2.0)) * pulse * u_audioBass;
        col += getColor(time * 0.2 + freqNorm) * centerGlow;
        
        return col;
      }
      
      vec3 styleNebula(vec2 uv, float time, float freqNorm) {
        vec3 col = vec3(0.0);
        float pulse = 1.0 + u_beatPulse * u_pulse * 0.3;
        
        vec2 p = uv * 2.0 * u_complexity * pulse;
        
        for (float i = 0.0; i < 5.0; i++) {
          float audioVal = getAudioBand(i / 5.0);
          
          vec3 samplePos = vec3(p + vec2(i * 0.3, i * 0.2), time * 0.2 * u_speed + i * 0.5);
          float n = fbm(samplePos, int(u_complexity * 3.0) + 3);
          n = n * 0.5 + 0.5;
          n = pow(n, 2.0 - audioVal * u_pulse);
          
          vec3 layerCol = getColor(i * 0.2 + time * 0.05 + freqNorm + audioVal * 0.3);
          col += layerCol * n * u_intensity * 0.3 * (1.0 + audioVal * u_pulse);
        }
        
        float glow = exp(-length(uv) * (1.5 - u_bloom)) * pulse;
        col += getColor(time * 0.1 + u_audioBass) * glow * 0.5;
        
        col = pow(col, vec3(0.9));
        
        return col;
      }
      
      void main() {
        vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution) / min(u_resolution.x, u_resolution.y);
        vec2 uv0 = uv;
        
        float time = u_time * u_speed;
        float freqNorm = u_frequency / 2000.0;
        
        vec3 finalColor = vec3(0.0);
        
        if (u_visualStyle == 0) {
          finalColor = styleFractal(uv, uv0, time, freqNorm);
        } else if (u_visualStyle == 1) {
          finalColor = styleTunnel(uv, time, freqNorm);
        } else if (u_visualStyle == 2) {
          finalColor = styleKaleidoscope(uv, time, freqNorm);
        } else if (u_visualStyle == 3) {
          finalColor = stylePlasma(uv, time, freqNorm);
        } else if (u_visualStyle == 4) {
          finalColor = styleWaveform(uv, time, freqNorm);
        } else if (u_visualStyle == 5) {
          finalColor = styleParticles(uv, time, freqNorm);
        } else if (u_visualStyle == 6) {
          finalColor = styleGeometric(uv, time, freqNorm);
        } else if (u_visualStyle == 7) {
          finalColor = styleVolumetric(uv, time, freqNorm);
        } else {
          finalColor = styleNebula(uv, time, freqNorm);
        }
        
        // Post-processing: Chromatic aberration
        if (u_chromatic > 0.01) {
          vec2 dir = uv0 * u_chromatic * 0.02;
          vec2 uvR = (gl_FragCoord.xy * 2.0 - u_resolution + dir * u_resolution.y) / min(u_resolution.x, u_resolution.y);
          vec2 uvB = (gl_FragCoord.xy * 2.0 - u_resolution - dir * u_resolution.y) / min(u_resolution.x, u_resolution.y);
          
          vec3 colR, colB;
          if (u_visualStyle == 0) {
            colR = styleFractal(uvR, uvR, time, freqNorm);
            colB = styleFractal(uvB, uvB, time, freqNorm);
          } else if (u_visualStyle == 3) {
            colR = stylePlasma(uvR, time, freqNorm);
            colB = stylePlasma(uvB, time, freqNorm);
          } else {
            colR = finalColor;
            colB = finalColor;
          }
          finalColor.r = mix(finalColor.r, colR.r, u_chromatic);
          finalColor.b = mix(finalColor.b, colB.b, u_chromatic);
        }
        
        // Post-processing: Film grain noise
        if (u_noise > 0.01) {
          float grain = fract(sin(dot(gl_FragCoord.xy + u_time * 100.0, vec2(12.9898, 78.233))) * 43758.5453);
          finalColor += (grain - 0.5) * u_noise * 0.3;
        }
        
        // Global glow
        vec3 glowColor = getColor(freqNorm + time * 0.1);
        float glow = exp(-length(uv0) * (2.0 - freqNorm)) * u_bloom;
        finalColor += glowColor * glow * u_amplitude * 0.2;
        
        // Vignette
        float vignette = 1.0 - length(uv0) * 0.35;
        finalColor *= vignette;
        
        // Tone mapping
        finalColor = finalColor / (finalColor + vec3(1.0));
        finalColor = pow(finalColor, vec3(0.95));
        
        gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
      }
    `;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    programRef.current = program;

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1
    ]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const gl = glRef.current;
    const program = programRef.current;
    
    if (!gl || !program) return;

    const uniforms = {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      frequency: gl.getUniformLocation(program, 'u_frequency'),
      amplitude: gl.getUniformLocation(program, 'u_amplitude'),
      waveType: gl.getUniformLocation(program, 'u_waveType'),
      audioData: gl.getUniformLocation(program, 'u_audioData'),
      audioBass: gl.getUniformLocation(program, 'u_audioBass'),
      audioMid: gl.getUniformLocation(program, 'u_audioMid'),
      audioHigh: gl.getUniformLocation(program, 'u_audioHigh'),
      audioPeak: gl.getUniformLocation(program, 'u_audioPeak'),
      visualStyle: gl.getUniformLocation(program, 'u_visualStyle'),
      colorPalette: gl.getUniformLocation(program, 'u_colorPalette'),
      speed: gl.getUniformLocation(program, 'u_speed'),
      intensity: gl.getUniformLocation(program, 'u_intensity'),
      complexity: gl.getUniformLocation(program, 'u_complexity'),
      symmetry: gl.getUniformLocation(program, 'u_symmetry'),
      bloom: gl.getUniformLocation(program, 'u_bloom'),
      motionBlur: gl.getUniformLocation(program, 'u_motionBlur'),
      chromatic: gl.getUniformLocation(program, 'u_chromatic'),
      noise: gl.getUniformLocation(program, 'u_noise'),
      pulse: gl.getUniformLocation(program, 'u_pulse'),
      beatPulse: gl.getUniformLocation(program, 'u_beatPulse'),
    };

    const waveTypes = { sine: 0, square: 1, sawtooth: 2, triangle: 3 };
    const visualStyles = { fractal: 0, tunnel: 1, kaleidoscope: 2, plasma: 3, waveform: 4, particles: 5, geometric: 6, volumetric: 7, nebula: 8 };
    const colorPalettes = { cyber: 0, fire: 1, nature: 2, ocean: 3, sunset: 4, neon: 5, vaporwave: 6, aurora: 7 };

    let prevBass = 0;
    let beatPulse = 0;

    const render = () => {
      const canvas = canvasRef.current;
      canvas.width = canvas.clientWidth * window.devicePixelRatio;
      canvas.height = canvas.clientHeight * window.devicePixelRatio;
      
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);

      const time = (Date.now() - startTimeRef.current) / 1000;
      
      let audioData = new Float32Array(64).fill(0.5);
      let audioBass = 0.5, audioMid = 0.5, audioHigh = 0.5, audioPeak = 0.5;
      
      if (analyserNode && isPlaying) {
        const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
        analyserNode.getByteFrequencyData(dataArray);
        
        // Map to 64 bands
        for (let i = 0; i < 64; i++) {
          const index = Math.floor(i * dataArray.length / 64);
          audioData[i] = dataArray[index] / 255;
        }
        
        // Calculate frequency bands
        const bassEnd = Math.floor(dataArray.length * 0.1);
        const midEnd = Math.floor(dataArray.length * 0.5);
        
        let bassSum = 0, midSum = 0, highSum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const val = dataArray[i] / 255;
          if (i < bassEnd) bassSum += val;
          else if (i < midEnd) midSum += val;
          else highSum += val;
        }
        
        audioBass = bassSum / bassEnd;
        audioMid = midSum / (midEnd - bassEnd);
        audioHigh = highSum / (dataArray.length - midEnd);
        audioPeak = Math.max(...dataArray) / 255;
        
        // Beat detection
        if (audioBass > prevBass + 0.1 && audioBass > 0.6) {
          beatPulse = 1.0;
        }
        prevBass = audioBass;
      }
      
      // Decay beat pulse
      beatPulse *= 0.92;
      
      // Smooth audio history
      for (let i = 0; i < 64; i++) {
        audioHistoryRef.current[i] = audioHistoryRef.current[i] * 0.8 + audioData[i] * 0.2;
      }

      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.time, time);
      gl.uniform1f(uniforms.frequency, frequency);
      gl.uniform1f(uniforms.amplitude, isPlaying ? 1.0 : 0.3);
      gl.uniform1f(uniforms.waveType, waveTypes[waveType] || 0);
      gl.uniform1fv(uniforms.audioData, audioHistoryRef.current);
      gl.uniform1f(uniforms.audioBass, audioBass);
      gl.uniform1f(uniforms.audioMid, audioMid);
      gl.uniform1f(uniforms.audioHigh, audioHigh);
      gl.uniform1f(uniforms.audioPeak, audioPeak);
      gl.uniform1i(uniforms.visualStyle, visualStyles[visualStyle] || 0);
      gl.uniform1i(uniforms.colorPalette, colorPalettes[colorPalette] || 0);
      gl.uniform1f(uniforms.speed, speed);
      gl.uniform1f(uniforms.intensity, intensity);
      gl.uniform1f(uniforms.complexity, complexity);
      gl.uniform1f(uniforms.symmetry, symmetry);
      gl.uniform1f(uniforms.bloom, bloom);
      gl.uniform1f(uniforms.motionBlur, motionBlur);
      gl.uniform1f(uniforms.chromatic, chromaticAberration);
      gl.uniform1f(uniforms.noise, noiseAmount);
      gl.uniform1f(uniforms.pulse, pulseReactivity);
      gl.uniform1f(uniforms.beatPulse, beatPulse);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [frequency, isPlaying, waveType, analyserNode, visualStyle, colorPalette, speed, intensity, complexity, symmetry, bloom, motionBlur, chromaticAberration, noiseAmount, pulseReactivity]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full absolute inset-0"
      style={{ background: '#0a0a0f' }}
    />
  );
}