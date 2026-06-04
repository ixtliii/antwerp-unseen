import { Routes, Route } from 'react-router-dom';
import Home from './routes/home';
import Explore from './routes/explore';
import Installation from './routes/installation';
import Submit from './routes/submit';
import Artists from "./routes/artists.tsx";

const AppRoutes = () => (
    <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/installation" element={<Installation />} />
        <Route path="/submit" element={<Submit />} />
        <Route path="/artists" element={<Artists />} />
    </Routes>
);

export default AppRoutes;