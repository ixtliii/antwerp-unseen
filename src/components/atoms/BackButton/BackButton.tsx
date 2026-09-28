import './backButton.css';

interface BackButtonProps {
    onClick: () => void;
}

const BackButton = ({ onClick }: BackButtonProps) => {
    return (
        <button type="button" className="back-button" onClick={onClick} aria-label="Go back">
            <span className="back-button__arrow">←</span>
            <span className="back-button__label">Back</span>
        </button>
    );
};

export default BackButton;