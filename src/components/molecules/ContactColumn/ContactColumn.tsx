import './contactColumn.css';

interface ContactRow { icon: string; value: string; href?: string; }
interface ContactColumnProps { title: string; rows: ContactRow[]; className?: string; }

const ContactColumn = ({ title, rows, className }: ContactColumnProps) => (
    <div className={`contact-column ${className ?? ''}`}>
        <h2 className="contact-column__title">{title}</h2>
        {rows.map((r) => (
            <div className="contact-column__row" key={r.value}>
                <span className="contact-column__icon">{r.icon}</span>
                {r.href
                    ? <a className="contact-column__value" href={r.href}>{r.value}</a>
                    : <span className="contact-column__value">{r.value}</span>}
            </div>
        ))}
    </div>
);

export default ContactColumn;