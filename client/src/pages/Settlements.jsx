import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';

const Settlements = () => {
  const { id } = useParams();
  const [balances, setBalances] = useState([]);
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettlements = async () => {
      try {
        const token = localStorage.getItem('token');
        const [tripRes, balRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/trips/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`http://localhost:5000/api/reports/trip/${id}/balances`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setTrip(tripRes.data.data);
        setBalances(balRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettlements();
  }, [id]);

  if (loading) return <p>Loading...</p>;

  // Map member IDs to names
  const getMemberName = (id) => {
    const member = trip.members.find(m => m.userId === id || m._id === id);
    return member ? member.name : 'Unknown Member';
  };

  // Simple Greedy Settlement Algorithm
  const calculateSettlements = () => {
    const debtors = [];
    const creditors = [];

    balances.forEach(b => {
      if (b.balance < -0.01) debtors.push({ id: b.memberId, amount: -b.balance });
      else if (b.balance > 0.01) creditors.push({ id: b.memberId, amount: b.balance });
    });

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    let d = 0, c = 0;
    const transactions = [];

    while (d < debtors.length && c < creditors.length) {
      const settleAmount = Math.min(debtors[d].amount, creditors[c].amount);
      
      transactions.push({
        from: debtors[d].id,
        to: creditors[c].id,
        amount: settleAmount
      });

      debtors[d].amount -= settleAmount;
      creditors[c].amount -= settleAmount;

      if (debtors[d].amount < 0.01) d++;
      if (creditors[c].amount < 0.01) c++;
    }

    return transactions;
  };

  const transactions = calculateSettlements();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="flex items-center gap-4 mb-6">
        <Link to={`/trips/${id}`} className="btn btn-secondary" style={{ padding: '8px' }}>
          <ArrowLeft size={20} />
        </Link>
        <h1 className="gradient-text" style={{ margin: 0 }}>Settlements</h1>
      </div>

      <div className="glass-panel mb-6">
        <h2 className="mb-4">Member Balances</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: '12px' }}>Member</th>
                <th style={{ padding: '12px' }}>Total Paid</th>
                <th style={{ padding: '12px' }}>Total Share</th>
                <th style={{ padding: '12px' }}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {balances.map(b => (
                <tr key={b.memberId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px' }}>{getMemberName(b.memberId)}</td>
                  <td style={{ padding: '12px' }} className="text-success">{trip.currency} {b.totalPaid.toFixed(2)}</td>
                  <td style={{ padding: '12px' }} className="text-danger">{trip.currency} {b.totalShare.toFixed(2)}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }} className={b.balance >= 0 ? 'text-success' : 'text-danger'}>
                    {b.balance >= 0 ? '+' : ''}{trip.currency} {b.balance.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h2 className="mb-4 text-center">How to settle debts</h2>
      {transactions.length === 0 ? (
        <div className="glass-panel text-center" style={{ padding: '40px' }}>
          <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto 16px' }} />
          <h3>All settled up!</h3>
          <p className="text-muted">No one owes anything.</p>
        </div>
      ) : (
        <div className="flex-col gap-4">
          {transactions.map((t, idx) => (
            <div key={idx} className="glass-card flex justify-between items-center" style={{ padding: '24px' }}>
              <div className="flex items-center gap-4">
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {getMemberName(t.from).charAt(0)}
                </div>
                <h4 style={{ margin: 0 }}>{getMemberName(t.from)}</h4>
              </div>
              
              <div className="flex-col items-center flex-1" style={{ padding: '0 20px' }}>
                <p style={{ margin: 0, fontWeight: 'bold' }} className="gradient-text">Pays {trip.currency} {t.amount.toFixed(2)}</p>
                <div style={{ height: '2px', background: 'linear-gradient(to right, transparent, var(--glass-border), transparent)', width: '100%', margin: '8px 0' }}></div>
              </div>

              <div className="flex items-center gap-4">
                <h4 style={{ margin: 0 }}>{getMemberName(t.to)}</h4>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {getMemberName(t.to).charAt(0)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Settlements;
