import { useState, useMemo, useEffect } from 'react';
import { mockDays } from '../data/mock';
import Scene from '../components/organisms/Scene/Scene';
import FilterMenu from '../components/molecules/FilterMenu/FilterMenu';
import NavBar from '../components/molecules/NavBar/NavBar';
import useFilterSound from '../hooks/useFilterSound';

const Explore = () => {
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [activeDate,   setActiveDate]   = useState<string>(mockDays[0].date);
    const playFilterSound = useFilterSound();

    const handleFilterChange = (filter: string) => {
        if (filter === activeFilter) return;
        setActiveFilter(filter);
        playFilterSound();
    };

    const { filteredDays, filterCounts } = useMemo(() => {
        const counts: Record<string, number> = { all: mockDays.length };

        mockDays.forEach(day => {
            const dayTypes = new Set<string>();
            const dayTags  = new Set<string>();
            day.contributions.forEach(c => {
                dayTypes.add(c.type);
                c.tags.forEach(t => dayTags.add(t.name));
            });
            dayTypes.forEach(type => { counts[type] = (counts[type] || 0) + 1; });
            dayTags.forEach(tag  => { counts[tag]  = (counts[tag]  || 0) + 1; });
        });

        const filtered = mockDays.filter(day => {
            if (activeFilter === 'all') return true;
            return day.contributions.some(c =>
                c.type === activeFilter || c.tags.some(t => t.name === activeFilter)
            );
        });

        return { filteredDays: filtered, filterCounts: counts };
    }, [activeFilter]);

    // Reset active date when it disappears from filtered set
    useEffect(() => {
        if (filteredDays.length > 0 && !filteredDays.find(d => d.date === activeDate)) {
            setActiveDate(filteredDays[0].date);
        }
    }, [filteredDays, activeDate]);

    return (
        // Fullscreen — NavBar floats over the scene, no PageLayout wrapper
        <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#0f0f0f', overflow: 'hidden' }}>
            <NavBar />
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