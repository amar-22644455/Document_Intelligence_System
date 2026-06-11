import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
// createRoot passed the control of root in index.html to React,
// which will manage the rendering of our App component and any updates to the UI.
// The StrictMode wrapper is a development tool that helps identify potential problems in our application by activating additional checks and warnings.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
