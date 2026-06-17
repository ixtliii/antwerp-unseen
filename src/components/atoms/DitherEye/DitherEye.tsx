import { useEffect, useRef } from 'react';
import './ditherEye.css';

interface DitherEyeProps {
    mouse: React.RefObject<{ x: number; y: number }>;
    className?: string;
}

const VERT = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

// 4x4 Bayer matrix ordered dithering
float bayer(vec2 p) {
    int x = int(mod(p.x, 4.0));
    int y = int(mod(p.y, 4.0));
    int idx = x + y * 4;
    float m[16];
    m[0]=0.0;  m[1]=8.0;  m[2]=2.0;  m[3]=10.0;
    m[4]=12.0; m[5]=4.0;  m[6]=14.0; m[7]=6.0;
    m[8]=3.0;  m[9]=11.0; m[10]=1.0; m[11]=9.0;
    m[12]=15.0;m[13]=7.0; m[14]=13.0;m[15]=5.0;
    float v = 0.0;
    for (int i = 0; i < 16; i++) { if (i == idx) v = m[i]; }
    return v / 16.0;
}

// lens / eye shape SDF
float eyeShape(vec2 p) {
    // two curves meeting at corners -> almond shape
    float top = 1.0 - (p.x * p.x) / 0.64;       // upper lid parabola
    float bot = -(1.0 - (p.x * p.x) / 0.64);    // lower lid
    float inside = step(p.y, top * 0.55) * step(bot * 0.55, p.y) * step(abs(p.x), 0.8);
    return inside;
}

void main() {
    vec2 uv = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
    uv.x *= u_resolution.x / u_resolution.y;

    float eye = eyeShape(uv);

    // iris follows mouse a little
    vec2 irisCenter = u_mouse * 0.18;
    float d = length(uv - irisCenter);
    float iris = smoothstep(0.30, 0.28, d);   // dark disc
    float pupilHi = smoothstep(0.10, 0.08, length(uv - irisCenter - vec2(0.05, 0.06)));

    // base brightness: white sclera, dark iris
    float lum = eye * (1.0 - iris * 0.92);
    lum += pupilHi * 0.5 * eye;

    // animated grain into the dither threshold
    float shimmer = sin(u_time * 1.5 + uv.x * 8.0) * 0.015;

    // ordered dithering
    float threshold = bayer(gl_FragCoord.xy);
    float dithered = step(threshold, lum + shimmer);

    if (eye < 0.5) discard;            // transparent outside the eye
    vec3 col = vec3(dithered);
    gl_FragColor = vec4(col, dithered < 0.5 && iris > 0.5 ? 1.0 : dithered);
}
`;

const DitherEye = ({ mouse, className }: DitherEyeProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const gl = canvas.getContext('webgl', { premultipliedAlpha: false, alpha: true });
        if (!gl) return;

        const compile = (type: number, src: string) => {
            const s = gl.createShader(type)!;
            gl.shaderSource(s, src);
            gl.compileShader(s);
            return s;
        };
        const prog = gl.createProgram()!;
        gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
        gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
        gl.linkProgram(prog);
        gl.useProgram(prog);

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, 'a_position');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

        const uRes = gl.getUniformLocation(prog, 'u_resolution');
        const uTime = gl.getUniformLocation(prog, 'u_time');
        const uMouse = gl.getUniformLocation(prog, 'u_mouse');

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio, 2);
            canvas.width = canvas.clientWidth * dpr;
            canvas.height = canvas.clientHeight * dpr;
            gl.viewport(0, 0, canvas.width, canvas.height);
        };
        resize();
        window.addEventListener('resize', resize);

        let raf = 0;
        const start = performance.now();
        const render = () => {
            const t = (performance.now() - start) / 1000;
            gl.uniform2f(uRes, canvas.width, canvas.height);
            gl.uniform1f(uTime, t);
            const m = mouse.current;
            gl.uniform2f(uMouse, m ? m.x : 0, m ? -m.y : 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            raf = requestAnimationFrame(render);
        };
        render();

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', resize);
        };
    }, [mouse]);

    return <canvas ref={canvasRef} className={`dither-eye ${className ?? ''}`} />;
};

export default DitherEye;