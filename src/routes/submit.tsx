import NavBar from '../components/molecules/NavBar/NavBar';
import Footer from '../components/molecules/Footer/Footer';
import { useLanguage } from '../context/LanguageContext';

const Submit = () => {
    const { t } = useLanguage();
    return (
        <div style={{ minHeight: '100vh', background: '#080808', color: '#f0ede8' }}>
            <NavBar />
            <main style={{ paddingTop: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>
                    Submission form — coming soon
                </p>
            </main>
            <Footer />
        </div>
    );
};

export default Submit;
