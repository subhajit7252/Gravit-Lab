// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import UniversalGravitation from './experiments/UniversalGravitation';

function App() {
  return (
    <Router>
      <div style={{ padding: 20 }}>
        <h1>🌌 GravitéLab</h1>
        <nav style={{ marginBottom: 20 }}>
          <Link to="/">Universal Gravitation</Link>
        </nav>

        <Routes>
          <Route path="/" element={<UniversalGravitation />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
