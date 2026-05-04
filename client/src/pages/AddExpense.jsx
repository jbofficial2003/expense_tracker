import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const AddExpense = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState('');
  const [payerType, setPayerType] = useState('single');
  const [payerId, setPayerId] = useState('');
  const [multiplePayers, setMultiplePayers] = useState({});
  const [splitType, setSplitType] = useState('equal'); // equal or custom
  const [customShares, setCustomShares] = useState({});

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/trips/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTrip(res.data.data);
        if (res.data.data.members.length > 0) {
          setPayerId(res.data.data.members[0].userId || res.data.data.members[0]._id);
          const initShares = {};
          const initPayers = {};
          res.data.data.members.forEach(m => {
            initShares[m.userId || m._id] = '';
            initPayers[m.userId || m._id] = '';
          });
          setCustomShares(initShares);
          setMultiplePayers(initPayers);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const totalAmt = parseFloat(amount);
    let paidBy = [];
    if (payerType === 'single') {
      paidBy = [{ memberId: payerId, amountPaid: totalAmt }];
    } else {
      let payerTotal = 0;
      paidBy = Object.entries(multiplePayers).map(([memberId, amt]) => {
        const amountPaid = parseFloat(amt) || 0;
        payerTotal += amountPaid;
        return { memberId, amountPaid };
      }).filter(p => p.amountPaid > 0);

      if (Math.abs(payerTotal - totalAmt) > 0.01) {
        alert(`Multiple payers total (${payerTotal.toFixed(2)}) must equal the expense amount (${totalAmt.toFixed(2)})`);
        return;
      }
    }

    // Split Logic
    let splitBetween = [];
    if (splitType === 'equal') {
      const share = totalAmt / trip.members.length;
      splitBetween = trip.members.map(m => ({
        memberId: m.userId || m._id,
        shareAmount: share
      }));
    } else {
      let customTotal = 0;
      splitBetween = Object.entries(customShares).map(([memberId, shareAmount]) => {
        const share = parseFloat(shareAmount) || 0;
        customTotal += share;
        return { memberId, shareAmount: share };
      }).filter(s => s.shareAmount > 0);

      if (Math.abs(customTotal - totalAmt) > 0.01) {
        alert(`Custom split total (${customTotal.toFixed(2)}) must exactly equal the expense amount (${totalAmt.toFixed(2)})`);
        return;
      }
    }

    try {
      await axios.post(`http://localhost:5000/api/trips/${id}/expenses`, {
        title,
        amount: totalAmt,
        category,
        location,
        tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
        paidBy,
        splitBetween
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate(`/trips/${id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to add expense');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="flex items-center gap-4 mb-6">
        <Link to={`/trips/${id}`} className="btn btn-secondary flex items-center gap-2" style={{ padding: '8px 12px' }}>
          <ArrowLeft size={20} />
        </Link>
        <h1 className="gradient-text" style={{ margin: 0 }}>Add Expense</h1>
      </div>

      <div className="glass-panel">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Expense Title</label>
            <input type="text" className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Amount</label>
              <input type="number" step="0.01" className="form-input" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Food">Food 🍔</option>
                <option value="Hotel">Hotel 🏨</option>
                <option value="Fuel">Fuel ⛽</option>
                <option value="Shopping">Shopping 🛍️</option>
                <option value="Tickets">Tickets 🎫</option>
                <option value="Other">Other 📦</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tags (Comma separated)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. breakfast, airport"
              value={tags}
              onChange={e => setTags(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Location (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Times Square, JFK Airport"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Who Paid?</label>
            <div className="flex gap-4 mb-2">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="radio" checked={payerType === 'single'} onChange={() => setPayerType('single')} /> Single Person
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="radio" checked={payerType === 'multiple'} onChange={() => setPayerType('multiple')} /> Multiple People
              </label>
            </div>

            {payerType === 'single' ? (
              <select className="form-input" value={payerId} onChange={(e) => setPayerId(e.target.value)}>
                {trip.members.map(m => (
                  <option key={m._id} value={m.userId || m._id}>{m.name}</option>
                ))}
              </select>
            ) : (
              <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)', padding: '16px' }}>
                <h4 className="mb-4 text-muted" style={{ fontSize: '0.95rem' }}>Specify Payment Amounts</h4>
                {trip.members.map(m => {
                  const mid = m.userId || m._id;
                  return (
                    <div key={mid} className="flex justify-between items-center mb-2">
                      <span>{m.name}</span>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        style={{ width: '120px', padding: '8px' }}
                        value={multiplePayers[mid] || ''}
                        onChange={(e) => setMultiplePayers({ ...multiplePayers, [mid]: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="form-group mb-6">
            <label className="form-label">Split Type</label>
            <select className="form-input" value={splitType} onChange={(e) => setSplitType(e.target.value)}>
              <option value="equal">Split Equally</option>
              <option value="custom">Custom Split</option>
            </select>
          </div>

          {splitType === 'custom' && (
            <div className="glass-panel mb-6" style={{ background: 'rgba(255,255,255,0.02)', padding: '16px' }}>
              <h4 className="mb-4 text-muted" style={{ fontSize: '0.95rem' }}>Specify Custom Amounts</h4>
              {trip.members.map(m => {
                const mid = m.userId || m._id;
                return (
                  <div key={mid} className="flex justify-between items-center mb-2">
                    <span>{m.name}</span>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      style={{ width: '120px', padding: '8px' }}
                      value={customShares[mid] || ''}
                      onChange={(e) => setCustomShares({ ...customShares, [mid]: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                );
              })}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Expense</button>
        </form>
      </div>
    </div>
  );
};

export default AddExpense;
