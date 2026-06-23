import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { useSpring } from '@react-spring/three';
import type { Submission } from '../../../types';
import SubmissionCard from '../SubmissionCard/SubmissionCard';
import DitherVideo from '../../atoms/DitherVideo/DitherVideo';
import { triggerPageTransition } from '../../globals/PixelTransition/triggerTransition';
import './archive.css';

interface SceneProps {
    submissions: Submission[];
    activeId: string;
    onActiveChange: (id: string) => void;
    onOpenDetail: (id: string) => void;
}

const DAY_SPACING  = 0.8;
const ACTIVE_EXTRA = 1.2;

const getPosition = (index: number, activeIndex: number): number => {
    let position = 0;
    for (let i = 0; i < index; i++) {
        if (i === activeIndex || i === activeIndex - 1) {
            position += DAY_SPACING + ACTIVE_EXTRA;
        } else {
            position += DAY_SPACING;
        }
    }
    return position;
};

interface RailProps {
    submissions: Submission[];
    activeId: string;
    offsetRef: React.MutableRefObject<number>;
    onActiveChange: (id: string) => void;
    onOpenDetail: (id: string) => void;
    setHovered: (hovered: boolean) => void;
}

const Rail = ({ submissions, activeId, offsetRef, onActiveChange, onOpenDetail, setHovered }: RailProps) => {
    const activeIndex = submissions.findIndex(s => s.id === activeId);

    const { animatedActiveIndex } = useSpring({
        animatedActiveIndex: activeIndex,
        config: { tension: 80, friction: 26 },
    });

    const groupRef        = useRef<THREE.Group>(null);
    const lerpedOffsetRef = useRef(0);
    const velocityRef     = useRef(0);

    useFrame((_, delta) => {
        if (!groupRef.current) return;

        const ai         = animatedActiveIndex.get();
        const prevOffset = lerpedOffsetRef.current;
        lerpedOffsetRef.current = THREE.MathUtils.lerp(lerpedOffsetRef.current, offsetRef.current, delta * 12);
        const currentOffset = lerpedOffsetRef.current;

        const rawVelocity = (currentOffset - prevOffset) * 40;
        velocityRef.current = THREE.MathUtils.lerp(velocityRef.current, rawVelocity, delta * 15);

        let currentPos = 0;
        submissions.forEach((_, index) => {
            const group = groupRef.current!.children[index];
            if (group) {
                group.position.x = currentPos - currentOffset;
                group.position.z = 0;
            }
            const factor1      = Math.max(0, 1 - Math.abs(index - ai));
            const factor2      = Math.max(0, 1 - Math.abs(index - (ai - 1)));
            const activeFactor = Math.min(1, factor1 + factor2);
            currentPos += DAY_SPACING + ACTIVE_EXTRA * activeFactor;
        });
    });

    return (
        <group ref={groupRef}>
            {submissions.map((submission) => (
                <SubmissionCard
                    key={submission.id}
                    submission={submission}
                    position={[0, 0, 0]}
                    isActive={submission.id === activeId}
                    onClick={() => {
                        if (submission.id === activeId) {
                            // Second click on active card → open detail view
                            onOpenDetail(submission.id);
                        } else {
                            // First click → activate card
                            onActiveChange(submission.id);
                        }
                    }}
                    velocityRef={velocityRef}
                    setHovered={setHovered}
                />
            ))}
        </group>
    );
};

const Archive = ({ submissions, activeId, onActiveChange, onOpenDetail }: SceneProps) => {
    const navigate    = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    const isDragging  = useRef(false);
    const lastX       = useRef(0);
    const offsetRef   = useRef(0);
    const activeIdRef = useRef(activeId);
    const cursorRef   = useRef<HTMLDivElement>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);

    useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

    useEffect(() => {
        const initAudio = () => {
            if (!audioCtxRef.current) {
                const AC = window.AudioContext ||
                    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                audioCtxRef.current = new AC();
            }
            if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
        };

        const playTick = (index: number) => {
            if (!audioCtxRef.current) return;
            const ctx    = audioCtxRef.current;
            const scales = [130.81, 146.83, 164.81, 196, 220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99, 880];
            const osc    = ctx.createOscillator();
            const gain   = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(scales[index % scales.length], ctx.currentTime);
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
        };

        const getTotal = () => {
            const activeIdx = submissions.findIndex(s => s.id === activeIdRef.current);
            return getPosition(submissions.length - 1, activeIdx);
        };

        const advance = (clamped: number) => {
            const idx = Math.max(0, Math.min(Math.round(clamped / DAY_SPACING), submissions.length - 1));
            const id  = submissions[idx]?.id;
            if (id && id !== activeIdRef.current) {
                activeIdRef.current = id;
                playTick(idx);
                onActiveChange(id);
            }
        };

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            initAudio();
            const clamped = Math.max(0, Math.min(offsetRef.current + e.deltaY * 0.01, getTotal()));
            offsetRef.current = clamped;
            advance(clamped);
        };

        const handleMouseDown = (e: MouseEvent) => {
            initAudio();
            isDragging.current = true;
            lastX.current = e.clientX;
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`;
            }
            if (!isDragging.current) return;
            const delta   = (e.clientX - lastX.current) * 0.008;
            lastX.current = e.clientX;
            const clamped = Math.max(0, Math.min(offsetRef.current - delta, getTotal()));
            offsetRef.current = clamped;
            advance(clamped);
        };

        const handleMouseUp = () => { isDragging.current = false; };

        const handleTouchStart = (e: TouchEvent) => {
            initAudio();
            isDragging.current = true;
            lastX.current = e.touches[0].clientX;
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isDragging.current) return;
            e.preventDefault();
            const x       = e.touches[0].clientX;
            const delta   = (x - lastX.current) * 0.012;
            lastX.current = x;
            const clamped = Math.max(0, Math.min(offsetRef.current - delta, getTotal()));
            offsetRef.current = clamped;
            advance(clamped);
        };

        const handleTouchEnd = () => { isDragging.current = false; };

        window.addEventListener('wheel',     handleWheel,     { passive: false });
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup',   handleMouseUp);
        window.addEventListener('touchstart', handleTouchStart, { passive: false });
        window.addEventListener('touchmove',  handleTouchMove,  { passive: false });
        window.addEventListener('touchend',   handleTouchEnd);

        return () => {
            window.removeEventListener('wheel',     handleWheel);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup',   handleMouseUp);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove',  handleTouchMove);
            window.removeEventListener('touchend',   handleTouchEnd);
        };
    }, [submissions, onActiveChange]);

    return (
        <div className="scene">
            <DitherVideo
                src="/videos/archive.mp4"
                pixelSize={7}
                intensity={0.25}
                cutout
                playbackRate={0.35}
                mouseReactive
                className="archive-bg-video"
            />

            <div ref={cursorRef} className="custom-cursor-wrapper">
                <div className={`custom-cursor ${isHovered ? 'hovered' : ''}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
                        <line x1="7" y1="17" x2="17" y2="7" />
                        <polyline points="7 7 17 7 17 17" />
                    </svg>
                </div>
            </div>

            <Canvas
                className="scene-canvas"
                camera={{
                    position: [-5.47, 7.02, 6.76],
                    rotation: [-0.80, -0.51, -0.47],
                    fov: typeof window !== 'undefined' && window.innerWidth <= 768 ? 78 : 50,
                }}
            >
                <ambientLight intensity={1} />
                <Rail
                    submissions={submissions}
                    activeId={activeId}
                    offsetRef={offsetRef}
                    onActiveChange={onActiveChange}
                    onOpenDetail={onOpenDetail}
                    setHovered={setIsHovered}
                />
            </Canvas>

            {/* ADD YOUR STORY — fixed above filter tab */}
            <button
                className="archive__add-story"
                onClick={() => triggerPageTransition(() => navigate('/submit'))}
                type="button"
            >
                ADD YOUR STORY
            </button>
        </div>
    );
};

export default Archive;