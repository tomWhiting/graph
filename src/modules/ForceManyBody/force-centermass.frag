// The fragment shader calculates the velocity of a point based on its position,
// the positions of other points in a spatial hierarchy, and random factors.

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D positionsTexture;
uniform sampler2D levelFbo;
uniform sampler2D randomValues;
uniform sampler2D repulsionMultipliersTexture;

uniform float levelTextureSize;
uniform float repulsion;
uniform float alpha;

varying vec2 textureCoords;

// Calculate the additional velocity based on the center of mass
vec2 calculateAdditionalVelocity (vec2 ij, vec2 pp, float pointRepulsionMultiplier) {
  vec2 add = vec2(0.0);
  vec4 centermass = texture2D(levelFbo, ij);
  if (centermass.r > 0.0 && centermass.g > 0.0 && centermass.b > 0.0) {
    vec2 centermassPosition = vec2(centermass.rg / centermass.b);
    vec2 distVector = pp - centermassPosition;
    float l = dot(distVector, distVector);
    float dist = sqrt(l);
    if (l > 0.0) {
      float angle = atan(distVector.y, distVector.x);
      // Apply both the centermass weight and the current point's repulsion multiplier
      float c = alpha * repulsion * centermass.b * pointRepulsionMultiplier;

      float distanceMin2 = 1.0;
      if (l < distanceMin2) l = sqrt(distanceMin2 * l);
      float addV = c / sqrt(l);
      add = addV * vec2(cos(angle), sin(angle));
    }
  }
  return add;
}

void main() {
  vec4 pointPosition = texture2D(positionsTexture, textureCoords);
  vec4 random = texture2D(randomValues, textureCoords);

  // Get the repulsion multiplier for this point (0 or missing means use default of 1.0)
  vec4 repulsionMultiplierVec = texture2D(repulsionMultipliersTexture, textureCoords);
  float pointRepulsionMultiplier = repulsionMultiplierVec.r;
  pointRepulsionMultiplier = pointRepulsionMultiplier > 0.0 ? pointRepulsionMultiplier : 1.0;

  vec4 velocity = vec4(0.0);

  // Calculate additional velocity based on the point position
  velocity.xy += calculateAdditionalVelocity(pointPosition.xy / levelTextureSize, pointPosition.xy, pointRepulsionMultiplier);
  // Apply random factor to the velocity
  velocity.xy += velocity.xy * random.rg;

  gl_FragColor = velocity;
}