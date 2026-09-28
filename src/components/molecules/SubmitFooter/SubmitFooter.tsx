import type { UserType } from '../../organisms/SubmitFlow/submitFlow.types';
import './submitFooter.css';

interface SubmitFooterProps {
    userType: UserType;
    onUserTypeChange: (type: UserType) => void;
    onSubmit: () => void;
    submitting: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
}

const SubmitFooter = ({
                          userType,
                          onUserTypeChange,
                          onSubmit,
                          submitting,
                          disabled = false,
                          fullWidth = false,
                      }: SubmitFooterProps) => {
    return (
        <div className={`submit-footer ${fullWidth ? 'submit-footer--full' : ''}`}>
            <div className="submit-footer__user-type">
                <span className="submit-footer__user-label">I'm an Antwerp :</span>
                <button
                    type="button"
                    className={`submit-footer__type-btn ${userType === 'local' ? 'is-active' : ''}`}
                    onClick={() => onUserTypeChange('local')}
                >
                    Local
                </button>
                <button
                    type="button"
                    className={`submit-footer__type-btn ${userType === 'tourist' ? 'is-active' : ''}`}
                    onClick={() => onUserTypeChange('tourist')}
                >
                    Tourist
                </button>
            </div>
            <button
                type="button"
                className={`submit-footer__submit ${fullWidth ? 'submit-footer__submit--full' : ''}`}
                onClick={onSubmit}
                disabled={disabled || submitting}
            >
                {submitting ? 'SUBMITTING...' : 'SUBMIT'}
            </button>
        </div>
    );
};

export default SubmitFooter;