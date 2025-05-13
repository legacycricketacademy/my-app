import React from 'react';

// Super minimal React app with no dependencies at all
export default function MinimalReactApp() {
  return (
    <div style={{ 
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ 
        fontSize: '2rem',
        color: '#4a5568',
        marginBottom: '1rem'
      }}>
        Minimal Cricket Academy App
      </h1>
      <div style={{ 
        padding: '1rem', 
        background: '#ebf8ff',
        border: '1px solid #bee3f8',
        borderRadius: '5px',
        marginBottom: '1rem'
      }}>
        <p><strong>Status:</strong> React is rendering!</p>
        <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
      </div>
      <p style={{ lineHeight: 1.6 }}>
        This is an extremely simplified version of the Cricket Academy app with no dependencies whatsoever.
        If this page is visible, it confirms that React itself is functioning correctly.
      </p>
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        background: '#f0fff4',
        border: '1px solid #c6f6d5',
        borderRadius: '5px'
      }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          color: '#2f855a',
          marginTop: 0,
          marginBottom: '0.5rem'
        }}>Next Steps</h2>
        <p>
          With this working, we can begin to add back functionality one piece at a time to identify what's
          causing the rendering issues in the main application.
        </p>
      </div>
    </div>
  );
}