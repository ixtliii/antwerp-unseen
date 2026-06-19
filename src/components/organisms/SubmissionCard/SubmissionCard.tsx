import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useTexture, Text } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { useFrame } from '@react-three/fiber';
import type { Submission } from '../../../types';

// ── Vertex shader (shared) ─────────────────────────────────────────────────

const VERT = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// ── Image / video dither shader ────────────────────────────────────────────

const FRAG = `
    uniform sampler2D map;
    uniform float velocity;
    uniform float grayscale;
    varying vec2 vUv;

    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
        float absVel = abs(velocity);
        vec2 grid = vec2(120.0, 84.0);
        vec2 blockUv = floor(vUv * grid) / grid;
        float randX = random(blockUv) * 2.0 - 1.0;
        float randY = random(blockUv + vec2(1.0, 0.0)) * 2.0 - 1.0;
        vec2 finalUv = vUv + vec2(randX, randY) * absVel * 0.08;
        float shift = velocity * 0.045;
        float r = texture2D(map, clamp(finalUv + vec2(shift, 0.0), 0.0, 1.0)).r;
        float g = texture2D(map, clamp(finalUv, 0.0, 1.0)).g;
        float b = texture2D(map, clamp(finalUv - vec2(shift, 0.0), 0.0, 1.0)).b;
        float alpha = 1.0;
        if (finalUv.x < 0.0 || finalUv.x > 1.0 || finalUv.y < 0.0 || finalUv.y > 1.0) alpha = 0.0;
        vec3 color = vec3(r, g, b);
        float luminance = dot(color, vec3(0.299, 0.587, 0.114));
        vec3 finalColor = mix(color, vec3(luminance), grayscale);
        gl_FragColor = vec4(finalColor, alpha);
    }
`;

// ── Animated background shader (text + voice faces) ────────────────────────
// Film grain + scan lines + vignette. Not flat.

const BG_FRAG = `
    uniform float time;
    uniform float grayscale;
    varying vec2 vUv;

    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    void main() {
        // Film grain — quantised to 24fps so it feels cinematic, not just noise
        float grain = hash(vUv * 220.0 + fract(time * 24.0) * 17.3) * 0.055;

        // Horizontal scan lines
        float scan = (1.0 - step(0.5, fract(vUv.y * 38.0))) * 0.022;

        // Soft edge vignette
        vec2 c = vUv - 0.5;
        float vig = 1.0 - smoothstep(0.28, 0.72, length(c));

        // Base darkness. Active card (grayscale = 0) is ever-so-slightly brighter.
        float base = 0.022 + grain + scan;
        float level = base * (0.65 + vig * 0.35) * (1.0 + (1.0 - grayscale) * 0.45);

        gl_FragColor = vec4(vec3(level), 1.0);
    }
`;

// ── VideoFace placeholder shader ───────────────────────────────────────────

const VIDEO_FRAG = `
    uniform float time;
    uniform float grayscale;
    varying vec2 vUv;

    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
        vec2 grid = vec2(80.0, 56.0);
        vec2 pixelUv = floor(vUv * grid) / grid;

        float noise = random(pixelUv + floor(time * 12.0));
        float threshold = mix(0.9, 0.5, 1.0 - grayscale);
        float dither = step(threshold, noise);

        float glitch = step(0.97, random(vec2(floor(time * 6.0), pixelUv.y))) * 0.2 * (1.0 - grayscale);

        vec2 p = pixelUv * 2.0 - 1.0;
        p.x -= glitch;

        float d = max(abs(p.y) - 0.5 * (0.25 - p.x), -p.x - 0.15);
        float playMask = step(d, 0.0);

        vec3 bgColor = mix(vec3(0.05), vec3(0.12), dither * (1.0 - grayscale));
        vec3 finalColor = mix(bgColor, vec3(0.94, 0.93, 0.91), playMask * mix(0.2, 1.0, 1.0 - grayscale));

        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

type GW = { get: () => number };

// ── ImageFace ──────────────────────────────────────────────────────────────

const ImageFace = ({
                       url,
                       velocityRef,
                       grayscaleWeight,
                   }: {
    url: string;
    velocityRef: React.MutableRefObject<number>;
    grayscaleWeight: GW;
}) => {
    const texture = useTexture(url);

    const material = useMemo(
        () =>
            new THREE.ShaderMaterial({
                transparent: true,
                uniforms: {
                    map:       { value: texture },
                    velocity:  { value: 0 },
                    grayscale: { value: 0 },
                },
                vertexShader:   VERT,
                fragmentShader: FRAG,
            }),
        [texture]
    );

    useFrame(() => {
        material.uniforms.velocity.value  = velocityRef.current;
        material.uniforms.grayscale.value = grayscaleWeight.get();
    });

    return (
        <mesh position-z={-0.001}>
            <planeGeometry args={[2, 1.4]} />
            <primitive object={material} attach="material" />
        </mesh>
    );
};

// ── TextFace ───────────────────────────────────────────────────────────────

const TextFace = ({
                      submission,
                      grayscaleWeight,
                  }: {
    submission: Submission;
    grayscaleWeight: GW;
}) => {
    const bgUniforms      = useMemo(() => ({ time: { value: 0 }, grayscale: { value: 1 } }), []);
    const contentGroupRef = useRef<THREE.Group>(null);
    const promptGroupRef  = useRef<THREE.Group>(null);
    const contentRef      = useRef<any>(null);
    const promptRef       = useRef<any>(null);
    const labelRef        = useRef<any>(null);
    const cursorRef       = useRef<THREE.MeshBasicMaterial>(null);

    useFrame((state) => {
        const t = state.clock.elapsedTime;
        const g = grayscaleWeight.get();

        // Animated background
        bgUniforms.time.value      = t;
        bgUniforms.grayscale.value = g;

        const fg  = THREE.MathUtils.lerp(0.94, 0.12, g);
        const dim = THREE.MathUtils.lerp(0.45, 0.08, g);

        if (contentRef.current?.material) contentRef.current.material.color.setRGB(fg, fg, fg);
        if (promptRef.current?.material)  promptRef.current.material.color.setRGB(dim, dim, dim);
        if (labelRef.current?.material)   labelRef.current.material.color.setRGB(dim, dim, dim);

        // Layers float at slightly different depths when active
        if (promptGroupRef.current) {
            promptGroupRef.current.position.z = THREE.MathUtils.lerp(0.03 + Math.sin(t * 1.5) * 0.005, 0, g);
        }
        if (contentGroupRef.current) {
            contentGroupRef.current.position.z = THREE.MathUtils.lerp(0.06 + Math.cos(t * 2) * 0.008, 0, g);
        }

        // Blinking cursor
        if (cursorRef.current) {
            cursorRef.current.color.setRGB(fg, fg, fg);
            const blink = Math.floor(t * 2) % 2 === 0 ? 1 : 0;
            cursorRef.current.opacity = THREE.MathUtils.lerp(blink, 0, g);
        }
    });

    const content  = submission.content_text ?? '';
    const truncated = content.length > 110 ? `${content.slice(0, 110)}\u2026` : content;
    const prompt   = submission.prompt_text.length > 60
        ? `${submission.prompt_text.slice(0, 60)}\u2026`
        : submission.prompt_text;

    return (
        <group>
            {/* Animated grain background */}
            <mesh position-z={-0.001}>
                <planeGeometry args={[2, 1.4]} />
                <shaderMaterial
                    vertexShader={VERT}
                    fragmentShader={BG_FRAG}
                    uniforms={bgUniforms}
                />
            </mesh>

            <group ref={promptGroupRef}>
                <Text
                    ref={promptRef}
                    position={[-0.85, 0.5, 0]}
                    fontSize={0.062}
                    maxWidth={1.7}
                    textAlign="left"
                    anchorX="left"
                    anchorY="top"
                    color="#666666"
                    lineHeight={1.3}
                >
                    {prompt}
                </Text>
            </group>

            <group ref={contentGroupRef}>
                <Text
                    ref={contentRef}
                    position={[-0.85, 0.15, 0]}
                    fontSize={0.092}
                    maxWidth={1.7}
                    textAlign="left"
                    anchorX="left"
                    anchorY="top"
                    color="#f0ede8"
                    lineHeight={1.5}
                >
                    {truncated}
                </Text>

                {/* Blinking cursor after text */}
                <mesh position={[-0.85, -0.25, 0]}>
                    <planeGeometry args={[0.04, 0.08]} />
                    <meshBasicMaterial ref={cursorRef} transparent opacity={0} color="#f0ede8" />
                </mesh>
            </group>

            <Text
                ref={labelRef}
                position={[-0.85, -0.57, 0]}
                fontSize={0.062}
                anchorX="left"
                anchorY="middle"
                color="#444444"
            >
                TEXT
            </Text>
        </group>
    );
};

// ── VoiceFace ──────────────────────────────────────────────────────────────

const BAR_COUNT = 45;
const BAR_WIDTH = 0.02;
const BAR_STEP  = 0.035;
const BAR_START = -((BAR_COUNT - 1) / 2) * BAR_STEP;

const VoiceFace = ({
                       submission,
                       grayscaleWeight,
                   }: {
    submission: Submission;
    grayscaleWeight: GW;
}) => {
    const bgUniforms  = useMemo(() => ({ time: { value: 0 }, grayscale: { value: 1 } }), []);
    const barMeshRefs = useRef<(THREE.Mesh | null)[]>([]);
    const barMatRefs  = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
    const labelRef    = useRef<any>(null);

    const bars = useMemo(() => {
        let hash = 0;
        for (let i = 0; i < submission.id.length; i++) {
            hash = (Math.imul(31, hash) + submission.id.charCodeAt(i)) | 0;
        }
        return Array.from({ length: BAR_COUNT }, (_, i) => {
            const raw = Math.abs(Math.sin((hash ^ (i * 2654435761)) * 0.00001));
            const mid = 1 - Math.pow(Math.abs(i - (BAR_COUNT - 1) / 2) / ((BAR_COUNT - 1) / 2), 2);
            return 0.02 + raw * 0.2 + mid * 0.3;
        });
    }, [submission.id]);

    useFrame((state) => {
        const t = state.clock.elapsedTime;
        const g = grayscaleWeight.get();

        // Animated background
        bgUniforms.time.value      = t;
        bgUniforms.grayscale.value = g;

        const bar = THREE.MathUtils.lerp(0.9, 0.14, g);
        const dim = THREE.MathUtils.lerp(0.45, 0.08, g);

        // Animate bar heights — two sine waves at different frequencies
        barMeshRefs.current.forEach((mesh, i) => {
            if (!mesh) return;
            const wave =
                Math.sin(t * 3.2 + i * 0.38) * 0.18 +
                Math.sin(t * 1.9 + i * 0.71) * 0.09;
            // Lerp toward static when inactive
            mesh.scale.y = 1 + wave * THREE.MathUtils.lerp(0.5, 0, g);
        });

        barMatRefs.current.forEach(mat => { if (mat) mat.color.setRGB(bar, bar, bar); });

        if (labelRef.current?.material) labelRef.current.material.color.setRGB(dim, dim, dim);
    });

    return (
        <group>
            {/* Animated grain background */}
            <mesh position-z={-0.001}>
                <planeGeometry args={[2, 1.4]} />
                <shaderMaterial
                    vertexShader={VERT}
                    fragmentShader={BG_FRAG}
                    uniforms={bgUniforms}
                />
            </mesh>

            {bars.map((height, i) => (
                <mesh
                    key={i}
                    ref={(el: any) => { barMeshRefs.current[i] = el; }}
                    position={[BAR_START + i * BAR_STEP, 0, 0]}
                >
                    <boxGeometry args={[BAR_WIDTH, height, 0.02]} />
                    <meshBasicMaterial
                        ref={(el: any) => { barMatRefs.current[i] = el; }}
                        color="#f0ede8"
                    />
                </mesh>
            ))}

            <Text
                ref={labelRef}
                position={[-0.85, -0.57, 0]}
                fontSize={0.062}
                anchorX="left"
                anchorY="middle"
                color="#444444"
            >
                VOICE MEMO
            </Text>
        </group>
    );
};

// ── VideoFace ──────────────────────────────────────────────────────────────
// Placeholder shader shows when inactive or video not yet ready.
// Actual video texture (through the same dither shader as ImageFace) shows
// on the active card once the browser has buffered enough data.

const VideoFace = ({
                       isActive,
                       fileUrl,
                       velocityRef,
                       grayscaleWeight,
                   }: {
    isActive: boolean;
    fileUrl: string | null;
    velocityRef: React.MutableRefObject<number>;
    grayscaleWeight: GW;
}) => {
    const placeholderUniforms = useMemo(() => ({ time: { value: 0 }, grayscale: { value: 1 } }), []);
    const placeholderRef      = useRef<THREE.ShaderMaterial>(null);
    const videoMeshRef        = useRef<THREE.Mesh>(null);
    const labelRef            = useRef<any>(null);

    // The video material lives in a ref so we never cause a React re-render when
    // the video loads — visibility is controlled imperatively in useFrame.
    const videoDataRef = useRef<{
        el:       HTMLVideoElement;
        texture:  THREE.VideoTexture;
        material: THREE.ShaderMaterial;
    } | null>(null);

    // Set up video element + texture + material when fileUrl is known
    useEffect(() => {
        if (!fileUrl) return;

        const el = document.createElement('video');
        el.src         = fileUrl;
        el.loop        = true;
        el.muted       = true;
        el.playsInline = true;
        el.crossOrigin = 'anonymous';
        el.load();

        const texture  = new THREE.VideoTexture(el);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const material = new THREE.ShaderMaterial({
            uniforms: {
                map:       { value: texture },
                velocity:  { value: 0 },
                grayscale: { value: 0 },
            },
            vertexShader:   VERT,
            fragmentShader: FRAG,
        });

        // Assign material to the video mesh imperatively — R3F won't fight us here
        // because the mesh's JSX uses <primitive object={...}> below.
        videoDataRef.current = { el, texture, material };

        return () => {
            el.pause();
            el.src = '';
            texture.dispose();
            material.dispose();
            videoDataRef.current = null;
        };
    }, [fileUrl]);

    // Play / pause based on active state
    useEffect(() => {
        const vd = videoDataRef.current;
        if (!vd) return;
        if (isActive) void vd.el.play().catch(() => { /* autoplay policy — placeholder stays visible */ });
        else          vd.el.pause();
    }, [isActive]);

    useFrame((state) => {
        const t = state.clock.elapsedTime;
        const g = grayscaleWeight.get();
        const dim = THREE.MathUtils.lerp(0.45, 0.08, g);

        // Update placeholder
        if (placeholderRef.current) {
            placeholderRef.current.uniforms.time.value      = t;
            placeholderRef.current.uniforms.grayscale.value = g;
        }

        // Update video material + show/hide the video mesh
        const vd = videoDataRef.current;
        if (vd) {
            vd.material.uniforms.velocity.value  = velocityRef.current;
            vd.material.uniforms.grayscale.value = g;

            // Only reveal the video mesh once the browser has actual frame data
            const ready = isActive && vd.el.readyState >= 2;
            if (videoMeshRef.current) videoMeshRef.current.visible = ready;
        }

        if (labelRef.current?.material) labelRef.current.material.color.setRGB(dim, dim, dim);
    });

    return (
        <group>
            {/* Placeholder always present — shows when inactive or video not ready */}
            <mesh position-z={-0.002}>
                <planeGeometry args={[2, 1.4]} />
                <shaderMaterial
                    ref={placeholderRef}
                    vertexShader={VERT}
                    fragmentShader={VIDEO_FRAG}
                    uniforms={placeholderUniforms}
                />
            </mesh>

            {/* Video mesh — starts invisible, revealed in useFrame once ready.
                Material is set imperatively so we never re-mount the mesh. */}
            {fileUrl && videoDataRef.current && (
                <mesh ref={videoMeshRef} position-z={-0.001} visible={false}>
                    <planeGeometry args={[2, 1.4]} />
                    <primitive object={videoDataRef.current.material} attach="material" />
                </mesh>
            )}

            {/* "VIDEO" label — visible on placeholder, naturally covered by dithered video */}
            <Text
                ref={labelRef}
                position={[-0.85, -0.57, 0.01]}
                fontSize={0.062}
                anchorX="left"
                anchorY="middle"
                color="#444444"
            >
                VIDEO
            </Text>
        </group>
    );
};

// ── SubmissionCard ─────────────────────────────────────────────────────────

export interface SubmissionCardProps {
    submission: Submission;
    position: [number, number, number];
    isActive: boolean;
    onClick: () => void;
    velocityRef: React.MutableRefObject<number>;
    setHovered: (hovered: boolean) => void;
}

const SubmissionCard = ({
                            submission,
                            position,
                            isActive,
                            onClick,
                            velocityRef,
                            setHovered,
                        }: SubmissionCardProps) => {
    const props = useSpring({
        from: { scale: 0, yLift: -0.5, grayscaleWeight: 1 },
        to: {
            scale:           isActive ? 1.3 : 1,
            yLift:           isActive ? 0.4 : 0,
            grayscaleWeight: isActive ? 0   : 1,
        },
        config: { tension: 160, friction: 20 },
    });

    const [{ tiltX, tiltY }, tiltApi] = useSpring(() => ({
        tiltX: 0,
        tiltY: 0,
        config: { tension: 300, friction: 20 },
    }));

    const handlePointerMove = (e: any) => {
        if (!isActive || !e.uv) return;
        const x = (e.uv.x - 0.5) * 2;
        const y = (e.uv.y - 0.5) * 2;
        tiltApi.start({ tiltX: y * 0.08, tiltY: x * 0.08 });
        document.body.style.cursor = 'none';
        setHovered(true);
    };

    const handlePointerLeave = () => {
        tiltApi.start({ tiltX: 0, tiltY: 0 });
        document.body.style.cursor = 'auto';
        setHovered(false);
    };

    const dateStr  = submission.created_at.split('T')[0];
    const imageUrl = submission.file_url ?? '/silhouette-default.jpg';

    return (
        <animated.group
            position-x={position[0]}
            position-y={props.yLift}
            position-z={position[2]}
        >
            <group rotation={[0, -Math.PI / 2, 0]}>
                <animated.group rotation-x={tiltX} rotation-y={tiltY}>
                    <animated.group scale={props.scale}>
                        {/* Transparent hit-target — handles pointer events for all formats */}
                        <mesh
                            onClick={onClick}
                            onPointerMove={handlePointerMove}
                            onPointerOut={handlePointerLeave}
                        >
                            <planeGeometry args={[2, 1.4]} />
                            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                        </mesh>

                        {submission.format === 'image' && (
                            <ImageFace
                                url={imageUrl}
                                velocityRef={velocityRef}
                                grayscaleWeight={props.grayscaleWeight}
                            />
                        )}
                        {submission.format === 'text' && (
                            <TextFace
                                submission={submission}
                                grayscaleWeight={props.grayscaleWeight}
                            />
                        )}
                        {submission.format === 'voice' && (
                            <VoiceFace
                                submission={submission}
                                grayscaleWeight={props.grayscaleWeight}
                            />
                        )}
                        {submission.format === 'video' && (
                            <VideoFace
                                isActive={isActive}
                                fileUrl={submission.file_url}
                                velocityRef={velocityRef}
                                grayscaleWeight={props.grayscaleWeight}
                            />
                        )}
                    </animated.group>
                </animated.group>
            </group>

            <Text
                position={[0, -0.5, 1.5]}
                rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
                fontSize={0.1}
                color="#555555"
                anchorX="left"
                anchorY="top"
            >
                {dateStr}{submission.location ? ` · ${submission.location}` : ''}
            </Text>
        </animated.group>
    );
};

export default SubmissionCard;