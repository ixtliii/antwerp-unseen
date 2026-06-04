import { BrowserRouter } from 'react-router-dom';
import AppRoutes from "./routes.tsx";
import AmbientSound from './components/molecules/AmbientSound/AmbientSound';
import PageTransition from './components/molecules/PageTransition/PageTransition';
import CustomCursor from "./components/molecules/CustomCursor/CustomCursor.tsx";

const App = () => {
    return (
        <BrowserRouter>
            <CustomCursor />
            <PageTransition />
            <AmbientSound />
            <AppRoutes />
        </BrowserRouter>
    );
};

export default App;