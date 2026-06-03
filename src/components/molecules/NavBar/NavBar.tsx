import { NavLink } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import './navBar.css';

interface NavBarProps {
    light?: boolean; // white bg + dark text — for light-themed pages
}

const NavBar = ({ light = false }: NavBarProps) => {
    const { lang, setLang, t } = useLanguage();

    const linkClass = ({ isActive }: { isActive: boolean }) =>
        `navbar__link${isActive ? ' navbar__link--active' : ''}`;

    return (
        <header className={`navbar${light ? ' navbar--light' : ''}`}>
            <NavLink to="/" className="navbar__logo" aria-label="Antwerp Unseen — home">
                ANTWERP<br />UNSEEN.
            </NavLink>

            <nav aria-label={t.a11y.navMenu}>
                <ul className="navbar__links">
                    <li><NavLink to="/"             className={linkClass} end>{t.nav.home}</NavLink></li>
                    <li><NavLink to="/explore"      className={linkClass}>{t.nav.archive}</NavLink></li>
                    <li><NavLink to="/artists" className={linkClass}>{t.nav.artists}</NavLink></li>
                    <li><NavLink to="/installation" className={linkClass}>{t.nav.installation}</NavLink></li>
                </ul>
            </nav>

            <div className="navbar__right">
                <NavLink to="/submit" className="navbar__subscribe">
                    {t.nav.submit}
                    <span className="navbar__subscribe-arrow" aria-hidden>——→</span>
                </NavLink>
                <button
                    className="navbar__lang"
                    onClick={() => setLang(lang === 'en' ? 'nl' : 'en')}
                    aria-label={t.a11y.langSwitch}
                >
                    <span className={lang === 'en' ? 'navbar__lang-opt--active' : 'navbar__lang-opt'}>EN</span>
                    <span className="navbar__lang-sep" aria-hidden>|</span>
                    <span className={lang === 'nl' ? 'navbar__lang-opt--active' : 'navbar__lang-opt'}>NL</span>
                </button>
            </div>
        </header>
    );
};

export default NavBar;