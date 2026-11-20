export const stylesChladniGlsl = `
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
  vec3 col = vec3(0.0);
  float m = u_frequency / 150.0;
  float n = u_frequency / 180.0;
  vec2 p = uv * (2.0 + u_complexity);
  float rotation = time * u_speed * 0.04;
  p = vec2(p.x * cos(rotation) - p.y * sin(rotation),
           p.x * sin(rotation) + p.y * cos(rotation));
  float chladni = cos(m * PI * p.x) * cos(n * PI * p.y)
                - cos(n * PI * p.x) * cos(m * PI * p.y);
  float m2 = m * 1.5;
  float n2 = n * 1.5;
  float chladni2 = cos(m2 * PI * p.x) * cos(n2 * PI * p.y)
                 - cos(n2 * PI * p.x) * cos(m2 * PI * p.y);
  float pattern = chladni * 0.7 + chladni2 * 0.3;
  float sand = 1.0 - smoothstep(0.0, 0.07, abs(pattern));
  float grain = hash(p * 90.0) * 0.18;
  sand = clamp(sand + grain * sand, 0.0, 1.0);
  vec3 plateColor = vec3(0.1, 0.12, 0.16);
  vec3 sandColor = mix(vec3(0.88, 0.82, 0.65), getColor(freqNorm * 1.5), 0.25);
  col = mix(plateColor, sandColor, sand * u_intensity);
  float glow = exp(-abs(pattern) * 4.0) * u_bloom * 0.5;
  col += getColor(freqNorm + time * 0.05) * glow;
  col *= smoothstep(1.5, 1.35, length(uv));
  return col;
}

vec3 styleChladni(vec2 uv, float time, float freqNorm, float audioSum) {
  vec3 col = vec3(0.0);
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
  float freq = u_frequency;
  float baseM = freq / 150.0 + bass * 2.0;
  float baseN = freq / 180.0 + mid * 2.0;
  float m = baseM + sin(time * u_speed * 0.5 + bass * 10.0) * (0.5 + bass * 2.0);
  float n = baseN + cos(time * u_speed * 0.7 + mid * 8.0) * (0.5 + mid * 2.0);
  float rotation = time * u_speed * 0.1 * freqNorm + bass * 0.5;
  vec2 p = uv * (2.0 + u_complexity + high * 1.5);
  p = vec2(p.x * cos(rotation) - p.y * sin(rotation),
           p.x * sin(rotation) + p.y * cos(rotation));
  float displacement = sin(time * u_speed * 8.0 + bass * 20.0) * audioSum * 0.2;
  p += vec2(sin(mid * 15.0), cos(high * 12.0)) * displacement;
  float phase1 = time * u_speed * 2.0 + bass * 5.0;
  float phase2 = time * u_speed * 1.5 + mid * 4.0;
  float chladni1 = cos(m * PI * p.x + phase1) * cos(n * PI * p.y + phase2)
                 - cos(n * PI * p.x + phase2) * cos(m * PI * p.y + phase1);
  float m2 = m * 1.5 + sin(time * u_speed + mid * 10.0);
  float n2 = n * 1.5 + cos(time * u_speed * 0.8 + mid * 8.0);
  float chladni2 = cos(m2 * PI * p.x - phase1 + mid * 3.0) * cos(n2 * PI * p.y + mid * 2.0)
                 - cos(n2 * PI * p.x + mid * 2.0) * cos(m2 * PI * p.y - phase2 + mid * 3.0);
  float chladni3 = sin(m * PI * p.x * 0.5 + time * u_speed * 3.0 + high * 15.0)
                 * sin(n * PI * p.y * 0.5 + time * u_speed * 2.5 + high * 12.0);
  float pattern = chladni1 * (0.5 + bass * 0.5) + chladni2 * (0.3 + mid * 0.4) + chladni3 * (0.2 + high * 0.5);
  pattern *= (1.0 + audioSum * 3.0);
  float sandThreshold = 0.1 + sin(time * u_speed * 4.0 + bass * 8.0) * 0.05 * audioSum;
  float sand = 1.0 - smoothstep(0.0, sandThreshold + audioSum * 0.2 + bass * 0.3, abs(pattern));
  float vibFreq = 10.0 + freqNorm * 30.0 + bass * 50.0;
  float vibration = sin(time * u_speed * vibFreq + p.x * 20.0 + bass * 30.0)
                  * sin(time * u_speed * vibFreq * 1.1 + p.y * 20.0 + mid * 25.0) * (0.1 + audioSum * 0.3);
  sand += vibration;
  float grainTime = time * u_speed * 2.0 + audioSum * 5.0;
  vec2 grainOffset = vec2(sin(grainTime + p.y * 5.0 + bass * 10.0), cos(grainTime + p.x * 5.0 + mid * 8.0)) * (0.02 + audioSum * 0.05);
  float grain = hash((p + grainOffset) * (80.0 + high * 100.0)) * 0.2;
  grain += hash((p - grainOffset) * (120.0 + bass * 80.0) + grainTime) * (0.1 + high * 0.3);
  sand = clamp(sand + grain * sand * (1.0 + audioSum * 2.0), 0.0, 1.0);
  float shimmer = sin(time * u_speed * 3.0 + length(p) * 2.0 + bass * 10.0) * (0.02 + bass * 0.05);
  vec3 plateColor = vec3(0.12 + shimmer + bass * 0.1, 0.14 + shimmer + mid * 0.08, 0.18 + shimmer + high * 0.12);
  vec3 sandColor = getColor(freqNorm * 2.0 + time * 0.1 + m * 0.05 + audioSum);
  vec3 naturalSand = vec3(0.9 + mid * 0.1, 0.85 + bass * 0.15, 0.7 + high * 0.2) + vec3(grain * 0.2);
  sandColor = mix(sandColor, naturalSand, 0.4 - audioSum * 0.2);
  float pulseIntensity = u_intensity * (1.0 + sin(time * u_speed * 5.0 + bass * 20.0) * (0.1 + audioSum * 0.5));
  col = mix(plateColor, sandColor, sand * pulseIntensity);
  float ripple = sin(length(p) * (10.0 + mid * 20.0) - time * u_speed * 5.0 - bass * 15.0) * 0.5 + 0.5;
  float reflection = pow(max(0.0, 1.0 - abs(pattern)), 4.0) * (0.4 + audioSum * 0.6) * ripple;
  col += getColor(time * 0.2 + freqNorm * 3.0 + audioSum * 2.0) * reflection * (1.0 - sand) * u_bloom * (1.0 + high);
  float glowPulse = (1.0 + sin(time * u_speed * 8.0 + bass * 25.0) * 0.5) * (audioSum + bass * 2.0);
  float glow = exp(-abs(pattern) * 2.0) * glowPulse * u_bloom * (1.0 + mid * 2.0);
  col += getColor(freqNorm * 2.0 + time * 0.15 + audioSum * 3.0) * glow * (0.6 + audioSum);
  float sparkle = pow(hash(p * (200.0 + high * 200.0) + time * (3.0 + audioSum * 10.0)), 20.0 - high * 15.0) * sand * (audioSum + high) * 3.0;
  col += getColor(time * 0.5 + freqNorm + high * 2.0) * sparkle;
  float edgeVib = sin(atan(uv.y, uv.x) * u_symmetry + time * u_speed * 2.0 + bass * 20.0) * (0.05 + bass * 0.15);
  float border = smoothstep(1.8 + edgeVib, 1.4 + edgeVib, length(uv * 1.5));
  col *= border;
  col += vec3(0.02 + audioSum * 0.05) * (1.0 - border);
  return col;
}
`;