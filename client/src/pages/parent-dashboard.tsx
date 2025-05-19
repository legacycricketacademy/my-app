import React, { useEffect } from "react";

const ParentDashboard = () => {
  useEffect(() => {
    console.log("✅ ParentDashboard mounted");
  }, []);

  return (
    <div style={{ padding: "40px", fontSize: "24px", color: "green" }}>
      🎯 Parent Dashboard Works!
    </div>
  );
};

export default ParentDashboard;