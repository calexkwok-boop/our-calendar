import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

if (process.env.NODE_ENV !== 'production') {
  const devStamp = 'DEV-STAMP-2026-03-31-our-calendar';
  window.__OUR_CALENDAR_DEV_STAMP__ = devStamp;
  document.title = `${document.title ? `${document.title} ` : ''}${devStamp}`;
  console.log(devStamp);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render( 
    <App />
 
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

if ('serviceWorker' in navigator) {
  (async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      if (process.env.NODE_ENV !== 'production') {
        await Promise.all(regs.map((reg) => reg.unregister()));
        return;
      }
      await Promise.all(
        regs
          .filter((reg) => !reg.active?.scriptURL?.includes('/firebase-messaging-sw.js'))
          .map((reg) => reg.unregister())
      );
      await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    } catch (err) {
      console.error('Service worker registration failed:', err);
    }
  })();
}
