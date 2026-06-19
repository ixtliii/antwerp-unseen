import './filterMenu.css';

export interface FilterItem {
    id: string;
    label: string;
    count?: number;
}

export interface FilterCategory {
    id: string;
    label: string;
    count: number;
    items: FilterItem[];
}

interface FilterMenuProps {
    categories: FilterCategory[];
    totalCount: number;
    activeFilter: string;
    onFilterChange: (filter: string) => void;
}

const FilterMenu = ({ categories, totalCount, activeFilter, onFilterChange }: FilterMenuProps) => {
    return (
        <nav className="filter-menu" aria-label="Archive filters">
            <button
                type="button"
                className={`filter-menu__all ${activeFilter === 'all' ? 'is-active' : ''}`}
                onClick={() => onFilterChange('all')}
            >
                <span className="filter-menu__all-label">all</span>
                <span className="filter-menu__count">
                    ({totalCount > 999 ? '999+' : totalCount})
                </span>
            </button>

            {categories.map((cat) => (
                <div key={cat.id} className="filter-menu__group">
                    <div className="filter-menu__category">
                        <span className="filter-menu__cat-label">{cat.label}</span>
                        <span className="filter-menu__count">({cat.count})</span>
                    </div>

                    <div className="filter-menu__items">
                        {cat.items.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                className={`filter-menu__item ${activeFilter === item.id ? 'is-active' : ''}`}
                                onClick={() => onFilterChange(item.id)}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </nav>
    );
};

export default FilterMenu;