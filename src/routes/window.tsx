import { useState } from 'react';
import PageLayout from '../layouts/PageLayout';
import WindowCarousel from '../components/organisms/WindowCarousel/WindowCarousel';
import WindowExpanded from '../components/organisms/WindowExpanded/WindowExpanded';
import { readDitherPref } from '../components/atoms/EffectToggle/EffectToggle';
import { WINDOWS } from '../data/windows';
import './window.css';
import DitherVideo from "../components/atoms/DitherVideo/DitherVideo.tsx";

const WindowPage = () => {
    const [current, setCurrent] = useState(1);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [ditherOn, setDitherOn] = useState<boolean>(() => readDitherPref());

    const goTo = (i: number) => setCurrent((i + WINDOWS.length) % WINDOWS.length);
    const open = (i: number) => setExpandedIndex(i);
    const close = () => setExpandedIndex(null);
    const expPrev = () => setExpandedIndex((p) => (p === null ? p : (p - 1 + WINDOWS.length) % WINDOWS.length));
    const expNext = () => setExpandedIndex((p) => (p === null ? p : (p + 1) % WINDOWS.length));

    return (
        <PageLayout noPadding showFooter={false}>
            <div className="window-page">
                <DitherVideo
                    src="/videos/aura.mp4"
                    pixelSize={6}
                    intensity={0.35}
                    cutout
                    playbackRate={2}
                    mouseReactive
                    className="artists-bg-video"
                />
                <p className="window-page__prompt">
                    <em>Somewhere</em> in the city, a stranger is walking past this screen right now.
                </p>

                <WindowCarousel current={current} onGoTo={goTo} onOpen={open} />

                <div className="window-page__arrows">
                    <button type="button" className="window-page__arrow" onClick={() => goTo(current - 1)}>← Previous</button>
                    <button type="button" className="window-page__arrow" onClick={() => goTo(current + 1)}>Next →</button>
                </div>

                {expandedIndex !== null && (
                    <WindowExpanded
                        memory={WINDOWS[expandedIndex]}
                        ditherOn={ditherOn}
                        onToggleDither={setDitherOn}
                        onClose={close}
                        onPrev={expPrev}
                        onNext={expNext}
                    />
                )}
            </div>
        </PageLayout>
    );
};

export default WindowPage;