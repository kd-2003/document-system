import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();

  return (
    <header style={{
      backgroundColor: '#2c3e50',
      color: 'white',
      padding: '1rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>
          Document Processing System
        </h1>
        <nav>
          <Link
            to="/"
            style={{
              color: 'white',
              textDecoration: 'none',
              marginRight: '20px',
              padding: '8px 16px',
              borderRadius: '4px',
              backgroundColor: location.pathname === '/' ? '#34495e' : 'transparent'
            }}
          >
            Upload
          </Link>
          <Link
            to="/dashboard"
            style={{
              color: 'white',
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              backgroundColor: location.pathname === '/dashboard' ? '#34495e' : 'transparent'
            }}
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;