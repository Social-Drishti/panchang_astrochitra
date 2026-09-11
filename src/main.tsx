import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';
import { setGeminiApiKey, setDeepSeekApiKey, setExplabsApiKey } from './lib/astro/astroModelProvider';

const viteGeminiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (viteGeminiKey) setGeminiApiKey(viteGeminiKey);

const viteDeepSeekKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
if (viteDeepSeekKey) setDeepSeekApiKey(viteDeepSeekKey);

const viteExplabsKey = import.meta.env.VITE_EXPLABS_API_KEY;
if (viteExplabsKey) setExplabsApiKey(viteExplabsKey);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
