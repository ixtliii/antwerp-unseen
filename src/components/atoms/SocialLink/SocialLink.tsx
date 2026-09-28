import './socialLink.css';

interface SocialLinkProps {
    label: string;
    href: string;
}

const SocialLink = ({ label, href }: SocialLinkProps) => (
    <a className="social-link" href={href} target="_blank" rel="noopener noreferrer">
        <span className="social-link__label">{label}</span>
        <span className="social-link__arrow" aria-hidden>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.61914 15.9297L16.51 2.57824" stroke="#DBE3EE" stroke-width="2"/>
                <path d="M16.7941 12.001L16.7941 2.05636L7.18138 2.05692" stroke="#DBE3EE" stroke-width="2"/>
            </svg>
        </span>
    </a>
);

export default SocialLink;