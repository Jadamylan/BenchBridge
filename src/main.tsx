import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './app/App';
import { DemoStateProvider } from './state/DemoState';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <DemoStateProvider>
        <App />
      </DemoStateProvider>
    </BrowserRouter>
  </StrictMode>,
);
