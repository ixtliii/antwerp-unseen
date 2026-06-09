import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LanguageProvider } from './context/LanguageContext';
import App from './App.tsx';
import './styles/reset.css';
import './styles/tokens.css';

const allowed = ['/', '/submit'];
if (!allowed.includes(window.location.pathname)) {
    window.history.replaceState(null, '', '/');
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <LanguageProvider>
            <App />
        </LanguageProvider>
    </StrictMode>
);