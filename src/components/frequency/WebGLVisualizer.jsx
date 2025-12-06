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
              
              vec2 p = uv;
              p.y += 0.5;
              
              for (float i = 0.0; i < 5.0; i++) {
                float wave = sin(p.x * (3.0 + i) + time * u_speed * (0.5 + i * 0.2) + f * 5.0);
                wave += sin(p.x * (5.0 + i * 2.0) - time * u_speed * 0.3) * 0.5;
                wave *= 0.15 + f * 0.1;
                
                float dist = abs(p.y - wave - i * 0.15);
                float glow = 0.02 / dist;
                glow *= 1.0 + audioSum;
                
                col += getColor(i * 0.2 + time * 0.1 + f) * glow * u_intensity * 0.5;
              }
              
              col += getColor(f + time * 0.05) * exp(-length(uv) * 1.5) * u_bloom;
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

              vec3 styleDNA(vec2 uv, float time, float freqNorm, float audioSum) {
                vec3 col = vec3(0.0);
                float f = freqNorm * 4.0;
                
                // Rotate based on frequency
                float rotation = time * u_speed * (0.5 + f);
                uv = vec2(uv.x * cos(rotation) - uv.y * sin(rotation), 
                         uv.x * sin(rotation) + uv.y * cos(rotation));
                
                // Double helix structure
                float helixSpeed = time * u_speed * (2.0 + f * 2.0);
                float twist = uv.y * (5.0 + f * 10.0) + helixSpeed;
                
                // Strand 1
                vec2 strand1 = vec2(
                  uv.x - sin(twist) * 0.3,
                  uv.y
                );
                float dist1 = length(vec2(strand1.x, 0.0));
                float helix1 = 0.02 / dist1;
                helix1 *= smoothstep(1.5, 0.0, abs(strand1.y));
                
                // Strand 2
                vec2 strand2 = vec2(
                  uv.x + sin(twist) * 0.3,
                  uv.y
                );
                float dist2 = length(vec2(strand2.x, 0.0));
                float helix2 = 0.02 / dist2;
                helix2 *= smoothstep(1.5, 0.0, abs(strand2.y));
                
                col += getColor(f + time * 0.1) * helix1 * u_intensity;
                col += getColor(f + 0.3 + time * 0.1) * helix2 * u_intensity;
                
                // Base pairs connecting the strands
                float pairs = mod(twist, PI / 2.0);
                if (pairs < 0.3) {
                  float baseX = sin(twist) * 0.3;
                  float bridgeDist = abs(uv.x / baseX - 1.0);
                  if (abs(baseX) > 0.01) {
                    float bridge = smoothstep(0.3, 0.0, bridgeDist) * smoothstep(1.5, 0.0, abs(uv.y));
                    bridge *= (1.0 + audioSum);
                    col += getColor(twist * 0.2 + f * 2.0) * bridge * 0.5 * u_intensity;
                  }
                }
                
                col += getColor(f * 2.0 + time * 0.1) * exp(-length(uv) * 1.5) * u_bloom;
                return col;
              }

              vec3 styleVortex(vec2 uv, float time, float freqNorm, float audioSum) {
                vec3 col = vec3(0.0);
                float f = freqNorm * 5.0;
                
                float angle = atan(uv.y, uv.x);
                float radius = length(uv);
                
                // Spiral vortex
                float spiral = angle + radius * (8.0 + f * 20.0) - time * u_speed * (3.0 + f * 5.0);
                spiral += sin(radius * 10.0 - time * 5.0) * 0.5;
                
                // Vortex bands
                float bands = sin(spiral * u_complexity * 3.0) * 0.5 + 0.5;
                bands *= exp(-radius * (1.0 - f * 0.3));
                bands *= 1.0 + audioSum;
                
                // Spinning particles
                for (float i = 0.0; i < 8.0; i++) {
                  float particleAngle = angle + i * TAU / 8.0 + time * u_speed * (1.0 + i * 0.1);
                  float particleRadius = 0.3 + sin(time * u_speed + i) * 0.2;
                  vec2 particlePos = vec2(cos(particleAngle), sin(particleAngle)) * particleRadius;
                  float dist = length(uv - particlePos);
                  col += getColor(i * 0.15 + f * 2.0 + time * 0.1) * (0.03 / dist) * u_intensity * 0.5;
                }
                
                col += getColor(bands + f * 3.0 + time * 0.1) * bands * u_intensity;
                col += getColor(spiral * 0.1 + f) * exp(-radius * 2.0) * u_bloom;
                
                return col;
              }

              vec3 styleConstellation(vec2 uv, float time, float freqNorm, float audioSum) {
                vec3 col = vec3(0.0);
                float f = freqNorm * 3.0;
                
                // Stars
                float numStars = 30.0 + f * 20.0;
                for (float i = 0.0; i < 50.0; i++) {
                  if (i >= numStars) break;
                  
                  float starAngle = hash(vec2(i, 0.0)) * TAU;
                  float starDist = hash(vec2(0.0, i)) * (0.8 + f * 0.3);
                  float twinkle = sin(time * u_speed * (2.0 + hash(vec2(i, i)) * 3.0)) * 0.5 + 0.5;
                  
                  vec2 starPos = vec2(cos(starAngle), sin(starAngle)) * starDist;
                  starPos += vec2(sin(time * 0.5 + i), cos(time * 0.3 + i)) * 0.05 * audioSum;
                  
                  float dist = length(uv - starPos);
                  float star = 0.005 / dist * twinkle;
                  star += exp(-dist * 20.0) * twinkle * 0.5;
                  
                  col += getColor(hash(vec2(i, i + 1.0)) + time * 0.05) * star * u_intensity;
                  
                  // Connect nearby stars
                  for (float j = i + 1.0; j < 50.0; j++) {
                    if (j >= numStars) break;
                    float otherAngle = hash(vec2(j, 0.0)) * TAU;
                    float otherDist = hash(vec2(0.0, j)) * (0.8 + f * 0.3);
                    vec2 otherPos = vec2(cos(otherAngle), sin(otherAngle)) * otherDist;
                    
                    float linkDist = length(starPos - otherPos);
                    if (linkDist < 0.3) {
                      vec2 toOther = otherPos - starPos;
                      float lineDist = abs(dot(uv - starPos, vec2(-toOther.y, toOther.x))) / length(toOther);
                      float along = dot(uv - starPos, toOther) / dot(toOther, toOther);
                      if (along > 0.0 && along < 1.0) {
                        float line = smoothstep(0.01, 0.0, lineDist) * (1.0 - linkDist / 0.3);
                        col += getColor(f + time * 0.1) * line * 0.2 * u_intensity * (1.0 + audioSum * 0.5);
                      }
                    }
                  }
                }
                
                col += getColor(f + time * 0.05) * exp(-length(uv) * 1.0) * u_bloom * 0.3;
                return col;
              }

              vec3 styleCrystal(vec2 uv, float time, float freqNorm, float audioSum) {
                vec3 col = vec3(0.0);
                float f = freqNorm * 4.0;
                
                float angle = atan(uv.y, uv.x);
                float radius = length(uv);
                
                // Crystal facets
                float facets = u_symmetry * 2.0 + f * 6.0;
                float facetAngle = mod(angle + time * u_speed * 0.2, TAU / facets);
                
                // Refraction effect
                vec2 refractUV = uv * (1.0 + sin(facetAngle * facets) * 0.1);
                
                // Crystal layers
                for (float i = 1.0; i < 5.0; i++) {
                  float layerRadius = i * 0.25 * (1.0 + sin(time * u_speed + i) * 0.1);
                  float crystal = smoothstep(0.02, 0.0, abs(radius - layerRadius));
                  crystal *= abs(sin(facetAngle * facets * i));
                  crystal *= 1.0 + audioSum;
                  
                  vec3 facetColor = getColor(i * 0.2 + f * 2.0 + time * 0.1);
                  col += facetColor * crystal * u_intensity;
                  
                  // Internal reflections
                  float reflect = sin(radius * 20.0 - time * 3.0 + i) * 0.5 + 0.5;
                  reflect *= exp(-abs(radius - layerRadius) * 10.0);
                  col += facetColor * reflect * 0.3 * u_bloom;
                }
                
                // Center glow
                float centerGlow = exp(-radius * (5.0 - f * 2.0)) * (1.0 + audioSum);
                col += getColor(f * 3.0 + time * 0.1) * centerGlow * u_bloom;
                
                return col;
              }

              vec3 styleBubbles(vec2 uv, float time, float freqNorm, float audioSum) {
                vec3 col = vec3(0.0);
                float f = freqNorm * 4.0;
                
                float numBubbles = 15.0 + f * 10.0;
                for (float i = 0.0; i < 25.0; i++) {
                  if (i >= numBubbles) break;
                  
                  float phase = hash(vec2(i, 0.0)) * TAU;
                  float lifeTime = fract(time * u_speed * 0.3 + phase);
                  
                  vec2 bubblePos = vec2(
                    sin(phase) * 0.6,
                    lifeTime * 2.0 - 1.0
                  );
                  bubblePos.x += sin(lifeTime * PI * 2.0 + i) * 0.2;
                  
                  float bubbleSize = 0.05 + hash(vec2(0.0, i)) * 0.1;
                  bubbleSize *= (1.0 + audioSum * 0.3);
                  
                  float dist = length(uv - bubblePos);
                  
                  // Bubble outline
                  float bubble = smoothstep(bubbleSize, bubbleSize - 0.01, dist);
                  bubble *= smoothstep(bubbleSize - 0.03, bubbleSize - 0.01, dist);
                  bubble *= smoothstep(0.0, 0.3, lifeTime) * smoothstep(1.0, 0.7, lifeTime);
                  
                  // Iridescent shimmer
                  float shimmerAngle = atan(uv.y - bubblePos.y, uv.x - bubblePos.x);
                  float shimmer = sin(shimmerAngle * 3.0 + time * 2.0 + i) * 0.5 + 0.5;
                  
                  vec3 bubbleCol = getColor(shimmer + f * 2.0 + i * 0.1);
                  col += bubbleCol * bubble * u_intensity;
                  
                  // Highlight
                  vec2 highlightOffset = vec2(-0.3, 0.3) * bubbleSize;
                  float highlight = exp(-length(uv - bubblePos - highlightOffset) * 30.0);
                  col += vec3(1.0) * highlight * bubble * 0.5;
                }
                
                col += getColor(f + time * 0.1) * exp(-length(uv) * 1.0) * u_bloom * 0.3;
                return col;
              }

              vec3 styleWeb(vec2 uv, float time, float freqNorm, float audioSum) {
                vec3 col = vec3(0.0);
                float f = freqNorm * 4.0;
                
                float angle = atan(uv.y, uv.x);
                float radius = length(uv);
                
                // Radial strands
                float strands = u_symmetry * 2.0 + f * 8.0;
                for (float i = 0.0; i < 20.0; i++) {
                  if (i >= strands) break;
                  float strandAngle = i * TAU / strands;
                  float angleDist = abs(angle - strandAngle);
                  angleDist = min(angleDist, abs(angleDist - TAU));
                  
                  float strand = smoothstep(0.02, 0.0, angleDist * radius);
                  strand *= smoothstep(1.5, 0.0, radius);
                  col += getColor(i * 0.1 + f * 2.0 + time * 0.05) * strand * u_intensity * 0.5;
                }
                
                // Concentric rings
                for (float r = 0.2; r < 1.5; r += 0.2) {
                  float ring = smoothstep(0.015, 0.0, abs(radius - r));
                  ring *= sin(angle * strands * 0.5 + time * u_speed) * 0.3 + 0.7;
                  ring *= 1.0 + audioSum * 0.5;
                  col += getColor(r + f * 2.0 + time * 0.1) * ring * u_intensity * 0.5;
                }
                
                // Dew drops
                for (float i = 0.0; i < 12.0; i++) {
                  float dropAngle = hash(vec2(i, 0.0)) * TAU;
                  float dropRadius = 0.3 + hash(vec2(0.0, i)) * 0.8;
                  vec2 dropPos = vec2(cos(dropAngle), sin(dropAngle)) * dropRadius;
                  
                  float sparkle = sin(time * u_speed * 3.0 + i) * 0.5 + 0.5;
                  float dist = length(uv - dropPos);
                  float drop = exp(-dist * 40.0) * sparkle * (1.0 + audioSum);
                  
                  col += getColor(i * 0.15 + f) * drop * u_bloom;
                }
                
                col += getColor(f + time * 0.1) * exp(-radius * 2.0) * u_bloom * 0.5;
                return col;
              }
            
            vec3 styleChladni(vec2 uv, float time, float freqNorm, float audioSum) {
        // Animated Chladni plate simulation - sand patterns on vibrating metal
        vec3 col = vec3(0.0);
        
        // Frequency determines the mode numbers (m, n) with smooth transitions
        float freq = u_frequency;
        float baseM = freq / 150.0;
        float baseN = freq / 180.0;
        
        // Animate mode numbers with time for dynamic patterns
        float m = baseM + sin(time * u_speed * 0.5) * 0.5;
        float n = baseN + cos(time * u_speed * 0.7) * 0.5;
        
        // Scale UV to plate coordinates with rotation
        float rotation = time * u_speed * 0.1 * freqNorm;
        vec2 p = uv * (2.0 + u_complexity);
        p = vec2(p.x * cos(rotation) - p.y * sin(rotation), 
                 p.x * sin(rotation) + p.y * cos(rotation));
        
        // Animated displacement based on audio
        float displacement = sin(time * u_speed * 8.0) * audioSum * 0.1;
        p += displacement;
        
        // Classic Chladni equation with time-varying parameters
        float phase1 = time * u_speed * 2.0;
        float phase2 = time * u_speed * 1.5;
        float chladni1 = cos(m * PI * p.x + phase1) * cos(n * PI * p.y + phase2) 
                       - cos(n * PI * p.x + phase2) * cos(m * PI * p.y + phase1);
        
        // Second harmonic with different phase
        float m2 = m * 1.5 + sin(time * u_speed);
        float n2 = n * 1.5 + cos(time * u_speed * 0.8);
        float chladni2 = cos(m2 * PI * p.x - phase1) * cos(n2 * PI * p.y) 
                       - cos(n2 * PI * p.x) * cos(m2 * PI * p.y - phase2);
        
        // Third harmonic for more complexity
        float chladni3 = sin(m * PI * p.x * 0.5 + time * u_speed * 3.0) 
                       * sin(n * PI * p.y * 0.5 + time * u_speed * 2.5);
        
        // Mix patterns based on audio intensity
        float pattern = chladni1 * 0.5 + chladni2 * 0.3 + chladni3 * 0.2 * audioSum;
        pattern *= (1.0 + audioSum * 2.0); // Amplify with audio
        
        // Animated sand accumulation at nodal lines
        float sandThreshold = 0.1 + sin(time * u_speed * 4.0) * 0.05 * audioSum;
        float sand = 1.0 - smoothstep(0.0, sandThreshold + audioSum * 0.15, abs(pattern));
        
        // Vibrating sand particles
        float vibFreq = 10.0 + freqNorm * 30.0;
        float vibration = sin(time * u_speed * vibFreq + p.x * 20.0) 
                        * sin(time * u_speed * vibFreq * 1.1 + p.y * 20.0) * 0.1;
        sand += vibration * audioSum;
        
        // Animated grain texture - sand particles moving
        float grainTime = time * u_speed * 2.0;
        vec2 grainOffset = vec2(sin(grainTime + p.y * 5.0), cos(grainTime + p.x * 5.0)) * 0.02 * audioSum;
        float grain = hash((p + grainOffset) * 80.0) * 0.2;
        grain += hash((p - grainOffset) * 120.0 + grainTime) * 0.1;
        sand = clamp(sand + grain * sand * (1.0 + audioSum), 0.0, 1.0);
        
        // Animated plate color (subtle metallic shimmer)
        float shimmer = sin(time * u_speed * 3.0 + length(p) * 2.0) * 0.02;
        vec3 plateColor = vec3(0.12 + shimmer, 0.14 + shimmer, 0.18 + shimmer);
        
        // Animated sand color based on palette and movement
        vec3 sandColor = getColor(freqNorm * 2.0 + time * 0.1 + m * 0.05);
        vec3 naturalSand = vec3(0.9, 0.85, 0.7) + vec3(grain * 0.2);
        sandColor = mix(sandColor, naturalSand, 0.4);
        
        // Combine plate and sand with pulsing intensity
        float pulseIntensity = u_intensity * (1.0 + sin(time * u_speed * 5.0) * 0.1 * audioSum);
        col = mix(plateColor, sandColor, sand * pulseIntensity);
        
        // Animated metallic reflection ripples
        float ripple = sin(length(p) * 10.0 - time * u_speed * 5.0) * 0.5 + 0.5;
        float reflection = pow(max(0.0, 1.0 - abs(pattern)), 4.0) * 0.4 * ripple;
        col += getColor(time * 0.2 + freqNorm * 3.0) * reflection * (1.0 - sand) * u_bloom;
        
        // Glowing nodal lines that pulse with audio
        float glowPulse = (1.0 + sin(time * u_speed * 8.0) * 0.5) * audioSum;
        float glow = exp(-abs(pattern) * 2.0) * glowPulse * u_bloom;
        col += getColor(freqNorm * 2.0 + time * 0.15) * glow * 0.6;
        
        // Add particle sparkles on sand
        float sparkle = pow(hash(p * 200.0 + time * 3.0), 20.0) * sand * audioSum * 2.0;
        col += getColor(time * 0.5 + freqNorm) * sparkle;
        
        // Animated edge with vibration effect
        float edgeVib = sin(atan(uv.y, uv.x) * u_symmetry + time * u_speed * 2.0) * 0.05 * audioSum;
        float border = smoothstep(1.8 + edgeVib, 1.4 + edgeVib, length(uv * 1.5));
        col *= border;
        col += vec3(0.02) * (1.0 - border);
        
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

                  float audioSum = 0.0;
        for (int i = 0; i < 32; i++) {
          audioSum += u_audioData[i];
        }
        audioSum /= 32.0;
        
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
                                                    finalColor = styleDNA(uv, time, freqNorm, audioSum);
                                                  } else if (u_visualStyle == 20) {
                                                    finalColor = styleVortex(uv, time, freqNorm, audioSum);
                                                  } else if (u_visualStyle == 21) {
                                                    finalColor = styleConstellation(uv, time, freqNorm, audioSum);
                                                  } else if (u_visualStyle == 22) {
                                                    finalColor = styleCrystal(uv, time, freqNorm, audioSum);
                                                  } else if (u_visualStyle == 23) {
                                                    finalColor = styleBubbles(uv, time, freqNorm, audioSum);
                                                  } else {
                                                    finalColor = styleWeb(uv, time, freqNorm, audioSum);
                                                  }
        
        vec3 glowColor = getColor(freqNorm + time * 0.1);
        float glow = exp(-length(uv0) * (2.0 - freqNorm)) * u_bloom;
        finalColor += glowColor * glow * u_amplitude * 0.3;
        
        float vignette = 1.0 - length(uv0) * 0.4;
                                finalColor *= vignette;

                                // Touch reactive effects
                                for (int i = 0; i < 5; i++) {
                                  if (float(i) >= u_touchCount) break;
                                  vec2 touchPos = u_touchPoints[i];
                                  float touchDist = length(uv - touchPos);

                                  // Ripple wave from touch point
                                  float ripple = sin(touchDist * 30.0 - time * 8.0) * 0.5 + 0.5;
                                  ripple *= exp(-touchDist * 3.0);
                                  ripple *= smoothstep(1.0, 0.0, touchDist);
                                  finalColor += getColor(touchDist + time * 0.5) * ripple * 0.5;

                                  // Glow at touch point
                                  float touchGlow = 0.03 / (touchDist + 0.05);
                                  finalColor += getColor(time * 0.2 + float(i) * 0.3) * touchGlow * 0.3;

                                  // Multi-touch harmonics (when more than one touch)
                                  if (u_touchCount > 1.0 && i > 0) {
                                    vec2 prevTouch = u_touchPoints[i - 1];
                                    vec2 midPoint = (touchPos + prevTouch) * 0.5;
                                    float harmonic = sin(length(uv - midPoint) * 50.0 - time * 10.0);
                                    harmonic *= exp(-length(uv - midPoint) * 4.0);
                                    finalColor += getColor(float(i) * 0.5 + time * 0.3) * abs(harmonic) * 0.3;
                                  }
                                }

                                // Drag distortion effect
                                if (length(u_dragVelocity) > 0.01) {
                                  float dragStrength = length(u_dragVelocity);
                                  vec2 dragDir = normalize(u_dragVelocity);
                                  float dragEffect = dot(uv, dragDir) * dragStrength * 2.0;
                                  finalColor += getColor(dragEffect + time * 0.5) * abs(sin(dragEffect * 20.0)) * 0.2;
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
    const visualStyles = { fractal: 0, tunnel: 1, kaleidoscope: 2, plasma: 3, waveform: 4, particles: 5, geometric: 6, spiral: 7, matrix: 8, nebula: 9, rings: 10, hexgrid: 11, chladni: 12, aurora: 13, fireworks: 14, mandala: 15, liquid: 16, electric: 17, electrons: 18, dna: 19, vortex: 20, constellation: 21, crystal: 22, bubbles: 23, web: 24 };
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