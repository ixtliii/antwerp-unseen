import PageLayout from '../layouts/PageLayout';
import ContactColumn from '../components/molecules/ContactColumn/ContactColumn';
import SocialLink from '../components/atoms/SocialLink/SocialLink';
import NewsletterField from '../components/atoms/NewsletterField/NewsletterField';
import './contact.css';
import DitherVideo from "../components/atoms/DitherVideo/DitherVideo.tsx";

const ContactPage = () => {
    const handleNewsletter = (email: string) => {
        console.log('subscribe', email);
    };

    return (
        <PageLayout noPadding showFooter={false}>
            <div className="contact-page">
                <DitherVideo
                    src="/videos/crowd.mp4"
                    pixelSize={6}
                    intensity={0.35}
                    cutout
                    playbackRate={1}
                    mouseReactive
                    className="artists-bg-video"
                />
                <ContactColumn
                    className="contact-page__contact"
                    title="Contact Us"
                    rows={[
                        {
                            icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
                            value: '+32 484 22 15 45',
                            href: 'tel:+32484221545'
                        },
                        {
                            icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
                            value: 'antwerp.unseen@gmail.com',
                            href: 'mailto:antwerp.unseen@gmail.com'
                        },
                    ]}
                />

                <div className="contact-page__socials">
                    <h2 className="contact-page__heading">Socials</h2>
                    <div className="socials__container">
                        <SocialLink label="Instagram" href="https://instagram.com" />
                        <SocialLink label="LinkedIn" href="https://linkedin.com" />
                    </div>
                </div>

                <div className="contact-page__news">
                    <h3 className="contact-page__heading">Stay in tune for new locations!</h3>
                    <NewsletterField onSubmit={handleNewsletter} />
                </div>

                <h2 className="contact-page__wordmark">
                    <span>
                        <span className="contact-page__wordmark-pixel">A</span>NTWERP
                    </span>
                    <span>
                        UNSEE<span className="contact-page__wordmark-pixel">N</span>
                        <span className="contact-page__wordmark-dot">.</span>
                    </span>
                </h2>

                <span className="contact-page__year">2026 ©</span>
            </div>
        </PageLayout>
    );
};

export default ContactPage;