import { commonGlsl } from './commonGlsl';
import { stylesBasicGlsl } from './stylesBasic';
import { stylesAdvancedGlsl } from './stylesAdvanced';
import { stylesChladniGlsl } from './stylesChladni';
import { mainGlsl } from './mainGlsl';

export const vertexShaderSource = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const fragmentShaderSource = [
  commonGlsl,
  stylesBasicGlsl,
  stylesAdvancedGlsl,
  stylesChladniGlsl,
  mainGlsl,
].join('\n');

export const waveTypes = { sine: 0, square: 1, sawtooth: 2, triangle: 3 };
export const visualStyles = { fractal: 0, tunnel: 1, kaleidoscope: 2, plasma: 3, waveform: 4, particles: 5, geometric: 6, spiral: 7, matrix: 8, nebula: 9, rings: 10, hexgrid: 11, chladni: 12, aurora: 13, fireworks: 14, mandala: 15, liquid: 16, electric: 17, electrons: 18, binary: 19, seismograph: 20, cymatics: 21, 'chladni-polar': 22, 'chladni-3d': 23, 'chladni-storm': 24, 'chladni-classic': 25 };
export const colorPalettes = { cyber: 0, fire: 1, nature: 2, ocean: 3, sunset: 4, neon: 5, aurora: 6, lava: 7, ice: 8, candy: 9, galaxy: 10 };