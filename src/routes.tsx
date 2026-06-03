import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home         from './routes/home';
import Explore      from './routes/explore';
import Installation from './routes/installation';
import Submit       from './routes/submit';

const AppRoutes = () => (
    <BrowserRouter>
        <Routes>
            <Route path="/"            element={<Home />} />
            <Route path="/explore"     element={<Explore />} />
            <Route path="/installation" element={<Installation />} />
            <Route path="/submit"      element={<Submit />} />
        </Routes>
    </BrowserRouter>
);

export default AppRoutes;