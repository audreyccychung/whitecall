// Protected route component - redirects to login if not authenticated
// This is the SINGLE SOURCE OF TRUTH for profile-based routing decisions.
// LoginPage only checks authentication; profile checks happen here.
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, profile, loading, isLoadingProfile } = useAuth();

  // Wait for both auth AND profile loading to complete before making routing decisions
  // This prevents premature redirects to /create-profile while profile is still loading
  if (loading || isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white-call-200">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-soft-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User is logged in but confirmed to have no profile - send to profile creation
  if (!profile) {
    return <Navigate to="/create-profile" replace />;
  }

  return <>{children}</>;
}
