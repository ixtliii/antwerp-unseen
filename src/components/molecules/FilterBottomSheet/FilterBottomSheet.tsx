import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import type { FilterCategory } from '../FilterMenu/FilterMenu';
import './filterBottomSheet.css';

interface FilterBottomSheetProps {
    categories: FilterCategory[];
    totalCount: number;
    activeFilter: string;
    onFilterChange: (filter: string) => void;
    filteredCount: number;
}

const FilterBottomSheet = ({
                               categories,
                               totalCount,
                               activeFilter,
                               onFilterChange,
                               filteredCount,
                           }: FilterBottomSheetProps) => {
    const [open, setOpen] = useState(false);
    const sheetRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open && sheetRef.current) {
            gsap.fromTo(
                sheetRef.current,
                { y: '100%' },
                { y: '0%', duration: 0.45, ease: 'expo.out' }
            );
        }
    }, [open]);

    const openSheet = () => {
        setOpen(true);
    };

    const closeSheet = () => {
        if (sheetRef.current) {
            gsap.to(sheetRef.current, {
                y: '100%',
                duration: 0.3,
                ease: 'power3.in',
                onComplete: () => setOpen(false),
            });
        } else {
            setOpen(false);
        }
    };

    const handleFilterChange = (filter: string) => {
        onFilterChange(filter);
        closeSheet();
    };

    const handleReset = () => {
        onFilterChange('all');
        closeSheet();
    };

    const hasActiveFilter = activeFilter !== 'all';

    return (
        <>
            {open && (
                <div className="filter-sheet__backdrop" onClick={closeSheet} />
            )}

            {open && (
                <div className="filter-sheet" ref={sheetRef}>
                    <div className="filter-sheet__header" onClick={closeSheet}>
                        <span className="filter-sheet__handle" aria-hidden />
                        <div className="filter-sheet__title">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="4" y1="6" x2="20" y2="6"/>
                                <line x1="8" y1="12" x2="16" y2="12"/>
                                <line x1="4" y1="18" x2="20" y2="18"/>
                            </svg>
                            <span>Filter</span>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polyline points="18 15 12 9 6 15" />
                        </svg>
                    </div>

                    <div className="filter-sheet__body">
                        <button
                            type="button"
                            className={`filter-sheet__all ${activeFilter === 'all' ? 'is-active' : ''}`}
                            onClick={() => handleFilterChange('all')}
                        >
                            <span>all</span>
                            <span className="filter-sheet__count">
                                ({totalCount > 999 ? '999+' : totalCount})
                            </span>
                        </button>

                        <div className="filter-sheet__grid">
                            {categories.map(cat => (
                                <div key={cat.id} className="filter-sheet__group">
                                    <div className="filter-sheet__cat-header">
                                        <span className="filter-sheet__cat-label">{cat.label}</span>
                                        <span className="filter-sheet__count">({cat.count})</span>
                                    </div>
                                    <div className="filter-sheet__items">
                                        {cat.items.map(item => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                className={`filter-sheet__item ${activeFilter === item.id ? 'is-active' : ''}`}
                                                onClick={() => handleFilterChange(item.id)}
                                            >
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="filter-sheet__actions">
                            <button
                                type="button"
                                className="filter-sheet__reset"
                                onClick={handleReset}
                                disabled={!hasActiveFilter}
                            >
                                RESET PREFERENCES
                            </button>
                            <button
                                type="button"
                                className="filter-sheet__apply"
                                onClick={closeSheet}
                            >
                                SHOW {filteredCount > 999 ? '999+' : filteredCount} RESULTS
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!open && (
                <button className="filter-sheet__trigger" onClick={openSheet} type="button">
                    <div className="filter-sheet__trigger-inner">
                        <span className="filter-sheet__trigger-left">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="4" y1="6" x2="20" y2="6"/>
                                <line x1="8" y1="12" x2="16" y2="12"/>
                                <line x1="4" y1="18" x2="20" y2="18"/>
                            </svg>
                            <span>Filter</span>
                            {hasActiveFilter && (
                                <span className="filter-sheet__active-dot" aria-label="filter active" />
                            )}
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </div>
                </button>
            )}
        </>
    );
};

export default FilterBottomSheet;