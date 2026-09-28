import './mockDataNotice.css';

interface MockDataNoticeProps {
    className?: string;
}

const MockDataNotice = ({ className = '' }: MockDataNoticeProps) => (
    <div className={`mock-data-notice ${className}`.trim()} role="status">
        <span className="mock-data-notice__dot" aria-hidden />
        <span className="mock-data-notice__text">
            No database connection &mdash; simulated data, shown to illustrate the visuals
        </span>
    </div>
);

export default MockDataNotice;
