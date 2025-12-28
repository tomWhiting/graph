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

// Flow animation uniforms - Layer 1 (primary)
uniform float time;
uniform bool flowEnabled;
uniform float flowSpeed;
uniform float flowPulseWidth;    // 0.001 = very narrow (particles), 0.5 = medium, 0.99 = wide
uniform float flowPulseCount;    // number of pulses per edge
uniform float flowWaveShape;     // 0.0 = square, 0.5 = triangle, 1.0 = sine (smoothest)
uniform float flowBrightness;    // How much brighter pulses are (1.0 = same, 2.0 = 2x brighter)
uniform float flowFade;          // How much to fade non-pulse areas (0 = no fade, 1 = fully transparent)
uniform vec4 flowColor;          // Color to tint pulses (RGBA, alpha = blend amount)

// Flow animation uniforms - Layer 2 (secondary, for stacking effects)
uniform bool flow2Enabled;
uniform float flow2Speed;
uniform float flow2PulseWidth;
uniform float flow2PulseCount;
uniform float flow2WaveShape;
uniform float flow2Brightness;
uniform float flow2Fade;
uniform vec4 flow2Color;

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

// Wave shape functions
float squareWave(float x) {
  // Sharp on/off - only the middle 50% is "on"
  return (x > 0.25 && x < 0.75) ? 1.0 : 0.0;
}

float triangleWave(float x) {
  // Linear ramp: even gradient from 0 to peak to 0
  return 1.0 - abs(x * 2.0 - 1.0);
}

float sineWave(float x) {
  // Soft feathered edges with pronounced center peak (Gaussian-like)
  // Using sin² for softer tails than triangle
  float s = sin(x * 3.14159265);
  return s * s * s * s; // sin^4 for very soft edges, sharp peak
}

// PWM-based flow animation with configurable wave shape
float pwmFlow(float t, float time, float speed, float pulseWidth, float pulseCount, float waveShape) {
  float result = 0.0;

  // For each pulse
  for (float i = 0.0; i < 8.0; i++) {
    if (i >= pulseCount) break;

    // Offset each pulse evenly along the edge
    float offset = i / pulseCount;

    // Calculate phase (0-1) for this pulse, animated by time
    float phase = fract(t * pulseCount - time * speed + offset);

    // Map phase to pulse window
    // If phase is within pulseWidth, we're in the "on" region
    float pulsePhase = phase / pulseWidth;

    float pulse = 0.0;
    if (phase < pulseWidth) {
      // Apply wave shape
      if (waveShape < 0.33) {
        // Square wave - sharp on/off
        pulse = squareWave(pulsePhase);
      } else if (waveShape < 0.66) {
        // Triangle wave - linear ramp
        pulse = triangleWave(pulsePhase);
      } else {
        // Sine wave - smooth bell curve
        pulse = sineWave(pulsePhase);
      }
    }

    result = max(result, pulse);
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

  // Apply PWM-based flow animation - Layer 1
  if (flowEnabled) {
    float flowValue = pwmFlow(pos.x, time, flowSpeed, flowPulseWidth, flowPulseCount, flowWaveShape);

    // Brightness adds light to peaks only (blend toward bright, not multiply)
    // flowBrightness 1.0 = no change, 2.0 = blend 50% toward white at peak, etc.
    float brightBlend = flowValue * (flowBrightness - 1.0) * 0.3; // Scale down for control
    vec3 brightColor = mix(color, vec3(1.0), clamp(brightBlend, 0.0, 0.9));

    // Apply pulse color tinting (overrides brightness if color alpha > 0)
    if (flowColor.a > 0.0) {
      // Tint toward the specified color at peaks
      vec3 tintTarget = flowColor.rgb + (vec3(1.0) - flowColor.rgb) * (flowBrightness - 1.0) * 0.2;
      brightColor = mix(brightColor, tintTarget, flowValue * flowColor.a);
    }

    color = brightColor;

    // Apply fade to non-pulse areas (flowFade controls how much to dim/fade)
    float fadeAmount = (1.0 - flowValue) * flowFade;
    opacity = opacity * (1.0 - fadeAmount);
  }

  // Apply PWM-based flow animation - Layer 2 (stacks on top of layer 1)
  if (flow2Enabled) {
    float flowValue2 = pwmFlow(pos.x, time, flow2Speed, flow2PulseWidth, flow2PulseCount, flow2WaveShape);

    // Brightness adds light to peaks only
    float brightBlend2 = flowValue2 * (flow2Brightness - 1.0) * 0.3;
    vec3 brightColor2 = mix(color, vec3(1.0), clamp(brightBlend2, 0.0, 0.9));

    // Apply layer 2 pulse color tinting
    if (flow2Color.a > 0.0) {
      vec3 tintTarget2 = flow2Color.rgb + (vec3(1.0) - flow2Color.rgb) * (flow2Brightness - 1.0) * 0.2;
      brightColor2 = mix(brightColor2, tintTarget2, flowValue2 * flow2Color.a);
    }

    color = brightColor2;

    // Apply layer 2 fade (additive with layer 1)
    float fadeAmount2 = (1.0 - flowValue2) * flow2Fade;
    opacity = opacity * (1.0 - fadeAmount2);
  }

  if (renderMode > 0.0) {
    if (opacity > 0.0) {
      gl_FragColor = vec4(linkIndex, 0.0, 0.0, 1.0);
    } else {
      gl_FragColor = vec4(-1.0, 0.0, 0.0, 0.0);
    }
  } else gl_FragColor = vec4(color, opacity);

}