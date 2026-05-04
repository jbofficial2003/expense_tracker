import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateTrip = () => {
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/trips', 
        { name, destination, currency },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate('/trips');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create trip');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 className="gradient-text mb-6">Create New Trip</h1>
      
      <div className="glass-panel">
        {error && <div className="text-danger mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Trip Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Destination</label>
            <input 
              type="text" 
              className="form-input" 
              value={destination} 
              onChange={(e) => setDestination(e.target.value)} 
            />
          </div>
          <div className="form-group mb-6">
            <label className="form-label">Currency</label>
            <select 
              className="form-input" 
              value={currency} 
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="INR">INR (₹)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Trip</button>
        </form>
      </div>
    </div>
  );
};

export default CreateTrip;
