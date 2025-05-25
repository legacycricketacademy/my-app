const express = require('express');
const path = require('path');
const app = express();
const port = 3001;

// Serve static files
app.use(express.static(path.join(__dirname)));
app.use(express.json());

// Route for the parent dashboard
app.get('/parent-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'standalone-parent-view.html'));
});

// Mock API endpoint for pending coaches
app.get('/api/coaches/pending', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        username: "coach1",
        email: "coach1@example.com",
        fullName: "John Smith",
        status: "pending",
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        username: "coach2",
        email: "coach2@example.com",
        fullName: "Jane Doe",
        status: "pending",
        createdAt: new Date().toISOString()
      }
    ]
  });
});

// Mock API endpoint for approving a coach
app.post('/api/coaches/:id/approve', (req, res) => {
  const coachId = req.params.id;
  console.log(`Coach ${coachId} approved`);
  res.json({
    success: true,
    message: `Coach with ID ${coachId} has been approved.`,
    data: {
      id: coachId,
      username: "coach" + coachId,
      status: "active"
    }
  });
});

// Mock API endpoint for rejecting a coach
app.post('/api/coaches/:id/reject', (req, res) => {
  const coachId = req.params.id;
  console.log(`Coach ${coachId} rejected`);
  res.json({
    success: true,
    message: `Coach with ID ${coachId} has been rejected.`,
    data: {
      id: coachId,
      username: "coach" + coachId,
      status: "rejected"
    }
  });
});

// Create a coaches approval page for demonstration
app.get('/coaches-approval', (req, res) => {
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Coach Approval Dashboard</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      h1 {
        color: #2c5282;
      }
      .coach-card {
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .coach-info h3 {
        margin: 0 0 5px 0;
      }
      .coach-info p {
        margin: 0;
        color: #718096;
      }
      .actions {
        display: flex;
        gap: 10px;
      }
      .approve-btn {
        background-color: #c6f6d5;
        color: #2f855a;
        border: 1px solid #2f855a;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
      }
      .reject-btn {
        background-color: #fed7d7;
        color: #e53e3e;
        border: 1px solid #e53e3e;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
      }
      .status {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        background-color: #fefcbf;
        color: #975a16;
      }
    </style>
  </head>
  <body>
    <h1>Coaches Pending Approval</h1>
    <div id="coaches-list">
      <!-- Coaches will be loaded here -->
    </div>

    <script>
      // Fetch and display pending coaches
      fetch('/api/coaches/pending')
        .then(response => response.json())
        .then(data => {
          const coachesList = document.getElementById('coaches-list');
          
          if (data.success && data.data.length > 0) {
            data.data.forEach(coach => {
              const coachCard = document.createElement('div');
              coachCard.className = 'coach-card';
              coachCard.id = 'coach-' + coach.id;
              
              coachCard.innerHTML = \`
                <div class="coach-info">
                  <h3>\${coach.fullName || coach.username}</h3>
                  <p>\${coach.email}</p>
                  <p>Status: <span class="status">\${coach.status}</span></p>
                </div>
                <div class="actions">
                  <button class="approve-btn" onclick="approveCoach(\${coach.id})">Approve</button>
                  <button class="reject-btn" onclick="rejectCoach(\${coach.id})">Reject</button>
                </div>
              \`;
              
              coachesList.appendChild(coachCard);
            });
          } else {
            coachesList.innerHTML = '<p>No coaches pending approval at this time.</p>';
          }
        })
        .catch(error => {
          console.error('Error fetching coaches:', error);
          document.getElementById('coaches-list').innerHTML = 
            '<p>Error loading coaches. Please try again later.</p>';
        });
      
      // Approve coach function
      function approveCoach(id) {
        fetch(\`/api/coaches/\${id}/approve\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            alert(\`Coach successfully approved! \${data.message}\`);
            // Remove the coach card or update its status
            const coachCard = document.getElementById('coach-' + id);
            if (coachCard) {
              coachCard.style.backgroundColor = '#f0fff4';
              const statusSpan = coachCard.querySelector('.status');
              if (statusSpan) {
                statusSpan.textContent = 'approved';
                statusSpan.style.backgroundColor = '#c6f6d5';
                statusSpan.style.color = '#2f855a';
              }
              // Disable buttons
              coachCard.querySelectorAll('button').forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = 0.5;
              });
            }
          } else {
            alert('Error approving coach: ' + (data.message || 'Unknown error'));
          }
        })
        .catch(error => {
          console.error('Error approving coach:', error);
          alert('Error approving coach. Please try again.');
        });
      }
      
      // Reject coach function
      function rejectCoach(id) {
        fetch(\`/api/coaches/\${id}/reject\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            alert(\`Coach successfully rejected! \${data.message}\`);
            // Remove the coach card or update its status
            const coachCard = document.getElementById('coach-' + id);
            if (coachCard) {
              coachCard.style.backgroundColor = '#fff5f5';
              const statusSpan = coachCard.querySelector('.status');
              if (statusSpan) {
                statusSpan.textContent = 'rejected';
                statusSpan.style.backgroundColor = '#fed7d7';
                statusSpan.style.color = '#e53e3e';
              }
              // Disable buttons
              coachCard.querySelectorAll('button').forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = 0.5;
              });
            }
          } else {
            alert('Error rejecting coach: ' + (data.message || 'Unknown error'));
          }
        })
        .catch(error => {
          console.error('Error rejecting coach:', error);
          alert('Error rejecting coach. Please try again.');
        });
      }
    </script>
  </body>
  </html>
  `;
  
  res.send(html);
});

// Default route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cricket Academy Dashboard</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          text-align: center;
        }
        h1 {
          color: #2c5282;
        }
        .links {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-top: 30px;
        }
        a {
          text-decoration: none;
          padding: 15px;
          background-color: #ebf4ff;
          color: #3182ce;
          border-radius: 8px;
          font-weight: bold;
        }
        a:hover {
          background-color: #bee3f8;
        }
      </style>
    </head>
    <body>
      <h1>Legacy Cricket Academy</h1>
      <p>Please select a dashboard to view:</p>
      <div class="links">
        <a href="/parent-dashboard">Parent Dashboard</a>
        <a href="/coaches-approval">Coaches Approval Dashboard</a>
      </div>
    </body>
    </html>
  `);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});