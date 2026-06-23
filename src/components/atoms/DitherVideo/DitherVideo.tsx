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
    uniform float u_videoAspect;
    uniform float u_canvasAspect;
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

    vec2 coverUv(vec2 uv) {
        vec2 c = uv - 0.5;
        if (u_canvasAspect > u_videoAspect) {
            c.y *= u_videoAspect / u_canvasAspect;
        } else {
            c.x *= u_canvasAspect / u_videoAspect;
        }
        return c + 0.5;
    }

    void main() {
        float dist = distance(v_uv, u_mouse);
        float influence = smoothstep(0.5, 0.0, dist) * u_mouseReactive;

        float dynamicPixelSize = mix(u_pixelSize, u_pixelSize * 0.55, influence);

        vec2 px = u_resolution / dynamicPixelSize;
        vec2 snapped = floor(v_uv * px) / px;
        vec2 uv = coverUv(snapped);

        vec3 c = texture2D(u_video, uv).rgb;
        float lum = dot(c, vec3(0.299, 0.587, 0.114));
        lum = clamp((lum - 0.5) * 1.4 + 0.5, 0.0, 1.0);

        float scanline = sin(v_uv.y * 600.0 - u_time * 3.0) * 0.04;
        lum -= scanline;

        vec2 screenPos = v_uv * u_resolution / dynamicPixelSize;
        float threshold = bayer(screenPos);
        float bw = lum > threshold ? 1.0 : 0.0;

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

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        const apply = () => { video.playbackRate = playbackRate; };
        apply();
        video.addEventListener('loadeddata', apply);
        return () => video.removeEventListener('loadeddata', apply);
    }, [playbackRate]);

    useEffect(() => {
        if (!mouseReactive) return;

        const onMove = (e: MouseEvent | TouchEvent) => {
            let clientX, clientY;

            if ('touches' in e) {
                if (e.touches.length > 0) {
                    clientX = e.touches[0].clientX;
                    clientY = e.touches[0].clientY;
                } else {
                    return;
                }
            } else {
                clientX = (e as MouseEvent).clientX;
                clientY = (e as MouseEvent).clientY;
            }

            mouseRef.current.tx = clientX / window.innerWidth;
            mouseRef.current.ty = clientY / window.innerHeight;
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('touchstart', onMove, { passive: true });

        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchstart', onMove);
        };
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
        const uVideoAspect = gl.getUniformLocation(program, 'u_videoAspect');
        const uCanvasAspect = gl.getUniformLocation(program, 'u_canvasAspect');

        const resize = () => {
            const cw = canvas.clientWidth;
            const ch = canvas.clientHeight;

            if (cw === 0 || ch === 0) {
                requestAnimationFrame(resize);
                return;
            }

            const dpr = Math.min(window.devicePixelRatio, 1.5);
            canvas.width = cw * dpr;
            canvas.height = ch * dpr;
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

                const dpr = Math.min(window.devicePixelRatio, 1.5);
                const phone =
                    window.matchMedia('(hover: none) and (pointer: coarse)').matches &&
                    window.innerWidth <= 820;

                const responsivePixel = phone ? pixelSize * 0.5 : pixelSize * dpr;
                const responsiveIntensity = phone ? intensity * 0.15 : intensity;
                const responsiveMouseReactive = phone ? (mouseReactive ? 0.4 : 0.0) : (mouseReactive ? 1.0 : 0.0);

                const videoAspect = (video.videoWidth / video.videoHeight) || 1;
                const canvasAspect = (canvas.width / canvas.height) || 1;

                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
                gl.uniform1i(uVideo, 0);
                gl.uniform2f(uResolution, canvas.width, canvas.height);
                gl.uniform2f(uMouse, m.x, m.y);
                gl.uniform1f(uPixelSize, responsivePixel);
                gl.uniform1f(uIntensity, responsiveIntensity);
                gl.uniform1f(uCutout, cutout ? 1.0 : 0.0);
                gl.uniform1f(uMouseReactive, responsiveMouseReactive);
                gl.uniform1f(uTime, t);
                gl.uniform1f(uVideoAspect, videoAspect);
                gl.uniform1f(uCanvasAspect, canvasAspect);
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