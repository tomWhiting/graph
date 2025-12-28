// Vertex shader for fullscreen quad - renders contours across entire viewport

#ifdef GL_ES
precision highp float;
#endif

attribute vec2 vertexCoord;
varying vec2 screenCoord;

void main() {
    // Pass through normalized device coordinates for fragment shader
    screenCoord = vertexCoord;
    gl_Position = vec4(vertexCoord, 0.0, 1.0);
}
