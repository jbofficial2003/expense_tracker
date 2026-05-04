import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, Plane, Receipt, PieChart, LogOut } from 'lucide-react';

const Sidebar = () => {
  const { logout, user } = useContext(AuthContext);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Trips', path: '/trips', icon: <Plane size={20} /> },
    { name: 'Reports', path: '/reports', icon: <PieChart size={20} /> },
  ];

  return (
    <div className="sidebar">
      <div className="mb-6">
        <h2 className="gradient-text">Expense Tracker</h2>
        <p className="text-muted" style={{ fontSize: '0.9rem' }}>Welcome, {user?.name}</p>
      </div>

      <nav className="flex-col gap-2" style={{ flex: 1 }}>
        {navItems.map(item => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => 
              `btn ${isActive ? 'btn-primary' : 'btn-secondary'} w-full justify-start`
            }
            style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '8px' }}
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>

      <button onClick={logout} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger)' }}>
        <LogOut size={20} />
        Logout
      </button>
    </div>
  );
};

export default Sidebar;
