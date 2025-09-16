import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initKeycloak, getUserRoles } from '@/auth/keycloak';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const keycloak = await initKeycloak();
        
        if (keycloak.authenticated) {
          const roles = getUserRoles();
          
          // Redirect based on user role
          if (roles.includes('admin')) {
            navigate('/admin/dashboard');
          } else if (roles.includes('parent')) {
            navigate('/dashboard/parent');
          } else {
            navigate('/');
          }
        } else {
          navigate('/auth');
        }
      } catch (error) {
        console.error('Auth callback failed:', error);
        navigate('/auth');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Completing login...</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  );
}
