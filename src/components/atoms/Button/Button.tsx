import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react';
import './button.css';

type BaseProps = {
    variant?: 'primary' | 'ghost' | 'text';
    size?:    'sm' | 'md' | 'lg';
    children: ReactNode;
    className?: string;
};

type ButtonAsButton = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { as?: 'button' };
type ButtonAsAnchor = BaseProps & AnchorHTMLAttributes<HTMLAnchorElement>  & { as: 'a' };
type ButtonProps = ButtonAsButton | ButtonAsAnchor;

const Button = ({ variant = 'ghost', size = 'md', children, className = '', as: Tag = 'button', ...rest }: ButtonProps) => (
    // @ts-expect-error — polymorphic component, types are manually narrowed above
    <Tag className={`btn btn--${variant} btn--${size} ${className}`} {...rest}>
        {children}
    </Tag>
);

export default Button;
