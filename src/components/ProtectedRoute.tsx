// Protected route component - redirects to login if not authenticated
// This is the SINGLE SOURCE OF TRUTH for profile-based routing decisions.
// LoginPage only checks authentication; profile checks happen here.
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, profile, authStatus, profileStatus } = useAuth();

  // Wait for auth to resolve
  if (authStatus === 'initializing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white-call-200">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-soft-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not signed in - redirect to login
  if (authStatus === 'signed_out' || !user) {
    return <Navigate to="/login" replace />;
  }

  // Signed in but profile status not yet resolved - wait
  // This is CRITICAL: we must wait until profileStatus is 'exists' or 'missing'
  // to avoid premature redirects to /create-profile
  if (profileStatus === 'idle' || profileStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white-call-200">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-soft-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Profile confirmed to NOT exist - send to profile creation
  if (profileStatus === 'missing' || !profile) {
    return <Navigate to="/create-profile" replace />;
  }

  // profileStatus === 'exists' && profile !== null
  return <>{children}</>;
}
