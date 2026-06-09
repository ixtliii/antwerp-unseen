import { forwardRef } from 'react';

interface NavItemProps {
    index: number;
    label: string;
    route: string;
    x: number;
    y: number;
    onClick: (route: string) => void;
}

const NavItem = forwardRef<HTMLButtonElement, NavItemProps>(({ index, label, route, x, y, onClick }, ref) => {
    return (
        <button
            type="button"
            ref={ref}
            data-x={x}
            data-y={y}
            className="navbar__node"
            onClick={() => onClick(route)}
        >
            <span className="navbar__node-index" aria-hidden>
                0{index + 1}
            </span>
            <span className="navbar__node-text">{label}</span>
        </button>
    );
});

NavItem.displayName = 'NavItem';

export default NavItem;