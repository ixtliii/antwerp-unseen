import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import './constellationNav.css';
import PathText from '../../atoms/PathText/PathText';
import DitherVideo from '../../atoms/DitherVideo/DitherVideo';
import { triggerPageTransition } from '../../globals/PixelTransition/triggerTransition.ts';

interface NodePosState {
    baseX: number; baseY: number; ambientX: number; ambientY: number;
    magneticX: number; magneticY: number; targetMagX: number; targetMagY: number;
    finalX: number; finalY: number;
}


const NODES = [
    { id: 'window', label: 'WINDOWS', type: 'link', x: 25, y: 25, pos: 'top', path: '/windows' },
    { id: 'archive', label: 'ARCHIVE', type: 'link', x: 75, y: 20, pos: 'top', path: '/explore' },
    { id: 'artist', label: 'LOCAL ARTISTS', type: 'link', x: 20, y: 70, pos: 'bottom', path: '/artists' },
    { id: 'map', label: 'MAP', type: 'link', x: 80, y: 65, pos: 'bottom', path: '/map' },
    { id: 'joint1', label: 'CONTACT US', type: 'link', x: 55, y: 45, pos: 'top', path: '/contact' },
    { id: 'add', label: 'ADD YOUR STORY', type: 'link', x: 50, y: 85, pos: 'bottom', path: '/submit' },
];

const EDGES = [
    ['window', 'joint1'],
    ['joint1', 'archive'],
    ['joint1', 'artist'],
    ['window', 'add'],
    ['add', 'artist'],
    ['add', 'map'],
    ['archive', 'map'],
    ['window', 'artist'],
];

const initAudio = () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    let audioCtx: AudioContext | null = null;

    if (AudioContextClass) {
        audioCtx = new AudioContextClass();
    }
    return audioCtx;
};

const playTone = (type: 'hover' | 'click') => {
    const ctx = initAudio();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'hover') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800 + Math.random() * 400, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
    } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.5);

        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(164.81, ctx.currentTime);
        osc2.connect(gain);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 1.5);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.5);
    }
};

const scrambleText = (element: HTMLElement, originalText: string) => {
    const chars = '!<>-_\\/[]{}—=+*^?#_';
    let iterations = 0;
    const interval = setInterval(() => {
        element.innerText = originalText.split('').map((char, i) => {
            if (char === ' ') return ' ';
            if (i < iterations) return originalText[i];
            return chars[Math.floor(Math.random() * chars.length)];
        }).join('');
        iterations += 1 / 2;
        if (iterations >= originalText.length) {
            element.innerText = originalText;
            clearInterval(interval);
        }
    }, 30);
};

export default function ConstellationNav() {
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);
    const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const lineRefs = useRef<Record<string, SVGLineElement | null>>({});
    const bgText1Ref = useRef<HTMLDivElement>(null);
    const bgText2Ref = useRef<HTMLDivElement>(null);

    const posState = useRef<Record<string, NodePosState>>({});

    useEffect(() => {
        NODES.forEach(node => {
            posState.current[node.id] = {
                baseX: 0, baseY: 0, ambientX: 0, ambientY: 0,
                magneticX: 0, magneticY: 0, targetMagX: 0, targetMagY: 0,
                finalX: 0, finalY: 0
            };
        });

        const handleResize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            NODES.forEach(node => {
                const state = posState.current[node.id];
                if (state) {
                    state.baseX = (node.x / 100) * w;
                    state.baseY = (node.y / 100) * h;
                }
            });
        };
        handleResize();
        window.addEventListener('resize', handleResize);

        const ctx = gsap.context(() => {
            gsap.fromTo('.const-bg-clouds',
                { opacity: 0 },
                { opacity: 1, duration: 2.5, ease: 'power2.out' }
            );

            gsap.fromTo('.const-bg-word',
                { opacity: 0, filter: 'blur(20px)', scale: 1.1, letterSpacing: '0.2em' },
                { opacity: 1, filter: 'blur(0px)', scale: 1, letterSpacing: '0em', duration: 2.5, ease: 'power3.out' }
            );

            gsap.fromTo('.const-node',
                { scale: 0, opacity: 0 },
                { scale: 1, opacity: 1, stagger: 0.15, duration: 1.2, ease: 'elastic.out(1, 0.5)', delay: 0.5 }
            );

            gsap.set('.const-line', {
                strokeDasharray: 1000,
                strokeDashoffset: 1000,
                opacity: 0
            });

            gsap.to('.const-line', {
                strokeDashoffset: 0,
                opacity: 1,
                duration: 1.8,
                ease: 'power4.out',
                stagger: { amount: 0.5, from: 'random' },
                delay: 0.8
            });

            NODES.forEach(node => {
                gsap.to(posState.current[node.id], {
                    ambientX: "random(-25, 25)", ambientY: "random(-25, 25)",
                    duration: "random(4, 7)", repeat: -1, yoyo: true, ease: "sine.inOut"
                });
            });
        }, containerRef);

        const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        const smoothMouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        const onMouseMove = (e: MouseEvent) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };
        window.addEventListener('mousemove', onMouseMove);

        const tick = () => {
            smoothMouse.x += (mouse.x - smoothMouse.x) * 0.05;
            smoothMouse.y += (mouse.y - smoothMouse.y) * 0.05;

            const w = window.innerWidth;
            const h = window.innerHeight;

            if (bgText1Ref.current && bgText2Ref.current) {
                const px1 = (smoothMouse.x - w / 2) * -0.03;
                const py1 = (smoothMouse.y - h / 2) * -0.03;
                bgText1Ref.current.style.transform = `translate3d(${px1}px, ${py1}px, 0)`;

                const px2 = (smoothMouse.x - w / 2) * 0.05;
                const py2 = (smoothMouse.y - h / 2) * 0.05;
                bgText2Ref.current.style.transform = `translate3d(${px2}px, ${py2}px, 0)`;
            }

            NODES.forEach(node => {
                const state = posState.current[node.id];
                const dx = mouse.x - state.baseX;
                const dy = mouse.y - state.baseY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 200) {
                    state.targetMagX = dx * 0.2;
                    state.targetMagY = dy * 0.2;
                } else {
                    state.targetMagX = 0;
                    state.targetMagY = 0;
                }

                state.magneticX += (state.targetMagX - state.magneticX) * 0.1;
                state.magneticY += (state.targetMagY - state.magneticY) * 0.1;

                state.finalX = state.baseX + state.ambientX + state.magneticX;
                state.finalY = state.baseY + state.ambientY + state.magneticY;

                if (nodeRefs.current[node.id]) {
                    nodeRefs.current[node.id]!.style.transform = `translate(-50%, -50%) translate3d(${state.finalX}px, ${state.finalY}px, 0)`;
                }
            });

            EDGES.forEach(edge => {
                const line = lineRefs.current[`${edge[0]}-${edge[1]}`];
                const n1 = posState.current[edge[0]];
                const n2 = posState.current[edge[1]];
                if (line && n1 && n2) {
                    line.setAttribute('x1', n1.finalX.toString());
                    line.setAttribute('y1', n1.finalY.toString());
                    line.setAttribute('x2', n2.finalX.toString());
                    line.setAttribute('y2', n2.finalY.toString());
                }
            });
        };

        gsap.ticker.add(tick);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', onMouseMove);
            gsap.ticker.remove(tick);
            ctx.revert();
        };
    }, []);

    const handleMouseEnter = (nodeId: string, e: React.MouseEvent, label: string) => {
        if (!label) return;
        playTone('hover');

        const labelEl = e.currentTarget.querySelector('.const-node-label') as HTMLElement;
        if (labelEl) scrambleText(labelEl, label);

        EDGES.forEach(edge => {
            if (edge[0] === nodeId || edge[1] === nodeId) {
                lineRefs.current[`${edge[0]}-${edge[1]}`]?.classList.add('is-highlighted');
            }
        });
    };

    const handleMouseLeave = (nodeId: string) => {
        EDGES.forEach(edge => {
            if (edge[0] === nodeId || edge[1] === nodeId) {
                lineRefs.current[`${edge[0]}-${edge[1]}`]?.classList.remove('is-highlighted');
            }
        });
    };

    const handleClick = (e: React.MouseEvent, path: string) => {
        e.preventDefault();
        if (!path) return;
        playTone('click');
        triggerPageTransition(() => {
            navigate(path);
        });
    };

    return (
        <div className="const-wrapper" ref={containerRef}>
            <DitherVideo
                src="/videos/clouds.mp4"
                pixelSize={7}
                intensity={0.25}
                cutout
                playbackRate={0.35}
                mouseReactive
                className="const-bg-clouds"
            />

            <PathText />

            <div className="const-bg-text">
                <div className="const-bg-word const-bg-word--top" ref={bgText1Ref} />
                <div className="const-bg-word const-bg-word--bottom" ref={bgText2Ref}>
                    <span className="const-bg-word-pixel"> </span>
                </div>
            </div>

            <svg className="const-svg">
                {EDGES.map(edge => (
                    <line
                        key={`${edge[0]}-${edge[1]}`}
                        ref={el => { lineRefs.current[`${edge[0]}-${edge[1]}`] = el; }}
                        className="const-line"
                    />
                ))}
            </svg>

            <div className="const-nodes-container">
                {NODES.map(node => (
                    <div
                        key={node.id}
                        ref={el => { nodeRefs.current[node.id] = el; }}
                        className={`const-node ${node.type === 'link' ? 'is-interactive' : ''}`}
                        role={node.type === 'link' ? "button" : undefined}
                        tabIndex={node.type === 'link' ? 0 : undefined}
                        onMouseEnter={(e) => handleMouseEnter(node.id, e, node.label)}
                        onMouseLeave={() => handleMouseLeave(node.id)}
                        onClick={(e) => handleClick(e, node.path)}
                    >
                        <div className="const-node-hitarea" />
                        <div className="const-node-square" />
                        {node.label && (
                            <div className={`const-node-label pos-${node.pos}`}>
                                {node.label}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}