export const mainGlsl = `
void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution) / min(u_resolution.x, u_resolution.y);
  vec2 uv0 = uv;

  float time = u_time * u_speed;
  float freqNorm = u_frequency / 2000.0;

  float binauralMod = 1.0;
  if (u_binauralEnabled > 0.5) {
    binauralMod = 1.0 + sin(time * u_binauralFreq * TAU) * 0.3;
    uv *= 1.0 + sin(time * u_binauralFreq * TAU) * 0.05;
    uv = uv * mat2(cos(sin(time * u_binauralFreq) * 0.1), -sin(sin(time * u_binauralFreq) * 0.1),
                   sin(sin(time * u_binauralFreq) * 0.1), cos(sin(time * u_binauralFreq) * 0.1));
  }

  float isochronicMod = 1.0;
  if (u_isochronicEnabled > 0.5) {
    float pulse = (sin(time * u_isochronicFreq * TAU) + 1.0) * 0.5;
    isochronicMod = 1.0 - u_isochronicDepth * (1.0 - pulse);
  }

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

  vec3 glowColor = getColor(freqNorm * 2.0 + time * 0.15);
  float glow = exp(-length(uv0) * (2.0 - freqNorm * 1.5)) * u_bloom;
  glow *= (1.0 + audioSum * 3.0 + bassSum * 2.0);
  finalColor += glowColor * glow * u_amplitude * (0.5 + u_amplitude * 0.8);

  float pulseRing = sin(length(uv0) * (20.0 + freqNorm * 30.0) - time * (5.0 + audioSum * 15.0));
  pulseRing = pow(max(0.0, pulseRing), 3.0);
  pulseRing *= exp(-abs(length(uv0) - 0.5) * 10.0) * (audioSum + bassSum * 0.5);
  finalColor += getColor(time * 0.3 + freqNorm) * pulseRing * u_amplitude * 0.6;

  float vignette = 1.0 - length(uv0) * 0.4;
  finalColor *= vignette;

  for (int i = 0; i < 5; i++) {
    if (float(i) >= u_touchCount) break;
    vec2 touchPos = u_touchPoints[i];
    float touchDist = length(uv - touchPos);

    float ampBoost = 1.0 + u_amplitude * 3.0;
    for (float r = 0.0; r < 3.0; r++) {
      float ripple = sin(touchDist * (30.0 + r * 10.0) - time * (8.0 + r * 2.0)) * 0.5 + 0.5;
      ripple *= exp(-touchDist * (3.0 - r * 0.5));
      ripple *= smoothstep(1.0, 0.0, touchDist);
      ripple *= ampBoost;
      finalColor += getColor(touchDist + time * 0.5 + r * 0.3) * ripple * (0.8 - r * 0.2);
    }

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

    float touchGlow = 0.08 / (touchDist + 0.03);
    touchGlow *= (1.0 + sin(time * 10.0 + freqNorm * 20.0) * 0.5) * ampBoost;
    finalColor += getColor(time * 0.3 + float(i) * 0.2 + freqNorm) * touchGlow * 0.6;

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

  if (length(u_dragVelocity) > 0.01) {
    float dragStrength = length(u_dragVelocity) * 5.0;
    vec2 dragDir = normalize(u_dragVelocity);

    float perpDist = abs(dot(uv, vec2(-dragDir.y, dragDir.x)));
    float alongDist = dot(uv, dragDir);
    float wake = exp(-perpDist * (8.0 - dragStrength));
    wake *= sin(perpDist * 40.0 + alongDist * 20.0 - time * 20.0) * 0.5 + 0.5;
    wake *= smoothstep(-0.5, 0.5, alongDist);
    finalColor += getColor(alongDist + time * 0.8 + freqNorm) * wake * dragStrength * 0.5;

    for (float t = 0.0; t < 10.0; t++) {
      vec2 trailPos = dragDir * (t * 0.15 - 0.5);
      float trailDist = length(uv - trailPos);
      float trail = 0.03 / (trailDist + 0.02);
      trail *= (1.0 - t / 10.0) * dragStrength;
      finalColor += getColor(t * 0.1 + time * 0.5) * trail * 0.3;
    }

    float streak = exp(-perpDist * 12.0);
    streak *= sin(alongDist * 80.0 - time * 30.0 * dragStrength) * 0.5 + 0.5;
    finalColor += getColor(time + freqNorm * 2.0) * streak * dragStrength * u_amplitude * 0.4;
  }

  finalColor *= binauralMod * isochronicMod;

  if (u_isochronicEnabled > 0.5) {
    float pulse = (sin(time * u_isochronicFreq * TAU) + 1.0) * 0.5;
    vec3 pulseColor = getColor(time * 0.1 + pulse);
    finalColor += pulseColor * pulse * u_isochronicDepth * 0.2 * u_bloom;
  }

  if (u_binauralEnabled > 0.5) {
    float shift = sin(time * u_binauralFreq * TAU) * 0.5;
    finalColor.r *= 1.0 + shift * 0.2;
    finalColor.b *= 1.0 - shift * 0.2;
  }

  finalColor = clamp(finalColor, 0.0, 1.0);
  gl_FragColor = vec4(finalColor, 1.0);
}
`;