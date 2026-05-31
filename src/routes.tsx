import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./routes/home";
import Explore from "./routes/explore";
import Installation from "./routes/installation.tsx";

const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/installation" element={<Installation />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;