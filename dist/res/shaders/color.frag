//https://www.cnblogs.com/webgl-angela/p/9846990.html

#ifdef GL_ES
precision highp float;
#endif

#extension GL_OES_standard_derivatives : enable

uniform vec3 diffuse;

void main(void)
{
  gl_FragColor = vec4(diffuse, 1.0);
}