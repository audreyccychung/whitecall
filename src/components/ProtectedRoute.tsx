// Protected route component - redirects to login if not authenticated
// This is the SINGLE SOURCE OF TRUTH for profile-based routing decisions.
// LoginPage only checks authentication; profile checks happen here.
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, profile, authStatus, profileStatus, refreshProfile } = useAuth();

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

  // Network error loading profile — show retry, NOT create-profile redirect
  if (profileStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white-call-200 p-4">
        <div className="text-center">
          <p className="text-4xl mb-4">📡</p>
          <p className="text-gray-800 font-medium mb-1">Connection issue</p>
          <p className="text-sm text-gray-500 mb-4">Couldn't load your profile. Check your connection and try again.</p>
          <button
            onClick={() => refreshProfile()}
            className="px-6 py-2.5 bg-sky-soft-500 text-white rounded-xl font-medium hover:bg-sky-soft-600 transition-colors"
          >
            Retry
          </button>
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
