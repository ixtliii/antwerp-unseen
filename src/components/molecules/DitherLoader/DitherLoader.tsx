import { useRef, useEffect, useState } from 'react';
import './ditherLoader.css';

interface Props {
    src?: string;
    onComplete?: () => void;
    duration?: number;
}

const vertexShader = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
        v_uv = vec2(a_position.x * 0.5 + 0.5, 1.0 - (a_position.y * 0.5 + 0.5));
        gl_Position = vec4(a_position, 0.0, 1.0);
    }
`;

const fragmentShader = `
    precision mediump float;
    uniform sampler2D u_video;
    uniform vec2 u_resolution;
    uniform float u_progress;
    uniform float u_time;
    varying vec2 v_uv;

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

    void main() {
        float dynamicPixelSize = mix(50.0, 2.0, u_progress);
        vec2 px = u_resolution / dynamicPixelSize;
        vec2 uv = floor(v_uv * px) / px;

        float aberration = (1.0 - u_progress) * 0.03;
        vec2 rUv = uv + vec2(aberration, 0.0);
        vec2 bUv = uv - vec2(aberration, 0.0);

        float r = texture2D(u_video, rUv).r;
        float g = texture2D(u_video, uv).g;
        float b = texture2D(u_video, bUv).b;
        vec3 c = vec3(r, g, b);

        float lum = dot(c, vec3(0.299, 0.587, 0.114));
        lum = clamp((lum - 0.5) * 1.5 + 0.5, 0.0, 1.0);

        float scanline = sin(v_uv.y * 800.0 - u_time * 5.0) * 0.05;
        lum -= scanline;

        vec2 screenPos = v_uv * u_resolution / dynamicPixelSize;
        float threshold = bayer(screenPos);

        float bw = lum > (threshold + sin(u_time * 3.0 + uv.x * 5.0) * 0.05) ? 1.0 : 0.0;

        float invert = step(0.95, u_progress) * smoothstep(0.95, 1.0, u_progress);
        bw = abs(invert - bw);

        gl_FragColor = vec4(vec3(bw), 1.0);
    }
`;

const DitherLoader = ({ src = '/loader.mp4', onComplete, duration = 3000 }: Props) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const progressRef = useRef(0);
    const doneRef = useRef(false);
    const [done, setDone] = useState(false);
    const [pct, setPct] = useState(0);

    useEffect(() => {
        const start = performance.now();
        let raf = 0;
        const tick = (now: number) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);

            progressRef.current = eased;
            setPct(Math.round(eased * 100));

            if (t < 1) {
                raf = requestAnimationFrame(tick);
            } else {
                setTimeout(() => {
                    doneRef.current = true;
                    setDone(true);
                    onComplete?.();
                    videoRef.current?.pause();
                }, 600);
            }
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [duration, onComplete]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;

        const gl = canvas.getContext('webgl', { antialias: false });
        if (!gl) return;

        const compile = (type: number, source: string) => {
            const shader = gl.createShader(type)!;
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            return shader;
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

        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        const uVideo = gl.getUniformLocation(program, 'u_video');
        const uResolution = gl.getUniformLocation(program, 'u_resolution');
        const uProgress = gl.getUniformLocation(program, 'u_progress');
        const uTime = gl.getUniformLocation(program, 'u_time');

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio, 2);
            canvas.width = canvas.clientWidth * dpr;
            canvas.height = canvas.clientHeight * dpr;
            gl.viewport(0, 0, canvas.width, canvas.height);
        };

        resize();
        window.addEventListener('resize', resize);

        let raf = 0;
        const startTime = performance.now();

        const render = () => {
            const currentTime = (performance.now() - startTime) / 1000.0;

            if (!doneRef.current && video.readyState >= video.HAVE_CURRENT_DATA) {
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
            }

            gl.uniform1i(uVideo, 0);
            gl.uniform2f(uResolution, canvas.width, canvas.height);
            gl.uniform1f(uProgress, progressRef.current);
            gl.uniform1f(uTime, doneRef.current ? 0 : currentTime);
            gl.drawArrays(gl.TRIANGLES, 0, 6);

            raf = requestAnimationFrame(render);
        };

        video.play().catch(() => {});
        render();

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <div className={`dither-loader ${done ? 'dither-loader--done' : ''}`}>
            <div className="dither-loader__stage">
                <video
                    ref={videoRef}
                    className="dither-loader__source"
                    src={src}
                    muted
                    loop
                    playsInline
                    autoPlay
                />
                <canvas ref={canvasRef} className="dither-loader__canvas" />
            </div>

            <div className="dither-loader__bar">
                <div className="dither-loader__bar-meta">
                    <span>Loading the archive</span>
                    <span className="dither-loader__pct">{String(pct).padStart(3, '0')}</span>
                </div>
                <div className="dither-loader__track">
                    <div
                        className="dither-loader__fill"
                        style={{ transform: `scaleX(${pct / 100})` }}
                    />
                </div>
            </div>
        </div>
    );
};

export default DitherLoader;