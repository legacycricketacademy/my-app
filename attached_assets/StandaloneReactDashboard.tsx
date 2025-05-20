import React, { useState } from "react";
import Schedule from "./components/Schedule";
import Stats from "./components/Stats";
import Meals from "./components/Meals";
import Payments from "./components/Payments";

const StandaloneReactDashboard = () => {
  const [tab, setTab] = useState("schedule");

  return (
    <div className="p-6 max-w-4xl mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-4">📊 Parent Dashboard</h1>

      <div className="flex space-x-4 mb-6">
        {["schedule", "stats", "meals", "payments"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded ${
              tab === t ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white p-4 rounded shadow">
        {tab === "schedule" && <Schedule />}
        {tab === "stats" && <Stats />}
        {tab === "meals" && <Meals />}
        {tab === "payments" && <Payments />}
      </div>
    </div>
  );
};

export default StandaloneReactDashboard;
