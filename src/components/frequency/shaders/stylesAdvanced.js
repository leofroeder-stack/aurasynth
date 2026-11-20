export const stylesAdvancedGlsl = `
vec3 styleAurora(vec2 uv, float time, float freqNorm, float audioSum) {
  vec3 col = vec3(0.0);
  float f = freqNorm * 3.0;
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
    float bassWave = sin(p.x * (3.0 + i + bass * 5.0) + time * u_speed * (0.5 + i * 0.2 + bass * 2.0) + f * 5.0);
    float midWave = sin(p.x * (5.0 + i * 2.0 + mid * 3.0) - time * u_speed * (0.3 + mid * 1.5)) * (0.5 + mid * 0.8);
    float highWave = sin(p.x * (8.0 + i + high * 10.0) + time * u_speed * (1.0 + high * 3.0)) * (0.3 + high * 0.5);
    float wave = bassWave + midWave + highWave;
    wave *= (0.15 + f * 0.1 + audioSum * 0.3);
    float dist = abs(p.y - wave - i * 0.15);
    float glow = (0.02 + audioSum * 0.03) / dist;
    glow *= (1.0 + audioSum * 2.0 + bass * 1.5);
    vec3 layerColor = getColor(i * 0.2 + time * 0.1 + f + bass * 0.5 + mid * 0.3);
    layerColor.r += high * 0.3;
    layerColor.g += mid * 0.4;
    layerColor.b += bass * 0.3;
    col += layerColor * glow * u_intensity * (0.5 + audioSum * 0.5);
  }
  float bgGlow = exp(-length(uv) * (1.5 - bass * 0.5)) * u_bloom * (1.0 + audioSum + bass * 2.0);
  col += getColor(f + time * 0.05 + audioSum) * bgGlow;
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
  float numTraces = 3.0 + floor(u_complexity * 3.0);
  for (float trace = 0.0; trace < 8.0; trace++) {
    if (trace >= numTraces) break;
    float yPos = (trace / numTraces) * 1.6 - 0.8;
    vec2 traceUV = uv;
    traceUV.y -= yPos;
    float speed = u_speed * (1.5 + f);
    float scrollX = mod(time * speed, 2.0);
    traceUV.x += scrollX;
    float waveAmp = 0.0;
    if (trace < numTraces / 3.0) {
      waveAmp = bass * 0.3;
    } else if (trace < numTraces * 2.0 / 3.0) {
      waveAmp = mid * 0.25;
    } else {
      waveAmp = high * 0.2;
    }
    float wave = 0.0;
    wave += sin(traceUV.x * 20.0 * u_complexity + time * 3.0 + trace) * waveAmp;
    wave += sin(traceUV.x * 40.0 * u_complexity - time * 5.0) * waveAmp * 0.5;
    wave += sin(traceUV.x * 10.0 - time * 2.0 + f * 5.0) * waveAmp * 0.3;
    float quake = sin(traceUV.x * 5.0 + time * 10.0) * bass * bass * 0.4;
    wave += quake;
    float freqWave = sin(traceUV.x * 30.0 + u_frequency * 0.01 - time * 4.0);
    wave += freqWave * (0.05 + audioSum * 0.15) * u_intensity;
    float lineThickness = 0.003 + audioSum * 0.002;
    float line = smoothstep(lineThickness * 2.0, lineThickness, abs(traceUV.y - wave));
    vec3 traceColor = getColor(trace * 0.15 + f + time * 0.05);
    float glow = exp(-abs(traceUV.y - wave) * 30.0) * (0.3 + audioSum * 0.7) * u_bloom;
    col += traceColor * (line * u_intensity + glow * 0.5);
    float gridLine = smoothstep(0.002, 0.001, abs(traceUV.y));
    col += vec3(0.1, 0.15, 0.2) * gridLine * 0.3;
  }
  float vGrid = sin(uv.x * 40.0) * 0.5 + 0.5;
  vGrid = smoothstep(0.98, 0.99, vGrid);
  col += vec3(0.1, 0.15, 0.2) * vGrid * 0.2;
  float needleX = mod(time * u_speed * 1.5, 2.0) - 1.0;
  float needle = smoothstep(0.015, 0.005, abs(uv.x - needleX));
  needle *= smoothstep(0.9, 0.7, abs(uv.y));
  col += getColor(time * 0.3 + f) * needle * (0.5 + audioSum);
  float needleGlow = exp(-abs(uv.x - needleX) * 10.0) * smoothstep(0.9, 0.5, abs(uv.y));
  col += getColor(time * 0.3 + f) * needleGlow * 0.3 * (1.0 + audioSum);
  float paper = hash(uv * 300.0) * 0.03;
  col += vec3(paper);
  float vignette = 1.0 - pow(length(uv) * 0.6, 2.0);
  col *= vignette;
  return col;
}

vec3 styleBinary(vec2 uv, float time, float freqNorm, float audioSum) {
  vec3 col = vec3(0.0);
  float f = freqNorm * 5.0;
  float noteNum = 12.0 * log(u_frequency / 440.0) / log(2.0);
  noteNum = mod(noteNum + 120.0, 12.0);
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
  vec2 gridSize = vec2(30.0 + f * 20.0, 40.0);
  vec2 gridUV = uv * gridSize;
  vec2 gridID = floor(gridUV);
  vec2 gridLocal = fract(gridUV);
  float flowSpeed = u_speed * (2.0 + audioSum * 3.0 + bass * 5.0);
  float flow = time * flowSpeed;
  float colHash = hash(vec2(gridID.x, 0.0));
  float colSpeed = 0.5 + colHash * 1.5;
  float yOffset = mod(flow * colSpeed + colHash * 100.0, gridSize.y * 2.0);
  float cellY = gridID.y + yOffset;
  float cellHash = hash(vec2(gridID.x, floor(cellY)));
  float noteBinary = floor(noteNum);
  float bitPosition = mod(floor(cellY), 8.0);
  float bitValue = mod(floor(noteBinary / pow(2.0, bitPosition)), 2.0);
  float randomBit = step(0.5 + audioSum * 0.3, cellHash);
  float finalBit = mix(bitValue, randomBit, 0.3 + sin(time + gridID.x) * 0.2);
  float pulse = sin(cellY * 0.5 - flow * 2.0 + bass * 10.0) * 0.5 + 0.5;
  pulse *= (1.0 + bass * 3.0);
  float trailLength = 8.0 + mid * 10.0;
  float distFromHead = mod(gridID.y - cellY, gridSize.y);
  float trail = smoothstep(trailLength, 0.0, distFromHead);
  trail *= pulse;
  float digit = 0.0;
  vec2 digitPos = gridLocal - 0.5;
  if (finalBit < 0.5) {
    float circle = length(digitPos);
    digit = smoothstep(0.35, 0.25, circle) * (1.0 - smoothstep(0.2, 0.1, circle));
  } else {
    digit = smoothstep(0.15, 0.05, abs(digitPos.x)) * smoothstep(0.4, 0.35, abs(digitPos.y));
  }
  digit *= trail;
  digit *= 1.0 + audioSum * 2.0;
  float colorShift = noteNum / 12.0 + f + time * 0.1;
  vec3 digitColor = getColor(colorShift);
  digitColor.r *= 0.3 + high * 0.7;
  digitColor.g *= 0.5 + mid * 0.5;
  digitColor.b *= 0.4 + bass * 0.6;
  col += digitColor * digit * u_intensity;
  if (trail > 0.5) {
    float columnGlow = exp(-abs(digitPos.x) * 3.0) * trail;
    columnGlow *= (1.0 + audioSum * 2.0 + bass * 3.0);
    col += getColor(colorShift + 0.2) * columnGlow * 0.3 * u_bloom;
  }
  if (uv.y < -0.8) {
    float noteDisplay = sin((uv.x + noteNum / 12.0) * 50.0) * 0.5 + 0.5;
    noteDisplay *= smoothstep(-0.9, -0.8, uv.y);
    col += getColor(noteNum / 12.0 + time * 0.1) * noteDisplay * audioSum;
  }
  float scanline = sin(uv.y * gridSize.y * 2.0 - time * 10.0) * 0.05 + 0.95;
  col *= scanline;
  float flicker = 1.0 + sin(time * 60.0 + audioSum * 50.0) * 0.02 * audioSum;
  col *= flicker;
  return col;
}

vec3 styleElectrons(vec2 uv, float time, float freqNorm, float audioSum) {
  vec3 col = vec3(0.0);
  float f = freqNorm * 3.0;
  float nucleusGlow = 0.02 / (length(uv) + 0.05);
  nucleusGlow *= 1.0 + sin(time * u_speed * 5.0) * 0.3 * audioSum;
  col += getColor(time * 0.1) * nucleusGlow * u_bloom * 0.5;
  for (float i = 0.0; i < 4.0; i++) {
    float angle = i * TAU / 4.0 + time * u_speed * 0.5;
    vec2 nucleonPos = vec2(cos(angle), sin(angle)) * 0.03;
    float nucleon = 0.008 / length(uv - nucleonPos);
    col += vec3(1.0, 0.3, 0.2) * nucleon * u_intensity * 0.5;
  }
  float numShells = 3.0 + f * 2.0;
  for (float shell = 1.0; shell <= 5.0; shell++) {
    if (shell > numShells) break;
    float shellRadius = shell * 0.18 * (1.0 + audioSum * 0.2);
    float orbital = smoothstep(0.008, 0.0, abs(length(uv) - shellRadius));
    col += getColor(shell * 0.2 + time * 0.05) * orbital * 0.1 * u_intensity;
    float electronsInShell = shell * 2.0;
    for (float e = 0.0; e < 10.0; e++) {
      if (e >= electronsInShell) break;
      float orbitSpeed = u_speed * (2.0 - shell * 0.3) * (1.0 + f);
      float electronAngle = e * TAU / electronsInShell + time * orbitSpeed + shell * 1.5;
      electronAngle += sin(time * u_speed * 3.0 + e) * f * 0.3;
      float tilt = shell * 0.3 + sin(time * u_speed * 0.5 + shell) * 0.2;
      vec2 electronPos = vec2(
        cos(electronAngle) * shellRadius,
        sin(electronAngle) * shellRadius * cos(tilt)
      );
      float dist = length(uv - electronPos);
      float electronSize = 0.015 + audioSum * 0.01;
      float electron = electronSize / dist;
      electron = pow(electron, 1.5);
      vec3 electronColor = getColor(0.5 + shell * 0.1 + time * 0.1);
      col += electronColor * electron * u_intensity;
      for (float t = 1.0; t <= 5.0; t++) {
        float trailAngle = electronAngle - t * 0.15 * orbitSpeed * 0.1;
        vec2 trailPos = vec2(
          cos(trailAngle) * shellRadius,
          sin(trailAngle) * shellRadius * cos(tilt)
        );
        float trailDist = length(uv - trailPos);
        float trail = (electronSize * 0.5) / trailDist;
        trail *= (6.0 - t) / 6.0;
        col += electronColor * trail * u_intensity * 0.3;
      }
    }
  }
  float cloudNoise = noise(uv * 5.0 + time * u_speed * 0.5);
  cloudNoise *= exp(-length(uv) * 2.0);
  col += getColor(time * 0.2 + f) * cloudNoise * u_bloom * 0.2 * (1.0 + audioSum);
  float flash = pow(hash(vec2(floor(time * 3.0), 0.0)), 10.0);
  if (flash > 0.5) {
    float flashRadius = mod(time * 2.0, 1.0) * 0.8;
    float photon = smoothstep(0.05, 0.0, abs(length(uv) - flashRadius));
    col += getColor(time + f * 2.0) * photon * audioSum * u_bloom;
  }
  return col;
}

vec3 styleCymatics(vec2 uv, float time, float freqNorm, float audioSum) {
  vec3 col = vec3(0.0);
  float f = freqNorm * 4.0;
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
  float radius = length(uv);
  float angle = atan(uv.y, uv.x);
  vec2 sources[5];
  sources[0] = vec2(0.0, 0.0);
  sources[1] = vec2(cos(time * u_speed * 0.3 + bass * 5.0) * 0.5, sin(time * u_speed * 0.3) * 0.5);
  sources[2] = vec2(cos(time * u_speed * 0.5 + 2.0 + mid * 4.0) * 0.6, sin(time * u_speed * 0.5 + 2.0) * 0.6);
  sources[3] = vec2(cos(time * u_speed * 0.7 + 4.0 + high * 6.0) * 0.4, sin(time * u_speed * 0.7 + 4.0) * 0.4);
  sources[4] = vec2(cos(angle * 3.0 + time) * 0.3, sin(angle * 3.0 + time) * 0.3);
  float waveHeight = 0.0;
  for (int i = 0; i < 5; i++) {
    vec2 toSource = uv - sources[i];
    float dist = length(toSource);
    float waveNumber = 5.0 + f * 15.0 + float(i) * 2.0;
    float amplitude = 0.0;
    if (i < 2) amplitude = bass * 0.8 + audioSum * 0.4;
    else if (i < 4) amplitude = mid * 0.7 + audioSum * 0.3;
    else amplitude = high * 0.6 + audioSum * 0.3;
    float wave = sin(dist * waveNumber * u_complexity - time * u_speed * (2.0 + f * 3.0) + float(i)) * amplitude;
    wave += cos(dist * waveNumber * 0.5 * u_complexity + time * u_speed * (1.5 + f * 2.0)) * amplitude * 0.5;
    waveHeight += wave;
  }
  float standingWave = sin(radius * (10.0 + f * 30.0) * u_complexity) * cos(angle * u_symmetry + time * u_speed);
  standingWave *= (bass * 0.5 + mid * 0.3 + high * 0.2);
  waveHeight += standingWave * 0.6;
  float nodalPattern = abs(waveHeight);
  float waterSurface = 1.0 - smoothstep(0.0, 0.3 + audioSum * 0.4, nodalPattern);
  vec3 deepWater = vec3(0.0, 0.1, 0.3);
  vec3 shallowWater = getColor(f + time * 0.1 + audioSum);
  vec3 waterColor = mix(deepWater, shallowWater, waterSurface);
  float crest = smoothstep(0.7 - audioSum * 0.3, 1.0, abs(waveHeight));
  waterColor += vec3(1.0) * crest * u_intensity * (0.8 + audioSum * 0.5);
  vec2 refractUV = uv + vec2(waveHeight * 0.1);
  float caustic = sin(refractUV.x * 20.0 + time * 2.0) * sin(refractUV.y * 20.0 - time * 2.0);
  caustic = pow(max(0.0, caustic), 3.0);
  waterColor += getColor(time * 0.3 + f) * caustic * 0.3 * u_bloom * (1.0 + audioSum);
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
  vec3 normal = normalize(vec3(waveHeight * 2.0, waveHeight, 1.0 - abs(waveHeight)));
  vec3 lightDir = normalize(vec3(0.5, 0.8, 1.0));
  float specular = pow(max(0.0, dot(normal, lightDir)), 8.0 + audioSum * 20.0);
  waterColor += vec3(1.0, 1.0, 0.95) * specular * u_intensity * (0.5 + audioSum);
  float depthFade = 1.0 - smoothstep(0.0, 1.5, radius);
  waterColor *= depthFade;
  float tension = sin(uv.x * (40.0 + high * 60.0) + time * 5.0) * sin(uv.y * (40.0 + high * 60.0) - time * 5.0);
  tension *= high * 0.2 * exp(-radius * 2.0);
  waterColor += vec3(0.8, 0.9, 1.0) * tension;
  float particles = hash(uv * (50.0 + audioSum * 100.0) + time * 0.5);
  particles = smoothstep(0.97 - audioSum * 0.1, 1.0, particles);
  waterColor += getColor(particles + time * 0.2) * particles * 0.3;
  col = waterColor * u_intensity;
  return col;
}
`;