import React, { useRef, useEffect } from 'react';

export default function WebGLVisualizer({ frequency, isPlaying, waveType, analyserNode }) {
  const canvasRef = useRef(null);
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

    // Vertex shader
    const vertexShaderSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment shader with audio-reactive visuals
    const fragmentShaderSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_frequency;
      uniform float u_amplitude;
      uniform float u_waveType;
      uniform float u_audioData[32];
      
      #define PI 3.14159265359
      
      vec3 palette(float t) {
        vec3 a = vec3(0.5, 0.5, 0.5);
        vec3 b = vec3(0.5, 0.5, 0.5);
        vec3 c = vec3(1.0, 1.0, 1.0);
        vec3 d = vec3(0.0, 0.33, 0.67);
        return a + b * cos(6.28318 * (c * t + d));
      }
      
      float sdCircle(vec2 p, float r) {
        return length(p) - r;
      }
      
      void main() {
        vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution) / min(u_resolution.x, u_resolution.y);
        vec2 uv0 = uv;
        vec3 finalColor = vec3(0.0);
        
        float freqNorm = u_frequency / 2000.0;
        float audioSum = 0.0;
        for(int i = 0; i < 32; i++) {
          audioSum += u_audioData[i];
        }
        audioSum /= 32.0;
        
        for(float i = 0.0; i < 4.0; i++) {
          uv = fract(uv * 1.5) - 0.5;
          
          float d = length(uv) * exp(-length(uv0));
          
          vec3 col = palette(length(uv0) + i * 0.4 + u_time * 0.2 + freqNorm);
          
          float wave;
          if(u_waveType < 0.5) {
            wave = sin(d * 8.0 + u_time * 2.0 + freqNorm * 10.0);
          } else if(u_waveType < 1.5) {
            wave = sign(sin(d * 8.0 + u_time * 2.0 + freqNorm * 10.0));
          } else if(u_waveType < 2.5) {
            wave = fract(d + u_time * 0.5 + freqNorm) * 2.0 - 1.0;
          } else {
            wave = abs(fract(d + u_time * 0.5 + freqNorm) * 2.0 - 1.0) * 2.0 - 1.0;
          }
          
          d = wave * u_amplitude;
          d = abs(d);
          d = pow(0.01 / d, 1.2);
          
          finalColor += col * d * (0.5 + audioSum * 0.5);
        }
        
        // Add glow effect based on frequency
        float glow = exp(-length(uv0) * (2.0 - freqNorm));
        vec3 glowColor = mix(vec3(0.0, 0.94, 1.0), vec3(1.0, 0.0, 0.67), freqNorm);
        finalColor += glowColor * glow * u_amplitude * 0.5;
        
        // Add circular wave rings
        float rings = sin(length(uv0) * 20.0 - u_time * 3.0 - u_frequency * 0.01) * 0.5 + 0.5;
        rings = pow(rings, 8.0);
        finalColor += glowColor * rings * u_amplitude * 0.3;
        
        // Vignette
        float vignette = 1.0 - length(uv0) * 0.5;
        finalColor *= vignette;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    // Compile shaders
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    // Create program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    programRef.current = program;

    // Create buffer
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

    const waveTypes = { sine: 0, square: 1, sawtooth: 2, triangle: 3 };

    const render = () => {
      const canvas = canvasRef.current;
      canvas.width = canvas.clientWidth * window.devicePixelRatio;
      canvas.height = canvas.clientHeight * window.devicePixelRatio;
      
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);

      const time = (Date.now() - startTimeRef.current) / 1000;
      
      // Get audio data if available
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

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [frequency, isPlaying, waveType, analyserNode]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full absolute inset-0"
      style={{ background: '#0a0a0f' }}
    />
  );
}