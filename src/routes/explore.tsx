import { useState, useMemo, useEffect, useRef } from 'react';
import { mockDays } from '../data/mock';
import Scene from '../components/Scene/Scene';
import FilterMenu from '../components/FilterMenu/FilterMenu';

const Explore = () => {
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [activeDate, setActiveDate] = useState<string>(mockDays[0].date);
    const audioCtxRef = useRef<AudioContext | null>(null);

    const playFilterSound = () => {
        if (!audioCtxRef.current) {
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            audioCtxRef.current = new AudioContextClass();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        // Satisfying, fast "snap" mechanical switch sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
    };

    const handleFilterChange = (filter: string) => {
        if (filter !== activeFilter) {
            setActiveFilter(filter);
            playFilterSound();
        }
    };

    const { filteredDays, filterCounts } = useMemo(() => {
        const counts: Record<string, number> = { all: mockDays.length };

        mockDays.forEach(day => {
            const dayTypes = new Set<string>();
            const dayTags = new Set<string>();

            day.contributions.forEach(c => {
                dayTypes.add(c.type);
                c.tags.forEach(t => dayTags.add(t.name));
            });

            dayTypes.forEach(type => {
                counts[type] = (counts[type] || 0) + 1;
            });

            dayTags.forEach(tag => {
                counts[tag] = (counts[tag] || 0) + 1;
            });
        });

        const filtered = mockDays.filter(day => {
            if (activeFilter === 'all') return true;
            return day.contributions.some(c =>
                c.type === activeFilter || c.tags.some(t => t.name === activeFilter)
            );
        });

        return { filteredDays: filtered, filterCounts: counts };
    }, [activeFilter]);

    useEffect(() => {
        if (filteredDays.length > 0 && !filteredDays.find(d => d.date === activeDate)) {
            setActiveDate(filteredDays[0].date);
        }
    }, [filteredDays, activeDate]);

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', backgroundColor: '#0f0f0f', overflow: 'hidden' }}>
            {filteredDays.length > 0 && (
                <Scene
                    days={filteredDays}
                    activeDate={activeDate}
                    onActiveChange={setActiveDate}
                />
            )}

            <FilterMenu
                filterCounts={filterCounts}
                activeFilter={activeFilter}
                onFilterChange={handleFilterChange}
            />
        </div>
    );
};

export default Explore;