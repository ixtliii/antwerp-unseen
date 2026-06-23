import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useLanguage } from '../../../context/LanguageContext';
import { triggerPageTransition } from '../../globals/PixelTransition/triggerTransition';
import logoUrl from '../../../assets/logo.svg';
import './navBar.css';
import NavItem from "../../atoms/NavItem/NavItem.tsx";

interface NavNode {
    labelKey: string;
    fallback: string;
    route: string;
    x: number;
    y: number;
}

const NODES: NavNode[] = [
    { labelKey: 'window', fallback: 'WINDOWS', route: '/windows', x: -190, y: 36 },
    { labelKey: 'archive', fallback: 'ARCHIVE', route: '/explore', x: -150, y: 96 },
    { labelKey: 'artist', fallback: 'LOCAL ARTISTS', route: '/artists', x: -210, y: 156 },
    { labelKey: 'map', fallback: 'MAP', route: '/map', x: -110, y: 210 },
    { labelKey: 'submit', fallback: 'ADD YOUR STORY', route: '/submit', x: -180, y: 270 },
    { labelKey: 'contact us', fallback: 'CONTACT US', route: '/installation', x: -80, y: 320 },
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

    // Logo → the menu page (ConstellationNav), bypassing the home loading screen.
    const handleLogoClick = () => {
        setOpen(false);
        triggerPageTransition(() => navigate('/constellation'));
    };

    return (
        <>
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
                    aria-label="Antwerp Unseen — menu"
                >
                    <img src={logoUrl} alt="Antwerp Unseen" className="navbar__logo-img" />
                </button>

                <button
                    type="button"
                    className="navbar__lang"
                    onClick={() => setLang(lang === 'en' ? 'nl' : 'en')}
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
                        aria-expanded={open}
                    >
                        <span className="navbar__trigger-line"></span>
                        <span className="navbar__trigger-line"></span>
                        <span className="navbar__trigger-line"></span>
                    </button>

                    {NODES.map((node, i) => (
                        <NavItem
                            key={node.route}
                            ref={(el) => { nodeRefs.current[i] = el; }}
                            index={i}
                            label={(t.nav && t.nav[node.labelKey as keyof typeof t.nav]) || node.fallback}
                            route={node.route}
                            x={node.x}
                            y={node.y}
                            onClick={handleNodeClick}
                        />
                    ))}
                </div>
            </header>
        </>
    );
};

export default NavBar;