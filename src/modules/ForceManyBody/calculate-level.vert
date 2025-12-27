#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D positionsTexture;
uniform sampler2D repulsionMultipliersTexture;
uniform float pointsTextureSize;
uniform float levelTextureSize;
uniform float cellSize;

attribute vec2 pointIndices;

varying vec4 rgba;

void main() {
  vec4 pointPosition = texture2D(positionsTexture, pointIndices / pointsTextureSize);
  // Get repulsion multiplier for this point (defaults to 1.0 if texture not provided or value is 0)
  vec4 repulsionMultiplierVec = texture2D(repulsionMultipliersTexture, pointIndices / pointsTextureSize);
  float repulsionMultiplier = repulsionMultiplierVec.r;
  // Use multiplier as the mass contribution - 0 means use default of 1.0
  float effectiveMultiplier = repulsionMultiplier > 0.0 ? repulsionMultiplier : 1.0;
  rgba = vec4(pointPosition.rg, effectiveMultiplier, 0.0);

  float n = floor(pointPosition.x / cellSize);
  float m = floor(pointPosition.y / cellSize);

  vec2 levelPosition = 2.0 * (vec2(n, m) + 0.5) / levelTextureSize - 1.0;

  gl_Position = vec4(levelPosition, 0.0, 1.0);
  gl_PointSize = 1.0;
}