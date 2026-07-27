import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initApiInterceptor } from './lib/apiInterceptor.ts';
import { LanguageThemeProvider } from './lib/i18n.tsx';

// Initialiser l'intercepteur API pour activer le fallback client-side (Netlify, etc.)
initApiInterceptor().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <LanguageThemeProvider>
        <App />
      </LanguageThemeProvider>
    </StrictMode>,
  );
});
