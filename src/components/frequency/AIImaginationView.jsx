import React, { useRef, useEffect } from 'react';

export default function AIImaginationView({ 
  frequency, 
  isPlaying, 
  analyserNode,
  speed = 1,
  intensity = 1,
  complexity = 1,
  canvasRef: externalCanvasRef
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
      uniform float u_audioData[32];
      uniform float u_speed;
      uniform float u_intensity;
      uniform float u_complexity;

      #define PI 3.14159265359
      #define TAU 6.28318530718

      // Hash function for pseudo-randomness
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float hash3D(vec3 p) {
        return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
      }

      // Neural network activation-like smoothstep
      float activation(float x) {
        return smoothstep(-1.0, 1.0, x);
      }

      // Latent space noise - simulates neural network latent representations
      float latentNoise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f); // Smooth interpolation
        
        float a = hash3D(i);
        float b = hash3D(i + vec3(1.0, 0.0, 0.0));
        float c = hash3D(i + vec3(0.0, 1.0, 0.0));
        float d = hash3D(i + vec3(1.0, 1.0, 0.0));
        float e = hash3D(i + vec3(0.0, 0.0, 1.0));
        float g = hash3D(i + vec3(1.0, 0.0, 1.0));
        float h = hash3D(i + vec3(0.0, 1.0, 1.0));
        float k = hash3D(i + vec3(1.0, 1.0, 1.0));
        
        return mix(
          mix(mix(a, b, f.x), mix(c, d, f.x), f.y),
          mix(mix(e, g, f.x), mix(h, k, f.x), f.y),
          f.z
        );
      }

      // Latent-space fractal - multi-octave latent noise
      float latentFractal(vec3 p, float comp) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        int octaves = int(comp * 6.0) + 3;
        
        for (int i = 0; i < 9; i++) {
          if (i >= octaves) break;
          value += amplitude * latentNoise(p * frequency);
          frequency *= 2.13; // Non-integer for more variation
          amplitude *= 0.47;
        }
        return value;
      }

      // Tensor grid - represents multi-dimensional weight matrices
      float tensorGrid(vec2 uv, float time, float freq) {
        vec2 grid = uv * (8.0 + freq * 4.0);
        vec2 id = floor(grid);
        vec2 gv = fract(grid) - 0.5;
        
        // Tensor node activation
        float node = hash(id + time * 0.1);
        node = activation(node * 2.0 - 1.0);
        
        // Connection strength based on distance
        float dist = length(gv);
        float connection = exp(-dist * 3.0) * node;
        
        // Propagating signals through tensor
        float signal = sin(hash(id) * TAU + time * 2.0 + freq * 0.1) * 0.5 + 0.5;
        connection *= signal;
        
        return connection;
      }

      // Embedding spiral - represents high-dimensional embedding space projections
      vec3 embeddingSpiral(vec2 uv, float time, float freq, float audioSum) {
        float radius = length(uv);
        float angle = atan(uv.y, uv.x);
        
        // Multi-dimensional spiral embedding
        float spiral1 = sin(angle * 3.0 + radius * 10.0 * freq - time * 2.0);
        float spiral2 = cos(angle * 5.0 - radius * 15.0 * freq + time * 1.5);
        float spiral3 = sin(angle * 7.0 + radius * 8.0 * freq - time * 2.5);
        
        // Embedding layer activation
        float embedding = (spiral1 + spiral2 + spiral3) / 3.0;
        embedding = activation(embedding);
        embedding *= 1.0 + audioSum * 2.0;
        
        // Distance attenuation
        embedding *= exp(-radius * 1.5);
        
        // Color based on embedding dimensions
        vec3 color;
        color.r = activation(spiral1 + freq);
        color.g = activation(spiral2 - freq * 0.5);
        color.b = activation(spiral3 + freq * 0.3);
        
        return color * embedding;
      }

      // Attention mechanism visualization
      float attentionPattern(vec2 uv, float time, float freq) {
        float attention = 0.0;
        
        // Multi-head attention
        for (float head = 0.0; head < 4.0; head++) {
          vec2 queryPos = vec2(sin(time * 0.5 + head), cos(time * 0.7 + head)) * 0.3;
          float dist = length(uv - queryPos);
          
          // Attention weights (softmax-like)
          float weight = exp(-dist * (3.0 + freq));
          attention += weight * sin(head + time + freq * 10.0);
        }
        
        return attention * 0.25;
      }

      // Gradient flow - represents backpropagation gradients
      vec3 gradientFlow(vec2 uv, float time, float freq, float audioSum) {
        vec2 flow = vec2(
          sin(uv.y * 5.0 + time * freq * 0.1),
          cos(uv.x * 5.0 - time * freq * 0.1)
        ) * 0.5;
        
        vec2 distorted = uv + flow * 0.3 * audioSum;
        
        float grad = latentFractal(vec3(distorted * 3.0, time * 0.3), u_complexity);
        grad = activation(grad * 2.0 - 1.0);
        
        // Gradient magnitude with directional color
        vec3 color;
        color.r = grad * (0.5 + 0.5 * sin(freq * 0.1 + time));
        color.g = grad * (0.5 + 0.5 * cos(freq * 0.15 - time * 0.8));
        color.b = grad * (0.5 + 0.5 * sin(freq * 0.08 + time * 1.2));
        
        return color;
      }

      // Neural activation map
      float neuralActivation(vec2 uv, float time, float freq, float audioSum) {
        vec3 pos = vec3(uv * 2.0, time * 0.5);
        
        // Layered activation
        float layer1 = latentNoise(pos * 2.0 + freq * 0.01);
        float layer2 = latentNoise(pos * 4.0 - freq * 0.02 + vec3(10.0));
        float layer3 = latentNoise(pos * 8.0 + freq * 0.015 + vec3(20.0));
        
        // ReLU-like activation
        float activation = max(0.0, layer1 * 0.5 + layer2 * 0.3 + layer3 * 0.2);
        activation *= 1.0 + audioSum;
        
        return activation;
      }

      // Weight matrix visualization
      vec3 weightMatrix(vec2 uv, float time, float freq) {
        vec2 grid = uv * 16.0;
        vec2 id = floor(grid);
        vec2 gv = fract(grid) - 0.5;
        
        // Weight values
        float weight = hash(id + floor(time * 0.5)) * 2.0 - 1.0;
        
        // Connection visualization
        float connection = smoothstep(0.4, 0.2, length(gv)) * abs(weight);
        
        // Color based on weight sign and magnitude
        vec3 color;
        if (weight > 0.0) {
          color = vec3(0.2, 0.8, 1.0) * weight; // Positive weights - cyan
        } else {
          color = vec3(1.0, 0.3, 0.5) * abs(weight); // Negative weights - magenta
        }
        
        return color * connection;
      }

      void main() {
        vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution) / min(u_resolution.x, u_resolution.y);
        
        float time = u_time * u_speed;
        float freqNorm = u_frequency / 2000.0;
        
        // Aggregate audio data
        float audioSum = 0.0;
        for (int i = 0; i < 32; i++) {
          audioSum += u_audioData[i];
        }
        audioSum /= 32.0;
        
        vec3 finalColor = vec3(0.0);
        
        // Layer 1: Latent-space fractal background
        vec3 latentPos = vec3(uv * (1.0 + freqNorm), time * 0.2);
        float latent = latentFractal(latentPos, u_complexity);
        latent = pow(latent, 1.5 - audioSum * 0.5);
        vec3 latentColor = vec3(0.1, 0.15, 0.25) * latent * u_intensity;
        finalColor += latentColor;
        
        // Layer 2: Tensor grid
        float tensor = tensorGrid(uv, time, freqNorm);
        vec3 tensorColor = vec3(0.2, 0.6, 0.9) * tensor * u_intensity * 2.0;
        finalColor += tensorColor;
        
        // Layer 3: Embedding spirals
        vec3 embedding = embeddingSpiral(uv, time, freqNorm, audioSum);
        finalColor += embedding * u_intensity * 1.5;
        
        // Layer 4: Attention patterns
        float attention = attentionPattern(uv, time, freqNorm);
        vec3 attentionColor = vec3(0.9, 0.4, 0.7) * abs(attention) * u_intensity;
        finalColor += attentionColor * 0.5;
        
        // Layer 5: Gradient flow
        vec3 gradient = gradientFlow(uv, time, freqNorm, audioSum);
        finalColor += gradient * 0.4 * u_intensity;
        
        // Layer 6: Neural activation map overlay
        float neural = neuralActivation(uv, time, freqNorm, audioSum);
        finalColor += vec3(0.8, 0.9, 1.0) * neural * 0.3 * u_intensity;
        
        // Layer 7: Weight matrix connections
        vec3 weights = weightMatrix(uv * (0.5 + freqNorm * 0.5), time, freqNorm);
        finalColor += weights * 0.6 * u_intensity;
        
        // Central glow - represents model convergence
        float centerDist = length(uv);
        float convergence = exp(-centerDist * (2.0 - freqNorm)) * (0.5 + audioSum);
        vec3 convergenceColor = vec3(0.4, 0.7, 1.0) * convergence * 0.4;
        finalColor += convergenceColor;
        
        // Frequency resonance effect
        float resonance = sin(centerDist * (20.0 + freqNorm * 80.0) - time * 3.0);
        resonance = activation(resonance) * audioSum;
        finalColor += vec3(0.6, 0.8, 1.0) * resonance * 0.2;
        
        // Vignette for depth
        float vignette = 1.0 - centerDist * 0.3;
        finalColor *= vignette;
        
        // Subtle chromatic aberration for digital feel
        finalColor.r *= 1.0 + sin(time * 2.0 + freqNorm * 10.0) * 0.02;
        finalColor.b *= 1.0 - sin(time * 2.0 + freqNorm * 10.0) * 0.02;
        
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
    const audioDataLocation = gl.getUniformLocation(program, 'u_audioData');
    const speedLocation = gl.getUniformLocation(program, 'u_speed');
    const intensityLocation = gl.getUniformLocation(program, 'u_intensity');
    const complexityLocation = gl.getUniformLocation(program, 'u_complexity');

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
      gl.uniform1fv(audioDataLocation, audioData);
      gl.uniform1f(speedLocation, speed);
      gl.uniform1f(intensityLocation, intensity);
      gl.uniform1f(complexityLocation, complexity);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [frequency, isPlaying, analyserNode, speed, intensity, complexity]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full absolute inset-0"
      style={{ background: '#050508' }}
    />
  );
}