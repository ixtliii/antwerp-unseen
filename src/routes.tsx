import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./routes/home";
import Explore from "./routes/explore";

const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/explore" element={<Explore />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;