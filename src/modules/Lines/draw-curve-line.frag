precision highp float;

varying vec4 rgbaColor;
varying vec2 pos;
varying float arrowLength;
varying float useArrow;
varying float smoothing;
varying float arrowWidthFactor;
varying float linkIndex;

// renderMode: 0.0 = normal rendering, 1.0 = index buffer rendering for picking
uniform float renderMode;

// Flow animation uniforms
uniform float time;
uniform float flowSpeed;
uniform float flowIntensity;
uniform int flowMode; // 0 = off, 1 = gradient, 2 = pulse, 3 = particles, 4 = noise, 5 = LIC

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

// Hash function for procedural noise (avoiding texture dependency)
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// Smooth noise using hash
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  // Smooth interpolation
  vec2 u = f * f * (3.0 - 2.0 * f);

  // Four corners
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Fractal Brownian Motion for richer noise
float fbm(vec2 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  for (int i = 0; i < 4; i++) {
    if (i >= octaves) break;
    value += amplitude * noise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return value;
}

// Gradient flow: smooth color transition along edge direction
float gradientFlow(float t, float time, float speed) {
  // Create a smooth gradient that flows from source to target
  // fract creates repeating 0-1 pattern, subtraction makes it flow forward
  return fract(t - time * speed);
}

// Pulse wave: discrete pulses traveling along the edge
float pulseWave(float t, float time, float speed, float pulseWidth) {
  float phase = fract(t - time * speed);
  // Create sharp pulses with smooth edges
  return smoothstep(0.0, pulseWidth, phase) * smoothstep(pulseWidth * 2.0, pulseWidth, phase);
}

// Pseudo-particles: multiple discrete dots traveling along edge
float particleFlow(float t, float time, float speed, float particleCount) {
  float result = 0.0;
  for (float i = 0.0; i < 4.0; i++) {
    if (i >= particleCount) break;
    float offset = i / particleCount;
    float phase = fract(t - time * speed + offset);
    // Each particle is a small gaussian-like bump
    float particle = exp(-pow((phase - 0.5) * 8.0, 2.0));
    result = max(result, particle);
  }
  return result;
}

// Noise advection: flowing noise pattern
float noiseAdvection(vec2 p, float linkIdx, float time, float speed) {
  // Use link index to give each edge unique noise
  vec2 noiseCoord = vec2(p.x * 10.0 + linkIdx * 3.7, p.y * 5.0);
  // Advect the noise coordinates over time in the flow direction
  noiseCoord.x -= time * speed * 5.0;
  return fbm(noiseCoord, 3);
}

// Line Integral Convolution: streak noise along flow direction
// This creates the classic wind-map appearance
float licFlow(vec2 p, float linkIdx, float time, float speed) {
  float result = 0.0;
  const int SAMPLES = 8;
  float sampleWeight = 1.0 / float(SAMPLES);

  // Sample noise at multiple positions along the flow direction
  // The key insight: we sample backward and forward along pos.x (the flow direction)
  for (int i = 0; i < SAMPLES; i++) {
    // Offset along the edge direction (pos.x)
    float offset = (float(i) - float(SAMPLES) * 0.5) * 0.02;

    // Create 2D coordinate for noise sampling
    // Use link index for per-edge variation
    vec2 samplePos = vec2(
      (p.x + offset) * 20.0 + linkIdx * 2.7,
      p.y * 10.0 + linkIdx * 1.3
    );

    // Advect the noise coordinates over time
    samplePos.x -= time * speed * 3.0;

    // Sample and accumulate
    result += noise(samplePos) * sampleWeight;
  }

  return result;
}

void main() {
  float opacity = 1.0;
  vec3 color = rgbaColor.rgb;

  if (useArrow > 0.5) {
    float end_arrow = 0.5 + arrowLength / 2.0;
    float start_arrow = end_arrow - arrowLength;
    float arrowWidthDelta = arrowWidthFactor / 2.0;
    float linkOpacity = rgbaColor.a * smoothstep(0.5 - arrowWidthDelta, 0.5 - arrowWidthDelta - smoothing / 2.0, abs(pos.y));
    float arrowOpacity = 1.0;
    if (pos.x > start_arrow && pos.x < start_arrow + arrowLength) {
      float xmapped = map(pos.x, start_arrow, end_arrow, 0.0, 1.0);
      arrowOpacity = rgbaColor.a * smoothstep(xmapped - smoothing, xmapped, map(abs(pos.y), 0.5, 0.0, 0.0, 1.0));
      if (linkOpacity != arrowOpacity) {
        linkOpacity = max(linkOpacity, arrowOpacity);
      }
    }
    opacity = linkOpacity;
  } else opacity = rgbaColor.a * smoothstep(0.5, 0.5 - smoothing, abs(pos.y));

  // Apply flow animation effects
  if (flowMode > 0 && flowIntensity > 0.0) {
    float flowValue = 0.0;

    if (flowMode == 1) {
      // Gradient flow: smooth brightness gradient flowing along edge
      flowValue = gradientFlow(pos.x, time, flowSpeed);
    } else if (flowMode == 2) {
      // Pulse wave: discrete bright pulses
      flowValue = pulseWave(pos.x, time, flowSpeed, 0.15);
    } else if (flowMode == 3) {
      // Particle flow: multiple dots traveling along edge
      flowValue = particleFlow(pos.x, time, flowSpeed, 3.0);
    } else if (flowMode == 4) {
      // Noise advection: flowing noise pattern
      flowValue = noiseAdvection(pos, linkIndex, time, flowSpeed);
    } else if (flowMode == 5) {
      // Line Integral Convolution: wind-map style streaked noise
      flowValue = licFlow(pos, linkIndex, time, flowSpeed);
    }

    // Apply flow effect: brighten the edge based on flow value
    // Mix between base color and brightened color based on intensity
    float brightness = 1.0 + flowValue * flowIntensity;
    color = color * brightness;

    // Optional: also modulate opacity for more visible particles
    if (flowMode == 3) {
      opacity = opacity * (0.5 + flowValue * 0.5 * flowIntensity);
    }

    // For noise-based modes, modulate opacity slightly for texture
    if (flowMode == 4 || flowMode == 5) {
      opacity = opacity * (0.7 + flowValue * 0.3 * flowIntensity);
    }
  }

  if (renderMode > 0.0) {
    if (opacity > 0.0) {
      gl_FragColor = vec4(linkIndex, 0.0, 0.0, 1.0);
    } else {
      gl_FragColor = vec4(-1.0, 0.0, 0.0, 0.0);
    }
  } else gl_FragColor = vec4(color, opacity);

}