import { forwardRef } from 'react';
import { formatStat, getStatLabel, getStatEmoji, type StatKey } from '../../../utils/statsRegistry';

// Stats displayed in the monthly share card
const MONTHLY_SHARE_STATS: StatKey[] = ['calls', 'avgSleep', 'heartsReceived'];

interface MonthlyShareCardProps {
  month: string;
  calls: number;
  avgSleep: number | null;
  heartsReceived: number;
  currentStreak: number;
}

/**
 * 1080x1920 share card for monthly stats
 * Rendered off-screen, captured as PNG via html-to-image
 */
export const MonthlyShareCard = forwardRef<HTMLDivElement, MonthlyShareCardProps>(
  ({ month, calls, avgSleep, heartsReceived, currentStreak }, ref) => {
    // Map stat keys to values for formatting
    const statValues: Record<StatKey, number | null> = {
      calls,
      heartsReceived,
      avgMood: null,
      avgSleep,
      avgSupport: null,
      streak: currentStreak,
    };
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
        {/* Mint to sky gradient */}
        <div
          className="w-full h-full flex flex-col items-center justify-between"
          style={{
            background: 'linear-gradient(165deg, #ecfdf5 0%, #f0f9ff 50%, #faf5ff 100%)',
            padding: '96px 72px',
          }}
        >
          {/* Logo */}
          <div style={{ fontSize: '56px', fontWeight: 600, color: '#0ea5e9' }}>
            WhiteCall
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* Hero emoji */}
            <div style={{ fontSize: '120px', marginBottom: '32px' }}>🤍</div>

            {/* Title */}
            <div className="text-center" style={{ marginBottom: '64px' }}>
              <div style={{ fontSize: '48px', fontWeight: 600, color: '#1e293b' }}>
                {month} recap
              </div>
            </div>

            {/* Stats container */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '32px',
                padding: '40px 56px',
                minWidth: '600px',
              }}
            >
              {MONTHLY_SHARE_STATS.map((statKey, index) => (
                <div key={statKey}>
                  {index > 0 && <Divider />}
                  <CompactStatRow
                    value={formatStat(statKey, statValues[statKey])}
                    label={getStatLabel(statKey).toLowerCase()}
                  />
                </div>
              ))}
              {currentStreak > 0 && (
                <>
                  <Divider />
                  <CompactStatRow
                    value={formatStat('streak', currentStreak)}
                    label="day streak"
                    emoji={getStatEmoji('streak')}
                  />
                </>
              )}
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

MonthlyShareCard.displayName = 'MonthlyShareCard';

function CompactStatRow({
  value,
  label,
  emoji,
}: {
  value: string;
  label: string;
  emoji?: string;
}) {
  return (
    <div className="flex items-center justify-between" style={{ padding: '12px 0' }}>
      <div className="flex items-baseline gap-3">
        <span style={{ fontSize: '56px', fontWeight: 700, color: '#0f172a' }}>{value}</span>
        <span style={{ fontSize: '28px', color: '#64748b' }}>{label}</span>
      </div>
      {emoji && <span style={{ fontSize: '48px' }}>{emoji}</span>}
    </div>
  );
}

function Divider() {
  return <div style={{ height: '2px', backgroundColor: '#e2e8f0', margin: '8px 0' }} />;
}
