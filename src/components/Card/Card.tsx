import './card.css';

interface CardProps {
    url: string;
    index: number;
}

const Card = ({ url, index }: CardProps) => {
    return (
        <div
            className="card"
            style={{
                transform: `translateX(${index * 10}px)`
            }}
        >
            <img src={url} alt="" />
        </div>
    );
};

export default Card;