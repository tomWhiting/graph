// Fragment shader for metaball/contour rendering
// WebGL1 (GLSL ES 1.0) compatible - ported from Sigma.js layer-webgl

#ifdef GL_ES
precision highp float;
#endif

// Maximum number of levels we support
#define MAX_LEVELS 16
// Maximum nodes per group (can be increased, but affects loop performance)
#define MAX_NODES 1024

// Main positions texture from Cosmograph (contains ALL node positions)
uniform sampler2D positionsTexture;
uniform float pointsTextureSize;

// Group node indices texture (1D: nodeCount x 1, contains point indices)
uniform sampler2D groupIndicesTexture;
uniform float nodeCount;
uniform float groupTextureWidth;

// Contour parameters
uniform float radius;
uniform float feather;
uniform float levelCount;

// Level data as individual uniforms (WebGL1 doesn't handle array uniforms well)
uniform float levelThreshold0, levelThreshold1, levelThreshold2, levelThreshold3;
uniform float levelThreshold4, levelThreshold5, levelThreshold6, levelThreshold7;
uniform float levelThreshold8, levelThreshold9, levelThreshold10, levelThreshold11;
uniform float levelThreshold12, levelThreshold13, levelThreshold14, levelThreshold15;

uniform vec4 levelColor0, levelColor1, levelColor2, levelColor3;
uniform vec4 levelColor4, levelColor5, levelColor6, levelColor7;
uniform vec4 levelColor8, levelColor9, levelColor10, levelColor11;
uniform vec4 levelColor12, levelColor13, levelColor14, levelColor15;

// Border parameters (optional)
uniform float hasBorder;
uniform vec4 borderColor;
uniform float borderThickness;
uniform float outerThreshold;

// Camera/transform uniforms
uniform mat3 transformationMatrix;
uniform float spaceSize;
uniform vec2 screenSize;

// Input from vertex shader
varying vec2 screenCoord;

// Helper to get threshold by index
float getThreshold(int i) {
    if (i == 0) return levelThreshold0;
    if (i == 1) return levelThreshold1;
    if (i == 2) return levelThreshold2;
    if (i == 3) return levelThreshold3;
    if (i == 4) return levelThreshold4;
    if (i == 5) return levelThreshold5;
    if (i == 6) return levelThreshold6;
    if (i == 7) return levelThreshold7;
    if (i == 8) return levelThreshold8;
    if (i == 9) return levelThreshold9;
    if (i == 10) return levelThreshold10;
    if (i == 11) return levelThreshold11;
    if (i == 12) return levelThreshold12;
    if (i == 13) return levelThreshold13;
    if (i == 14) return levelThreshold14;
    return levelThreshold15;
}

// Helper to get color by index
vec4 getColor(int i) {
    if (i == 0) return levelColor0;
    if (i == 1) return levelColor1;
    if (i == 2) return levelColor2;
    if (i == 3) return levelColor3;
    if (i == 4) return levelColor4;
    if (i == 5) return levelColor5;
    if (i == 6) return levelColor6;
    if (i == 7) return levelColor7;
    if (i == 8) return levelColor8;
    if (i == 9) return levelColor9;
    if (i == 10) return levelColor10;
    if (i == 11) return levelColor11;
    if (i == 12) return levelColor12;
    if (i == 13) return levelColor13;
    if (i == 14) return levelColor14;
    return levelColor15;
}

// Utility: smooth linear interpolation for anti-aliasing
float linearstep(float edge0, float edge1, float x) {
    return clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
}

// Get the point index from the group indices texture
float getPointIndex(int groupIndex) {
    float texCoord = (float(groupIndex) + 0.5) / groupTextureWidth;
    return texture2D(groupIndicesTexture, vec2(texCoord, 0.5)).a;
}

// Get node position from the main positions texture using point index
vec2 getNodePosition(float pointIndex) {
    // Convert 1D index to 2D texture coordinates
    float x = mod(pointIndex, pointsTextureSize);
    float y = floor(pointIndex / pointsTextureSize);
    vec2 texCoord = (vec2(x, y) + 0.5) / pointsTextureSize;
    return texture2D(positionsTexture, texCoord).rg;
}

// Convert screen coordinates to world/space coordinates
vec2 screenToWorld(vec2 screen) {
    // screen is in [-1, 1] normalized device coordinates
    // We need to invert the transformation matrix to go back to world space

    float a = transformationMatrix[0][0];
    float b = transformationMatrix[1][0];
    float c = transformationMatrix[0][1];
    float d = transformationMatrix[1][1];
    float tx = transformationMatrix[2][0];
    float ty = transformationMatrix[2][1];

    // Calculate determinant
    float det = a * d - b * c;

    // Calculate inverse transformation
    float invA = d / det;
    float invB = -b / det;
    float invC = -c / det;
    float invD = a / det;
    float invTx = (b * ty - d * tx) / det;
    float invTy = (c * tx - a * ty) / det;

    // Apply inverse transform
    vec2 worldNorm = vec2(
        invA * screen.x + invB * screen.y + invTx,
        invC * screen.x + invD * screen.y + invTy
    );

    // Convert from normalized to world coordinates
    vec2 world = (worldNorm * screenSize / spaceSize + 1.0) * 0.5 * spaceSize;

    return world;
}

void main() {
    // Early exit if no nodes
    if (nodeCount < 1.0) {
        gl_FragColor = vec4(0.0);
        return;
    }

    // Convert screen position to world coordinates
    vec2 worldPos = screenToWorld(screenCoord);

    // Calculate metaball score - sum of contributions from all nodes
    float score = 0.0;

    // Iterate through all nodes in the group
    for (int i = 0; i < MAX_NODES; i++) {
        if (float(i) >= nodeCount) break;

        // Get the point index from the group indices texture
        float pointIndex = getPointIndex(i);
        // Get the actual position from the main positions texture
        vec2 nodePos = getNodePosition(pointIndex);
        vec2 diff = worldPos - nodePos;

        // Early exit optimization using Manhattan distance
        if (abs(diff.x) > radius || abs(diff.y) > radius) continue;

        float d = length(diff);

        // Smoothstep contribution - creates soft falloff
        score += smoothstep(radius, 0.0, d);
    }

    // Find the appropriate level color based on score
    vec4 levelColor = vec4(0.0);
    float currentThreshold = 0.0;

    // Find which level we're in (levels should be sorted descending by threshold)
    for (int i = 0; i < MAX_LEVELS; i++) {
        if (float(i) >= levelCount) break;

        float threshold = getThreshold(i);
        if (score > threshold) {
            levelColor = getColor(i);
            currentThreshold = threshold;
            break;
        }
    }

    // If we have a border, calculate contour lines
    if (hasBorder > 0.5 && levelColor.a > 0.0) {
        // Simple border: draw at the edge of the outermost level
        float borderStart = outerThreshold - borderThickness * 0.01;
        float borderEnd = outerThreshold + borderThickness * 0.01;

        if (score > borderStart && score < borderEnd) {
            // We're in the border zone
            float borderFactor = 1.0 - abs(score - outerThreshold) / (borderThickness * 0.01);
            borderFactor = smoothstep(0.0, 1.0, borderFactor);
            levelColor = mix(levelColor, borderColor, borderFactor);
        }
    }

    // Apply feathering for smooth edges
    if (feather > 0.0 && levelColor.a > 0.0) {
        // Soften the transition at level boundaries
        float edgeSoftness = feather * 0.1;
        if (currentThreshold > 0.0) {
            float edgeFactor = linearstep(currentThreshold - edgeSoftness, currentThreshold + edgeSoftness, score);
            levelColor.a *= edgeFactor;
        }
    }

    gl_FragColor = levelColor;
}
