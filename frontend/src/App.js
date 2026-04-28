import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import CreateListing from './pages/CreateListing';
import ListingsPage from './pages/ListingsPage';
import History from './pages/History';
import DatabaseView from './pages/DatabaseView';
import About from './pages/About';

function App() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isLogin = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-inter">
      {!isLanding && !isLogin && <Navbar />}

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/create" element={<ProtectedRoute allowedRoles={['farmer']}><CreateListing /></ProtectedRoute>} />
        <Route path="/listings" element={<ProtectedRoute><ListingsPage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/database" element={<DatabaseView />} />
        <Route path="/about" element={<About />} />
      </Routes>

      {!isLogin && !isLanding && <Footer />}

      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop closeOnClick draggable pauseOnHover
        theme="colored"
        toastStyle={{ borderRadius: '12px', fontWeight: 600 }}
      />
    </div>
  );
}

export default App;
