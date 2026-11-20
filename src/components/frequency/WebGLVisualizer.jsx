import React, { useRef, useEffect } from 'react';
import {
  vertexShaderSource,
  fragmentShaderSource,
  waveTypes,
  visualStyles,
  colorPalettes,
} from './shaders/fragmentShader';

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
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Shader error:', gl.getShaderInfoLog(fragmentShader) || gl.getProgramInfoLog(program));
    }
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

    const loc = (name) => gl.getUniformLocation(program, name);
    const resolutionLocation = loc('u_resolution');
    const timeLocation = loc('u_time');
    const frequencyLocation = loc('u_frequency');
    const amplitudeLocation = loc('u_amplitude');
    const waveTypeLocation = loc('u_waveType');
    const audioDataLocation = loc('u_audioData');
    const visualStyleLocation = loc('u_visualStyle');
    const colorPaletteLocation = loc('u_colorPalette');
    const speedLocation = loc('u_speed');
    const intensityLocation = loc('u_intensity');
    const complexityLocation = loc('u_complexity');
    const symmetryLocation = loc('u_symmetry');
    const bloomLocation = loc('u_bloom');
    const binauralEnabledLocation = loc('u_binauralEnabled');
    const binauralFreqLocation = loc('u_binauralFreq');
    const isochronicEnabledLocation = loc('u_isochronicEnabled');
    const isochronicFreqLocation = loc('u_isochronicFreq');
    const isochronicDepthLocation = loc('u_isochronicDepth');
    const touchPointsLocation = loc('u_touchPoints');
    const touchCountLocation = loc('u_touchCount');
    const dragVelocityLocation = loc('u_dragVelocity');

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