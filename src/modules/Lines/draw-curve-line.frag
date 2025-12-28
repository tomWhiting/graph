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
uniform int flowMode; // 0 = off, 1 = gradient, 2 = pulse, 3 = particles

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
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
    }

    // Apply flow effect: brighten the edge based on flow value
    // Mix between base color and brightened color based on intensity
    float brightness = 1.0 + flowValue * flowIntensity;
    color = color * brightness;

    // Optional: also modulate opacity for more visible particles
    if (flowMode == 3) {
      opacity = opacity * (0.5 + flowValue * 0.5 * flowIntensity);
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