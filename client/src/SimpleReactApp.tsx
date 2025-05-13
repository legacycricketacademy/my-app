import React from 'react';

// Simple React app with minimal dependencies
export default function SimpleReactApp() {
  return (
    <div style={{ 
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ color: '#4a5568' }}>
        Simple React Test App
      </h1>
      <div style={{ 
        padding: '1rem', 
        background: '#ebf8ff',
        borderRadius: '5px',
        marginBottom: '1rem'
      }}>
        <p><strong>Status:</strong> React is working!</p>
        <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
      </div>
      <p>
        This is a minimal React application without any complex dependencies.
        If you can see this, it means React is rendering correctly.
      </p>
    </div>
  );
}