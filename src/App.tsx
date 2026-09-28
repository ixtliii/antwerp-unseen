import { useState, createContext } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes.tsx';
import AmbientSound from './components/molecules/AmbientSound/AmbientSound';
import CustomCursor from './components/molecules/CustomCursor/CustomCursor.tsx';
import PixelTransition from './components/globals/PixelTransition/PixelTransition';
import DitherLoader from './components/molecules/DitherLoader/DitherLoader';

export const LoadingContext = createContext(true);

const App = () => {
    const [loading, setLoading] = useState(true);
    const [showLoader, setShowLoader] = useState(true);

    return (
        <BrowserRouter>
            <LoadingContext.Provider value={loading}>
                {showLoader && (
                    <DitherLoader
                        onComplete={() => {
                            setLoading(false);
                            setTimeout(() => setShowLoader(false), 1300);
                        }}
                    />
                )}
                <CustomCursor />
                <PixelTransition />
                <AmbientSound />
                <AppRoutes />
            </LoadingContext.Provider>
        </BrowserRouter>
    );
};

export default App;