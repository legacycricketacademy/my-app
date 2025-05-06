import ParentDashboard from './parent-dashboard';
import { useEffect } from 'react';

// This is a simple wrapper component to test the parent dashboard
export default function ParentTest() {
  // Log that we're in the test component
  useEffect(() => {
    console.log('Parent Test Page Loaded');
  }, []);
  
  return <ParentDashboard />;
}