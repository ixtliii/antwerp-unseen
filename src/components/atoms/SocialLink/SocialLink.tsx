import './socialLink.css';

interface SocialLinkProps {
    label: string;
    href: string;
}

const SocialLink = ({ label, href }: SocialLinkProps) => (
    <a className="social-link" href={href} target="_blank" rel="noopener noreferrer">
        <span className="social-link__label">{label}</span>
        <span className="social-link__arrow" aria-hidden>↗</span>
    </a>
);

export default SocialLink;