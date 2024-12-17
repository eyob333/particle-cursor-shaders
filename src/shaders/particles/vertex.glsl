uniform vec2 uResolution;
uniform sampler2D uImgTexture;
uniform sampler2D uDisplacementTexture;

varying vec3 vColor;

attribute float aIntensity;
attribute float aAngle;


void main(){

    // Position
    vec3 newPosition = position;
    float displacementIntensity = texture(uDisplacementTexture, uv).r;
    displacementIntensity = smoothstep( 0.1, .3, displacementIntensity);
    vec3 displacement = vec3( 
         cos(aAngle) * .2,
         sin(aAngle) * .2, 
        1.);
    displacement = normalize( displacement);
    displacement *= displacementIntensity;
    displacement *= 3.;
    displacement *= aIntensity;

    newPosition += displacement;

    // Final position
    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    //Texture
    float picureIntensity = texture(uImgTexture, uv).r;

    // Point size
    gl_PointSize = 0.15 * picureIntensity * uResolution.y;
    gl_PointSize *= (1.0 / - viewPosition.z);

    // varyings

    vColor = vec3(pow(picureIntensity, 3.));

}