import { useNavigate } from "react-router-dom";

const Home = () => {
    const navigate = useNavigate();
    return (
        <div className="home">
            <h1>every : second</h1>
            <button onClick={() => navigate("/explore")}>explore</button>
            <button onClick={() => navigate("/installation")}>explore</button>
        </div>
    );
};

export default Home;