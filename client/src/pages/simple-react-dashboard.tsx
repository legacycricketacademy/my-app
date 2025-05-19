import React, { useEffect } from 'react';

function SimpleParentDashboard() {
  // Log when component mounts to verify it's being rendered
  useEffect(() => {
    console.log("✅ Simple Parent Dashboard mounted successfully");
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#333' }}>
        Parent Dashboard
      </h1>
      
      <p style={{ fontSize: '1rem', marginBottom: '2rem', color: '#666' }}>
        Welcome to your cricket academy parent dashboard. Here you can track your child's progress.
      </p>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '1.5rem', 
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Upcoming Sessions</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4285F4' }}>3</p>
          <p style={{ fontSize: '0.875rem', color: '#666' }}>Next 7 days</p>
        </div>
        
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '1.5rem', 
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Completed Sessions</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#34A853' }}>12</p>
          <p style={{ fontSize: '0.875rem', color: '#666' }}>This month</p>
        </div>
        
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '1.5rem', 
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Performance</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FBBC05' }}>85%</p>
          <p style={{ fontSize: '0.875rem', color: '#666' }}>Overall rating</p>
        </div>
        
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '1.5rem', 
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Achievements</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#EA4335' }}>5</p>
          <p style={{ fontSize: '0.875rem', color: '#666' }}>Badges earned</p>
        </div>
      </div>
      
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '1.5rem', 
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Upcoming Sessions</h2>
        
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <th style={{ textAlign: 'left', padding: '0.75rem 0' }}>Date</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 0' }}>Time</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 0' }}>Location</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 0' }}>Coach</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 0' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '0.75rem 0' }}>May 20</td>
              <td style={{ padding: '0.75rem 0' }}>5:00 PM</td>
              <td style={{ padding: '0.75rem 0' }}>Legacy Turf</td>
              <td style={{ padding: '0.75rem 0' }}>Coach John</td>
              <td style={{ padding: '0.75rem 0' }}>
                <span style={{ 
                  backgroundColor: '#d4edda', 
                  color: '#155724',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem'
                }}>
                  Confirmed
                </span>
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '0.75rem 0' }}>May 22</td>
              <td style={{ padding: '0.75rem 0' }}>4:30 PM</td>
              <td style={{ padding: '0.75rem 0' }}>Central Park</td>
              <td style={{ padding: '0.75rem 0' }}>Coach Maria</td>
              <td style={{ padding: '0.75rem 0' }}>
                <span style={{ 
                  backgroundColor: '#fff3cd', 
                  color: '#856404',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem'
                }}>
                  Pending
                </span>
              </td>
            </tr>
            <tr>
              <td style={{ padding: '0.75rem 0' }}>May 25</td>
              <td style={{ padding: '0.75rem 0' }}>6:00 PM</td>
              <td style={{ padding: '0.75rem 0' }}>Legacy Turf</td>
              <td style={{ padding: '0.75rem 0' }}>Coach Smith</td>
              <td style={{ padding: '0.75rem 0' }}>
                <span style={{ 
                  backgroundColor: '#d4edda', 
                  color: '#155724',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem'
                }}>
                  Confirmed
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '1.5rem', 
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Performance Overview</h2>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Key Skills</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Batting</span>
                <span>75%</span>
              </div>
              <div style={{ backgroundColor: '#e9ecef', height: '0.5rem', borderRadius: '0.25rem' }}>
                <div 
                  style={{ 
                    backgroundColor: '#4285F4', 
                    width: '75%', 
                    height: '100%', 
                    borderRadius: '0.25rem' 
                  }}
                ></div>
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Bowling</span>
                <span>60%</span>
              </div>
              <div style={{ backgroundColor: '#e9ecef', height: '0.5rem', borderRadius: '0.25rem' }}>
                <div 
                  style={{ 
                    backgroundColor: '#4285F4', 
                    width: '60%', 
                    height: '100%', 
                    borderRadius: '0.25rem' 
                  }}
                ></div>
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Fielding</span>
                <span>85%</span>
              </div>
              <div style={{ backgroundColor: '#e9ecef', height: '0.5rem', borderRadius: '0.25rem' }}>
                <div 
                  style={{ 
                    backgroundColor: '#4285F4', 
                    width: '85%', 
                    height: '100%', 
                    borderRadius: '0.25rem' 
                  }}
                ></div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Recent Achievements</h3>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              backgroundColor: '#ffffff', 
              padding: '1rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              marginBottom: '1rem'
            }}>
              <span style={{ fontSize: '1.5rem', marginRight: '1rem' }}>🏆</span>
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0' }}>Century Maker</h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#6c757d' }}>April 10, 2025</p>
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              backgroundColor: '#ffffff', 
              padding: '1rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}>
              <span style={{ fontSize: '1.5rem', marginRight: '1rem' }}>🥇</span>
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0' }}>Golden Arm</h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#6c757d' }}>March 15, 2025</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SimpleParentDashboard;