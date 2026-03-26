import { forwardRef } from 'react';
import type { TrendPoint, RatingDistribution } from '../../../hooks/useProfileStats';
import type { CallRatingValue } from '../../../types/database';
import { RATING_LABEL } from '../../../types/database';

interface InsightsShareCardProps {
  sleepTrend: TrendPoint[];
  allTimeSleepAvg: number | null;
  ratingDistribution: RatingDistribution;
  avgGapDays: number | null;
  totalCalls: number;
  callsByDayOfWeek: number[];
  allTimeHeartsReceived: number;
  callsWithHeartsPercent: number | null;
  currentStreak: number;
  longestStreak: number;
}

// Grayscale mood colors (rough=black → great=white)
const MOOD_COLORS: Record<number, string> = {
  1: '#1f2937',
  2: '#6b7280',
  3: '#d1d5db',
  4: '#f3f4f6',
};

const RATING_CIRCLE_COLORS: Record<CallRatingValue, string> = {
  rough: '#1f2937',
  okay: '#6b7280',
  good: '#d1d5db',
  great: '#f9fafb',
};

const RATING_BORDER: Record<CallRatingValue, string> = {
  rough: 'none',
  okay: 'none',
  good: 'none',
  great: '2px solid #d1d5db',
};

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const RATINGS_ORDER: CallRatingValue[] = ['great', 'good', 'okay', 'rough'];

/**
 * 1080x1920 share card for insights (both Trends + Patterns combined)
 * Rendered off-screen, captured as PNG via html-to-image
 */
export const InsightsShareCard = forwardRef<HTMLDivElement, InsightsShareCardProps>(
  (props, ref) => {
    const {
      sleepTrend,
      allTimeSleepAvg,
      ratingDistribution,
      avgGapDays,
      totalCalls,
      callsByDayOfWeek,
      allTimeHeartsReceived,
      callsWithHeartsPercent,
      currentStreak,
      longestStreak,
    } = props;

    const ratingTotal = ratingDistribution.rough + ratingDistribution.okay +
      ratingDistribution.good + ratingDistribution.great;

    const sleepPoints = sleepTrend.filter(p => p.sleep !== null);
    const maxSleep = sleepPoints.length > 0 ? Math.max(...sleepPoints.map(p => p.sleep!)) : 8;
    const ceiling = maxSleep <= 4 ? 5 : maxSleep <= 6 ? 7 : maxSleep <= 8 ? 9 : 12;

    const maxDayCount = Math.max(...callsByDayOfWeek);
    const rotationNumber = avgGapDays !== null ? Math.round(avgGapDays) : null;

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
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(165deg, #f0f9ff 0%, #f8fafc 50%, #f0f9ff 100%)',
            padding: '80px 72px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
            <div style={{ fontSize: '48px', fontWeight: 600, color: '#0ea5e9' }}>WhiteCall</div>
            <div style={{ fontSize: '32px', fontWeight: 500, color: '#94a3b8' }}>My Insights</div>
          </div>

          {/* Sleep Trend */}
          <SectionCard title="Sleep Trend">
            {sleepPoints.length >= 3 ? (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '180px', marginBottom: '16px' }}>
                  {sleepPoints.map((p, i) => {
                    const heightPct = (p.sleep! / ceiling) * 100;
                    return (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'flex-end',
                          height: '100%',
                        }}
                      >
                        <div
                          style={{
                            width: '100%',
                            height: `${Math.max(heightPct, 4)}%`,
                            minHeight: '4px',
                            backgroundColor: MOOD_COLORS[p.mood] || '#d1d5db',
                            borderRadius: '4px 4px 0 0',
                            border: p.mood === 4 ? '2px solid #d1d5db' : 'none',
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: '28px', color: '#94a3b8', textAlign: 'center' }}>
                  Avg {allTimeSleepAvg !== null ? `${allTimeSleepAvg.toFixed(1)}h` : '-'} · {sleepPoints.length} calls
                </div>
              </>
            ) : (
              <div style={{ fontSize: '28px', color: '#94a3b8', textAlign: 'center', padding: '32px 0' }}>
                Not enough data yet
              </div>
            )}
          </SectionCard>

          {/* Rating Breakdown */}
          <SectionCard title="Ratings">
            {ratingTotal > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {RATINGS_ORDER.map((rating) => {
                  const count = ratingDistribution[rating];
                  const pct = ratingTotal > 0 ? (count / ratingTotal) * 100 : 0;
                  return (
                    <div key={rating} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: RATING_CIRCLE_COLORS[rating],
                          border: RATING_BORDER[rating],
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: '26px', color: '#6b7280', width: '100px' }}>
                        {RATING_LABEL[rating]}
                      </span>
                      <div style={{ flex: 1, height: '24px', backgroundColor: '#f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.max(pct, count > 0 ? 3 : 0)}%`,
                            backgroundColor: RATING_CIRCLE_COLORS[rating],
                            borderRadius: '12px',
                            border: rating === 'great' ? '2px solid #d1d5db' : 'none',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '26px', color: '#94a3b8', width: '80px', textAlign: 'right' }}>
                        {Math.round(pct)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: '28px', color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>
                No rated calls yet
              </div>
            )}
          </SectionCard>

          {/* Patterns Row: Frequency + Day of Week */}
          <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
            {/* Call Frequency */}
            <div
              style={{
                flex: 1,
                backgroundColor: 'rgba(255,255,255,0.8)',
                borderRadius: '28px',
                padding: '32px',
              }}
            >
              <div style={{ fontSize: '24px', fontWeight: 600, color: '#94a3b8', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Frequency
              </div>
              {rotationNumber !== null && totalCalls >= 5 ? (
                <>
                  <div style={{ fontSize: '72px', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>
                    q{rotationNumber}d
                  </div>
                  <div style={{ fontSize: '26px', color: '#64748b', marginTop: '8px' }}>
                    {totalCalls} calls total
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '56px', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>
                    {totalCalls}
                  </div>
                  <div style={{ fontSize: '26px', color: '#64748b', marginTop: '8px' }}>
                    calls total
                  </div>
                </>
              )}
            </div>

            {/* Day of Week */}
            <div
              style={{
                flex: 1,
                backgroundColor: 'rgba(255,255,255,0.8)',
                borderRadius: '28px',
                padding: '32px',
              }}
            >
              <div style={{ fontSize: '24px', fontWeight: 600, color: '#94a3b8', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                By Day
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px' }}>
                {callsByDayOfWeek.map((count, i) => {
                  const heightPct = maxDayCount > 0 ? (count / maxDayCount) * 100 : 0;
                  const isBusiest = count === maxDayCount && count > 0;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div
                        style={{
                          width: '100%',
                          height: `${Math.max(heightPct, count > 0 ? 6 : 0)}%`,
                          minHeight: count > 0 ? '4px' : '0',
                          backgroundColor: isBusiest ? '#374151' : '#d1d5db',
                          borderRadius: '4px 4px 0 0',
                        }}
                      />
                      <span style={{ fontSize: '22px', color: isBusiest ? '#374151' : '#94a3b8', marginTop: '6px', fontWeight: isBusiest ? 600 : 400 }}>
                        {DAY_LABELS[i]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Support Row */}
          <div
            style={{
              backgroundColor: 'rgba(255,255,255,0.8)',
              borderRadius: '28px',
              padding: '32px 40px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '48px' }}>🤍</span>
              <div>
                <div style={{ fontSize: '36px', fontWeight: 700, color: '#0f172a' }}>
                  {allTimeHeartsReceived}
                </div>
                <div style={{ fontSize: '24px', color: '#64748b' }}>
                  hearts received
                  {callsWithHeartsPercent !== null ? ` · ${Math.round(callsWithHeartsPercent)}% of calls` : ''}
                </div>
              </div>
            </div>
            {currentStreak > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '48px' }}>🔥</span>
                <div>
                  <div style={{ fontSize: '36px', fontWeight: 700, color: '#0f172a' }}>
                    {currentStreak}
                  </div>
                  <div style={{ fontSize: '24px', color: '#64748b' }}>
                    day streak
                    {longestStreak > currentStreak ? ` · best ${longestStreak}` : ''}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Footer */}
          <div style={{ fontSize: '32px', fontWeight: 500, color: '#94a3b8', textAlign: 'center' }}>
            whitecall.app
          </div>
        </div>
      </div>
    );
  }
);

InsightsShareCard.displayName = 'InsightsShareCard';

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: '28px',
        padding: '32px 40px',
        marginBottom: '24px',
      }}
    >
      <div style={{ fontSize: '24px', fontWeight: 600, color: '#94a3b8', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </div>
      {children}
    </div>
  );
}
