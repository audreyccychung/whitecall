import { forwardRef } from 'react';

interface StreakShareCardProps {
  streakDays: number;
}

/**
 * 1080x1920 share card for streak milestones
 * Rendered off-screen, captured as PNG via html-to-image
 */
export const StreakShareCard = forwardRef<HTMLDivElement, StreakShareCardProps>(
  ({ streakDays }, ref) => {
    return (
      <div
        ref={ref}
        className="absolute -left-[9999px] top-0"
        style={{
          width: '1080px',
          height: '1920px',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Warm gradient for streaks */}
        <div
          className="w-full h-full flex flex-col items-center justify-between"
          style={{
            background: 'linear-gradient(165deg, #fff7ed 0%, #fef3c7 50%, #fdf2f8 100%)',
            padding: '96px 72px',
          }}
        >
          {/* Logo */}
          <div style={{ fontSize: '56px', fontWeight: 600, color: '#0ea5e9' }}>
            WhiteCall
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* Fire emoji */}
            <div style={{ fontSize: '160px', marginBottom: '24px' }}>🔥</div>

            {/* Streak number - HUGE */}
            <div
              style={{
                fontSize: '180px',
                fontWeight: 700,
                color: '#0f172a',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              {streakDays}
            </div>

            {/* Label */}
            <div
              style={{
                fontSize: '48px',
                fontWeight: 500,
                color: '#64748b',
                marginTop: '16px',
              }}
            >
              day streak
            </div>

            {/* Subtitle */}
            <div
              style={{
                fontSize: '32px',
                fontWeight: 400,
                color: '#94a3b8',
                marginTop: '24px',
              }}
            >
              keeping connected
            </div>
          </div>

          {/* Footer */}
          <div style={{ fontSize: '32px', fontWeight: 500, color: '#94a3b8' }}>
            whitecall.app
          </div>
        </div>
      </div>
    );
  }
);

StreakShareCard.displayName = 'StreakShareCard';
