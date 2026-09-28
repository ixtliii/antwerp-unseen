import { useCallback, useEffect, useRef, useState } from 'react';
import type { VisualSettings } from '../components/organisms/Installation/installationConfig';

type MPMask = { getAsFloat32Array: () => Float32Array; width: number; height: number };
type ImageSegmenterInstance = {
    segmentForVideo: (
        video: HTMLVideoElement,
        timestamp: number,
        callback: (result: { confidenceMasks?: MPMask[] }) => void
    ) => void;
};

interface UseInstallationRenderArgs {
    settingsRef: React.MutableRefObject<VisualSettings>;
}

const MAX_EDGE = 960;

// ── Shaders ──────────────────────────────────────────────────────────────────

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
}`;

// Pass A — feedback trail. Reads ONLY the smoothed mask. Feedback is gated by
// the figure so the background stays perfectly clean (no gray camera bleed).
const FRAG_TRAIL = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uMask;
uniform sampler2D uPrev;
uniform vec2  uMaskTexel;
uniform float uTime;
uniform float uGlitch;
uniform float uDecay;
uniform float uWarp;

float softMask(vec2 uv) {
    float m = 0.0;
    m += texture2D(uMask, uv).r * 0.25;
    m += texture2D(uMask, uv + vec2( uMaskTexel.x, 0.0)).r * 0.125;
    m += texture2D(uMask, uv + vec2(-uMaskTexel.x, 0.0)).r * 0.125;
    m += texture2D(uMask, uv + vec2(0.0,  uMaskTexel.y)).r * 0.125;
    m += texture2D(uMask, uv + vec2(0.0, -uMaskTexel.y)).r * 0.125;
    m += texture2D(uMask, uv + uMaskTexel).r * 0.0625;
    m += texture2D(uMask, uv - uMaskTexel).r * 0.0625;
    m += texture2D(uMask, uv + vec2( uMaskTexel.x, -uMaskTexel.y)).r * 0.0625;
    m += texture2D(uMask, uv + vec2(-uMaskTexel.x,  uMaskTexel.y)).r * 0.0625;
    return m;
}

void main() {
    vec2 muv = vec2(1.0 - vUv.x, 1.0 - vUv.y);

    if (uGlitch > 0.0) {
        float n = sin(muv.y * 120.0 + uTime * 1.7) * sin(muv.y * 31.0 + uTime * 0.6);
        muv.x += n * uGlitch * 0.03;
    }

    float conf   = softMask(muv);
    float figure = smoothstep(0.12, 0.45, conf);   // slightly higher floor = no faint bg haze

    vec2 flow = vec2(
        sin(vUv.y * 7.0 + uTime * 0.6),
        cos(vUv.x * 7.0 + uTime * 0.5)
    ) * 0.0016 * uWarp;
    vec2 drift = vec2(0.0, 0.0009 * uWarp);

    float prev  = texture2D(uPrev, vUv + flow + drift).r;
    float faded = prev * (1.0 - uDecay);

    // Hard floor: anything that decays below this is forced to pure zero, so the
    // background can never accumulate faint gray smear — it stays clean black.
    faded = max(faded - 0.02, 0.0);
    faded *= step(0.012, faded);

    float trail = max(figure, faded);
    gl_FragColor = vec4(vec3(trail), 1.0);
}`;

// Pass B — present. FLAT clean background (no camera wash). Only the figure and
// its dither trail are drawn; everything else is pure base colour.
const FRAG_PRESENT = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTrail;
uniform vec2  uRes;
uniform float uTime;
uniform int   uStyle;
uniform float uScale;
uniform bool  uIsDark;
uniform float uGrain;
uniform float uDepth;
uniform float uDotGrow;
uniform float uBreathe;

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

float bayer(vec2 p) {
    int x = int(mod(p.x, 4.0));
    int y = int(mod(p.y, 4.0));
    int i = x + y * 4;
    if (i == 0)  return 0.0312; if (i == 1)  return 0.5312; if (i == 2)  return 0.1562; if (i == 3)  return 0.6562;
    if (i == 4)  return 0.7812; if (i == 5)  return 0.2812; if (i == 6)  return 0.9062; if (i == 7)  return 0.4062;
    if (i == 8)  return 0.2187; if (i == 9)  return 0.7187; if (i == 10) return 0.0937; if (i == 11) return 0.5937;
    if (i == 12) return 0.9687; if (i == 13) return 0.4687; if (i == 14) return 0.8437; if (i == 15) return 0.3437;
    return 0.5;
}

float halftone(vec2 px, float cell, float value, float grow) {
    float thr  = bayer(px / cell);
    float soft = mix(0.02, 0.35, grow);
    return smoothstep(thr - soft, thr + soft, value);
}

float gbloom(vec2 uv) {
    vec2 t1 = 2.5 / uRes;
    vec2 t2 = 5.5 / uRes;
    float b = texture2D(uTrail, uv).r * 0.196;
    b += texture2D(uTrail, uv + vec2( t1.x, 0.0)).r * 0.118;
    b += texture2D(uTrail, uv + vec2(-t1.x, 0.0)).r * 0.118;
    b += texture2D(uTrail, uv + vec2(0.0,  t1.y)).r * 0.118;
    b += texture2D(uTrail, uv + vec2(0.0, -t1.y)).r * 0.118;
    b += texture2D(uTrail, uv + vec2( t2.x,  t2.y)).r * 0.083;
    b += texture2D(uTrail, uv + vec2(-t2.x,  t2.y)).r * 0.083;
    b += texture2D(uTrail, uv + vec2( t2.x, -t2.y)).r * 0.083;
    b += texture2D(uTrail, uv + vec2(-t2.x, -t2.y)).r * 0.083;
    return b;
}

void main() {
    vec2 px = vUv * uRes;
    float trail = texture2D(uTrail, vUv).r;

    float breath = 1.0 + sin(uTime * 0.7) * 0.12 * uBreathe;
    float val = clamp(trail * breath, 0.0, 1.0);

    float bloom = gbloom(vUv);

    // FLAT clean background — pure base colour, no camera feed. This is the fix:
    // there are no gray pixels to smear because the background isn't drawn.
    vec3 base = uIsDark ? vec3(0.02) : vec3(0.94);

    // --- Dot coverage ---
    float cover;
    float cell = max(2.0, uScale);

    if (uStyle == 1) {
        float fine   = halftone(px, cell,       val, uDotGrow);
        float coarse = halftone(px, cell * 2.2, val, uDotGrow);
        float edgeMix = mix(0.5, 1.0 - val, uDepth);
        cover = mix(fine, coarse, edgeMix * uDepth);
        float fizz = hash(floor(px / cell) + floor(uTime * 2.0));
        float edgeBand = smoothstep(0.05, 0.22, val) * (1.0 - smoothstep(0.22, 0.5, val));
        if (fizz < edgeBand * 0.5) cover = max(cover, 0.8);
    } else if (uStyle == 2) {
        float d = mod(px.x + px.y + floor(uTime), cell);
        cover = (d < cell * (0.25 + val * 0.5)) ? 1.0 : 0.0;
    } else if (uStyle == 3) {
        vec2 c  = floor(px / cell);
        float ct = texture2D(uTrail, (c * cell) / uRes).r;
        cover = ct > 0.30 ? 1.0 : 0.0;
    } else {
        cover = val > 0.5 ? 1.0 : 0.0;
    }

    float fillV = uIsDark ? 1.0 : 0.0;

    vec3 col = base;

    // Soft aura — gated so it only appears near actual figure energy, never bg
    float auraGate = smoothstep(0.02, 0.12, bloom);
    col += vec3(fillV) * bloom * auraGate * (uIsDark ? 0.40 : 0.24);

    // Halftone body
    float bodyAmt = cover * clamp(val * 1.3, 0.0, 1.0);
    col = mix(col, vec3(fillV), bodyAmt);

    // Grain
    col += (hash(px + uTime) * 2.0 - 1.0) * uGrain;

    // Output dither — kills 8-bit banding in the flat background
    col += (bayer(px) - 0.5) / 255.0 * 1.5;

    // Vignette
    float dv = distance(vUv, vec2(0.5));
    col *= smoothstep(0.95, 0.30, dv) * 0.5 + 0.5;

    gl_FragColor = vec4(col, 1.0);
}`;

// ── GL helpers ───────────────────────────────────────────────────────────────

const compile = (gl: WebGLRenderingContext, type: number, src: string) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(sh));
    }
    return sh;
};

const makeProgram = (gl: WebGLRenderingContext, vs: string, fs: string) => {
    const p = gl.createProgram()!;
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(p));
    }
    return p;
};

const makeTexture = (gl: WebGLRenderingContext) => {
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return t;
};

const makeFBO = (gl: WebGLRenderingContext, w: number, h: number) => {
    const tex = makeTexture(gl);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { tex, fbo };
};

const STYLE_INT: Record<string, number> = {
    none: 0, 'bayer-dots': 1, 'cross-hatch': 2, blocky: 3,
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export const useInstallationRender = ({ settingsRef }: UseInstallationRenderArgs) => {
    const videoRef         = useRef<HTMLVideoElement>(null);
    const displayCanvasRef = useRef<HTMLCanvasElement>(null);

    const animFrameRef = useRef<number>(0);
    const audioCtxRef  = useRef<AudioContext | null>(null);
    const analyserRef  = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

    const segmenterRef = useRef<ImageSegmenterInstance | null>(null);
    const maskAccumRef = useRef<Float32Array | null>(null);
    const maskByteRef  = useRef<{ data: Uint8Array; w: number; h: number } | null>(null);
    const frameRef     = useRef(0);

    const glRef        = useRef<WebGLRenderingContext | null>(null);
    const trailProgRef = useRef<WebGLProgram | null>(null);
    const presentRef   = useRef<WebGLProgram | null>(null);
    const videoTexRef  = useRef<WebGLTexture | null>(null);
    const maskTexRef   = useRef<WebGLTexture | null>(null);
    const pingRef      = useRef<{ tex: WebGLTexture; fbo: WebGLFramebuffer } | null>(null);
    const pongRef      = useRef<{ tex: WebGLTexture; fbo: WebGLFramebuffer } | null>(null);
    const quadRef      = useRef<WebGLBuffer | null>(null);
    const sizeRef      = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

    const [started, setStarted] = useState(false);

    const initGL = useCallback((video: HTMLVideoElement) => {
        const canvas = displayCanvasRef.current;
        if (!canvas) return;

        const vw = video.videoWidth, vh = video.videoHeight;
        const scale = Math.min(1, MAX_EDGE / Math.max(vw, vh));
        const w = Math.round(vw * scale);
        const h = Math.round(vh * scale);
        canvas.width = w;
        canvas.height = h;
        sizeRef.current = { w, h };

        const gl = canvas.getContext('webgl', { antialias: false, preserveDrawingBuffer: false });
        if (!gl) { console.error('WebGL not available'); return; }
        glRef.current = gl;

        trailProgRef.current = makeProgram(gl, VERT, FRAG_TRAIL);
        presentRef.current   = makeProgram(gl, VERT, FRAG_PRESENT);

        const quad = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 1, -1, -1, 1,
            -1, 1, 1, -1, 1, 1,
        ]), gl.STATIC_DRAW);
        quadRef.current = quad;

        videoTexRef.current = makeTexture(gl);
        maskTexRef.current  = makeTexture(gl);
        pingRef.current = makeFBO(gl, w, h);
        pongRef.current = makeFBO(gl, w, h);

        [pingRef.current, pongRef.current].forEach(t => {
            gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
        });
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }, []);

    const bindQuad = (gl: WebGLRenderingContext, prog: WebGLProgram) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, quadRef.current);
        const loc = gl.getAttribLocation(prog, 'aPos');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    };

    const initSegmenter = useCallback(async () => {
        const { ImageSegmenter, FilesetResolver } = await import('@mediapipe/tasks-vision');
        const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        segmenterRef.current = await ImageSegmenter.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath:
                    'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite',
                delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            outputCategoryMask: false,
            outputConfidenceMasks: true,
        }) as unknown as ImageSegmenterInstance;
    }, []);

    const renderLoop = useCallback(() => {
        const gl    = glRef.current;
        const video = videoRef.current;
        const trailProg = trailProgRef.current;
        const present   = presentRef.current;
        const ping  = pingRef.current;
        const pong  = pongRef.current;

        if (!gl || !video || !trailProg || !present || !ping || !pong || video.readyState < 2) {
            animFrameRef.current = requestAnimationFrame(renderLoop);
            return;
        }

        const s = settingsRef.current;
        frameRef.current++;
        const time = frameRef.current * 0.05;
        const { w, h } = sizeRef.current;
        const isDark = s.mode !== 'dark-on-light';

        if (segmenterRef.current) {
            segmenterRef.current.segmentForVideo(video, performance.now(), (result) => {
                const m = result.confidenceMasks?.[0];
                if (!m) return;
                const f = m.getAsFloat32Array();
                const mw = m.width, mh = m.height;

                let accum = maskAccumRef.current;
                let byte  = maskByteRef.current;
                if (!accum || !byte || byte.w !== mw || byte.h !== mh) {
                    accum = new Float32Array(f);
                    byte  = { data: new Uint8Array(mw * mh), w: mw, h: mh };
                    maskAccumRef.current = accum;
                    maskByteRef.current  = byte;
                }

                const a = 1.0 - s.smoothing * 0.85;
                for (let i = 0; i < f.length; i++) {
                    accum[i] += (f[i] - accum[i]) * a;
                    byte.data[i] = accum[i] * 255;
                }
            });
        }

        const mask = maskByteRef.current;
        if (mask) {
            gl.bindTexture(gl.TEXTURE_2D, maskTexRef.current);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, mask.w, mask.h, 0,
                gl.LUMINANCE, gl.UNSIGNED_BYTE, mask.data);
        }

        // ── Pass A: trail (mask only — video texture no longer needed) ──
        gl.bindFramebuffer(gl.FRAMEBUFFER, ping.fbo);
        gl.viewport(0, 0, w, h);
        gl.useProgram(trailProg);
        bindQuad(gl, trailProg);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, maskTexRef.current);
        gl.uniform1i(gl.getUniformLocation(trailProg, 'uMask'), 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, pong.tex);
        gl.uniform1i(gl.getUniformLocation(trailProg, 'uPrev'), 1);

        const mw = mask?.w ?? 256, mh = mask?.h ?? 256;
        gl.uniform2f(gl.getUniformLocation(trailProg, 'uMaskTexel'), 1 / mw, 1 / mh);
        gl.uniform1f(gl.getUniformLocation(trailProg, 'uTime'), time);
        gl.uniform1f(gl.getUniformLocation(trailProg, 'uGlitch'), s.glitch);
        gl.uniform1f(gl.getUniformLocation(trailProg, 'uDecay'), s.decay);
        gl.uniform1f(gl.getUniformLocation(trailProg, 'uWarp'), s.warp);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // ── Pass B: present ──
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, w, h);
        gl.useProgram(present);
        bindQuad(gl, present);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, ping.tex);
        gl.uniform1i(gl.getUniformLocation(present, 'uTrail'), 0);

        gl.uniform2f(gl.getUniformLocation(present, 'uRes'), w, h);
        gl.uniform1f(gl.getUniformLocation(present, 'uTime'), time);
        gl.uniform1i(gl.getUniformLocation(present, 'uStyle'), STYLE_INT[s.ditherStyle] ?? 1);
        gl.uniform1f(gl.getUniformLocation(present, 'uScale'), s.ditherScale);
        gl.uniform1i(gl.getUniformLocation(present, 'uIsDark'), isDark ? 1 : 0);
        gl.uniform1f(gl.getUniformLocation(present, 'uGrain'), s.grain);
        gl.uniform1f(gl.getUniformLocation(present, 'uDepth'), s.depth);
        gl.uniform1f(gl.getUniformLocation(present, 'uDotGrow'), s.dotGrow);
        gl.uniform1f(gl.getUniformLocation(present, 'uBreathe'), s.breathe);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        const tmp = pingRef.current;
        pingRef.current = pongRef.current;
        pongRef.current = tmp;

        animFrameRef.current = requestAnimationFrame(renderLoop);
    }, [settingsRef]);

    const startCamera = useCallback(async () => {
        try {
            const AudioContextClass = window.AudioContext ||
                (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (AudioContextClass) {
                audioCtxRef.current = new AudioContextClass();
                analyserRef.current = audioCtxRef.current.createAnalyser();
                analyserRef.current.fftSize = 256;
                dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount) as Uint8Array<ArrayBuffer>;
            }

            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
            const video = videoRef.current!;
            video.srcObject = stream;
            await video.play();

            if (audioCtxRef.current && analyserRef.current) {
                const source = audioCtxRef.current.createMediaStreamSource(stream);
                source.connect(analyserRef.current);
            }

            setStarted(true);
            void initSegmenter();

            const waitForVideo = () => {
                if (video.readyState >= 2 && video.videoWidth > 0) {
                    initGL(video);
                    renderLoop();
                } else {
                    requestAnimationFrame(waitForVideo);
                }
            };
            waitForVideo();
        } catch {
            setStarted(true);
        }
    }, [initGL, initSegmenter, renderLoop]);

    useEffect(() => {
        return () => {
            cancelAnimationFrame(animFrameRef.current);
            void audioCtxRef.current?.close();
        };
    }, []);

    return { videoRef, displayCanvasRef, started, startCamera };
};

export default useInstallationRender;