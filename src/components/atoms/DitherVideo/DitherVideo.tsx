import { useRef, useEffect } from 'react';
import './ditherVideo.css';

interface Props {
    src: string;
    pixelSize?: number;
    intensity?: number;
    cutout?: boolean;
    playbackRate?: number;
    mouseReactive?: boolean;
    className?: string;
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
    uniform vec2 u_mouse;
    uniform float u_pixelSize;
    uniform float u_intensity;
    uniform float u_cutout;
    uniform float u_mouseReactive;
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
        // distance from cursor (0 at cursor, ~1 at far corner)
        float dist = distance(v_uv, u_mouse);
        float influence = smoothstep(0.5, 0.0, dist) * u_mouseReactive;

        // pixel size: finer near cursor, chunkier farther — so the dither "focuses"
        float dynamicPixelSize = mix(u_pixelSize, u_pixelSize * 0.55, influence);

        vec2 px = u_resolution / dynamicPixelSize;
        vec2 uv = floor(v_uv * px) / px;

        vec3 c = texture2D(u_video, uv).rgb;
        float lum = dot(c, vec3(0.299, 0.587, 0.114));
        lum = clamp((lum - 0.5) * 1.4 + 0.5, 0.0, 1.0);

        float scanline = sin(v_uv.y * 600.0 - u_time * 3.0) * 0.04;
        lum -= scanline;

        vec2 screenPos = v_uv * u_resolution / dynamicPixelSize;
        float threshold = bayer(screenPos);
        float bw = lum > threshold ? 1.0 : 0.0;

        // brighten near cursor for a "reveal" feel
        float dynamicIntensity = u_intensity + influence * 0.25;

        float alpha = mix(dynamicIntensity, bw * dynamicIntensity, u_cutout);

        gl_FragColor = vec4(vec3(bw), alpha);
    }
`;

const DitherVideo = ({
                         src,
                         pixelSize = 5,
                         intensity = 1,
                         cutout = false,
                         playbackRate = 1,
                         mouseReactive = false,
                         className = '',
                     }: Props) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const mouseRef = useRef({ x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 });

    // apply playbackRate when the video loads
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        const apply = () => { video.playbackRate = playbackRate; };
        apply();
        video.addEventListener('loadeddata', apply);
        return () => video.removeEventListener('loadeddata', apply);
    }, [playbackRate]);

    // mouse listener — store normalized 0..1 coords
    useEffect(() => {
        if (!mouseReactive) return;
        const onMove = (e: MouseEvent) => {
            mouseRef.current.tx = e.clientX / window.innerWidth;
            mouseRef.current.ty = 1 - e.clientY / window.innerHeight; // flip y for shader
        };
        window.addEventListener('mousemove', onMove);
        return () => window.removeEventListener('mousemove', onMove);
    }, [mouseReactive]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;

        const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false });
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

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        const uVideo = gl.getUniformLocation(program, 'u_video');
        const uResolution = gl.getUniformLocation(program, 'u_resolution');
        const uMouse = gl.getUniformLocation(program, 'u_mouse');
        const uPixelSize = gl.getUniformLocation(program, 'u_pixelSize');
        const uIntensity = gl.getUniformLocation(program, 'u_intensity');
        const uCutout = gl.getUniformLocation(program, 'u_cutout');
        const uMouseReactive = gl.getUniformLocation(program, 'u_mouseReactive');
        const uTime = gl.getUniformLocation(program, 'u_time');

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio, 1.5);
            canvas.width = canvas.clientWidth * dpr;
            canvas.height = canvas.clientHeight * dpr;
            gl.viewport(0, 0, canvas.width, canvas.height);
        };
        resize();
        window.addEventListener('resize', resize);

        let raf = 0;
        const startTime = performance.now();

        const render = () => {
            const t = (performance.now() - startTime) / 1000;

            const m = mouseRef.current;
            m.x += (m.tx - m.x) * 0.06;
            m.y += (m.ty - m.y) * 0.06;

            if (video.readyState >= video.HAVE_CURRENT_DATA) {
                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT);

                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
                gl.uniform1i(uVideo, 0);
                gl.uniform2f(uResolution, canvas.width, canvas.height);
                gl.uniform2f(uMouse, m.x, m.y);
                gl.uniform1f(uPixelSize, pixelSize * Math.min(window.devicePixelRatio, 1.5));
                gl.uniform1f(uIntensity, intensity);
                gl.uniform1f(uCutout, cutout ? 1.0 : 0.0);
                gl.uniform1f(uMouseReactive, mouseReactive ? 1.0 : 0.0);
                gl.uniform1f(uTime, t);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            }
            raf = requestAnimationFrame(render);
        };

        video.play().catch(() => {});
        render();

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', resize);
        };
    }, [pixelSize, intensity, cutout, mouseReactive]);

    return (
        <div className={`dither-video ${className}`}>
            <video
                ref={videoRef}
                className="dither-video__source"
                src={src}
                muted
                loop
                playsInline
                autoPlay
            />
            <canvas ref={canvasRef} className="dither-video__canvas" />
        </div>
    );
};

export default DitherVideo;