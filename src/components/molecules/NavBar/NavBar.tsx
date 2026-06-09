import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useLanguage } from '../../../context/LanguageContext';
import { triggerPageTransition } from '../../globals/PixelTransition/triggerTransition';
import './navBar.css';

interface NavNode {
    labelKey: 'archive' | 'submit' | 'artists' | 'installation';
    route: string;
    x: number;
    y: number;
}

const NODES: NavNode[] = [
    { labelKey: 'archive',      route: '/explore',      x: -190, y: 36 },
    { labelKey: 'artists',      route: '/artists',      x: -150, y: 96 },
    { labelKey: 'submit',       route: '/submit',       x: -210, y: 156 },
    { labelKey: 'installation', route: '/installation', x: -110, y: 210 },
];

interface NavBarProps {
    light?: boolean;
}

const NavBar = ({ light = false }: NavBarProps) => {
    const { lang, setLang, t } = useLanguage();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const systemRef = useRef<HTMLDivElement>(null);
    const nodeRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const floatTweens = useRef<gsap.core.Tween[]>([]);

    // open / close animation
    useEffect(() => {
        const nodes = nodeRefs.current.filter(Boolean) as HTMLButtonElement[];

        if (open) {
            nodes.forEach((node, i) => {
                node.style.visibility = 'visible';
                const x = node.dataset.x ?? '0';
                const y = node.dataset.y ?? '0';

                gsap.to(node, {
                    x, y,
                    opacity: 1,
                    scale: 1,
                    duration: 0.8,
                    ease: 'expo.out',
                    delay: i * 0.05,
                    onStart: () => {
                        gsap.delayedCall(0.3, () => {
                            node.style.pointerEvents = 'auto';
                        });
                    },
                    onComplete: () => {
                        const tween = gsap.to(node, {
                            y: `+=${Math.random() * 8 + 4}`,
                            x: `+=${Math.random() * 4 - 2}`,
                            duration: Math.random() * 2 + 2.5,
                            yoyo: true,
                            repeat: -1,
                            ease: 'sine.inOut',
                        });
                        floatTweens.current.push(tween);
                    },
                });
            });
        } else {
            floatTweens.current.forEach((tw) => tw.kill());
            floatTweens.current = [];

            nodes.forEach((node, i) => {
                node.style.pointerEvents = 'none';
                gsap.to(node, {
                    x: 0, y: 0,
                    opacity: 0,
                    scale: 0,
                    duration: 0.5,
                    ease: 'power2.in',
                    delay: (nodes.length - 1 - i) * 0.05,
                    onComplete: () => {
                        node.style.visibility = 'hidden';
                    },
                });
            });
        }
    }, [open]);

    // close on Escape
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    const handleNodeClick = (route: string) => {
        setOpen(false);
        triggerPageTransition(() => navigate(route));
    };

    const handleLogoClick = () => {
        setOpen(false);
        triggerPageTransition(() => navigate('/'));
    };

    return (
        <>
            {/* backdrop dim — click anywhere to close */}
            <div
                className={`navbar__backdrop${open ? ' navbar__backdrop--visible' : ''}`}
                onClick={() => setOpen(false)}
                aria-hidden
            />

            <header className={`navbar${light ? ' navbar--light' : ''}`}>
                <button
                    type="button"
                    className="navbar__logo"
                    onClick={handleLogoClick}
                    aria-label="Antwerp Unseen — home"
                >
                    ANTWERP<br />UNSEEN.
                </button>

                <button
                    type="button"
                    className="navbar__lang"
                    onClick={() => setLang(lang === 'en' ? 'nl' : 'en')}
                    aria-label={t.a11y.langSwitch}
                >
                    <span className={lang === 'en' ? 'navbar__lang-opt--active' : 'navbar__lang-opt'}>EN</span>
                    <span className="navbar__lang-sep" aria-hidden>/</span>
                    <span className={lang === 'nl' ? 'navbar__lang-opt--active' : 'navbar__lang-opt'}>NL</span>
                </button>

                <div className="navbar__system" ref={systemRef}>
                    <button
                        type="button"
                        className={`navbar__trigger${open ? ' navbar__trigger--active' : ''}`}
                        onClick={() => setOpen((o) => !o)}
                        aria-label={open ? 'Close menu' : 'Open menu'}
                        aria-expanded={open}
                    />

                    {NODES.map((node, i) => (
                        <button
                            type="button"
                            key={node.route}
                            ref={(el) => { nodeRefs.current[i] = el; }}
                            data-x={node.x}
                            data-y={node.y}
                            className="navbar__node"
                            onClick={() => handleNodeClick(node.route)}
                        >
                            <span className="navbar__node-index" aria-hidden>
                                0{i + 1}
                            </span>
                            <span className="navbar__node-text">{t.nav[node.labelKey]}</span>
                        </button>
                    ))}
                </div>
            </header>
        </>
    );
};

export default NavBar;