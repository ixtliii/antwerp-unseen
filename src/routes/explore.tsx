import { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Archive from '../components/organisms/Archive/Archive.tsx';
import FilterMenu from '../components/molecules/FilterMenu/FilterMenu';
import useFilterSound from '../hooks/useFilterSound';
import PageLayout from '../layouts/PageLayout.tsx';
import type { Submission } from '../types';
import type { FilterCategory } from '../components/molecules/FilterMenu/FilterMenu';

// ── Date helpers ─────────────────────────────────────────────────────────────

const startOfDay  = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const isToday     = (d: Date) => startOfDay(d) === startOfDay(new Date());
const isThisWeek  = (d: Date) => d.getTime() >= new Date().getTime() - 7 * 24 * 60 * 60 * 1000;
const isThisMonth = (d: Date) => {
    const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
};
const isThisYear  = (d: Date) => d.getFullYear() === new Date().getFullYear();

// ── Component ─────────────────────────────────────────────────────────────────

const Explore = () => {
    const [submissions,   setSubmissions]   = useState<Submission[]>([]);
    const [loading,       setLoading]       = useState(true);
    const [activeFilter,  setActiveFilter]  = useState<string>('all');
    const [activeId,      setActiveId]      = useState<string>('');
    const playFilterSound = useFilterSound();

    // Fetch all submissions once on mount
    useEffect(() => {
        const fetchSubmissions = async () => {
            const { data, error } = await supabase
                .from('submissions')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data) setSubmissions(data as Submission[]);
            setLoading(false);
        };
        void fetchSubmissions();
    }, []);

    // Filter submissions by active filter
    const filteredSubmissions = useMemo((): Submission[] => {
        if (activeFilter === 'all') return submissions;

        const timeFns: Record<string, (d: Date) => boolean> = {
            'today':      isToday,
            'this-week':  isThisWeek,
            'this-month': isThisMonth,
            'this-year':  isThisYear,
        };
        if (timeFns[activeFilter]) {
            const fn = timeFns[activeFilter];
            return submissions.filter(s => fn(new Date(s.created_at)));
        }

        if (['text', 'voice', 'image', 'video'].includes(activeFilter)) {
            return submissions.filter(s => s.format === activeFilter);
        }

        if (activeFilter === 'local' || activeFilter === 'tourist') {
            return submissions.filter(s => s.user_type === activeFilter);
        }

        return submissions;
    }, [submissions, activeFilter]);

    // Set initial activeId once data arrives
    useEffect(() => {
        if (filteredSubmissions.length > 0 && !activeId) {
            setActiveId(filteredSubmissions[0].id);
        }
    }, [filteredSubmissions, activeId]);

    // Reset activeId if it disappears after filtering
    useEffect(() => {
        if (
            filteredSubmissions.length > 0 &&
            !filteredSubmissions.find(s => s.id === activeId)
        ) {
            setActiveId(filteredSubmissions[0].id);
        }
    }, [filteredSubmissions, activeId]);

    // Compute filter panel data from ALL submissions (counts stay stable while browsing)
    const { categories, totalCount } = useMemo(() => {
        const uniqueDates = new Set(submissions.map(s => s.created_at.split('T')[0])).size;
        const fmt = { text: 0, voice: 0, image: 0, video: 0 };
        const usr = { local: 0, tourist: 0 };

        submissions.forEach(s => {
            fmt[s.format]++;
            usr[s.user_type]++;
        });

        const cats: FilterCategory[] = [
            {
                id: 'time', label: 'time', count: uniqueDates,
                items: [
                    { id: 'today',      label: 'today',      count: submissions.filter(s => isToday(new Date(s.created_at))).length },
                    { id: 'this-week',  label: 'this week',  count: submissions.filter(s => isThisWeek(new Date(s.created_at))).length },
                    { id: 'this-month', label: 'this month', count: submissions.filter(s => isThisMonth(new Date(s.created_at))).length },
                    { id: 'this-year',  label: 'this year',  count: submissions.filter(s => isThisYear(new Date(s.created_at))).length },
                ],
            },
            {
                id: 'format', label: 'format', count: submissions.length,
                items: [
                    { id: 'voice', label: 'voice memo', count: fmt.voice },
                    { id: 'text',  label: 'text',       count: fmt.text  },
                    { id: 'image', label: 'image',      count: fmt.image },
                    { id: 'video', label: 'video',      count: fmt.video },
                ],
            },
            {
                id: 'usertype', label: 'local/tourist', count: submissions.length,
                items: [
                    { id: 'local',   label: 'locals',  count: usr.local   },
                    { id: 'tourist', label: 'tourists', count: usr.tourist },
                ],
            },
        ];

        return { categories: cats, totalCount: submissions.length };
    }, [submissions]);

    const handleFilterChange = (filter: string) => {
        if (filter === activeFilter) return;
        setActiveFilter(filter);
        playFilterSound();
    };

    return (
        <PageLayout noPadding showFooter={false}>
            {!loading && filteredSubmissions.length > 0 && (
                <Archive
                    submissions={filteredSubmissions}
                    activeId={activeId}
                    onActiveChange={setActiveId}
                />
            )}
            {!loading && (
                <FilterMenu
                    categories={categories}
                    totalCount={totalCount}
                    activeFilter={activeFilter}
                    onFilterChange={handleFilterChange}
                />
            )}
        </PageLayout>
    );
};

export default Explore;