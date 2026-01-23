import { forwardRef } from 'react';
import { formatStat, getStatLabel, type StatKey } from '../../../utils/statsRegistry';

// Stats displayed in the share card (intentionally different from UI card)
const WEEKLY_SHARE_STATS: StatKey[] = ['calls', 'avgSleep', 'heartsReceived'];

interface WeeklyShareCardProps {
  calls: number;
  avgSleep: number | null;
  heartsReceived: number;
  avgMood: number | null;
}

/**
 * 1080x1920 share card for weekly recap
 * Rendered off-screen, captured as PNG via html-to-image
 */
export const WeeklyShareCard = forwardRef<HTMLDivElement, WeeklyShareCardProps>(
  ({ calls, avgSleep, heartsReceived, avgMood }, ref) => {
    // Map stat keys to values for formatting
    const statValues: Record<StatKey, number | null> = {
      calls,
      heartsReceived,
      avgMood,
      avgSleep,
      avgSupport: null,
      streak: null,
    };

    // Get mood emoji for display alongside stats
    const moodEmoji = formatStat('avgMood', avgMood);
    return (
      <div
        ref={ref}
        style={{
          width: '1080px',
          height: '1920px',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div
          className="w-full h-full flex flex-col items-center justify-between"
          style={{
            background: 'linear-gradient(165deg, #f0f9ff 0%, #faf5ff 50%, #fdf2f8 100%)',
            padding: '96px 72px',
          }}
        >
          {/* Logo */}
          <div style={{ fontSize: '56px', fontWeight: 600, color: '#0ea5e9' }}>
            WhiteCall
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div style={{ fontSize: '120px', marginBottom: '32px' }}>🤍</div>

            <div className="text-center" style={{ marginBottom: '64px' }}>
              <div style={{ fontSize: '48px', fontWeight: 600, color: '#1e293b' }}>
                On-call recap
              </div>
              <div style={{ fontSize: '32px', color: '#64748b', marginTop: '8px' }}>
                This week
              </div>
            </div>

            {/* Stats */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '32px',
                padding: '48px 64px',
                minWidth: '600px',
              }}
            >
              {WEEKLY_SHARE_STATS.map((statKey, index) => (
                <div key={statKey}>
                  {index > 0 && <Divider />}
                  <StatRow
                    value={formatStat(statKey, statValues[statKey])}
                    label={getStatLabel(statKey).toLowerCase()}
                    emoji={statKey === 'avgSleep' && moodEmoji !== '-' ? moodEmoji : undefined}
                  />
                </div>
              ))}
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

WeeklyShareCard.displayName = 'WeeklyShareCard';

function StatRow({ value, label, emoji }: { value: string; label: string; emoji?: string }) {
  return (
    <div className="flex items-center justify-between" style={{ padding: '16px 0' }}>
      <div className="flex items-baseline gap-4">
        <span style={{ fontSize: '72px', fontWeight: 700, color: '#0f172a' }}>{value}</span>
        <span style={{ fontSize: '36px', color: '#64748b' }}>{label}</span>
      </div>
      {emoji && <span style={{ fontSize: '64px' }}>{emoji}</span>}
    </div>
  );
}

function Divider() {
  return <div style={{ height: '2px', backgroundColor: '#e2e8f0', margin: '8px 0' }} />;
}
