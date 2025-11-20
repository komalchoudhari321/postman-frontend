import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
// You might need a custom CSS file for Postman-like colors
import './styles.css'; 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Add this to your main CSS file (e.g., src/styles.css)
// This sets the base colors similar to Postman's dark mode
/*
body {
    background-color: #202020 !important;
    color: #f0f0f0 !important;
}
.navbar-dark {
    background-color: #2d2d2d !important;
}
.sidebar-item:hover {
    background-color: #353535 !important;
}
*/