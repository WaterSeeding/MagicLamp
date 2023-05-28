uniform sampler2D uMask;

varying float vAlpha;

vec3 color=vec3(1.0, 0.0471, 0.9059);

void main()
{
    float maskStrength=texture2D(uMask,gl_PointCoord).r;
    gl_FragColor=vec4(color,maskStrength*vAlpha);
}