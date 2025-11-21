import React from 'react';
import ReactDOM from 'react-dom/client';
import { TimerPopup } from './components/TimerPopup';
import './index.css';

ReactDOM.createRoot(document.getElementById('timer-popup-root')!).render(
  <React.StrictMode>
    <TimerPopup />
  </React.StrictMode>
);
