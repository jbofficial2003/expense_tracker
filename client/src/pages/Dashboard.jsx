import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { PlusCircle, Wallet, Plane } from 'lucide-react';

const Dashboard = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/trips', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTrips(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  const activeTrips = trips.filter(t => t.status === 'Active');

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="gradient-text">Dashboard</h1>
        <div className="flex gap-4">
          <Link to="/trips/new" className="btn btn-primary">
            <PlusCircle size={20} />
            Create Trip
          </Link>
        </div>
      </div>

      <div className="flex gap-4 mb-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
        <Link to="/trips" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="glass-card">
            <div className="flex items-center gap-4">
              <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '12px', borderRadius: '12px' }}>
                <Plane size={24} color="var(--primary)" />
              </div>
              <div>
                <p className="text-muted">Total Trips</p>
                <h3>{trips.length}</h3>
              </div>
            </div>
          </div>
        </Link>

        <Link to="/trips" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="glass-card">
            <div className="flex items-center gap-4">
              <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '12px' }}>
                <Plane size={24} color="var(--success)" />
              </div>
              <div>
                <p className="text-muted">Active Trips</p>
                <h3>{activeTrips.length}</h3>
              </div>
            </div>
          </div>
        </Link>
        
        <Link to="/reports" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="glass-card">
            <div className="flex items-center gap-4">
              <div style={{ background: 'rgba(236, 72, 153, 0.2)', padding: '12px', borderRadius: '12px' }}>
                <Wallet size={24} color="var(--secondary)" />
              </div>
              <div>
                <p className="text-muted">Pending Balances</p>
                <h3>View Reports</h3>
              </div>
            </div>
          </div>
        </Link>
      </div>

      <h2 className="mb-4">Recent Trips</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {trips.slice(0, 4).map(trip => (
          <Link to={`/trips/${trip._id}`} key={trip._id} style={{ textDecoration: 'none' }}>
            <div className="glass-card">
              <div className="flex justify-between items-center mb-4">
                <h4>{trip.name}</h4>
                <span style={{ fontSize: '0.8rem', padding: '4px 8px', background: trip.status === 'Active' ? 'var(--success)' : 'var(--text-muted)', borderRadius: '12px', color: 'white' }}>
                  {trip.status}
                </span>
              </div>
              <p className="text-muted mb-2">📍 {trip.destination}</p>
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>Members: {trip.members.length}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
