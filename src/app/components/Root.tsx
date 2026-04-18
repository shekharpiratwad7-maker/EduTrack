import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from './ui/sonner';
import { Spinner } from './ui/spinner';
import { useAuth } from '../../contexts/AuthContext';
import { WhatsAppSupport } from './WhatsAppSupport';

export function Root() {
  const { loading, session, profile } = useAuth();
  const location = useLocation();
  const isAuthPage = ['/', '/signin', '/signup', '/forgot-password'].includes(location.pathname);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
  }

  // After login, redirect to role dashboard if on root
  if (session && profile?.role && location.pathname === '/') {
    return <Navigate to={`/${profile.role}`} replace />;
  }

  // Profile guard: keep user on signin until profile is available.
  if (session && !profile && !isAuthPage) {
    return <Navigate to="/signin" replace />;
  }

  // Optional login enabled: Guests can access all pages (components handle auth)
  if (!session && !isAuthPage) {
    // No redirect - allow guest view with login prompt in components
    // return <Navigate to="/" replace />;
  }

  // Role guards
  const protectedRolePaths = {
    admin: /^\/admin(\/|$)/,
    teacher: /^\/teacher(\/|$)/,
    student: /^\/student(\/|$)/,
    parent: /^\/parent(\/|$)/,
  };

  const currentPath = location.pathname;
  const wrongRole = profile?.role && !Object.entries(protectedRolePaths).some(([role, regex]) => {
    if (profile!.role !== role) return false;
    return (regex as RegExp).test(currentPath);
  });

  if (wrongRole) {
    const rolePath = `/${profile!.role}`;
    return <Navigate to={rolePath} replace />;
  }

  return (
    <div className="min-h-screen">
      <Outlet />
      <Toaster />
      <WhatsAppSupport />
    </div>
  );
}

