import { Routes, Route } from 'react-router-dom';
import Home from './routes/home';
import Explore from './routes/explore';
import Installation from './routes/installation';
import Submit from './routes/submit';
import Artists from "./routes/artists.tsx";
import Constellation from "./routes/constellation.tsx";
import MapPage from "./routes/map.tsx";
import ContactPage from "./routes/contact.tsx";

const AppRoutes = () => (
    <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/constellation" element={<Constellation />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/installation" element={<Installation />} />
        <Route path="/submit" element={<Submit />} />
        <Route path="/artists" element={<Artists />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/contact" element={<ContactPage />} />
    </Routes>
);

export default AppRoutes;