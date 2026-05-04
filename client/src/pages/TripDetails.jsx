import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PlusCircle, Users, Receipt, PieChart, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const TripDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedExpenseId, setExpandedExpenseId] = useState(null);

  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const [tripRes, expRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/trips/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`http://localhost:5000/api/trips/${id}/expenses`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setTrip(tripRes.data.data);
        setExpenses(expRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`http://localhost:5000/api/trips/${id}/members`, 
        { name: newMemberName, email: newMemberEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTrip(res.data.data);
      setNewMemberName('');
      setNewMemberEmail('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTrip = async () => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/trips/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        navigate('/trips');
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.error || 'Failed to delete trip');
      }
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!trip) return <p>Trip not found</p>;

  const getPayerText = (exp) => {
    if (!exp.paidBy || exp.paidBy.length === 0) return 'Unknown';
    const names = exp.paidBy.map(p => {
      const payerIdStr = p.memberId ? p.memberId.toString() : '';
      const payer = trip.members.find(m => (m.userId || m._id).toString() === payerIdStr);
      return payer ? payer.name : 'Unknown';
    });
    return names.join(', ');
  };

  const getMemberName = (memberId) => {
    if (!trip) return 'Unknown';
    const mIdStr = memberId.toString();
    const member = trip.members.find(m => (m.userId || m._id).toString() === mIdStr);
    return member ? member.name : 'Unknown';
  };

  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  const displayedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  const handleDeleteExpense = async (expenseId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/expenses/${expenseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setExpenses(expenses.filter(exp => exp._id !== expenseId));
      } catch (err) {
        console.error(err);
        alert('Failed to delete expense');
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="gradient-text" style={{ marginBottom: '4px' }}>{trip.name}</h1>
          <p className="text-muted">📍 {trip.destination} | 💱 {trip.currency}</p>
        </div>
        <div className="flex gap-4">
          <Link to={`/trips/${id}/expenses/new`} className="btn btn-primary">
            <PlusCircle size={20} />
            Add Expense
          </Link>
          <Link to={`/trips/${id}/settlements`} className="btn btn-secondary">
            <PieChart size={20} />
            Settlements
          </Link>
          <button onClick={handleDeleteTrip} className="btn" style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
        <div className="glass-card">
          <h3 className="text-muted" style={{ fontWeight: 400, fontSize: '1rem' }}>Total Spent</h3>
          <h2 className="gradient-text">{trip.currency} {totalSpent.toFixed(2)}</h2>
        </div>
        <Link to={`/trips/${id}/expenses`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="glass-card" style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}>
            <h3 className="text-muted" style={{ fontWeight: 400, fontSize: '1rem' }}>Total Expenses</h3>
            <h2>{expenses.length}</h2>
          </div>
        </Link>
        <div className="glass-card">
          <h3 className="text-muted" style={{ fontWeight: 400, fontSize: '1rem' }}>Total Members</h3>
          <h2>{trip.members.length}</h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 style={{ margin: 0 }}>Recent Expenses</h2>
            {expenses.length > 5 && (
              <Link 
                to={`/trips/${id}/expenses`}
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
              >
                View All
              </Link>
            )}
          </div>
          {displayedExpenses.length === 0 ? (
            <p className="text-muted">No expenses yet. Start adding some!</p>
          ) : (
            <div className="flex-col gap-4">
              {displayedExpenses.map(exp => {
                const isExpanded = expandedExpenseId === exp._id;
                return (
                  <div 
                    key={exp._id} 
                    className="glass-card" 
                    style={{ padding: '20px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onClick={() => setExpandedExpenseId(isExpanded ? null : exp._id)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex gap-4 items-center">
                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px' }}>
                          <Receipt size={24} color="var(--accent)" />
                        </div>
                        <div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '4px', alignItems: 'center' }}>
                            <h4 style={{ margin: 0 }}>{exp.title}</h4>
                            {exp.tags && exp.tags.map((tag, idx) => (
                              <span key={idx} style={{ 
                                fontSize: '0.7rem', 
                                padding: '2px 8px', 
                                background: 'rgba(99, 102, 241, 0.2)', 
                                color: 'var(--primary)', 
                                borderRadius: '12px' 
                              }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                          <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                            {new Date(exp.date).toLocaleDateString()} • {exp.category} <br/>
                            <span style={{ color: 'var(--primary)', fontWeight: 500 }}>Paid by: {getPayerText(exp)}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <h3 style={{ margin: 0 }}>{trip.currency} {exp.amount.toFixed(2)}</h3>
                        <button 
                          onClick={(e) => handleDeleteExpense(exp._id, e)}
                          className="btn" 
                          style={{ padding: '6px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none' }}
                          title="Remove Expense"
                        >
                          <Trash2 size={18} />
                        </button>
                        {isExpanded ? <ChevronUp size={20} className="text-muted" /> : <ChevronDown size={20} className="text-muted" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div>
                            <p className="text-muted mb-1" style={{ fontSize: '0.8rem' }}>Location</p>
                            <p>{exp.location || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-muted mb-1" style={{ fontSize: '0.8rem' }}>Notes</p>
                            <p>{exp.notes || 'N/A'}</p>
                          </div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                          <div>
                            <p className="text-muted mb-2" style={{ fontSize: '0.8rem' }}>Paid By</p>
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                              {exp.paidBy && exp.paidBy.map((payer, idx) => (
                                <div key={idx} className="flex justify-between items-center mb-1 last:mb-0">
                                  <span>{getMemberName(payer.memberId)}</span>
                                  <span style={{ fontWeight: 500, color: 'var(--success)' }}>{trip.currency} {payer.amountPaid.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-muted mb-2" style={{ fontSize: '0.8rem' }}>Split Between</p>
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                              {exp.splitBetween && exp.splitBetween.map((split, idx) => (
                                <div key={idx} className="flex justify-between items-center mb-1 last:mb-0">
                                  <span>{getMemberName(split.memberId)}</span>
                                  <span style={{ fontWeight: 500, color: 'var(--danger)' }}>{trip.currency} {split.shareAmount.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="glass-panel mb-6">
            <h3 className="mb-4 flex items-center gap-2"><Users size={20} /> Members</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {trip.members.map((m, idx) => (
                <li key={idx} className="mb-2 pb-2" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  {m.name} <span className="text-muted" style={{ fontSize: '0.8rem' }}>{m.email}</span>
                </li>
              ))}
            </ul>

            <h4 className="mt-4 mb-2">Add Member</h4>
            <form onSubmit={handleAddMember}>
              <input 
                type="text" 
                placeholder="Name" 
                className="form-input mb-2" 
                value={newMemberName}
                onChange={e => setNewMemberName(e.target.value)}
                required
              />
              <input 
                type="email" 
                placeholder="Email (optional)" 
                className="form-input mb-4" 
                value={newMemberEmail}
                onChange={e => setNewMemberEmail(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary w-full" style={{ width: '100%' }}>Add</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripDetails;
