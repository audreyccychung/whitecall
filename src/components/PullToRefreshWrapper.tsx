// Pull-to-refresh wrapper component
// Renders a spinner indicator that follows pull distance, then spins during refresh.
// Does not wrap children in a scroll container — pages scroll the whole window.
import { usePullToRefresh } from '../hooks/usePullToRefresh';

interface PullToRefreshWrapperProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefreshWrapper({ onRefresh, children }: PullToRefreshWrapperProps) {
  const { isRefreshing, pullDistance } = usePullToRefresh(onRefresh);

  // Show the indicator only when the user is pulling or refresh is in progress
  const indicatorVisible = pullDistance > 0 || isRefreshing;

  return (
    <>
      {/* Pull indicator — fixed at top of viewport, translates down with pull */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          // Sit above page content but below modals
          zIndex: 40,
          pointerEvents: 'none',
          // Translate: indicator starts hidden at -40px (its own height), slides down as user pulls
          transform: `translateY(${indicatorVisible ? pullDistance - 40 : -40}px)`,
          transition: isRefreshing
            ? 'transform 0.2s ease-out'
            : 'none', // No transition while pulling (instant feedback); smooth snap-back on release
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              animation: isRefreshing ? 'ptr-spin 0.8s linear infinite' : 'none',
              // Rotate proportionally to pull distance when not refreshing
              transform: isRefreshing
                ? undefined
                : `rotate(${(pullDistance / 60) * 270}deg)`,
              color: '#38bdf8', // sky-400 — matches app's sky-soft palette
            }}
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="28 56"
            />
          </svg>
        </div>
      </div>

      {/* Page content — unchanged */}
      {children}
    </>
  );
}
