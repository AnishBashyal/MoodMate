import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import SignupPage from './pages/SignupPage';

function App() {
  return (
    <div className="min-h-screen font-sans bg-gray-50">
      <nav className="bg-white shadow px-6 py-4 flex justify-between">
        <h1 className="text-xl font-bold text-pink-600">Moodmate</h1>
        <div className="space-x-4">
          <Link to="/" className="text-gray-700 hover:text-pink-500">Home</Link>
          <Link to="/login" className="text-gray-700 hover:text-pink-500">Login</Link>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path='/signup' element={<SignupPage/>}/>
      </Routes>
    </div>
  );
}

export default App;
