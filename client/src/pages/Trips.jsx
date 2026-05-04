import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';

const Trips = () => {
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

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="gradient-text">All Trips</h1>
        <Link to="/trips/new" className="btn btn-primary">
          <PlusCircle size={20} />
          Create Trip
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {trips.map(trip => (
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

export default Trips;
