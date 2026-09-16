import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initApiInterceptor } from './lib/apiInterceptor.ts';
import { LanguageThemeProvider } from './lib/i18n.tsx';

// Déclencher l'intercepteur API en arrière-plan sans bloquer le rendu du DOM
try {
  initApiInterceptor().catch((err) => {
    console.warn("API interceptor warning:", err);
  });
} catch (e) {
  console.warn("API interceptor initialisation error:", e);
}

const rootEl = document.getElementById('root');
if (rootEl) {
  try {
    createRoot(rootEl).render(
      <StrictMode>
        <LanguageThemeProvider>
          <App />
        </LanguageThemeProvider>
      </StrictMode>,
    );
  } catch (renderError) {
    console.error("Critical rendering error:", renderError);
  }
}

