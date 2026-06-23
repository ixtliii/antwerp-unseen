import React, { useEffect, useRef, useContext, useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { LoadingContext } from '../../../App';
import gsap from 'gsap';
import './homeHero.css';
import {Link, useNavigate} from "react-router-dom";

const SCRAMBLE_CHARS = '!<>-_\\/[]{}—=+*^?#_';

const WHISPERS = [
    'At the corner of Lange Gasthuisstraat, I let go of a hand for the last time.',
    'The tram at 6am knows everyone who never sleeps.',
    'I buried a secret under the cobblestones near the cathedral.',
    'We danced in the rain on Groenplaats and no one was watching.',
    'My grandmother sold flowers here for forty years.',
];

const SplitText = ({ children }: { children: string }) => {
    const containerRef = useRef<HTMLSpanElement>(null);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const spans = Array.from(containerRef.current.querySelectorAll('.tw-char')) as HTMLSpanElement[];
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        spans.forEach((span) => {
            const rect = span.getBoundingClientRect();
            const spanX = rect.left + rect.width / 2;
            const spanY = rect.top + rect.height / 2;
            const dist = Math.sqrt(Math.pow(mouseX - spanX, 2) + Math.pow(mouseY - spanY, 2));

            if (dist < 60) {
                const original = span.getAttribute('data-char');
                if (original && original !== ' ' && !span.dataset.isScrambling) {
                    span.dataset.isScrambling = 'true';
                    let iterations = 0;
                    const maxIterations = Math.floor(Math.random() * 3) + 2;
                    const interval = setInterval(() => {
                        span.textContent = SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
                        iterations++;
                        if (iterations >= maxIterations) {
                            span.textContent = original;
                            delete span.dataset.isScrambling;
                            clearInterval(interval);
                        }
                    }, 50);
                }
            }
        });
    };

    return (
        <span ref={containerRef} onMouseMove={handleMouseMove} className="scramble-container">
            {children.split('').map((char, i) => (
                <span key={i} className="tw-char" data-char={char} style={{ opacity: 0, display: 'inline-block' }}>
                    {char === ' ' ? '\u00A0' : char}
                </span>
            ))}
        </span>
    );
};

const HomeHero = () => {
    const { lang, setLang } = useLanguage();
    const navigate = useNavigate();
    const heroRef = useRef<HTMLElement>(null);
    const ctaRef = useRef<HTMLAnchorElement>(null);
    const loading = useContext(LoadingContext);

    const [clock, setClock] = useState('');
    const [whisperIndex, setWhisperIndex] = useState(0);

    useEffect(() => {
        const tick = () => {
            const now = new Date().toLocaleTimeString('en-GB', {
                timeZone: 'Europe/Brussels',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });
            setClock(now);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        if (loading) return;
        const id = setInterval(() => {
            setWhisperIndex((i) => (i + 1) % WHISPERS.length);
        }, 5000);
        return () => clearInterval(id);
    }, [loading]);

    useEffect(() => {
        if (loading) return;

        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

            tl.fromTo('.home-hero__frame',
                { opacity: 0 },
                { opacity: 1, duration: 0.6, ease: 'steps(4)' }
            )
                .fromTo('.home-hero__meta',
                    { clipPath: 'inset(0 100% 0 0)' },
                    { clipPath: 'inset(0 0% 0 0)', duration: 0.7, ease: 'power3.inOut' },
                    0.1
                )
                .fromTo('.home-hero__meta > *',
                    { opacity: 0 },
                    { opacity: 1, duration: 0.3, stagger: 0.06 },
                    '<0.3'
                )
                .fromTo('.home-hero__title-line',
                    { clipPath: 'inset(0 0 100% 0)', y: 20 },
                    { clipPath: 'inset(0 0 0% 0)', y: 0, duration: 0.7, stagger: 0.14, ease: 'expo.out' },
                    0.3
                )
                .to('.tw-char',
                    { opacity: 1, duration: 0.01, stagger: { amount: 0.9, from: 'start' } },
                    '-=0.2'
                )
                .fromTo('.home-hero__whisper',
                    { opacity: 0, x: -16 },
                    { opacity: 1, x: 0, duration: 0.5 },
                    '-=0.4'
                )
                .fromTo('.home-hero__cta',
                    { opacity: 0 },
                    { opacity: 1, duration: 0.4 },
                    '-=0.2'
                );

            gsap.to('.home-hero__float', {
                y: 'random(-6, 6)',
                x: 'random(-3, 3)',
                duration: 'random(5, 8)',
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
                stagger: { amount: 2, from: 'random' },
            });

            const handleMouseMove = (e: MouseEvent) => {
                const x = (e.clientX / window.innerWidth - 0.5) * 2;
                const y = (e.clientY / window.innerHeight - 0.5) * 2;

                gsap.utils.toArray<HTMLElement>('.home-hero__parallax').forEach((el) => {
                    const depth = parseFloat(el.dataset.depth || '1');
                    gsap.to(el, {
                        x: x * 24 * depth,
                        y: y * 24 * depth,
                        duration: 1.6,
                        ease: 'power2.out',
                    });
                });

                if (ctaRef.current) {
                    const rect = ctaRef.current.getBoundingClientRect();
                    const cx = rect.left + rect.width / 2;
                    const cy = rect.top + rect.height / 2;
                    const dx = e.clientX - cx;
                    const dy = e.clientY - cy;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 160) {
                        gsap.to(ctaRef.current, {
                            x: dx * 0.3,
                            y: dy * 0.3,
                            duration: 0.6,
                            ease: 'power3.out',
                        });
                    } else {
                        gsap.to(ctaRef.current, { x: 0, y: 0, duration: 0.6, ease: 'power3.out' });
                    }
                }
            };

            window.addEventListener('mousemove', handleMouseMove);
            return () => window.removeEventListener('mousemove', handleMouseMove);
        }, heroRef);

        return () => ctx.revert();
    }, [loading]);

    const handleExit = (e: React.MouseEvent) => {
        e.preventDefault();
        const targetPath = (e.currentTarget as HTMLAnchorElement).getAttribute('href') || '/constellation';

        window.dispatchEvent(new CustomEvent('start-ambient'));

        gsap.context(() => {
            gsap.killTweensOf('.home-hero__float');

            const exitTl = gsap.timeline({
                onComplete: () => {
                    navigate(targetPath);
                }
            });

            exitTl.to('.tw-char', {
                y: window.innerHeight + 100,
                rotation: 'random(-90, 90)',
                opacity: 0,
                duration: 0.8,
                ease: 'power4.in',
                stagger: { amount: 0.5, from: 'random' },
            }, 0)
                .to(['.home-hero__title-line', '.home-hero__meta', '.home-hero__whisper', '.home-hero__cta'], {
                    y: 40,
                    opacity: 0,
                    filter: 'blur(6px)',
                    duration: 0.6,
                    ease: 'power3.in',
                }, 0.15);
        }, heroRef);
    };

    return (
        <section className="home-hero" ref={heroRef}>
            <div className="home-hero__frame" aria-hidden>
                <span className="home-hero__corner home-hero__corner--tl" />
                <span className="home-hero__corner home-hero__corner--tr" />
                <span className="home-hero__corner home-hero__corner--bl" />
                <span className="home-hero__corner home-hero__corner--br" />
            </div>

            <div className="home-hero__meta">
                <span className="home-hero__meta-item">51.22°N / 4.40°E</span>
                <span className="home-hero__meta-item home-hero__clock">{clock} CET</span>
                <button
                    type="button"
                    className="home-hero__lang"
                    onClick={() => setLang(lang === 'en' ? 'nl' : 'en')}
                    aria-label="Switch language"
                >
                    <span className={lang === 'en' ? 'is-active' : ''}>EN</span>
                    <span className="home-hero__lang-sep" aria-hidden>/</span>
                    <span className={lang === 'nl' ? 'is-active' : ''}>NL</span>
                </button>
            </div>

            <div className="home-hero__center">
                <h1 className="home-hero__title home-hero__parallax" data-depth="0.3">
                    <span className="home-hero__title-line">
                        <span className="home-hero__title-pixel">A</span>NTWERP
                    </span>
                    <span className="home-hero__title-line">
                        UNSEE<span className="home-hero__title-pixel">N</span><span className="home-hero__title-dot">.</span>
                    </span>
                </h1>

                <p className="home-hero__lede home-hero__parallax" data-depth="0.6">
                    <SplitText>
                        Approach the screen, and a stranger begins to tell you a story that happened right where you're standing. A living archive of voices, photos, and memories — left by Antwerp, for Antwerp.
                    </SplitText>
                </p>

                <Link
                    to="/constellation"
                    ref={ctaRef}
                    onClick={handleExit}
                    className="home-hero__cta"
                >
                    <span className="home-hero__cta-label">Step closer</span>
                    <svg viewBox="0 0 40 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="home-hero__cta-icon" aria-hidden="true">
                        <path d="M0 6H39M39 6L34 1M39 6L34 11" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                </Link>
            </div>

            <div className="home-hero__whisper home-hero__float home-hero__parallax" data-depth="0.9">
                <span className="home-hero__whisper-label">now playing</span>
                <span key={whisperIndex} className="home-hero__whisper-text">
                    &ldquo;{WHISPERS[whisperIndex]}&rdquo;
                </span>
            </div>
        </section>
    );
};

export default HomeHero;