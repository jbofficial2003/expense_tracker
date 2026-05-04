import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { Receipt, ChevronDown, ChevronUp, ArrowLeft, Trash2 } from 'lucide-react';

const AllExpenses = () => {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedExpenseId, setExpandedExpenseId] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const [tripRes, expRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/trips/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`http://localhost:5000/api/trips/${id}/expenses`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setTrip(tripRes.data.data);

        // Sort by date descending
        const sortedExpenses = expRes.data.data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setExpenses(sortedExpenses);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const handleDeleteExpense = async (expenseId, e) => {
    e.stopPropagation(); // Prevent expanding the card when clicking delete
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

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to={`/trips/${id}`} className="btn btn-secondary flex items-center gap-2" style={{ padding: '8px 12px' }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="gradient-text" style={{ margin: 0 }}>All Expenses</h1>
          <p className="text-muted" style={{ margin: 0 }}>{trip.name}</p>
        </div>
      </div>

      {expenses.length === 0 ? (
        <p className="text-muted">No expenses found.</p>
      ) : (
        <div className="flex-col gap-4">
          {expenses.map(exp => {
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
                        {new Date(exp.date).toLocaleDateString()} • {exp.category} <br />
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
  );
};

export default AllExpenses;
