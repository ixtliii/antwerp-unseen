import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import './pixelTransition.css';

const vertexShader = `
    attribute vec2 a_position;
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
    }
`;

const fragmentShader = `
    precision mediump float;
    uniform vec2 u_resolution;
    uniform float u_progress;   // 0 = clear, 1 = fully covered
    uniform float u_pixelSize;
    uniform float u_time;
    uniform vec3 u_color;

    float bayer(vec2 p) {
        int x = int(mod(p.x, 4.0));
        int y = int(mod(p.y, 4.0));
        int idx = x + y * 4;
        float m[16];
        m[0]=0.0;   m[1]=8.0;   m[2]=2.0;   m[3]=10.0;
        m[4]=12.0;  m[5]=4.0;   m[6]=14.0;  m[7]=6.0;
        m[8]=3.0;   m[9]=11.0;  m[10]=1.0;  m[11]=9.0;
        m[12]=15.0; m[13]=7.0;  m[14]=13.0; m[15]=5.0;
        float v = 0.0;
        for (int i = 0; i < 16; i++) {
            if (i == idx) v = m[i];
        }
        return (v + 0.5) / 16.0;
    }

    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    void main() {
        vec2 cell = floor(gl_FragCoord.xy / u_pixelSize);
        float threshold = bayer(cell);

        float n = random(cell + floor(u_time * 12.0)) * 0.06;

        float cover = step(threshold + n, u_progress);

        gl_FragColor = vec4(u_color, cover);
    }
`;

export default function PixelTransition() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const glRef = useRef<WebGLRenderingContext | null>(null);
    const uniformsRef = useRef<{
        progress: WebGLUniformLocation | null;
        resolution: WebGLUniformLocation | null;
        pixelSize: WebGLUniformLocation | null;
        time: WebGLUniformLocation | null;
        color: WebGLUniformLocation | null;
    }>({ progress: null, resolution: null, pixelSize: null, time: null, color: null });
    const progressRef = useRef(0);
    const startTimeRef = useRef(performance.now());

    // --- one-time WebGL setup ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
        if (!gl) {
            console.error('[PixelTransition] WebGL not supported');
            return;
        }
        glRef.current = gl;

        const compile = (type: number, src: string) => {
            const s = gl.createShader(type)!;
            gl.shaderSource(s, src);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                console.error('[PixelTransition] shader error:', gl.getShaderInfoLog(s));
            }
            return s;
        };

        const program = gl.createProgram()!;
        gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexShader));
        gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentShader));
        gl.linkProgram(program);
        gl.useProgram(program);

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
            gl.STATIC_DRAW
        );
        const posLoc = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        uniformsRef.current = {
            progress: gl.getUniformLocation(program, 'u_progress'),
            resolution: gl.getUniformLocation(program, 'u_resolution'),
            pixelSize: gl.getUniformLocation(program, 'u_pixelSize'),
            time: gl.getUniformLocation(program, 'u_time'),
            color: gl.getUniformLocation(program, 'u_color'),
        };

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio, 2);
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            gl.viewport(0, 0, canvas.width, canvas.height);
        };
        resize();
        window.addEventListener('resize', resize);

        draw();

        return () => window.removeEventListener('resize', resize);
    }, []);

    const draw = () => {
        const gl = glRef.current;
        const canvas = canvasRef.current;
        if (!gl || !canvas) return;

        const u = uniformsRef.current;
        const dpr = Math.min(window.devicePixelRatio, 2);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.uniform1f(u.progress, progressRef.current);
        gl.uniform2f(u.resolution, canvas.width, canvas.height);
        gl.uniform1f(u.pixelSize, 6.0 * dpr); // chunky — match the loader
        gl.uniform1f(u.time, (performance.now() - startTimeRef.current) / 1000);
        gl.uniform3f(u.color, 1.0, 1.0, 1.0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    useEffect(() => {
        const handleStart = (e: Event) => {
            const callback = (e as CustomEvent).detail as () => void;
            const wrapper = canvasRef.current?.parentElement;

            if (wrapper) wrapper.style.pointerEvents = 'auto';

            const state = { value: 0 };

            const tl = gsap.timeline({
                onComplete: () => {
                    if (wrapper) wrapper.style.pointerEvents = 'none';
                },
            });

            // 1. Cover the screen
            tl.to(state, {
                value: 1,
                duration: 0.6,
                ease: 'power2.inOut',
                onUpdate: () => {
                    progressRef.current = state.value;
                    draw();
                }
            });

            // 2. Perform navigation EXACTLY at the peak
            tl.add(() => callback());

            // 3. Keep the screen covered while the new page loads/mounts
            tl.to({}, { duration: 0.5 });

            // 4. Reveal
            tl.to(state, {
                value: 0,
                duration: 0.6,
                ease: 'power2.inOut',
                onUpdate: () => {
                    progressRef.current = state.value;
                    draw();
                }
            });
        };

        window.addEventListener('pixel-transition-start', handleStart);
        return () => window.removeEventListener('pixel-transition-start', handleStart);
    }, []);
    return (
        <div className="pixel-transition-wrapper">
            <canvas ref={canvasRef} className="pixel-transition-canvas" />
        </div>
    );
}