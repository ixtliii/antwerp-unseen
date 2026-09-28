import { useEffect, useRef } from 'react';
import './ditherEye.css';

const VERT = `attribute vec2 p; void main(){ gl_Position=vec4(p,0.,1.); }`;
const FRAG = `precision highp float;
uniform vec2 u_res; uniform float u_time; uniform vec2 u_mouse;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
float bayer(vec2 q){int x=int(mod(q.x,4.));int y=int(mod(q.y,4.));int idx=x+y*4;float m[16];
 m[0]=0.;m[1]=8.;m[2]=2.;m[3]=10.;m[4]=12.;m[5]=4.;m[6]=14.;m[7]=6.;m[8]=3.;m[9]=11.;m[10]=1.;m[11]=9.;m[12]=15.;m[13]=7.;m[14]=13.;m[15]=5.;
 float v=0.;for(int i=0;i<16;i++){if(i==idx)v=m[i];}return v/16.;}
void main(){
 vec2 uv=(gl_FragCoord.xy/u_res)*2.-1.; uv.x*=u_res.x/u_res.y;
 float lid=0.6*(1.0-(uv.x*uv.x)/0.9);
 float eye=step(uv.y,lid)*step(-lid,uv.y)*step(abs(uv.x),0.95);
 float tip=step(0.95,uv.x)*step(abs(uv.y),0.6-(uv.x-0.95)*1.5);
 eye=max(eye,tip);
 if(eye<0.5){discard;}
 vec2 iris=u_mouse*0.3; float d=length(uv-iris);
 float irisMask=smoothstep(0.42,0.40,d);
 float pupil=smoothstep(0.22,0.20,d);
 float grain=noise(uv*6.+u_time*0.2);
 float lum=1.0 - irisMask*0.5 - pupil*0.5 + grain*0.25;
 float dith=step(bayer(gl_FragCoord.xy),clamp(lum,0.,1.));
 gl_FragColor=vec4(vec3(dith),1.0);
}`;

interface DitherEyeProps { className?: string; }

const DitherEye = ({ className }: DitherEyeProps) => {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = ref.current!;
        const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
        if (!gl) return;
        const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
        const onMove = (e: MouseEvent) => { mouse.tx = e.clientX / innerWidth - 0.5; mouse.ty = e.clientY / innerHeight - 0.5; };
        window.addEventListener('mousemove', onMove);
        const sh = (t: number, s: string) => { const o = gl.createShader(t)!; gl.shaderSource(o, s); gl.compileShader(o); return o; };
        const prog = gl.createProgram()!;
        gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
        gl.linkProgram(prog); gl.useProgram(prog);
        const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
        const pl = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(pl); gl.vertexAttribPointer(pl, 2, gl.FLOAT, false, 0, 0);
        const uR = gl.getUniformLocation(prog, 'u_res'), uT = gl.getUniformLocation(prog, 'u_time'), uM = gl.getUniformLocation(prog, 'u_mouse');
        const rs = () => { const d = Math.min(devicePixelRatio, 2); canvas.width = canvas.clientWidth * d; canvas.height = canvas.clientHeight * d; gl.viewport(0, 0, canvas.width, canvas.height); };
        rs(); window.addEventListener('resize', rs);
        const start = performance.now(); let raf = 0;
        const loop = () => {
            mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;
            gl.uniform2f(uR, canvas.width, canvas.height); gl.uniform1f(uT, (performance.now() - start) / 1000); gl.uniform2f(uM, mouse.x, -mouse.y);
            gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 6);
            raf = requestAnimationFrame(loop);
        };
        loop();
        return () => { cancelAnimationFrame(raf); window.removeEventListener('mousemove', onMove); window.removeEventListener('resize', rs); };
    }, []);

    return <canvas ref={ref} className={`dither-eye ${className ?? ''}`} />;
};

export default DitherEye;