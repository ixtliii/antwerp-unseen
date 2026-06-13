import { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Artwork } from '../../../types';
import './artworkDetail.css';

type Props = {
    artwork: Artwork & { _key?: string };
    onClose: () => void;
};

const transitionSpring = {
    type: "spring",
    damping: 25,
    stiffness: 120,
    mass: 0.8
};

const ArtworkDetail = ({ artwork, onClose }: Props) => {
    const uniqueId = artwork._key || artwork.id;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    return (
        <motion.div
            className="artwork-detail-overlay"
            initial={{ backgroundColor: "rgba(4, 4, 4, 0)", backdropFilter: "blur(0px)" }}
            animate={{ backgroundColor: "rgba(4, 4, 4, 0.98)", backdropFilter: "blur(12px)" }}
            exit={{ backgroundColor: "rgba(4, 4, 4, 0)", backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
        >
            <div className="artwork-detail__top-bar">
                <motion.button
                    className="artwork-detail__back-btn"
                    onClick={onClose}
                    aria-label="Go back"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    <span className="artwork-detail__back-arrow">←</span>
                </motion.button>
            </div>

            <div className="artwork-detail__content">
                <motion.div
                    className="artwork-detail__header"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <h1 className="artwork-detail__artist-name">{artwork.artist.name}</h1>
                    <p className="artwork-detail__artist-role">Local Artist</p>
                </motion.div>

                <div className="artwork-detail__hero">
                    <motion.div
                        className="artwork-detail__accent-square square-top-right"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{ duration: 0.2 }}
                    />
                    <motion.div
                        className="artwork-detail__accent-square square-bottom-left"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{ duration: 0.2 }}
                    />

                    <motion.img
                        src={artwork.image_url}
                        alt={artwork.name}
                        className="artwork-detail__image"
                        layoutId={`artwork-image-${uniqueId}`}
                        transition={transitionSpring}
                    />
                </div>

                <motion.div
                    className="artwork-detail__info"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="artwork-detail__title-row">
                        <motion.h2
                            className="artwork-detail__title"
                            layoutId={`title-${uniqueId}`}
                            transition={transitionSpring}
                        >
                            {artwork.name}
                        </motion.h2>
                        <div className="artwork-detail__line"></div>
                        <span className="artwork-detail__year">2024</span>
                    </div>

                    <p className="artwork-detail__description">
                        {artwork.description || "This artwork is a lyrical abstract composition created by the local artist. The piece utilizes dynamic techniques to create texture, depth, and unseen perspectives."}
                    </p>

                    <div className="artwork-detail__socials">
                        <span className="artwork-detail__socials-label">FIND THE ARTIST ON</span>
                        <div className="artwork-detail__socials-links">
                            <a href="#">Instagram</a>
                            <a href="#">Twitter</a>
                            <a href="#">Facebook</a>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default ArtworkDetail;