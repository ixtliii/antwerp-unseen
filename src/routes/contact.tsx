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
                        { icon: '☎', value: '+32 484 22 15 45', href: 'tel:+32484221545' },
                        { icon: '@', value: 'antwerp.unseen@gmail.com', href: 'mailto:antwerp.unseen@gmail.com' },
                    ]}
                />

                <div className="contact-page__socials">
                    <h2 className="contact-page__heading">Socials</h2>
                    <SocialLink label="Instagram" href="https://instagram.com" />
                    <SocialLink label="LinkedIn" href="https://linkedin.com" />
                </div>

                <div className="contact-page__news">
                    <h3 className="contact-page__heading">Stay in tune for new locations!</h3>
                    <NewsletterField onSubmit={handleNewsletter} />
                </div>

                <h2 className="contact-page__wordmark">
                    <span className="contact-page__wordmark-pixel">A</span>NTWERP&nbsp;UNSEE<span className="contact-page__wordmark-pixel">N</span><span className="contact-page__wordmark-dot">.</span>
                </h2>

                <span className="contact-page__year">2026 ©</span>
            </div>
        </PageLayout>
    );
};

export default ContactPage;