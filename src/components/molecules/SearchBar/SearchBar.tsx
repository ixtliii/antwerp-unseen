import { useState } from 'react';
import './searchBar.css';

type Props = {
    search: string;
    setSearch: (value: string) => void;
    suggestions: string[];
    placeholder?: string;
    transparentBackground?: boolean;
};

const SearchBar = ({
                       search,
                       setSearch,
                       suggestions,
                       placeholder = "Search...",
                       transparentBackground = false
                   }: Props) => {
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const showSuggestions = isSearchFocused && suggestions.length > 0;

    return (
        <div className="artists-sidebar__search-wrapper">
            <div
                className="artists-sidebar__search"
                style={transparentBackground ? { padding: 0, background: 'transparent' } : undefined}
            >
                <span className="artists-sidebar__search-icon">⌕</span>
                <input
                    type="text"
                    placeholder={placeholder}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    className="artists-sidebar__search-input"
                    aria-label={placeholder}
                />
            </div>
            {showSuggestions && (
                <ul className="artists-sidebar__suggestions">
                    {suggestions.map((sug, idx) => (
                        <li
                            key={idx}
                            onMouseDown={() => {
                                setSearch(sug);
                                setIsSearchFocused(false);
                            }}
                        >
                            {sug}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SearchBar;