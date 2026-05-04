import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Sidebar from './components/Sidebar';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Trips from './pages/Trips';
import CreateTrip from './pages/CreateTrip';
import TripDetails from './pages/TripDetails';
import AddExpense from './pages/AddExpense';
import Settlements from './pages/Settlements';
import Reports from './pages/Reports';

const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user ? (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  ) : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { user } = useContext(AuthContext);
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/trips" element={<PrivateRoute><Trips /></PrivateRoute>} />
      <Route path="/trips/new" element={<PrivateRoute><CreateTrip /></PrivateRoute>} />
      <Route path="/trips/:id" element={<PrivateRoute><TripDetails /></PrivateRoute>} />
      <Route path="/trips/:id/expenses/new" element={<PrivateRoute><AddExpense /></PrivateRoute>} />
      <Route path="/trips/:id/settlements" element={<PrivateRoute><Settlements /></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
      {/* Add more routes later */}
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
