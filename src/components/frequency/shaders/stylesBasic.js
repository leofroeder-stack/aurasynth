export const stylesBasicGlsl = `
vec3 styleFractal(vec2 uv, vec2 uv0, float time, float freqNorm, float audioSum) {
  vec3 finalColor = vec3(0.0);
  float comp = u_complexity;
  float f = freqNorm * 5.0;
  uv *= 0.5 + f * 1.5;
  uv = uv * mat2(cos(f), -sin(f), sin(f), cos(f));
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
  float f = freqNorm * 5.0;
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
  float f = freqNorm * 5.0;
  float freqSpeed = u_speed * (0.3 + f * 4.0);
  vec2 c = uv * u_complexity * 3.0 * (0.5 + f * 2.0);
  c = c * mat2(cos(f), -sin(f), sin(f), cos(f));
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
  float f = freqNorm * 5.0;
  float freqMult = 0.5 + f * 6.0;
  for (float i = 0.0; i < 5.0; i++) {
    float offset = i * 0.15 - 0.3;
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
  float f = freqNorm * 5.0;
  float comp = u_complexity * 10.0 + 5.0 + f * 20.0;
  float freqSpeed = u_speed * (0.3 + f * 5.0);
  for (float i = 0.0; i < 40.0; i++) {
    if (i >= comp) break;
    float orbitMod = 1.0 + f * sin(i + time);
    vec2 particlePos = vec2(
      sin(i * 174.2 + time * freqSpeed * (0.5 + hash(vec2(i, 0.0)) * 0.5) + f * 10.0) * orbitMod,
      cos(i * 267.3 + time * freqSpeed * (0.5 + hash(vec2(0.0, i)) * 0.5) + f * 5.0) * orbitMod
    ) * (0.3 + audioSum * 0.5 + f * 1.0);
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
  float f = freqNorm * 5.0;
  float angle = atan(uv.y, uv.x);
  float radius = length(uv);
  float segments = u_symmetry + floor(f * 12.0);
  float segmentAngle = TAU / segments;
  float rotSpeed = u_speed * 0.2 * (1.0 + f * 8.0);
  angle = mod(angle + time * rotSpeed + f * TAU * 3.0, segmentAngle);
  for (float i = 1.0; i <= 5.0; i++) {
    float ringRadius = i * 0.2 * (0.6 + audioSum * 0.4 + f * 0.8);
    ringRadius += sin(time * (2.0 + f * 6.0) + f * 15.0 + i) * f * 0.25;
    float ringWidth = 0.02 + f * 0.03;
    float ring = smoothstep(ringWidth, 0.0, abs(radius - ringRadius));
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
`;