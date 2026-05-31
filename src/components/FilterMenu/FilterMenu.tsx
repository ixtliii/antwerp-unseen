import './filterMenu.css';

interface FilterMenuProps {
    filterCounts: Record<string, number>;
    activeFilter: string;
    onFilterChange: (filter: string) => void;
}

const FilterMenu = ({ filterCounts, activeFilter, onFilterChange }: FilterMenuProps) => {
    return (
        <div className="filter-menu-container">
            {Object.entries(filterCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([key, count]) => (
                    <div
                        key={key}
                        onClick={() => onFilterChange(key)}
                        className={`filter-menu-item ${activeFilter === key ? 'active' : ''}`}
                    >
                        <span>{key}</span>
                        <span className="filter-menu-count">{count}</span>
                    </div>
                ))}
        </div>
    );
};

export default FilterMenu;