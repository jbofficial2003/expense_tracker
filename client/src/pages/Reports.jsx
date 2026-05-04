import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const Reports = () => {
  const [trips, setTrips] = useState([]);
  const [allCategoryData, setAllCategoryData] = useState([]);
  const [myPayments, setMyPayments] = useState([]);
  const [globalFilterId, setGlobalFilterId] = useState('global');
  const [selectedTripId, setSelectedTripId] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [tripExpenses, setTripExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444'];

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const token = localStorage.getItem('token');
        const resTrips = await axios.get('http://localhost:5000/api/trips', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const paymentsRes = await axios.get('http://localhost:5000/api/reports/my-payments', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const allTrips = resTrips.data.data;
        setTrips(allTrips);
        setMyPayments(paymentsRes.data.data);
        if (allTrips.length > 0) {
          setSelectedTripId(allTrips[0]._id);
        }

        // Fetch category summaries for all trips
        const promises = allTrips.map(t => 
          axios.get(`http://localhost:5000/api/reports/trip/${t._id}/categories`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        );
        
        const results = await Promise.all(promises);
        
        const perTripCategoryData = results.map((res, i) => ({
          tripId: allTrips[i]._id,
          data: res.data.data
        }));
        setAllCategoryData(perTripCategoryData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  useEffect(() => {
    const fetchTripExpenses = async () => {
      if (!selectedTripId) return;
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/trips/${selectedTripId}/expenses`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTripExpenses(res.data.data);
        const currentTrip = trips.find(t => t._id === selectedTripId);
        if (currentTrip && currentTrip.members.length > 0) {
          const firstMemberId = currentTrip.members[0].userId || currentTrip.members[0]._id;
          setSelectedMemberId(firstMemberId.toString());
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchTripExpenses();
  }, [selectedTripId, trips]);

  const displayCategoryData = useMemo(() => {
    let rawDataToProcess = [];
    if (globalFilterId === 'global') {
      allCategoryData.forEach(tripCat => {
        rawDataToProcess = [...rawDataToProcess, ...tripCat.data];
      });
    } else {
      const specificTrip = allCategoryData.find(t => t.tripId === globalFilterId);
      if (specificTrip) {
        rawDataToProcess = specificTrip.data;
      }
    }

    const aggMap = {};
    rawDataToProcess.forEach(item => {
      if (!aggMap[item._id]) aggMap[item._id] = 0;
      aggMap[item._id] += item.totalAmount;
    });

    return Object.keys(aggMap).map(key => ({
      name: key,
      value: aggMap[key]
    }));
  }, [globalFilterId, allCategoryData]);

  const displayPayments = useMemo(() => {
    if (globalFilterId === 'global') return myPayments;
    return myPayments.filter(p => p.tripId && p.tripId.toString() === globalFilterId);
  }, [globalFilterId, myPayments]);

  if (loading) return <p>Loading...</p>;

  const getPayerName = (exp, trip) => {
    if (!trip) return 'Unknown';
    if (!exp.paidBy || exp.paidBy.length === 0) return 'Unknown';
    const names = exp.paidBy.map(p => {
      const payerIdStr = p.memberId ? p.memberId.toString() : '';
      const payer = trip.members.find(m => (m.userId || m._id).toString() === payerIdStr);
      return payer ? payer.name : 'Unknown';
    });
    return names.join(', ');
  };

  const selectedTripObj = trips.find(t => t._id === selectedTripId);

  const filteredMemberExpenses = tripExpenses.filter(exp => 
    exp.paidBy && exp.paidBy.some(p => p.memberId && p.memberId.toString() === selectedMemberId)
  );

  const currentTripsCount = globalFilterId === 'global' ? trips.length : 1;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="gradient-text" style={{ margin: 0 }}>Reports & Analytics</h1>
        <select 
          className="form-input" 
          style={{ width: '250px', margin: 0 }}
          value={globalFilterId}
          onChange={(e) => setGlobalFilterId(e.target.value)}
        >
          <option value="global">Global (All Trips)</option>
          {trips.map(t => (
            <option key={t._id} value={t._id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div className="glass-panel">
          <h2 className="mb-4">Spending by Category</h2>
          {displayCategoryData.length === 0 ? (
            <p className="text-muted">No spending data available.</p>
          ) : (
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displayCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {displayCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '8px', color: 'white' }} 
                    itemStyle={{ color: 'white' }} 
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="glass-panel">
          <h2 className="mb-4">Trip Summary</h2>
          <div className="flex-col gap-4">
            <div className="flex justify-between items-center pb-2" style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <span className="text-muted">Selected Trips</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{currentTripsCount}</span>
            </div>
            <div className="flex justify-between items-center pb-2" style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <span className="text-muted">Total Spending</span>
              <span className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {displayCategoryData.reduce((acc, curr) => acc + curr.value, 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2" style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <span className="text-muted">Most Expensive Category</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                {displayCategoryData.length > 0 ? displayCategoryData.sort((a,b) => b.value - a.value)[0].name : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel mt-6" style={{ marginTop: '24px' }}>
        <h2 className="mb-4">My Payment History</h2>
        {displayPayments.length === 0 ? (
          <p className="text-muted">No payments recorded yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Date</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Trip</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Title</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Category</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Amount Paid</th>
                </tr>
              </thead>
              <tbody>
                {displayPayments.map(p => (
                  <tr key={p._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 8px' }}>{new Date(p.date).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <div>{p.tripName}</div>
                      <div className="text-muted" style={{ fontSize: '0.8rem' }}>{p.destination}</div>
                    </td>
                    <td style={{ padding: '12px 8px' }}>{p.title}</td>
                    <td style={{ padding: '12px 8px' }}>{p.category}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{p.currency} {p.amountPaid.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="glass-panel mt-6" style={{ marginTop: '24px' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 style={{ margin: 0 }}>Trip Payments By Member</h2>
          <select 
            className="form-input" 
            style={{ width: '300px', margin: 0 }}
            value={selectedTripId}
            onChange={(e) => setSelectedTripId(e.target.value)}
          >
            {trips.map(t => (
              <option key={t._id} value={t._id}>{t.name} ({t.destination})</option>
            ))}
          </select>
        </div>

        {selectedTripObj && (
          <div className="flex gap-2 mb-4" style={{ overflowX: 'auto', paddingBottom: '8px' }}>
            {selectedTripObj.members.map(m => {
              const mId = (m.userId || m._id).toString();
              const isSelected = selectedMemberId === mId;
              return (
                <button
                  key={mId}
                  className={`btn ${isSelected ? 'btn-primary' : ''}`}
                  style={{ 
                    background: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                    border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.1)'
                  }}
                  onClick={() => setSelectedMemberId(mId)}
                >
                  {m.name}
                </button>
              );
            })}
          </div>
        )}

        {filteredMemberExpenses.length === 0 ? (
          <p className="text-muted">No expenses recorded for this user.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Date</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Payer Name(s)</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Title</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Category</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Amount Paid By User</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Total Bill</th>
                </tr>
              </thead>
              <tbody>
                {filteredMemberExpenses.map(exp => {
                  const userPayment = exp.paidBy.find(p => p.memberId.toString() === selectedMemberId);
                  const amountUserPaid = userPayment ? userPayment.amountPaid : 0;

                  return (
                    <tr key={exp._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px 8px' }}>{new Date(exp.date).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 8px', fontWeight: 'bold', color: 'var(--primary)' }}>
                        {getPayerName(exp, selectedTripObj)}
                      </td>
                      <td style={{ padding: '12px 8px' }}>{exp.title}</td>
                      <td style={{ padding: '12px 8px' }}>{exp.category}</td>
                      <td style={{ padding: '12px 8px', fontWeight: 'bold', color: 'var(--success)' }}>
                        {selectedTripObj?.currency} {amountUserPaid.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>
                        {selectedTripObj?.currency} {exp.amount.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
