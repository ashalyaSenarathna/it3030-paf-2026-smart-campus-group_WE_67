import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ResourceCatalogue from './pages/facility-management/ResourceCatalogue';
import AdminDashboard from './pages/facility-management/AdminDashboard';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/facility-management/resource-catalogue" element={<ResourceCatalogue />} />
      <Route path="/facility-management/admin" element={<AdminDashboard />} />
    </Routes>
  );
}

export default App;
