import React from "react";

/**
 * This is an independent React dashboard component that doesn't rely on any context providers,
 * hooks, or external dependencies. It uses only inline styles to avoid any Tailwind or CSS issues.
 */
export default function IndependentDashboard() {
  // Use only local state, no hooks or context
  const [activeTab, setActiveTab] = React.useState("overview");
  
  // Sample data for the dashboard
  const stats = {
    progress: "78%",
    attendance: "92%",
    fitness: "85/100"
  };
  
  const sessions = [
    { title: "Team Practice", date: "May 25, 2025", time: "16:00 - 18:00", location: "Main Ground", status: "confirmed" },
    { title: "Fitness Training", date: "May 27, 2025", time: "15:30 - 17:00", location: "Training Center", status: "confirmed" },
    { title: "Practice Match", date: "May 29, 2025", time: "09:00 - 12:00", location: "City Stadium", status: "tentative" }
  ];
  
  const skills = [
    { name: "Batting Technique", score: 85 },
    { name: "Bowling Accuracy", score: 72 },
    { name: "Fielding", score: 80 }
  ];
  
  // Inline styles to avoid any CSS dependencies
  const styles = {
    container: {
      fontFamily: "Arial, sans-serif",
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "20px",
      color: "#1a202c",
    },
    header: {
      backgroundColor: "#1e293b",
      color: "white",
      padding: "16px 0",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      marginBottom: "20px",
    },
    headerContent: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "0 20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    logo: {
      fontSize: "20px",
      fontWeight: "bold",
    },
    logoHighlight: {
      color: "#3b82f6",
    },
    userInfo: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    avatar: {
      width: "32px",
      height: "32px",
      borderRadius: "50%",
      backgroundColor: "#3b82f6",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "bold",
      color: "white",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: "20px",
      marginBottom: "30px",
    },
    card: {
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      padding: "20px",
      position: "relative",
      overflow: "hidden",
    },
    cardAccent: {
      position: "absolute",
      top: "0",
      left: "0",
      width: "4px",
      height: "100%",
    },
    cardTitle: {
      fontWeight: "600",
      color: "#4b5563",
      marginBottom: "8px",
    },
    cardValue: {
      fontSize: "32px",
      fontWeight: "700",
      marginBottom: "8px",
    },
    cardDescription: {
      fontSize: "14px",
      color: "#6b7280",
    },
    tabs: {
      display: "flex",
      borderBottom: "1px solid #e5e7eb",
      marginBottom: "20px",
    },
    tab: {
      padding: "10px 16px",
      cursor: "pointer",
      borderBottom: "2px solid transparent",
      fontWeight: "500",
      color: "#6b7280",
    },
    activeTab: {
      borderBottomColor: "#3b82f6",
      color: "#3b82f6",
    },
    tabContent: {
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      padding: "20px",
      marginBottom: "30px",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
    },
    th: {
      textAlign: "left",
      padding: "12px 16px",
      fontSize: "14px",
      fontWeight: "500",
      color: "#6b7280",
      textTransform: "uppercase",
      backgroundColor: "#f9fafb",
      borderBottom: "1px solid #e5e7eb",
    },
    td: {
      padding: "16px",
      borderBottom: "1px solid #e5e7eb",
    },
    status: {
      display: "inline-block",
      padding: "4px 8px",
      borderRadius: "9999px",
      fontSize: "12px",
      fontWeight: "500",
    },
    statusConfirmed: {
      backgroundColor: "#dcfce7",
      color: "#166534",
    },
    statusTentative: {
      backgroundColor: "#fef9c3",
      color: "#854d0e",
    },
    skillItem: {
      marginBottom: "16px",
    },
    skillHeader: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "8px",
    },
    progressBar: {
      height: "8px",
      width: "100%",
      backgroundColor: "#e5e7eb",
      borderRadius: "9999px",
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: "#3b82f6",
      borderRadius: "9999px",
    },
  };
  
  return (
    <div>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logo}>
            Legacy <span style={styles.logoHighlight}>Cricket Academy</span>
          </div>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>P</div>
            <div>Parent Account</div>
          </div>
        </div>
      </div>
      
      <div style={styles.container}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "24px" }}>Player Dashboard</h1>
        
        {/* Stats Cards */}
        <div style={styles.grid}>
          <div style={styles.card}>
            <div style={{ ...styles.cardAccent, backgroundColor: "#3b82f6" }}></div>
            <div style={styles.cardTitle}>Overall Progress</div>
            <div style={styles.cardValue}>{stats.progress}</div>
            <div style={styles.cardDescription}>Skills development score</div>
          </div>
          <div style={styles.card}>
            <div style={{ ...styles.cardAccent, backgroundColor: "#10b981" }}></div>
            <div style={styles.cardTitle}>Attendance</div>
            <div style={styles.cardValue}>{stats.attendance}</div>
            <div style={styles.cardDescription}>24 practices attended</div>
          </div>
          <div style={styles.card}>
            <div style={{ ...styles.cardAccent, backgroundColor: "#8b5cf6" }}></div>
            <div style={styles.cardTitle}>Fitness Score</div>
            <div style={styles.cardValue}>{stats.fitness}</div>
            <div style={styles.cardDescription}>Physical fitness assessment</div>
          </div>
        </div>
        
        {/* Tabs */}
        <div style={styles.tabs}>
          <div 
            style={{ ...styles.tab, ...(activeTab === "overview" ? styles.activeTab : {}) }}
            onClick={() => setActiveTab("overview")}
          >
            Upcoming Sessions
          </div>
          <div 
            style={{ ...styles.tab, ...(activeTab === "performance" ? styles.activeTab : {}) }}
            onClick={() => setActiveTab("performance")}
          >
            Performance
          </div>
        </div>
        
        {/* Tab Content */}
        <div style={styles.tabContent}>
          {activeTab === "overview" && (
            <div>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Title</th>
                    <th style={styles.th}>Date & Time</th>
                    <th style={styles.th}>Location</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session, index) => (
                    <tr key={index}>
                      <td style={styles.td}>{session.title}</td>
                      <td style={styles.td}>{session.date} • {session.time}</td>
                      <td style={styles.td}>{session.location}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.status,
                          ...(session.status === "confirmed" ? styles.statusConfirmed : styles.statusTentative)
                        }}>
                          {session.status === "confirmed" ? "Confirmed" : "Tentative"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {activeTab === "performance" && (
            <div>
              {skills.map((skill, index) => (
                <div key={index} style={styles.skillItem}>
                  <div style={styles.skillHeader}>
                    <div>{skill.name}</div>
                    <div>{skill.score}/100</div>
                  </div>
                  <div style={styles.progressBar}>
                    <div style={{ ...styles.progressFill, width: `${skill.score}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}