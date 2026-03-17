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
  canvasRef: externalCanvasRef,
  binauralEnabled = false,
  binauralFreq = 10,
  isochronicEnabled = false,
  isochronicFreq = 10,
  isochronicDepth = 0.8,
  touchPoints = [],
  dragVelocity = { x: 0, y: 0 }
}) {
  const internalCanvasRef = useRef(null);
  const canvasRef = externalCanvasRef || internalCanvasRef;
  const animationRef = useRef(null);
  const glRef = useRef(null);
  const programRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    glRef.current = gl;

    const vertexShaderSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
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
      
      vec3 styleFractal(vec2 uv, vec2 uv0, float time, float freqNorm, float audioSum) {
        vec3 finalColor = vec3(0.0);
        float comp = u_complexity;
        float f = freqNorm * 5.0; // Amplified frequency effect
        
        // Frequency affects zoom/scale dramatically
        uv *= 0.5 + f * 1.5;
        uv = uv * mat2(cos(f), -sin(f), sin(f), cos(f)); // Rotate based on frequency
        
        for (float i = 0.0; i < 4.0; i++) {
          uv = fract(uv * (1.0 + comp * 0.5 + f * 0.8)) - 0.5;
          float d = length(uv) * exp(-length(uv0));
          vec3 col = getColor(length(uv0) + i * 0.4 + time * 0.2 + f * 2.0);
          
          float wave;
          float freqMod = f * 30.0;
          if (u_waveType < 0.5) {
            wave = sin(d * (8.0 + freqMod) * comp + time * (1.0 + f * 3.0) + f * 10.0);
          } else if (u_waveType < 1.5) {
            wave = sign(sin(d * (8.0 + freqMod) * comp + time * (1.0 + f * 3.0) + f * 10.0));
          } else if (u_waveType < 2.5) {
            wave = fract(d * comp * (1.0 + f * 2.0) + time * (0.5 + f) + f * 3.0) * 2.0 - 1.0;
          } else {
            wave = abs(fract(d * comp * (1.0 + f * 2.0) + time * (0.5 + f) + f * 3.0) * 2.0 - 1.0) * 2.0 - 1.0;
          }
          
          d = wave * u_amplitude * u_intensity * (0.5 + f * 1.0);
          d = abs(d);
          d = pow(0.01 / d, 1.2);
          finalColor += col * d * (0.5 + audioSum * 0.5);
        }
        
        return finalColor;
      }
      
      vec3 styleTunnel(vec2 uv, float time, float freqNorm, float audioSum) {
        float angle = atan(uv.y, uv.x);
        float radius = length(uv);
        float freqEffect = freqNorm * 3.0;
        
        float tunnelAngle = angle / TAU + 0.5;
        float tunnelDepth = 1.0 / radius;
        
        // Frequency affects tunnel speed and twist
        float freqSpeed = u_speed * (0.5 + freqNorm * 2.0);
        vec2 tunnelUV = vec2(tunnelAngle * u_symmetry + freqNorm * 0.5, tunnelDepth - time * freqSpeed);
        
        float pattern = sin(tunnelUV.x * TAU * u_complexity * (1.0 + freqNorm)) * sin(tunnelUV.y * (10.0 + freqNorm * 20.0) * u_complexity);
        pattern += sin(tunnelUV.x * TAU * 2.0 * u_complexity + time * (1.0 + freqNorm * 2.0)) * 0.5;
        pattern += audioSum * sin(tunnelUV.y * 5.0 - time * 3.0);
        pattern += sin(freqEffect * 10.0 + time) * 0.3;
        
        vec3 col = getColor(pattern * 0.5 + time * 0.1 + freqEffect);
        col *= (1.0 - radius * 0.5) * u_intensity * (0.8 + freqNorm * 0.5);
        col += getColor(tunnelDepth * 0.1 + freqNorm) * u_bloom * 0.3;
        
        return col;
      }
      
      vec3 styleKaleidoscope(vec2 uv, float time, float freqNorm, float audioSum) {
        float angle = atan(uv.y, uv.x);
        float radius = length(uv);
        float f = freqNorm * 5.0; // Amplified
        
        // Frequency dramatically affects segment count and rotation
        float segments = u_symmetry + floor(f * 8.0);
        angle = mod(angle + f * TAU * 2.0 + time * f, TAU / segments);
        angle = abs(angle - PI / segments);
        
        vec2 kalUV = vec2(cos(angle), sin(angle)) * radius * (0.5 + f * 2.0);
        kalUV += time * u_speed * 0.2 * (1.0 + f * 3.0);
        kalUV = kalUV * mat2(cos(f * 2.0), -sin(f * 2.0), sin(f * 2.0), cos(f * 2.0));
        
        float n = fbm(kalUV * 3.0 * u_complexity * (1.0 + f * 2.0) + time * (0.5 + f), u_complexity);
        n += audioSum * 0.5 + f * 1.5;
        
        vec3 col = getColor(n + f * 3.0 + time * 0.1);
        col *= (1.0 + sin(radius * (10.0 + f * 40.0) * u_complexity - time * (2.0 + f * 4.0)) * 0.5) * u_intensity;
        
        float glow = exp(-radius * (2.0 - f * 1.5)) * u_bloom * (1.0 + f * 2.0);
        col += getColor(time * 0.2 + f * 4.0) * glow;
        
        return col;
      }
      
      vec3 stylePlasma(vec2 uv, float time, float freqNorm, float audioSum) {
        float v = 0.0;
        float f = freqNorm * 5.0; // Amplified
        float freqSpeed = u_speed * (0.3 + f * 4.0);
        vec2 c = uv * u_complexity * 3.0 * (0.5 + f * 2.0);
        
        // Rotate UV based on frequency
        c = c * mat2(cos(f), -sin(f), sin(f), cos(f));
        
        // Frequency dramatically affects wave patterns
        v += sin((c.x + time * freqSpeed) * (1.0 + f * 5.0));
        v += sin((c.y + time * freqSpeed) * 0.5 * (1.0 + f * 3.0));
        v += sin((c.x + c.y + time * freqSpeed) * (0.5 + f) + f * 15.0);
        v += sin(c.x * f * 10.0 + time * 3.0) * f;
        
        c += vec2(sin(time * freqSpeed * 0.3 + f * 5.0), cos(time * freqSpeed * 0.5 + f * 3.0)) * (2.0 + f * 3.0);
        v += sin(sqrt(c.x * c.x + c.y * c.y + 1.0) * (1.0 + f * 4.0) + time * freqSpeed);
        v += sin(f * 20.0 + time * (2.0 + f * 5.0)) * (0.5 + f);
        
        v = v * 0.5 + audioSum;
        
        vec3 col = getColor(v * 0.5 + f * 4.0 + time * 0.05);
        col *= u_intensity * (0.6 + f * 0.8);
        
        float glow = exp(-length(uv) * (2.0 - u_bloom - f));
        col += getColor(v + time * 0.1 + f * 5.0) * glow * (0.5 + f * 0.5);
        
        return col;
      }
      
      vec3 styleWaveform(vec2 uv, float time, float freqNorm, float audioSum) {
        vec3 col = vec3(0.0);
        float f = freqNorm * 5.0; // Amplified
        float freqMult = 0.5 + f * 6.0;
        
        for (float i = 0.0; i < 5.0; i++) {
          float offset = i * 0.15 - 0.3;
          // Frequency dramatically affects wave complexity and amplitude
          float waveY = sin(uv.x * TAU * u_complexity * freqMult + time * u_speed * (2.0 + f * 5.0) + i + f * 8.0) * (0.2 + f * 0.5);
          waveY += sin(uv.x * TAU * 2.0 * u_complexity * freqMult + time * u_speed * (3.0 + f * 4.0)) * (0.1 + f * 0.2);
          waveY += sin(uv.x * f * 50.0 + time * (4.0 + f * 8.0)) * f * 0.3;
          waveY += cos(uv.x * f * 30.0 - time * 5.0) * f * 0.2;
          waveY *= audioSum + 0.5;
          waveY += offset * (1.0 + f * 0.5);
          
          float dist = abs(uv.y - waveY);
          float line = 0.01 / dist;
          line = pow(line, 1.5);
          
          col += getColor(i * 0.2 + time * 0.1 + f * 4.0) * line * u_intensity * (0.4 + f * 0.3);
        }
        
        float glow = exp(-length(uv) * (3.0 - u_bloom * 2.0 - f * 1.5));
        col += getColor(time * 0.2 + f * 5.0) * glow * (0.3 + f * 0.4);
        
        return col;
      }
      
      vec3 styleParticles(vec2 uv, float time, float freqNorm, float audioSum) {
        vec3 col = vec3(0.0);
        float f = freqNorm * 5.0; // Amplified
        float comp = u_complexity * 10.0 + 5.0 + f * 20.0;
        float freqSpeed = u_speed * (0.3 + f * 5.0);
        
        for (float i = 0.0; i < 40.0; i++) {
          if (i >= comp) break;
          // Frequency dramatically affects particle orbit size and speed
          float orbitMod = 1.0 + f * sin(i + time);
          vec2 particlePos = vec2(
            sin(i * 174.2 + time * freqSpeed * (0.5 + hash(vec2(i, 0.0)) * 0.5) + f * 10.0) * orbitMod,
            cos(i * 267.3 + time * freqSpeed * (0.5 + hash(vec2(0.0, i)) * 0.5) + f * 5.0) * orbitMod
          ) * (0.3 + audioSum * 0.5 + f * 1.0);
          
          // Add spiral motion based on frequency
          float spiralAngle = time * f * 2.0 + i * 0.5;
          particlePos += vec2(cos(spiralAngle), sin(spiralAngle)) * f * 0.3;
          
          float dist = length(uv - particlePos);
          float size = 0.02 + hash(vec2(i, i)) * 0.03;
          size *= 1.0 + audioSum * 0.5 + f * 1.0;
          
          float particle = smoothstep(size, size * 0.5, dist);
          float glow = size / dist * 0.1 * u_bloom * (1.0 + f * 2.0);
          
          vec3 particleCol = getColor(i * 0.1 + time * 0.05 + f * 4.0);
          col += particleCol * (particle + glow) * u_intensity;
        }
        
        return col;
      }
      
      vec3 styleGeometric(vec2 uv, float time, float freqNorm, float audioSum) {
        vec3 col = vec3(0.0);
        float f = freqNorm * 5.0; // Amplified
        
        float angle = atan(uv.y, uv.x);
        float radius = length(uv);
        
        // Frequency dramatically affects segment count and rotation speed
        float segments = u_symmetry + floor(f * 12.0);
        float segmentAngle = TAU / segments;
        float rotSpeed = u_speed * 0.2 * (1.0 + f * 8.0);
        angle = mod(angle + time * rotSpeed + f * TAU * 3.0, segmentAngle);
        
        for (float i = 1.0; i <= 5.0; i++) {
          // Frequency dramatically affects ring spacing and pulsing
          float ringRadius = i * 0.2 * (0.6 + audioSum * 0.4 + f * 0.8);
          ringRadius += sin(time * (2.0 + f * 6.0) + f * 15.0 + i) * f * 0.25;
          float ringWidth = 0.02 + f * 0.03;
          
          float ring = smoothstep(ringWidth, 0.0, abs(radius - ringRadius));
          
          // More spokes at higher frequencies
          float spokes = step(0.98 - f * 0.15, cos(angle * segments * i * u_complexity * (1.0 + f)));
          
          vec3 shapeCol = getColor(i * 0.2 + time * 0.1 + f * 4.0);
          col += shapeCol * (ring + spokes * (0.5 + f * 0.3)) * u_intensity;
        }
        
        float centerGlow = exp(-radius * (4.0 - u_bloom * 2.0 - f * 2.0));
        col += getColor(time * 0.2 + f * 5.0) * centerGlow * (1.0 + f * 1.5);
        
        return col;
      }
      
      vec3 styleSpiral(vec2 uv, float time, float freqNorm, float audioSum) {
        vec3 col = vec3(0.0);
        float f = freqNorm * 5.0;
        float angle = atan(uv.y, uv.x);
        float radius = length(uv);
        
        float arms = u_symmetry + f * 6.0;
        float twist = radius * (5.0 + f * 15.0) - time * u_speed * (2.0 + f * 5.0);
        float spiral = sin(angle * arms + twist) * 0.5 + 0.5;
        spiral = pow(spiral, 2.0 - f);
        
        float pulse = sin(radius * (10.0 + f * 30.0) - time * (3.0 + f * 5.0)) * 0.5 + 0.5;
        spiral *= pulse;
        spiral *= 1.0 + audioSum;
        
        col = getColor(spiral + f * 3.0 + time * 0.1) * spiral * u_intensity;
        col += getColor(angle / TAU + f) * exp(-radius * (3.0 - f)) * u_bloom;
        
        return col;
      }
      
      vec3 styleMatrix(vec2 uv, float time, float freqNorm, float audioSum) {
        vec3 col = vec3(0.0);
        float f = freqNorm * 5.0;
        
        vec2 grid = uv * (5.0 + f * 10.0);
        vec2 id = floor(grid);
        vec2 gv = fract(grid) - 0.5;
        
        float speed = u_speed * (1.0 + f * 3.0);
        float drop = fract(hash(id) + time * speed * (0.5 + hash(id.xx) * 0.5));
        drop = smoothstep(0.0, 0.3, drop) * smoothstep(1.0, 0.7, drop);
        
        float glow = 0.1 / (length(gv) + 0.1);
        glow *= drop * (1.0 + audioSum);
        
        vec3 matrixCol = getColor(hash(id) + f * 2.0 + time * 0.05);
        col += matrixCol * glow * u_intensity;
        
        col += getColor(f) * exp(-length(uv) * (2.0 - f)) * u_bloom * 0.5;
        
        return col;
      }
      
      vec3 styleNebula(vec2 uv, float time, float freqNorm, float audioSum) {
        vec3 col = vec3(0.0);
        float f = freqNorm * 5.0;
        
        vec2 p = uv * (2.0 + f * 2.0);
        float t = time * u_speed * (0.3 + f);
        
        float n1 = fbm(p + t * 0.5, u_complexity);
        float n2 = fbm(p * 2.0 - t * 0.3 + n1, u_complexity);
        float n3 = fbm(p * 0.5 + t * 0.2 + n2 * 2.0, u_complexity);
        
        float nebula = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
        nebula = pow(nebula, 1.5 - f * 0.5);
        nebula *= 1.0 + audioSum * 0.5 + f * 0.5;
        
        col = getColor(nebula + f * 2.0 + time * 0.05) * nebula * u_intensity;
        col += getColor(n1 + f) * n2 * 0.3;
        col += getColor(time * 0.1 + f * 3.0) * exp(-length(uv) * (2.0 - f)) * u_bloom;
        
        return col;
      }
      
      vec3 styleRings(vec2 uv, float time, float freqNorm, float audioSum) {
        vec3 col = vec3(0.0);
        float f = freqNorm * 5.0;
        float radius = length(uv);
        float angle = atan(uv.y, uv.x);
        
        float numRings = 8.0 + f * 12.0;
        float ringSpeed = time * u_speed * (1.0 + f * 3.0);
        
        for (float i = 0.0; i < 10.0; i++) {
          if (i >= numRings / 2.0) break;
          float r = (i + 1.0) * 0.15 * (1.0 + sin(ringSpeed + i) * 0.2 * (1.0 + f));
          r += sin(angle * u_symmetry + time * (1.0 + f * 2.0) + i) * 0.02 * (1.0 + f * 2.0);
          
          float ring = smoothstep(0.02 + f * 0.01, 0.0, abs(radius - r));
          ring *= 1.0 + audioSum;
          
          col += getColor(i * 0.15 + f * 2.0 + time * 0.1) * ring * u_intensity;
        }
        
        col += getColor(f * 3.0 + time * 0.1) * exp(-radius * (4.0 - f * 2.0)) * u_bloom;
        
        return col;
      }
      
      vec3 styleHexgrid(vec2 uv, float time, float freqNorm, float audioSum) {
        vec3 col = vec3(0.0);
        float f = freqNorm * 5.0;
        
        vec2 p = uv * (3.0 + f * 5.0);
        p = p * mat2(cos(time * u_speed * f * 0.5), -sin(time * u_speed * f * 0.5), sin(time * u_speed * f * 0.5), cos(time * u_speed * f * 0.5));
        
        vec2 h = vec2(1.0, 1.732);
        vec2 a = mod(p, h) - h * 0.5;
        vec2 b = mod(p + h * 0.5, h) - h * 0.5;
        vec2 gv = length(a) < length(b) ? a : b;
        
        float hexDist = max(abs(gv.x), abs(gv.y * 0.866 + gv.x * 0.5));
        hexDist = max(hexDist, abs(gv.y * 0.866 - gv.x * 0.5));
        
        float edge = smoothstep(0.5, 0.45 - f * 0.1, hexDist);
        float pulse = sin(length(uv) * (5.0 + f * 15.0) - time * (2.0 + f * 4.0)) * 0.5 + 0.5;
        edge *= pulse * (1.0 + audioSum);
        
        vec2 id = floor(p / h);
        col = getColor(hash(id) + f * 2.0 + time * 0.05) * edge * u_intensity;
        col += getColor(f * 3.0 + time * 0.1) * exp(-length(uv) * (2.0 - f)) * u_bloom;
        
        return col;
      }
      
      vec3 styleAurora(vec2 uv, float time, float freqNorm, float audioSum) {
              vec3 col = vec3(0.0);
              float f = freqNorm * 3.0;

              // Extract frequency bands from audio
              float bass = 0.0;
              float mid = 0.0;
              float high = 0.0;
              for (int i = 0; i < 32; i++) {
                if (i < 10) bass += u_audioData[i];
                else if (i < 20) mid += u_audioData[i];
                else high += u_audioData[i];
              }
              bass /= 10.0;
              mid /= 10.0;
              high /= 12.0;

              vec2 p = uv;
              p.y += 0.5;

              for (float i = 0.0; i < 5.0; i++) {
                // Wave amplitude driven by different frequency bands
                float bassWave = sin(p.x * (3.0 + i + bass * 5.0) + time * u_speed * (0.5 + i * 0.2 + bass * 2.0) + f * 5.0);
                float midWave = sin(p.x * (5.0 + i * 2.0 + mid * 3.0) - time * u_speed * (0.3 + mid * 1.5)) * (0.5 + mid * 0.8);
                float highWave = sin(p.x * (8.0 + i + high * 10.0) + time * u_speed * (1.0 + high * 3.0)) * (0.3 + high * 0.5);

                float wave = bassWave + midWave + highWave;
                wave *= (0.15 + f * 0.1 + audioSum * 0.3);

                // Multiple aurora layers with varying intensities
                float dist = abs(p.y - wave - i * 0.15);
                float glow = (0.02 + audioSum * 0.03) / dist;
                glow *= (1.0 + audioSum * 2.0 + bass * 1.5);

                // Color shifts based on frequency content
                vec3 layerColor = getColor(i * 0.2 + time * 0.1 + f + bass * 0.5 + mid * 0.3);
                layerColor.r += high * 0.3;
                layerColor.g += mid * 0.4;
                layerColor.b += bass * 0.3;

                col += layerColor * glow * u_intensity * (0.5 + audioSum * 0.5);
              }

              // Pulsing background glow with music
              float bgGlow = exp(-length(uv) * (1.5 - bass * 0.5)) * u_bloom * (1.0 + audioSum + bass * 2.0);
              col += getColor(f + time * 0.05 + audioSum) * bgGlow;

              // Shimmer effect driven by high frequencies
              float shimmer = sin(p.x * (20.0 + high * 30.0) + time * (5.0 + high * 10.0)) * high * 0.3;
              col += getColor(time * 0.3 + high * 2.0) * shimmer * u_intensity;

              return col;
            }
            
            vec3 styleFireworks(vec2 uv, float time, float freqNorm, float audioSum) {
              vec3 col = vec3(0.0);
              float f = freqNorm * 4.0;
              
              for (float i = 0.0; i < 8.0; i++) {
                float t = fract(time * u_speed * 0.3 + i * 0.125);
                vec2 center = vec2(sin(i * 3.14) * 0.6, cos(i * 2.71) * 0.4);
                
                float explosion = smoothstep(0.0, 0.3, t) * smoothstep(1.0, 0.5, t);
                float radius = t * (1.0 + f);
                
                for (float j = 0.0; j < 12.0; j++) {
                  float angle = j * TAU / 12.0 + i;
                  vec2 particlePos = center + vec2(cos(angle), sin(angle)) * radius;
                  particlePos.y -= t * t * 0.5;
                  
                  float dist = length(uv - particlePos);
                  float spark = 0.01 / dist * explosion;
                  spark *= 1.0 + audioSum;
                  
                  col += getColor(i * 0.15 + j * 0.05 + f) * spark * u_intensity;
                }
              }
              
              col += getColor(time * 0.1 + f) * exp(-length(uv) * 2.0) * u_bloom * 0.5;
              return col;
            }
            
            vec3 styleMandala(vec2 uv, float time, float freqNorm, float audioSum) {
              vec3 col = vec3(0.0);
              float f = freqNorm * 4.0;
              float angle = atan(uv.y, uv.x);
              float radius = length(uv);
              
              float segments = u_symmetry * 2.0 + f * 4.0;
              angle = mod(angle, TAU / segments);
              angle = abs(angle - PI / segments);
              
              for (float i = 1.0; i < 6.0; i++) {
                float r = i * 0.18 * (1.0 + sin(time * u_speed + i) * 0.1 * (1.0 + f));
                float pattern = sin(angle * segments * i + time * u_speed * 0.5) * 0.5 + 0.5;
                pattern *= sin(radius * 20.0 * u_complexity - time * u_speed + f * 10.0) * 0.5 + 0.5;
                
                float ring = smoothstep(0.03, 0.0, abs(radius - r));
                ring *= pattern * (1.0 + audioSum);
                
                col += getColor(i * 0.15 + f * 2.0 + time * 0.1) * ring * u_intensity;
              }
              
              col += getColor(f + time * 0.1) * exp(-radius * 3.0) * u_bloom;
              return col;
            }
            
            vec3 styleLiquid(vec2 uv, float time, float freqNorm, float audioSum) {
              vec3 col = vec3(0.0);
              float f = freqNorm * 3.0;
              
              vec2 p = uv * (2.0 + f);
              float t = time * u_speed * 0.5;
              
              float n1 = sin(p.x * 3.0 + t) * cos(p.y * 3.0 + t * 0.7);
              float n2 = sin(p.x * 5.0 - t * 0.8 + n1) * cos(p.y * 4.0 + t * 0.5);
              float n3 = sin(p.x * 2.0 + t * 1.2 + n2 * 2.0) * cos(p.y * 6.0 - t * 0.3);
              
              float liquid = (n1 + n2 + n3) / 3.0;
              liquid = liquid * 0.5 + 0.5;
              liquid = pow(liquid, 1.5 - f * 0.3);
              liquid *= 1.0 + audioSum * 0.5;
              
              col = getColor(liquid + f * 2.0 + time * 0.05) * liquid * u_intensity;
              
              float highlight = pow(max(0.0, liquid - 0.7) * 3.0, 2.0);
              col += vec3(1.0) * highlight * 0.3;
              
              col += getColor(f + time * 0.1) * exp(-length(uv) * 1.5) * u_bloom;
              return col;
            }
            
            vec3 styleElectric(vec2 uv, float time, float freqNorm, float audioSum) {
                                vec3 col = vec3(0.0);
                                float f = freqNorm * 5.0;

                                for (float i = 0.0; i < 5.0; i++) {
                                  vec2 start = vec2(-1.0, (i - 2.0) * 0.3);
                                  vec2 end = vec2(1.0, (i - 2.0) * 0.3 + sin(time * u_speed + i) * 0.2);

                                  float segments = 20.0;
                                  vec2 prev = start;

                                  for (float j = 1.0; j <= 20.0; j++) {
                                    float t = j / segments;
                                    vec2 pos = mix(start, end, t);
                                    float offset = sin(t * 30.0 + time * u_speed * 10.0 + i * 5.0 + f * 20.0) * 0.1;
                                    offset *= sin(t * PI) * (1.0 + audioSum + f);
                                    pos.y += offset;

                                    float dist = length(uv - pos);
                                    float bolt = 0.005 / dist;
                                    bolt *= 1.0 + audioSum;

                                    col += getColor(i * 0.2 + t + f * 2.0 + time * 0.1) * bolt * u_intensity;
                                    prev = pos;
                                  }
                                }

                                float flash = pow(sin(time * u_speed * 5.0) * 0.5 + 0.5, 8.0) * audioSum;
                                col += getColor(f + time * 0.2) * flash * 0.3;

                                col += getColor(f * 2.0 + time * 0.1) * exp(-length(uv) * 2.0) * u_bloom;
                                return col;
                              }

                              vec3 styleSeismograph(vec2 uv, float time, float freqNorm, float audioSum) {
              vec3 col = vec3(0.0);
              float f = freqNorm * 3.0;
              
              // Extract frequency bands
              float bass = 0.0;
              float mid = 0.0;
              float high = 0.0;
              for (int i = 0; i < 32; i++) {
                if (i < 10) bass += u_audioData[i];
                else if (i < 20) mid += u_audioData[i];
                else high += u_audioData[i];
              }
              bass /= 10.0;
              mid /= 10.0;
              high /= 12.0;
              
              // Multiple seismograph traces
              float numTraces = 3.0 + floor(u_complexity * 3.0);
              
              for (float trace = 0.0; trace < 8.0; trace++) {
                if (trace >= numTraces) break;
                
                float yPos = (trace / numTraces) * 1.6 - 0.8;
                vec2 traceUV = uv;
                traceUV.y -= yPos;
                
                // Recording paper moves from right to left
                float speed = u_speed * (1.5 + f);
                float scrollX = mod(time * speed, 2.0);
                traceUV.x += scrollX;
                
                // Base wave amplitude driven by different frequency bands
                float waveAmp = 0.0;
                if (trace < numTraces / 3.0) {
                  waveAmp = bass * 0.3; // Low frequency traces
                } else if (trace < numTraces * 2.0 / 3.0) {
                  waveAmp = mid * 0.25; // Mid frequency traces
                } else {
                  waveAmp = high * 0.2; // High frequency traces
                }
                
                // Main seismic wave pattern
                float wave = 0.0;
                wave += sin(traceUV.x * 20.0 * u_complexity + time * 3.0 + trace) * waveAmp;
                wave += sin(traceUV.x * 40.0 * u_complexity - time * 5.0) * waveAmp * 0.5;
                wave += sin(traceUV.x * 10.0 - time * 2.0 + f * 5.0) * waveAmp * 0.3;
                
                // Earthquake shake effect on strong bass
                float quake = sin(traceUV.x * 5.0 + time * 10.0) * bass * bass * 0.4;
                wave += quake;
                
                // Main frequency response
                float freqWave = sin(traceUV.x * 30.0 + u_frequency * 0.01 - time * 4.0);
                wave += freqWave * (0.05 + audioSum * 0.15) * u_intensity;
                
                // Draw the seismograph line
                float lineThickness = 0.003 + audioSum * 0.002;
                float line = smoothstep(lineThickness * 2.0, lineThickness, abs(traceUV.y - wave));
                
                // Color based on trace and intensity
                vec3 traceColor = getColor(trace * 0.15 + f + time * 0.05);
                
                // Intensity glow
                float glow = exp(-abs(traceUV.y - wave) * 30.0) * (0.3 + audioSum * 0.7) * u_bloom;
                
                col += traceColor * (line * u_intensity + glow * 0.5);
                
                // Grid lines (horizontal)
                float gridLine = smoothstep(0.002, 0.001, abs(traceUV.y));
                col += vec3(0.1, 0.15, 0.2) * gridLine * 0.3;
              }
              
              // Vertical grid lines (time markers)
              float vGrid = sin(uv.x * 40.0) * 0.5 + 0.5;
              vGrid = smoothstep(0.98, 0.99, vGrid);
              col += vec3(0.1, 0.15, 0.2) * vGrid * 0.2;
              
              // Recording needle/head at current position
              float needleX = mod(time * u_speed * 1.5, 2.0) - 1.0;
              float needle = smoothstep(0.015, 0.005, abs(uv.x - needleX));
              needle *= smoothstep(0.9, 0.7, abs(uv.y));
              col += getColor(time * 0.3 + f) * needle * (0.5 + audioSum);
              
              // Needle glow
              float needleGlow = exp(-abs(uv.x - needleX) * 10.0) * smoothstep(0.9, 0.5, abs(uv.y));
              col += getColor(time * 0.3 + f) * needleGlow * 0.3 * (1.0 + audioSum);
              
              // Paper texture
              float paper = hash(uv * 300.0) * 0.03;
              col += vec3(paper);
              
              // Vignette edges
              float vignette = 1.0 - pow(length(uv) * 0.6, 2.0);
              col *= vignette;
              
              return col;
            }
            
            vec3 styleBinary(vec2 uv, float time, float freqNorm, float audioSum) {
              vec3 col = vec3(0.0);
              float f = freqNorm * 5.0;
              
              // Convert frequency to musical note and then to binary
              // Musical notes: A=440Hz, each semitone is 2^(1/12) higher
              float noteNum = 12.0 * log(u_frequency / 440.0) / log(2.0);
              noteNum = mod(noteNum + 120.0, 12.0); // Map to 0-11 range (C to B)
              
              // Extract frequency bands for note detection
              float bass = 0.0;
              float mid = 0.0;
              float high = 0.0;
              for (int i = 0; i < 32; i++) {
                if (i < 10) bass += u_audioData[i];
                else if (i < 20) mid += u_audioData[i];
                else high += u_audioData[i];
              }
              bass /= 10.0;
              mid /= 10.0;
              high /= 12.0;
              
              // Create binary rain grid
              vec2 gridSize = vec2(30.0 + f * 20.0, 40.0);
              vec2 gridUV = uv * gridSize;
              vec2 gridID = floor(gridUV);
              vec2 gridLocal = fract(gridUV);
              
              // Time-based flow with music
              float flowSpeed = u_speed * (2.0 + audioSum * 3.0 + bass * 5.0);
              float flow = time * flowSpeed;
              
              // Each column has different speed based on hash
              float colHash = hash(vec2(gridID.x, 0.0));
              float colSpeed = 0.5 + colHash * 1.5;
              float yOffset = mod(flow * colSpeed + colHash * 100.0, gridSize.y * 2.0);
              
              // Determine if this cell shows a bit
              float cellY = gridID.y + yOffset;
              float cellHash = hash(vec2(gridID.x, floor(cellY)));
              
              // Convert note to binary (8-bit representation)
              float noteBinary = floor(noteNum);
              float bitPosition = mod(floor(cellY), 8.0);
              float bitValue = mod(floor(noteBinary / pow(2.0, bitPosition)), 2.0);
              
              // Add audio-reactive random bits
              float randomBit = step(0.5 + audioSum * 0.3, cellHash);
              
              // Mix note bits with audio bits
              float finalBit = mix(bitValue, randomBit, 0.3 + sin(time + gridID.x) * 0.2);
              
              // Strong pulse with bass
              float pulse = sin(cellY * 0.5 - flow * 2.0 + bass * 10.0) * 0.5 + 0.5;
              pulse *= (1.0 + bass * 3.0);
              
              // Trail effect - fade from head to tail
              float trailLength = 8.0 + mid * 10.0;
              float distFromHead = mod(gridID.y - cellY, gridSize.y);
              float trail = smoothstep(trailLength, 0.0, distFromHead);
              trail *= pulse;
              
              // Digit rendering (0 or 1)
              float digit = 0.0;
              vec2 digitPos = gridLocal - 0.5;
              
              if (finalBit < 0.5) {
                // Render '0' - circle
                float circle = length(digitPos);
                digit = smoothstep(0.35, 0.25, circle) * (1.0 - smoothstep(0.2, 0.1, circle));
              } else {
                // Render '1' - vertical line
                digit = smoothstep(0.15, 0.05, abs(digitPos.x)) * smoothstep(0.4, 0.35, abs(digitPos.y));
              }
              
              digit *= trail;
              digit *= 1.0 + audioSum * 2.0;
              
              // Color based on note value and frequency bands
              float colorShift = noteNum / 12.0 + f + time * 0.1;
              vec3 digitColor = getColor(colorShift);
              
              // Frequency-specific coloring
              digitColor.r *= 0.3 + high * 0.7;
              digitColor.g *= 0.5 + mid * 0.5;
              digitColor.b *= 0.4 + bass * 0.6;
              
              col += digitColor * digit * u_intensity;
              
              // Glow effect on active columns
              if (trail > 0.5) {
                float columnGlow = exp(-abs(digitPos.x) * 3.0) * trail;
                columnGlow *= (1.0 + audioSum * 2.0 + bass * 3.0);
                col += getColor(colorShift + 0.2) * columnGlow * 0.3 * u_bloom;
              }
              
              // Musical note annotation - show current note at bottom
              if (uv.y < -0.8) {
                float noteDisplay = sin((uv.x + noteNum / 12.0) * 50.0) * 0.5 + 0.5;
                noteDisplay *= smoothstep(-0.9, -0.8, uv.y);
                col += getColor(noteNum / 12.0 + time * 0.1) * noteDisplay * audioSum;
              }
              
              // Scanline effect
              float scanline = sin(uv.y * gridSize.y * 2.0 - time * 10.0) * 0.05 + 0.95;
              col *= scanline;
              
              // Screen flicker with strong notes
              float flicker = 1.0 + sin(time * 60.0 + audioSum * 50.0) * 0.02 * audioSum;
              col *= flicker;
              
              return col;
            }
            
            vec3 styleElectrons(vec2 uv, float time, float freqNorm, float audioSum) {
                                vec3 col = vec3(0.0);
                                float f = freqNorm * 3.0;

                                // Nucleus glow at center
                                float nucleusGlow = 0.02 / (length(uv) + 0.05);
                                nucleusGlow *= 1.0 + sin(time * u_speed * 5.0) * 0.3 * audioSum;
                                col += getColor(time * 0.1) * nucleusGlow * u_bloom * 0.5;

                                // Protons/neutrons in nucleus
                                for (float i = 0.0; i < 4.0; i++) {
                                  float angle = i * TAU / 4.0 + time * u_speed * 0.5;
                                  vec2 nucleonPos = vec2(cos(angle), sin(angle)) * 0.03;
                                  float nucleon = 0.008 / length(uv - nucleonPos);
                                  col += vec3(1.0, 0.3, 0.2) * nucleon * u_intensity * 0.5;
                                }

                                // Electron shells/orbitals
                                float numShells = 3.0 + f * 2.0;
                                for (float shell = 1.0; shell <= 5.0; shell++) {
                                  if (shell > numShells) break;

                                  float shellRadius = shell * 0.18 * (1.0 + audioSum * 0.2);

                                  // Draw orbital path (faint)
                                  float orbital = smoothstep(0.008, 0.0, abs(length(uv) - shellRadius));
                                  col += getColor(shell * 0.2 + time * 0.05) * orbital * 0.1 * u_intensity;

                                  // Electrons on this shell
                                  float electronsInShell = shell * 2.0;
                                  for (float e = 0.0; e < 10.0; e++) {
                                    if (e >= electronsInShell) break;

                                    // Electron orbit - different speeds per shell
                                    float orbitSpeed = u_speed * (2.0 - shell * 0.3) * (1.0 + f);
                                    float electronAngle = e * TAU / electronsInShell + time * orbitSpeed + shell * 1.5;

                                    // Add wobble based on frequency
                                    electronAngle += sin(time * u_speed * 3.0 + e) * f * 0.3;

                                    // 3D-like orbit tilt per shell
                                    float tilt = shell * 0.3 + sin(time * u_speed * 0.5 + shell) * 0.2;
                                    vec2 electronPos = vec2(
                                      cos(electronAngle) * shellRadius,
                                      sin(electronAngle) * shellRadius * cos(tilt)
                                    );

                                    // Electron particle
                                    float dist = length(uv - electronPos);
                                    float electronSize = 0.015 + audioSum * 0.01;
                                    float electron = electronSize / dist;
                                    electron = pow(electron, 1.5);

                                    // Electron color - blue/cyan glow
                                    vec3 electronColor = getColor(0.5 + shell * 0.1 + time * 0.1);
                                    col += electronColor * electron * u_intensity;

                                    // Motion trail
                                    for (float t = 1.0; t <= 5.0; t++) {
                                      float trailAngle = electronAngle - t * 0.15 * orbitSpeed * 0.1;
                                      vec2 trailPos = vec2(
                                        cos(trailAngle) * shellRadius,
                                        sin(trailAngle) * shellRadius * cos(tilt)
                                      );
                                      float trailDist = length(uv - trailPos);
                                      float trail = (electronSize * 0.5) / trailDist;
                                      trail *= (6.0 - t) / 6.0; // Fade trail
                                      col += electronColor * trail * u_intensity * 0.3;
                                    }
                                  }
                                }

                                // Quantum probability cloud effect
                                float cloudNoise = noise(uv * 5.0 + time * u_speed * 0.5);
                                cloudNoise *= exp(-length(uv) * 2.0);
                                col += getColor(time * 0.2 + f) * cloudNoise * u_bloom * 0.2 * (1.0 + audioSum);

                                // Energy level transitions (random flashes)
                                float flash = pow(hash(vec2(floor(time * 3.0), 0.0)), 10.0);
                                if (flash > 0.5) {
                                  float flashRadius = mod(time * 2.0, 1.0) * 0.8;
                                  float photon = smoothstep(0.05, 0.0, abs(length(uv) - flashRadius));
                                  col += getColor(time + f * 2.0) * photon * audioSum * u_bloom;
                                }

                                return col;
                              }
            
            vec3 styleCymatics(vec2 uv, float time, float freqNorm, float audioSum) {
              // Cymatics - water surface vibration patterns
              vec3 col = vec3(0.0);
              float f = freqNorm * 4.0;
              
              // Extract frequency bands
              float bass = 0.0;
              float mid = 0.0;
              float high = 0.0;
              for (int i = 0; i < 32; i++) {
                if (i < 10) bass += u_audioData[i];
                else if (i < 20) mid += u_audioData[i];
                else high += u_audioData[i];
              }
              bass /= 10.0;
              mid /= 10.0;
              high /= 12.0;
              
              // Water surface parameters
              float radius = length(uv);
              float angle = atan(uv.y, uv.x);
              
              // Multiple wave sources creating interference patterns
              vec2 sources[5];
              sources[0] = vec2(0.0, 0.0); // Center
              sources[1] = vec2(cos(time * u_speed * 0.3 + bass * 5.0) * 0.5, sin(time * u_speed * 0.3) * 0.5);
              sources[2] = vec2(cos(time * u_speed * 0.5 + 2.0 + mid * 4.0) * 0.6, sin(time * u_speed * 0.5 + 2.0) * 0.6);
              sources[3] = vec2(cos(time * u_speed * 0.7 + 4.0 + high * 6.0) * 0.4, sin(time * u_speed * 0.7 + 4.0) * 0.4);
              sources[4] = vec2(cos(angle * 3.0 + time) * 0.3, sin(angle * 3.0 + time) * 0.3);
              
              float waveHeight = 0.0;
              
              // Create interference from multiple sources
              for (int i = 0; i < 5; i++) {
                vec2 toSource = uv - sources[i];
                float dist = length(toSource);
                
                // Frequency determines wave number
                float waveNumber = 5.0 + f * 15.0 + float(i) * 2.0;
                
                // Different frequency bands control different sources
                float amplitude = 0.0;
                if (i < 2) amplitude = bass * 0.8 + audioSum * 0.4;
                else if (i < 4) amplitude = mid * 0.7 + audioSum * 0.3;
                else amplitude = high * 0.6 + audioSum * 0.3;
                
                // Wave equation with audio modulation
                float wave = sin(dist * waveNumber * u_complexity - time * u_speed * (2.0 + f * 3.0) + float(i)) * amplitude;
                wave += cos(dist * waveNumber * 0.5 * u_complexity + time * u_speed * (1.5 + f * 2.0)) * amplitude * 0.5;
                
                waveHeight += wave;
              }
              
              // Circular standing wave patterns
              float standingWave = sin(radius * (10.0 + f * 30.0) * u_complexity) * cos(angle * u_symmetry + time * u_speed);
              standingWave *= (bass * 0.5 + mid * 0.3 + high * 0.2);
              waveHeight += standingWave * 0.6;
              
              // Nodal lines (where waves cancel out)
              float nodalPattern = abs(waveHeight);
              float waterSurface = 1.0 - smoothstep(0.0, 0.3 + audioSum * 0.4, nodalPattern);
              
              // Water color with depth
              vec3 deepWater = vec3(0.0, 0.1, 0.3);
              vec3 shallowWater = getColor(f + time * 0.1 + audioSum);
              vec3 waterColor = mix(deepWater, shallowWater, waterSurface);
              
              // Add wave crests (white foam)
              float crest = smoothstep(0.7 - audioSum * 0.3, 1.0, abs(waveHeight));
              waterColor += vec3(1.0) * crest * u_intensity * (0.8 + audioSum * 0.5);
              
              // Caustics effect (light refraction)
              vec2 refractUV = uv + vec2(waveHeight * 0.1);
              float caustic = sin(refractUV.x * 20.0 + time * 2.0) * sin(refractUV.y * 20.0 - time * 2.0);
              caustic = pow(max(0.0, caustic), 3.0);
              waterColor += getColor(time * 0.3 + f) * caustic * 0.3 * u_bloom * (1.0 + audioSum);
              
              // Ripple highlights
              for (int i = 0; i < 5; i++) {
                vec2 toSource = uv - sources[i];
                float dist = length(toSource);
                float ripple = sin(dist * (15.0 + f * 20.0) - time * u_speed * 4.0 + float(i) * 1.5) * 0.5 + 0.5;
                ripple *= exp(-dist * (2.0 - f * 0.5));
                ripple *= smoothstep(1.5, 0.3, dist);
                
                float rippleIntensity = 0.0;
                if (i < 2) rippleIntensity = bass;
                else if (i < 4) rippleIntensity = mid;
                else rippleIntensity = high;
                
                waterColor += getColor(float(i) * 0.2 + f + time * 0.1) * ripple * rippleIntensity * 0.4;
              }
              
              // Specular highlights (sun reflection)
              vec3 normal = normalize(vec3(waveHeight * 2.0, waveHeight, 1.0 - abs(waveHeight)));
              vec3 lightDir = normalize(vec3(0.5, 0.8, 1.0));
              float specular = pow(max(0.0, dot(normal, lightDir)), 8.0 + audioSum * 20.0);
              waterColor += vec3(1.0, 1.0, 0.95) * specular * u_intensity * (0.5 + audioSum);
              
              // Depth gradient
              float depthFade = 1.0 - smoothstep(0.0, 1.5, radius);
              waterColor *= depthFade;
              
              // Surface tension waves (high frequency detail)
              float tension = sin(uv.x * (40.0 + high * 60.0) + time * 5.0) * sin(uv.y * (40.0 + high * 60.0) - time * 5.0);
              tension *= high * 0.2 * exp(-radius * 2.0);
              waterColor += vec3(0.8, 0.9, 1.0) * tension;
              
              // Add particle suspension in water
              float particles = hash(uv * (50.0 + audioSum * 100.0) + time * 0.5);
              particles = smoothstep(0.97 - audioSum * 0.1, 1.0, particles);
              waterColor += getColor(particles + time * 0.2) * particles * 0.3;
              
              col = waterColor * u_intensity;
              
              return col;
            }
            
      vec3 styleChladniPolar(vec2 uv, float time, float freqNorm, float audioSum) {
        vec3 col = vec3(0.0);
        float bass = 0.0; float mid = 0.0; float high = 0.0;
        for (int i = 0; i < 32; i++) {
          if (i < 10) bass += u_audioData[i];
          else if (i < 20) mid += u_audioData[i];
          else high += u_audioData[i];
        }
        bass /= 10.0; mid /= 10.0; high /= 12.0;
        float r = length(uv);
        float theta = atan(uv.y, uv.x);
        float m = floor(u_frequency / 120.0 + bass * 3.0 + 1.0);
        float n = floor(u_frequency / 200.0 + mid * 3.0 + 1.0);
        float radialWave = sin(r * (m * PI + bass * 10.0) * u_complexity - time * u_speed * 1.5);
        float angularWave = cos(theta * n + time * u_speed * 0.5 + mid * 5.0);
        float pattern = radialWave * angularWave;
        float radial2 = sin(r * (n * PI * 1.5 + mid * 8.0) * u_complexity + time * u_speed);
        float angular2 = cos(theta * m * 2.0 - time * u_speed * 0.3 + high * 4.0);
        pattern += radial2 * angular2 * 0.6;
        pattern *= (1.0 + audioSum * 2.5);
        float sand = 1.0 - smoothstep(0.0, 0.12 + audioSum * 0.15, abs(pattern));
        float glow = exp(-abs(pattern) * 3.0) * (0.5 + audioSum * 1.5) * u_bloom;
        float grain = hash(uv * 90.0 + time * 1.5) * 0.15;
        sand = clamp(sand + grain * sand, 0.0, 1.0);
        vec3 plateColor = vec3(0.08, 0.12, 0.18);
        vec3 sandColor = mix(getColor(freqNorm * 2.0 + time * 0.1), vec3(0.95, 0.9, 0.75), 0.5);
        col = mix(plateColor, sandColor, sand * u_intensity);
        col += getColor(freqNorm + time * 0.15 + audioSum) * glow;
        col *= smoothstep(1.5, 1.2, r);
        return col;
      }

      vec3 styleChladni3D(vec2 uv, float time, float freqNorm, float audioSum) {
        vec3 col = vec3(0.0);
        float bass = 0.0; float mid = 0.0; float high = 0.0;
        for (int i = 0; i < 32; i++) {
          if (i < 10) bass += u_audioData[i];
          else if (i < 20) mid += u_audioData[i];
          else high += u_audioData[i];
        }
        bass /= 10.0; mid /= 10.0; high /= 12.0;
        float tilt = 0.5 + sin(time * u_speed * 0.3) * 0.1;
        vec2 p = vec2(uv.x, uv.y / tilt);
        float depth = (uv.y + 1.0) * 0.5;
        float m = u_frequency / 140.0 + bass * 2.0;
        float n = u_frequency / 170.0 + mid * 2.0;
        float phase1 = time * u_speed * 2.0 + bass * 5.0;
        float phase2 = time * u_speed * 1.5 + mid * 4.0;
        float rot = time * u_speed * 0.08 * freqNorm;
        vec2 rp = vec2(p.x * cos(rot) - p.y * sin(rot), p.x * sin(rot) + p.y * cos(rot)) * (2.0 + u_complexity);
        float chladni = cos(m * PI * rp.x + phase1) * cos(n * PI * rp.y + phase2)
                      - cos(n * PI * rp.x + phase2) * cos(m * PI * rp.y + phase1);
        float hx = cos(m * PI * (rp.x + 0.01) + phase1) * cos(n * PI * rp.y + phase2)
                 - cos(n * PI * (rp.x + 0.01) + phase2) * cos(m * PI * rp.y + phase1);
        float hy = cos(m * PI * rp.x + phase1) * cos(n * PI * (rp.y + 0.01) + phase2)
                 - cos(n * PI * rp.x + phase2) * cos(m * PI * (rp.y + 0.01) + phase1);
        vec3 normal = normalize(vec3(-(hx - chladni) / 0.01, -(hy - chladni) / 0.01, 0.3));
        vec3 lightDir = normalize(vec3(0.4, 0.8 + sin(time * 0.5) * 0.3, 1.0));
        float diffuse = max(0.0, dot(normal, lightDir));
        float specular = pow(max(0.0, dot(reflect(-lightDir, normal), vec3(0.0, 0.0, 1.0))), 12.0 + audioSum * 20.0);
        float heightMap = chladni * (1.0 + audioSum * 2.0);
        float sand = 1.0 - smoothstep(0.0, 0.1 + audioSum * 0.12, abs(heightMap));
        float grain = hash(p * 100.0 + time) * 0.12;
        sand = clamp(sand + grain * sand, 0.0, 1.0);
        vec3 plateColor = mix(vec3(0.04, 0.06, 0.1), vec3(0.12, 0.16, 0.22), depth);
        vec3 sandColor = mix(vec3(0.6, 0.55, 0.4), getColor(freqNorm * 2.0 + time * 0.1 + audioSum), 0.45);
        sandColor *= (0.6 + diffuse * 0.6);
        sandColor += vec3(specular * 0.4 * (1.0 + audioSum));
        col = mix(plateColor, sandColor, sand * u_intensity);
        col *= smoothstep(1.4, 0.9, length(uv * vec2(0.85, 1.0)));
        col += getColor(freqNorm + time * 0.2 + audioSum * 2.0) * exp(-abs(heightMap) * 2.0) * u_bloom * (0.4 + audioSum * 0.8);
        return col;
      }

      vec3 styleChladniStorm(vec2 uv, float time, float freqNorm, float audioSum) {
        vec3 col = vec3(0.0);
        float bass = 0.0; float mid = 0.0; float high = 0.0;
        for (int i = 0; i < 32; i++) {
          if (i < 10) bass += u_audioData[i];
          else if (i < 20) mid += u_audioData[i];
          else high += u_audioData[i];
        }
        bass /= 10.0; mid /= 10.0; high /= 12.0;
        float m = u_frequency / 130.0 + bass * 3.0;
        float n = u_frequency / 160.0 + mid * 3.0;
        float rotation = time * u_speed * 0.2 * (1.0 + bass * 3.0);
        vec2 p = uv * (2.5 + u_complexity + high * 2.0);
        p = vec2(p.x * cos(rotation) - p.y * sin(rotation), p.x * sin(rotation) + p.y * cos(rotation));
        float shake = bass * bass * 0.15;
        p += vec2(sin(time * 40.0 + p.y * 5.0) * shake, cos(time * 37.0 + p.x * 5.0) * shake);
        float phase1 = time * u_speed * 3.0 + bass * 10.0;
        float phase2 = time * u_speed * 2.5 + mid * 8.0;
        float c1 = cos(m * PI * p.x + phase1) * cos(n * PI * p.y + phase2)
                 - cos(n * PI * p.x + phase2) * cos(m * PI * p.y + phase1);
        float c2 = cos(m * 1.7 * PI * p.x - phase1 + high * 5.0) * cos(n * 1.3 * PI * p.y + mid * 3.0)
                 - cos(n * 1.3 * PI * p.x + mid * 3.0) * cos(m * 1.7 * PI * p.y - phase2 + high * 5.0);
        float pattern = (c1 * (0.6 + bass) + c2 * (0.4 + high)) * (1.0 + audioSum * 4.0);
        float sand = 1.0 - smoothstep(0.0, 0.08 + audioSum * 0.25 + bass * 0.3, abs(pattern));
        float flyingSand = 0.0;
        for (float i = 0.0; i < 6.0; i++) {
          float t2 = fract(time * u_speed * (0.5 + i * 0.1) + i * 0.17);
          float angle = i * TAU / 6.0 + time * 2.0 + bass * 10.0;
          vec2 trajPos = uv - vec2(cos(angle), sin(angle)) * t2 * (0.5 + bass);
          float grain2 = hash(vec2(i, floor(t2 * 20.0))) * 0.02;
          flyingSand += smoothstep(grain2 + 0.005, grain2, length(trajPos)) * (1.0 - t2) * (bass + mid);
        }
        float beatFlash = pow(max(0.0, bass - 0.3) / 0.7, 2.0);
        float lightning = 0.0;
        for (float i = 0.0; i < 4.0; i++) {
          float lAngle = i * PI * 0.5 + time * 3.0;
          vec2 lDir = vec2(cos(lAngle), sin(lAngle));
          float lDist = abs(dot(uv, vec2(-lDir.y, lDir.x)));
          float lLen = dot(uv, lDir);
          float bolt = 0.004 / (lDist + 0.01);
          bolt *= sin(lLen * 60.0 + time * 30.0) * 0.5 + 0.5;
          bolt *= exp(-abs(abs(lLen) - 0.5) * 5.0) * beatFlash;
          lightning += bolt;
        }
        float grain = hash(p * 120.0 + time * (2.0 + audioSum * 5.0)) * (0.2 + audioSum * 0.3);
        sand = clamp(sand + grain * sand + flyingSand, 0.0, 1.0);
        vec3 plateColor = vec3(0.06, 0.08, 0.12);
        vec3 sandColor = mix(getColor(freqNorm * 2.0 + time * 0.15 + audioSum * 3.0), vec3(0.95, 0.9, 0.7), 0.35);
        sandColor += vec3(bass * 0.3, mid * 0.1, 0.0);
        col = mix(plateColor, sandColor, sand * u_intensity);
        float glowPulse = (1.0 + sin(time * u_speed * 12.0 + bass * 30.0) * 0.7) * (bass * 3.0 + audioSum * 2.0);
        col += getColor(freqNorm * 3.0 + time * 0.2 + audioSum * 4.0) * exp(-abs(pattern) * 1.5) * glowPulse * u_bloom;
        col += getColor(time * 0.5) * lightning * u_intensity * (1.0 + audioSum);
        float sparkle = pow(hash(p * 250.0 + time * (5.0 + bass * 20.0)), max(1.0, 15.0 - bass * 12.0)) * (audioSum + bass) * 4.0;
        col += getColor(time * 0.8 + freqNorm * 2.0) * sparkle;
        col *= 1.0 - pow(length(uv) * 0.6, 2.0);
        return col;
      }

      vec3 styleChladniClassic(vec2 uv, float time, float freqNorm, float audioSum) {
        // Pure Chladni plate - fixed mode numbers from frequency, no pulsing
        vec3 col = vec3(0.0);

        // Fixed mode numbers derived purely from frequency — no audio-reactive drift
        float m = u_frequency / 150.0;
        float n = u_frequency / 180.0;

        // Scale UV to plate coordinates, very slow rotation only
        vec2 p = uv * (2.0 + u_complexity);
        float rotation = time * u_speed * 0.04;
        p = vec2(p.x * cos(rotation) - p.y * sin(rotation),
                 p.x * sin(rotation) + p.y * cos(rotation));

        // Classic Chladni equation — no phase animation, no beat influence
        float chladni = cos(m * PI * p.x) * cos(n * PI * p.y)
                      - cos(n * PI * p.x) * cos(m * PI * p.y);

        // Second harmonic at fixed ratio
        float m2 = m * 1.5;
        float n2 = n * 1.5;
        float chladni2 = cos(m2 * PI * p.x) * cos(n2 * PI * p.y)
                       - cos(n2 * PI * p.x) * cos(m2 * PI * p.y);

        float pattern = chladni * 0.7 + chladni2 * 0.3;

        // Sharp nodal lines — sand stays put
        float sand = 1.0 - smoothstep(0.0, 0.07, abs(pattern));

        // Static grain texture
        float grain = hash(p * 90.0) * 0.18;
        sand = clamp(sand + grain * sand, 0.0, 1.0);

        // Neutral plate and warm sand colors
        vec3 plateColor = vec3(0.1, 0.12, 0.16);
        vec3 sandColor = mix(vec3(0.88, 0.82, 0.65), getColor(freqNorm * 1.5), 0.25);

        col = mix(plateColor, sandColor, sand * u_intensity);

        // Subtle glow only on nodal lines, no center bloom
        float glow = exp(-abs(pattern) * 4.0) * u_bloom * 0.5;
        col += getColor(freqNorm + time * 0.05) * glow;

        // Hard plate border
        col *= smoothstep(1.5, 1.35, length(uv));

        return col;
      }

            vec3 styleChladni(vec2 uv, float time, float freqNorm, float audioSum) {
              // Animated Chladni plate simulation - sand patterns on vibrating metal
              vec3 col = vec3(0.0);

              // Extract frequency bands from audio data for multi-frequency response
              float bass = 0.0;
              float mid = 0.0;
              float high = 0.0;
              for (int i = 0; i < 32; i++) {
                if (i < 10) bass += u_audioData[i];
                else if (i < 20) mid += u_audioData[i];
                else high += u_audioData[i];
              }
              bass /= 10.0;
              mid /= 10.0;
              high /= 12.0;

              // Frequency determines the mode numbers (m, n) - now audio-reactive
              float freq = u_frequency;
              float baseM = freq / 150.0 + bass * 2.0;
              float baseN = freq / 180.0 + mid * 2.0;

              // Animate mode numbers with time and music
              float m = baseM + sin(time * u_speed * 0.5 + bass * 10.0) * (0.5 + bass * 2.0);
              float n = baseN + cos(time * u_speed * 0.7 + mid * 8.0) * (0.5 + mid * 2.0);

              // Scale UV to plate coordinates with music-driven rotation
              float rotation = time * u_speed * 0.1 * freqNorm + bass * 0.5;
              vec2 p = uv * (2.0 + u_complexity + high * 1.5);
              p = vec2(p.x * cos(rotation) - p.y * sin(rotation), 
                       p.x * sin(rotation) + p.y * cos(rotation));

              // Music-driven displacement
              float displacement = sin(time * u_speed * 8.0 + bass * 20.0) * audioSum * 0.2;
              p += vec2(sin(mid * 15.0), cos(high * 12.0)) * displacement;

              // Classic Chladni equation with music-reactive parameters
              float phase1 = time * u_speed * 2.0 + bass * 5.0;
              float phase2 = time * u_speed * 1.5 + mid * 4.0;
              float chladni1 = cos(m * PI * p.x + phase1) * cos(n * PI * p.y + phase2) 
                             - cos(n * PI * p.x + phase2) * cos(m * PI * p.y + phase1);

              // Second harmonic responds to mid frequencies
              float m2 = m * 1.5 + sin(time * u_speed + mid * 10.0);
              float n2 = n * 1.5 + cos(time * u_speed * 0.8 + mid * 8.0);
              float chladni2 = cos(m2 * PI * p.x - phase1 + mid * 3.0) * cos(n2 * PI * p.y + mid * 2.0) 
                             - cos(n2 * PI * p.x + mid * 2.0) * cos(m2 * PI * p.y - phase2 + mid * 3.0);

              // Third harmonic responds to high frequencies
              float chladni3 = sin(m * PI * p.x * 0.5 + time * u_speed * 3.0 + high * 15.0) 
                             * sin(n * PI * p.y * 0.5 + time * u_speed * 2.5 + high * 12.0);

              // Mix patterns based on frequency bands
              float pattern = chladni1 * (0.5 + bass * 0.5) + chladni2 * (0.3 + mid * 0.4) + chladni3 * (0.2 + high * 0.5);
              pattern *= (1.0 + audioSum * 3.0); // Strong amplification with music

              // Music-reactive sand accumulation
              float sandThreshold = 0.1 + sin(time * u_speed * 4.0 + bass * 8.0) * 0.05 * audioSum;
              float sand = 1.0 - smoothstep(0.0, sandThreshold + audioSum * 0.2 + bass * 0.3, abs(pattern));

              // Intense vibrating sand particles - bass-driven
              float vibFreq = 10.0 + freqNorm * 30.0 + bass * 50.0;
              float vibration = sin(time * u_speed * vibFreq + p.x * 20.0 + bass * 30.0) 
                              * sin(time * u_speed * vibFreq * 1.1 + p.y * 20.0 + mid * 25.0) * (0.1 + audioSum * 0.3);
              sand += vibration;

              // Animated grain texture - particles moving with music
              float grainTime = time * u_speed * 2.0 + audioSum * 5.0;
              vec2 grainOffset = vec2(sin(grainTime + p.y * 5.0 + bass * 10.0), cos(grainTime + p.x * 5.0 + mid * 8.0)) * (0.02 + audioSum * 0.05);
              float grain = hash((p + grainOffset) * (80.0 + high * 100.0)) * 0.2;
              grain += hash((p - grainOffset) * (120.0 + bass * 80.0) + grainTime) * (0.1 + high * 0.3);
              sand = clamp(sand + grain * sand * (1.0 + audioSum * 2.0), 0.0, 1.0);

              // Animated plate color responds to bass
              float shimmer = sin(time * u_speed * 3.0 + length(p) * 2.0 + bass * 10.0) * (0.02 + bass * 0.05);
              vec3 plateColor = vec3(0.12 + shimmer + bass * 0.1, 0.14 + shimmer + mid * 0.08, 0.18 + shimmer + high * 0.12);

              // Sand color responds to frequency content
              vec3 sandColor = getColor(freqNorm * 2.0 + time * 0.1 + m * 0.05 + audioSum);
              vec3 naturalSand = vec3(0.9 + mid * 0.1, 0.85 + bass * 0.15, 0.7 + high * 0.2) + vec3(grain * 0.2);
              sandColor = mix(sandColor, naturalSand, 0.4 - audioSum * 0.2);

              // Combine plate and sand with music-driven intensity
              float pulseIntensity = u_intensity * (1.0 + sin(time * u_speed * 5.0 + bass * 20.0) * (0.1 + audioSum * 0.5));
              col = mix(plateColor, sandColor, sand * pulseIntensity);

              // Strong metallic reflection ripples with music
              float ripple = sin(length(p) * (10.0 + mid * 20.0) - time * u_speed * 5.0 - bass * 15.0) * 0.5 + 0.5;
              float reflection = pow(max(0.0, 1.0 - abs(pattern)), 4.0) * (0.4 + audioSum * 0.6) * ripple;
              col += getColor(time * 0.2 + freqNorm * 3.0 + audioSum * 2.0) * reflection * (1.0 - sand) * u_bloom * (1.0 + high);

              // Intense glowing nodal lines pulsing with music
              float glowPulse = (1.0 + sin(time * u_speed * 8.0 + bass * 25.0) * 0.5) * (audioSum + bass * 2.0);
              float glow = exp(-abs(pattern) * 2.0) * glowPulse * u_bloom * (1.0 + mid * 2.0);
              col += getColor(freqNorm * 2.0 + time * 0.15 + audioSum * 3.0) * glow * (0.6 + audioSum);

              // Particle sparkles react strongly to high frequencies
              float sparkle = pow(hash(p * (200.0 + high * 200.0) + time * (3.0 + audioSum * 10.0)), 20.0 - high * 15.0) * sand * (audioSum + high) * 3.0;
              col += getColor(time * 0.5 + freqNorm + high * 2.0) * sparkle;

              // Edge vibration driven by bass
              float edgeVib = sin(atan(uv.y, uv.x) * u_symmetry + time * u_speed * 2.0 + bass * 20.0) * (0.05 + bass * 0.15);
              float border = smoothstep(1.8 + edgeVib, 1.4 + edgeVib, length(uv * 1.5));
              col *= border;
              col += vec3(0.02 + audioSum * 0.05) * (1.0 - border);

              return col;
            }
      
      void main() {
        vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution) / min(u_resolution.x, u_resolution.y);
        vec2 uv0 = uv;
        
        float time = u_time * u_speed;
        float freqNorm = u_frequency / 2000.0;

                  // Binaural beat modulation
                  float binauralMod = 1.0;
                  if (u_binauralEnabled > 0.5) {
                    binauralMod = 1.0 + sin(time * u_binauralFreq * TAU) * 0.3;
                    uv *= 1.0 + sin(time * u_binauralFreq * TAU) * 0.05;
                    uv = uv * mat2(cos(sin(time * u_binauralFreq) * 0.1), -sin(sin(time * u_binauralFreq) * 0.1), 
                                   sin(sin(time * u_binauralFreq) * 0.1), cos(sin(time * u_binauralFreq) * 0.1));
                  }

                  // Isochronic pulse modulation
                  float isochronicMod = 1.0;
                  if (u_isochronicEnabled > 0.5) {
                    float pulse = (sin(time * u_isochronicFreq * TAU) + 1.0) * 0.5;
                    isochronicMod = 1.0 - u_isochronicDepth * (1.0 - pulse);
                  }

                  // Enhanced audio analysis with frequency band separation
                  float audioSum = 0.0;
                  float bassSum = 0.0;
                  float midSum = 0.0;
                  float highSum = 0.0;
                  for (int i = 0; i < 32; i++) {
                    audioSum += u_audioData[i];
                    if (i < 10) bassSum += u_audioData[i];
                    else if (i < 20) midSum += u_audioData[i];
                    else highSum += u_audioData[i];
                  }
                  audioSum /= 32.0;
                  bassSum /= 10.0;
                  midSum /= 10.0;
                  highSum /= 12.0;

                  // Amplify audio response
                  audioSum = pow(audioSum, 0.7) * 1.5;
                  bassSum = pow(bassSum, 0.6) * 2.0;
                  midSum = pow(midSum, 0.7) * 1.8;
                  highSum = pow(highSum, 0.8) * 1.6;
        
        vec3 finalColor = vec3(0.0);
        
        if (u_visualStyle == 0) {
          finalColor = styleFractal(uv, uv0, time, freqNorm, audioSum);
        } else if (u_visualStyle == 1) {
          finalColor = styleTunnel(uv, time, freqNorm, audioSum);
        } else if (u_visualStyle == 2) {
          finalColor = styleKaleidoscope(uv, time, freqNorm, audioSum);
        } else if (u_visualStyle == 3) {
          finalColor = stylePlasma(uv, time, freqNorm, audioSum);
        } else if (u_visualStyle == 4) {
          finalColor = styleWaveform(uv, time, freqNorm, audioSum);
        } else if (u_visualStyle == 5) {
          finalColor = styleParticles(uv, time, freqNorm, audioSum);
        } else if (u_visualStyle == 6) {
          finalColor = styleGeometric(uv, time, freqNorm, audioSum);
        } else if (u_visualStyle == 7) {
          finalColor = styleSpiral(uv, time, freqNorm, audioSum);
        } else if (u_visualStyle == 8) {
          finalColor = styleMatrix(uv, time, freqNorm, audioSum);
        } else if (u_visualStyle == 9) {
          finalColor = styleNebula(uv, time, freqNorm, audioSum);
        } else if (u_visualStyle == 10) {
          finalColor = styleRings(uv, time, freqNorm, audioSum);
        } else if (u_visualStyle == 11) {
          finalColor = styleHexgrid(uv, time, freqNorm, audioSum);
        } else if (u_visualStyle == 12) {
          finalColor = styleChladni(uv, time, freqNorm, audioSum);
        } else if (u_visualStyle == 13) {
                        finalColor = styleAurora(uv, time, freqNorm, audioSum);
                      } else if (u_visualStyle == 14) {
                        finalColor = styleFireworks(uv, time, freqNorm, audioSum);
                      } else if (u_visualStyle == 15) {
                        finalColor = styleMandala(uv, time, freqNorm, audioSum);
                      } else if (u_visualStyle == 16) {
                        finalColor = styleLiquid(uv, time, freqNorm, audioSum);
                      } else if (u_visualStyle == 17) {
                                                                  finalColor = styleElectric(uv, time, freqNorm, audioSum);
                                                                } else if (u_visualStyle == 18) {
                                                                                                            finalColor = styleElectrons(uv, time, freqNorm, audioSum);
                                                                                                          } else if (u_visualStyle == 19) {
                                                                                                            finalColor = styleBinary(uv, time, freqNorm, audioSum);
                                                                                                          } else if (u_visualStyle == 20) {
                                                                                                            finalColor = styleSeismograph(uv, time, freqNorm, audioSum);
                                                                                                          } else if (u_visualStyle == 21) {
                                                                                                            finalColor = styleCymatics(uv, time, freqNorm, audioSum);
                                                                                                          } else if (u_visualStyle == 22) {
                                                                                                            finalColor = styleChladniPolar(uv, time, freqNorm, audioSum);
                                                                                                          } else if (u_visualStyle == 23) {
                                                                                                            finalColor = styleChladni3D(uv, time, freqNorm, audioSum);
                                                                                                          } else if (u_visualStyle == 24) {
                                                                                                            finalColor = styleChladniStorm(uv, time, freqNorm, audioSum);
                                                                                                          } else {
                                                                                                            finalColor = styleChladniClassic(uv, time, freqNorm, audioSum);
                                                                                                          }
        
        // Enhanced glow with stronger frequency and amplitude response
        vec3 glowColor = getColor(freqNorm * 2.0 + time * 0.15);
        float glow = exp(-length(uv0) * (2.0 - freqNorm * 1.5)) * u_bloom;
        glow *= (1.0 + audioSum * 3.0 + bassSum * 2.0);
        finalColor += glowColor * glow * u_amplitude * (0.5 + u_amplitude * 0.8);

        // Add pulsing energy rings based on amplitude
        float pulseRing = sin(length(uv0) * (20.0 + freqNorm * 30.0) - time * (5.0 + audioSum * 15.0));
        pulseRing = pow(max(0.0, pulseRing), 3.0);
        pulseRing *= exp(-abs(length(uv0) - 0.5) * 10.0) * (audioSum + bassSum * 0.5);
        finalColor += getColor(time * 0.3 + freqNorm) * pulseRing * u_amplitude * 0.6;
        
        float vignette = 1.0 - length(uv0) * 0.4;
                                finalColor *= vignette;

                                // Enhanced touch reactive effects with wave particles
                                for (int i = 0; i < 5; i++) {
                                  if (float(i) >= u_touchCount) break;
                                  vec2 touchPos = u_touchPoints[i];
                                  float touchDist = length(uv - touchPos);

                                  // Multi-layered ripples with amplitude response
                                  float ampBoost = 1.0 + u_amplitude * 3.0;
                                  for (float r = 0.0; r < 3.0; r++) {
                                    float ripple = sin(touchDist * (30.0 + r * 10.0) - time * (8.0 + r * 2.0)) * 0.5 + 0.5;
                                    ripple *= exp(-touchDist * (3.0 - r * 0.5));
                                    ripple *= smoothstep(1.0, 0.0, touchDist);
                                    ripple *= ampBoost;
                                    finalColor += getColor(touchDist + time * 0.5 + r * 0.3) * ripple * (0.8 - r * 0.2);
                                  }

                                  // Frequency-reactive particle spray from touch
                                  float angle = atan(uv.y - touchPos.y, uv.x - touchPos.x);
                                  for (float p = 0.0; p < 8.0; p++) {
                                    float particleAngle = angle + p * TAU / 8.0 + time * freqNorm * 5.0;
                                    float particleRadius = time * 0.3 * (1.0 + freqNorm * 2.0);
                                    particleRadius = mod(particleRadius, 1.0);
                                    vec2 particlePos = touchPos + vec2(cos(particleAngle), sin(particleAngle)) * particleRadius;
                                    float particleDist = length(uv - particlePos);
                                    float particle = 0.02 / (particleDist + 0.01);
                                    particle *= (1.0 - particleRadius) * ampBoost;
                                    finalColor += getColor(p * 0.1 + freqNorm + time * 0.2) * particle * 0.4;
                                  }

                                  // Intense glow at touch point with frequency modulation
                                  float touchGlow = 0.08 / (touchDist + 0.03);
                                  touchGlow *= (1.0 + sin(time * 10.0 + freqNorm * 20.0) * 0.5) * ampBoost;
                                  finalColor += getColor(time * 0.3 + float(i) * 0.2 + freqNorm) * touchGlow * 0.6;

                                  // Energy waves between touch points
                                  if (u_touchCount > 1.0 && i > 0) {
                                    vec2 prevTouch = u_touchPoints[i - 1];
                                    vec2 midPoint = (touchPos + prevTouch) * 0.5;
                                    float lineEffect = abs(dot(normalize(touchPos - prevTouch), normalize(uv - midPoint)));
                                    lineEffect = pow(1.0 - lineEffect, 8.0);
                                    float wave = sin(length(uv - midPoint) * 60.0 - time * 15.0) * 0.5 + 0.5;
                                    wave *= exp(-length(uv - midPoint) * 2.0) * lineEffect;
                                    finalColor += getColor(float(i) * 0.5 + time * 0.4) * wave * ampBoost * 0.8;
                                  }
                                }

                                // Enhanced drag with wave particle trail
                                if (length(u_dragVelocity) > 0.01) {
                                  float dragStrength = length(u_dragVelocity) * 5.0;
                                  vec2 dragDir = normalize(u_dragVelocity);

                                  // Wave wake effect
                                  float perpDist = abs(dot(uv, vec2(-dragDir.y, dragDir.x)));
                                  float alongDist = dot(uv, dragDir);
                                  float wake = exp(-perpDist * (8.0 - dragStrength));
                                  wake *= sin(perpDist * 40.0 + alongDist * 20.0 - time * 20.0) * 0.5 + 0.5;
                                  wake *= smoothstep(-0.5, 0.5, alongDist);
                                  finalColor += getColor(alongDist + time * 0.8 + freqNorm) * wake * dragStrength * 0.5;

                                  // Particle trail following drag
                                  for (float t = 0.0; t < 10.0; t++) {
                                    vec2 trailPos = dragDir * (t * 0.15 - 0.5);
                                    float trailDist = length(uv - trailPos);
                                    float trail = 0.03 / (trailDist + 0.02);
                                    trail *= (1.0 - t / 10.0) * dragStrength;
                                    finalColor += getColor(t * 0.1 + time * 0.5) * trail * 0.3;
                                  }

                                  // Directional streaks
                                  float streak = exp(-perpDist * 12.0);
                                  streak *= sin(alongDist * 80.0 - time * 30.0 * dragStrength) * 0.5 + 0.5;
                                  finalColor += getColor(time + freqNorm * 2.0) * streak * dragStrength * u_amplitude * 0.4;
                                }

                                // Apply beat modulations
                  finalColor *= binauralMod * isochronicMod;

                  // Add pulsing glow for isochronic
                  if (u_isochronicEnabled > 0.5) {
                    float pulse = (sin(time * u_isochronicFreq * TAU) + 1.0) * 0.5;
                    vec3 pulseColor = getColor(time * 0.1 + pulse);
                    finalColor += pulseColor * pulse * u_isochronicDepth * 0.2 * u_bloom;
                  }

                  // Add stereo-like color shift for binaural
                  if (u_binauralEnabled > 0.5) {
                    float shift = sin(time * u_binauralFreq * TAU) * 0.5;
                    finalColor.r *= 1.0 + shift * 0.2;
                    finalColor.b *= 1.0 - shift * 0.2;
                  }

                  finalColor = clamp(finalColor, 0.0, 1.0);
                  gl_FragColor = vec4(finalColor, 1.0);
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

    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const frequencyLocation = gl.getUniformLocation(program, 'u_frequency');
    const amplitudeLocation = gl.getUniformLocation(program, 'u_amplitude');
    const waveTypeLocation = gl.getUniformLocation(program, 'u_waveType');
    const audioDataLocation = gl.getUniformLocation(program, 'u_audioData');
    const visualStyleLocation = gl.getUniformLocation(program, 'u_visualStyle');
    const colorPaletteLocation = gl.getUniformLocation(program, 'u_colorPalette');
    const speedLocation = gl.getUniformLocation(program, 'u_speed');
    const intensityLocation = gl.getUniformLocation(program, 'u_intensity');
    const complexityLocation = gl.getUniformLocation(program, 'u_complexity');
    const symmetryLocation = gl.getUniformLocation(program, 'u_symmetry');
    const bloomLocation = gl.getUniformLocation(program, 'u_bloom');
          const binauralEnabledLocation = gl.getUniformLocation(program, 'u_binauralEnabled');
          const binauralFreqLocation = gl.getUniformLocation(program, 'u_binauralFreq');
          const isochronicEnabledLocation = gl.getUniformLocation(program, 'u_isochronicEnabled');
          const isochronicFreqLocation = gl.getUniformLocation(program, 'u_isochronicFreq');
          const isochronicDepthLocation = gl.getUniformLocation(program, 'u_isochronicDepth');
          const touchPointsLocation = gl.getUniformLocation(program, 'u_touchPoints');
          const touchCountLocation = gl.getUniformLocation(program, 'u_touchCount');
          const dragVelocityLocation = gl.getUniformLocation(program, 'u_dragVelocity');

          const waveTypes = { sine: 0, square: 1, sawtooth: 2, triangle: 3 };
    const visualStyles = { fractal: 0, tunnel: 1, kaleidoscope: 2, plasma: 3, waveform: 4, particles: 5, geometric: 6, spiral: 7, matrix: 8, nebula: 9, rings: 10, hexgrid: 11, chladni: 12, aurora: 13, fireworks: 14, mandala: 15, liquid: 16, electric: 17, electrons: 18, binary: 19, seismograph: 20, cymatics: 21, 'chladni-polar': 22, 'chladni-3d': 23, 'chladni-storm': 24, 'chladni-classic': 25 };
          const colorPalettes = { cyber: 0, fire: 1, nature: 2, ocean: 3, sunset: 4, neon: 5, aurora: 6, lava: 7, ice: 8, candy: 9, galaxy: 10 };

    const render = () => {
      const canvas = canvasRef.current;
      canvas.width = canvas.clientWidth * window.devicePixelRatio;
      canvas.height = canvas.clientHeight * window.devicePixelRatio;
      
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);

      const time = (Date.now() - startTimeRef.current) / 1000;
      
      let audioData = new Float32Array(32).fill(0.5);
      if (analyserNode && isPlaying) {
        const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
        analyserNode.getByteFrequencyData(dataArray);
        for (let i = 0; i < 32; i++) {
          const index = Math.floor(i * dataArray.length / 32);
          audioData[i] = dataArray[index] / 255;
        }
      }

      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, time);
      gl.uniform1f(frequencyLocation, frequency);
      gl.uniform1f(amplitudeLocation, isPlaying ? 1.0 : 0.3);
      gl.uniform1f(waveTypeLocation, waveTypes[waveType] || 0);
      gl.uniform1fv(audioDataLocation, audioData);
      gl.uniform1i(visualStyleLocation, visualStyles[visualStyle] || 0);
      gl.uniform1i(colorPaletteLocation, colorPalettes[colorPalette] || 0);
      gl.uniform1f(speedLocation, speed);
      gl.uniform1f(intensityLocation, intensity);
      gl.uniform1f(complexityLocation, complexity);
      gl.uniform1f(symmetryLocation, symmetry);
      gl.uniform1f(bloomLocation, bloom);
              gl.uniform1f(binauralEnabledLocation, binauralEnabled ? 1.0 : 0.0);
              gl.uniform1f(binauralFreqLocation, binauralFreq);
              gl.uniform1f(isochronicEnabledLocation, isochronicEnabled ? 1.0 : 0.0);
              gl.uniform1f(isochronicFreqLocation, isochronicFreq);
                                  gl.uniform1f(isochronicDepthLocation, isochronicDepth);

                        // Touch points (normalized to -1 to 1 range)
                        const touchData = new Float32Array(10).fill(0);
                        touchPoints.slice(0, 5).forEach((point, i) => {
                          touchData[i * 2] = point.x;
                          touchData[i * 2 + 1] = point.y;
                        });
                        gl.uniform2fv(touchPointsLocation, touchData);
                        gl.uniform1f(touchCountLocation, Math.min(touchPoints.length, 5));
                        gl.uniform2f(dragVelocityLocation, dragVelocity.x, dragVelocity.y);

                                  gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [frequency, isPlaying, waveType, analyserNode, visualStyle, colorPalette, speed, intensity, complexity, symmetry, bloom, binauralEnabled, binauralFreq, isochronicEnabled, isochronicFreq, isochronicDepth, touchPoints, dragVelocity]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full absolute inset-0"
      style={{ background: '#0a0a0f' }}
    />
  );
}