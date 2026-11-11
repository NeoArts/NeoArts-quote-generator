import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { probeCloud } from './lib/supabase';
import './index.css';

// Decide cloud vs. browser storage before anything reads it.
probeCloud().finally(() => ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
));
