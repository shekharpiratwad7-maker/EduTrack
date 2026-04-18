import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function useRoleRedirect() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Only redirect from root protected dashboards if role mismatch (prevent loops)
  const isDashboardIndex = ['/admin', '/teacher', '/student', '/parent'].includes(location.pathname);

  useEffect(() => {
    if (profile?.role && isDashboardIndex) {
      const rolePaths: Record<string, string> = {
        admin: '/admin',
        teacher: '/teacher',
        student: '/student',
        parent: '/parent',
      };
      const rolePath = rolePaths[profile.role];
      if (rolePath && location.pathname !== rolePath) {
        navigate(rolePath, { replace: true });
      }
    }
  }, [profile?.role, navigate, location.pathname]);
}

