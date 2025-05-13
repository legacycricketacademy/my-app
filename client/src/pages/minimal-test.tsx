import React from "react";

// This component doesn't use any hooks or providers
export default function MinimalTest() {
  // Plain React component with no hooks
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      minHeight: '100vh',
      background: '#f0f0f0'
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <h1 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#333'
        }}>
          Minimal Test Page
        </h1>
        <p style={{ marginBottom: '1rem', color: '#555' }}>
          This is a minimal test page with no hooks or providers.
        </p>
        <div style={{ 
          background: '#e6f7ff', 
          padding: '1rem', 
          borderRadius: '0.25rem',
          border: '1px solid #91caff'
        }}>
          <p style={{ color: '#0958d9' }}>
            If you can see this page, React is working but there might be an issue with the AuthProvider.
          </p>
        </div>
      </div>
    </div>
  );
}