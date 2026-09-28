import './viewToggle.css';

type View = 'map' | 'list';

interface ViewToggleProps {
    view: View;
    onChange: (view: View) => void;
}

const ViewToggle = ({ view, onChange }: ViewToggleProps) => {
    return (
        <div className="view-toggle">
            <button
                type="button"
                className={`view-toggle__btn ${view === 'map' ? 'is-active' : ''}`}
                onClick={() => onChange('map')}
                aria-label="Map view"
                aria-pressed={view === 'map'}
            >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <rect x="1" y="1" width="8" height="8" stroke="currentColor" strokeWidth="1.5" />
                    <rect x="13" y="1" width="8" height="8" stroke="currentColor" strokeWidth="1.5" />
                    <rect x="1" y="13" width="8" height="8" stroke="currentColor" strokeWidth="1.5" />
                    <rect x="13" y="13" width="8" height="8" stroke="currentColor" strokeWidth="1.5" />
                </svg>
            </button>
            <button
                type="button"
                className={`view-toggle__btn ${view === 'list' ? 'is-active' : ''}`}
                onClick={() => onChange('list')}
                aria-label="List view"
                aria-pressed={view === 'list'}
            >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <rect x="1" y="4" width="20" height="14" rx="1" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="5" y1="11" x2="17" y2="11" stroke="currentColor" strokeWidth="1.5" />
                </svg>
            </button>
        </div>
    );
};

export default ViewToggle;