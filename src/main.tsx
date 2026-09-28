import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LanguageProvider } from './context/LanguageContext';
import App from './App.tsx';
import './styles/reset.css';
import './styles/tokens.css';
import './styles/fonts.css'

const allowed = ['/', '/submit', '/installation'];
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