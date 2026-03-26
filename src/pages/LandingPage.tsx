// Landing page — Apple-style marketing page for unauthenticated visitors
// Authenticated users redirect straight to /home
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

// Phone frame wrapper for product mockups
function PhoneMockup({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative mx-auto w-[240px] sm:w-[280px] ${className}`}>
      {/* Phone frame */}
      <div className="bg-gray-900 rounded-[2rem] sm:rounded-[2.5rem] p-2.5 sm:p-3 shadow-2xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 sm:w-28 h-5 sm:h-6 bg-gray-900 rounded-b-xl sm:rounded-b-2xl z-10" />
        {/* Screen */}
        <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden h-[440px] sm:h-[520px]">
          {children}
        </div>
      </div>
    </div>
  );
}

// Mock home screen — matches real HomePage layout exactly
function MockHomeScreen() {
  const friends = [
    { name: 'Sarah', emoji: '🐱', color: '#ffd6e8', sent: false },
    { name: 'Jason', emoji: '🐻', color: '#d6e8ff', sent: true },
    { name: 'Wing Yan', emoji: '🐰', color: '#e8d6ff', sent: false },
  ];
  return (
    <div className="h-full overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #f0f9ff, #fafafa)' }}>
      {/* Header — matches real: white bg, shadow-soft, title left, bell right */}
      <div className="bg-white px-4 py-2.5 flex items-center justify-between" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <p className="font-bold text-gray-800 text-sm">WhiteCall</p>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </div>
      <div className="px-3 py-2.5 space-y-2.5">
        {/* Streak banner — matches real: orange gradient */}
        <div className="rounded-xl px-3 py-1.5 flex items-center justify-center gap-1.5" style={{ background: 'linear-gradient(to right, #ffedd5, #fef3c7)' }}>
          <span className="text-sm">🔥</span>
          <span className="font-semibold text-orange-700" style={{ fontSize: 11 }}>8-day streak!</span>
        </div>
        {/* User status — matches real: white card, avatar + heart counter */}
        <div className="bg-white rounded-xl p-2.5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div className="flex items-center gap-2.5">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: '#d6ffe8' }}>🐶</div>
              {/* Heart badge */}
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-100 rounded-full flex items-center justify-center" style={{ fontSize: 9 }}>3</div>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800" style={{ fontSize: 13 }}>You received 3 🤍 today</p>
              <p className="text-gray-500" style={{ fontSize: 10 }}>On call · Keep going!</p>
            </div>
          </div>
        </div>
        {/* Friends on call — matches real: white card, section header, friend rows */}
        <div className="bg-white rounded-xl p-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div className="flex items-center justify-between mb-1.5">
            <p className="font-semibold text-gray-700" style={{ fontSize: 11 }}>Friends on call</p>
            <p className="text-gray-400" style={{ fontSize: 10 }}>3 today</p>
          </div>
          <div className="space-y-1">
            {friends.map((f) => (
              <div key={f.name} className="flex items-center justify-between py-1.5 px-2 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: f.color, fontSize: 14 }}>{f.emoji}</div>
                  <p className="font-medium text-gray-700" style={{ fontSize: 12 }}>{f.name}</p>
                </div>
                {f.sent ? (
                  <span className="px-3 py-1 rounded-full text-sky-soft-400" style={{ fontSize: 10, backgroundColor: '#e0f2fe' }}>Sent 🤍</span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-white font-medium" style={{ fontSize: 10, backgroundColor: 'rgba(59,130,246,0.9)' }}>Send 🤍</span>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* Activity feed — matches real: white card with shadow-soft-lg */}
        <div className="bg-white rounded-2xl p-3" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
          <p className="font-semibold text-gray-700 mb-2" style={{ fontSize: 11 }}>Support Feed</p>
          <div className="space-y-2">
            {[
              { name: 'Sarah', emoji: '🐱', color: '#ffd6e8', rating: 'Great', sleep: '5h', icon: '⚪' },
              { name: 'Jason', emoji: '🐻', color: '#d6e8ff', rating: 'Okay', sleep: '2h', icon: '⬛' },
            ].map((item) => (
              <div key={item.name} className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: item.color, fontSize: 10 }}>{item.emoji}</div>
                <div className="flex-1">
                  <p className="text-gray-600" style={{ fontSize: 10 }}><span className="font-medium">{item.name}</span> rated their call</p>
                  <p className="text-gray-400" style={{ fontSize: 9 }}>{item.icon} {item.rating} · 😴 {item.sleep} sleep</p>
                </div>
                <span style={{ fontSize: 10 }}>❤️</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Mock profile screen — matches real ProfilePage layout
function MockProfileScreen() {
  const sleepData = [
    { h: 3, mood: '#6b7280' }, { h: 2, mood: '#1f2937' }, { h: 5, mood: '#d1d5db' },
    { h: 1, mood: '#1f2937' }, { h: 4, mood: '#f9fafb' }, { h: 3, mood: '#6b7280' },
    { h: 6, mood: '#d1d5db' }, { h: 2, mood: '#1f2937' }, { h: 4, mood: '#6b7280' },
    { h: 3, mood: '#d1d5db' },
  ];
  return (
    <div className="h-full overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #f0f9ff, #fafafa)' }}>
      {/* Header */}
      <div className="bg-white px-4 py-2.5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <p className="font-bold text-gray-800 text-sm">Profile</p>
      </div>
      <div className="px-3 py-2.5 space-y-2.5">
        {/* Hero — matches real: white card, avatar + name + share button */}
        <div className="bg-white rounded-2xl p-3 flex items-center gap-3" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: '#d6ffe8' }}>🐶</div>
          <div className="flex-1">
            <p className="font-bold text-gray-800" style={{ fontSize: 13 }}>Audrey</p>
            <p className="text-gray-500" style={{ fontSize: 10 }}>@audreychung</p>
          </div>
          <span className="px-2.5 py-1.5 rounded-xl text-sky-soft-600 flex items-center gap-1" style={{ fontSize: 10, backgroundColor: '#f0f9ff' }}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            Share
          </span>
        </div>
        {/* This Month stats — matches real: 4 stat cards */}
        <div>
          <p className="text-gray-700 font-medium uppercase px-0.5 mb-1" style={{ fontSize: 9, letterSpacing: '0.05em' }}>This Month</p>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: 'Calls', value: '6' },
              { label: 'Avg Quality', value: '●', valueColor: '#6b7280' },
              { label: 'Avg Sleep', value: '3.2h' },
              { label: 'Avg Support', value: '2.1 🤍' },
            ].map((s) => (
              <div key={s.label} className="rounded-lg p-1.5 text-center" style={{ backgroundColor: '#f9fafb' }}>
                <p className="font-bold text-gray-800" style={{ fontSize: 12, color: s.valueColor }}>{s.value}</p>
                <p className="text-gray-500" style={{ fontSize: 7 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Insights — matches real: white card with tabs + sleep chart */}
        <div className="bg-white rounded-2xl p-3" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-500 font-medium" style={{ fontSize: 11 }}>Insights</p>
            <div className="flex gap-0.5 rounded-md p-0.5" style={{ backgroundColor: '#f3f4f6' }}>
              <span className="px-2 py-0.5 rounded bg-white text-gray-800 font-medium" style={{ fontSize: 9, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>Trends</span>
              <span className="px-2 py-0.5 rounded text-gray-500" style={{ fontSize: 9 }}>Patterns</span>
            </div>
          </div>
          {/* Sleep sparkline — dots + line like real SleepSparkline.tsx */}
          <p className="text-gray-500 font-medium mb-1" style={{ fontSize: 9 }}>Sleep Over Time</p>
          <div className="relative" style={{ height: 55 }}>
            <svg viewBox="0 0 220 50" className="w-full h-full">
              {/* Y-axis labels */}
              <text x="12" y="8" textAnchor="end" fill="#9ca3af" fontSize="6">7h</text>
              <text x="12" y="28" textAnchor="end" fill="#9ca3af" fontSize="6">3h</text>
              <text x="12" y="48" textAnchor="end" fill="#9ca3af" fontSize="6">0</text>
              {/* Gridlines */}
              <line x1="18" y1="5" x2="216" y2="5" stroke="#f1f5f9" strokeWidth="0.5" />
              <line x1="18" y1="25" x2="216" y2="25" stroke="#f1f5f9" strokeWidth="0.5" />
              <line x1="18" y1="45" x2="216" y2="45" stroke="#f1f5f9" strokeWidth="0.5" />
              {/* Average line */}
              <line x1="18" y1="27" x2="216" y2="27" stroke="#d1d5db" strokeWidth="0.75" strokeDasharray="3 2" />
              {/* Line connecting dots */}
              <polyline
                points={sleepData.map((d, i) => {
                  const x = 18 + (i / (sleepData.length - 1)) * 198;
                  const y = 45 - (d.h / 7) * 40;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#9ca3af"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              {/* Dots colored by mood */}
              {sleepData.map((d, i) => {
                const x = 18 + (i / (sleepData.length - 1)) * 198;
                const y = 45 - (d.h / 7) * 40;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={3}
                    fill={d.mood}
                    stroke={d.mood === '#f9fafb' ? '#9ca3af' : d.mood}
                    strokeWidth={1.2}
                  />
                );
              })}
            </svg>
          </div>
          <p className="text-center text-gray-400" style={{ fontSize: 8 }}>Avg 3.2h · 10 calls</p>
          {/* Rating breakdown */}
          <p className="text-gray-500 font-medium mt-2 mb-1" style={{ fontSize: 9 }}>Rating Breakdown</p>
          {[
            { label: 'Great', pct: 15, color: '#f9fafb', border: true },
            { label: 'Good', pct: 35, color: '#d1d5db', border: false },
            { label: 'Okay', pct: 35, color: '#6b7280', border: false },
            { label: 'Rough', pct: 15, color: '#1f2937', border: false },
          ].map((r) => (
            <div key={r.label} className="flex items-center gap-1.5 mb-0.5">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: r.color, border: r.border ? '1px solid #d1d5db' : 'none' }} />
              <span className="text-gray-500" style={{ fontSize: 8, width: 28 }}>{r.label}</span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#f1f5f9' }}>
                <div className="h-full rounded-full" style={{ width: `${r.pct}%`, backgroundColor: r.color, border: r.border ? '1px solid #d1d5db' : 'none' }} />
              </div>
              <span className="text-gray-400" style={{ fontSize: 8, width: 16, textAlign: 'right' }}>{r.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Mock calendar screen — based on Audrey's real April 2026 schedule
function MockCalendarScreen() {
  const call = { color: '#7dd3fc', accent: '#38bdf8' };
  const off = { color: '#5eead4', accent: '#2dd4bf' };
  const work = { color: '#c4b5fd', accent: '#a78bfa' };
  const half = { color: '#fdba74', accent: '#fb923c' };

  // April 2026 — copied from Audrey's real calendar screenshot
  const shifts: Record<number, { color: string; accent: string }> = {
    1: work, 2: call, 3: half, 4: off,
    5: off, 6: off, 7: work, 8: call, 9: call, 10: half, 11: off,
    12: off, 13: work, 14: work, 15: call, 16: call, 17: off, 18: work,
    19: half, 20: work, 21: work, 22: work, 23: call, 24: off, 25: work,
    26: off, 27: half, 28: half, 29: call, 30: half,
  };
  // Rating dots for past rated calls
  const ratings: Record<number, string> = {
    2: '#6b7280', 8: '#d1d5db', 9: '#f9fafb', 15: '#1f2937', 16: '#6b7280',
  };
  const today = 17;
  const daysInMonth = 30;
  const startDay = 3; // April 2026 starts on Wednesday (0=Sun)

  const cells = [];
  // Empty cells before month starts
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="h-full overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #f0f9ff, #fafafa)' }}>
      <div className="bg-white px-4 py-2.5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <p className="font-bold text-gray-800 text-sm">Calls</p>
      </div>
      <div className="px-2.5 py-2">
        {/* Calendar card */}
        <div className="bg-white rounded-2xl p-3" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
          {/* Month header */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400" style={{ fontSize: 14 }}>&#8249;</span>
            <div className="text-center">
              <p className="font-bold text-gray-800" style={{ fontSize: 13 }}>April 2026</p>
              <p className="text-sky-soft-600" style={{ fontSize: 9 }}>Today</p>
            </div>
            <span className="text-gray-400" style={{ fontSize: 14 }}>&#8250;</span>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <div key={d} className="text-center text-gray-500 font-medium" style={{ fontSize: 8 }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (day === null) return <div key={i} className="aspect-square" />;
              const shift = shifts[day];
              const isToday = day === today;
              const isPast = day < today;
              const rating = ratings[day];

              const cellStyle: React.CSSProperties = {};
              if (isToday && shift) {
                cellStyle.backgroundColor = shift.color + '14';
                cellStyle.boxShadow = `inset 2px 0 0 0 ${shift.accent}, 0 0 0 1.5px #38bdf8`;
                cellStyle.color = '#0369a1';
                cellStyle.fontWeight = 600;
              } else if (isToday) {
                cellStyle.backgroundColor = '#f0f9ff';
                cellStyle.boxShadow = '0 0 0 1.5px #38bdf8';
                cellStyle.color = '#0369a1';
                cellStyle.fontWeight = 600;
              } else if (shift && !isPast) {
                cellStyle.backgroundColor = shift.color + '14';
                cellStyle.boxShadow = `inset 2px 0 0 0 ${shift.accent}`;
              } else if (shift && isPast) {
                cellStyle.backgroundColor = shift.color + '0a';
                cellStyle.boxShadow = `inset 2px 0 0 0 ${shift.accent}60`;
                cellStyle.color = '#9ca3af';
              } else if (isPast) {
                cellStyle.color = '#d1d5db';
              }

              return (
                <div
                  key={i}
                  className="aspect-square rounded-lg flex flex-col items-center justify-center relative"
                  style={cellStyle}
                >
                  <span style={{ fontSize: 9 }}>{day}</span>
                  {/* Rating dot for past rated calls */}
                  {rating && (
                    <div
                      className="rounded-full mt-0.5"
                      style={{
                        width: 5, height: 5,
                        backgroundColor: rating,
                        border: rating === '#f9fafb' ? '0.5px solid #d1d5db' : 'none',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend — matches real: Call, Off, Work, Half */}
          <div className="flex gap-3 mt-2 justify-center">
            {[
              { color: '#7dd3fc', label: 'Call' },
              { color: '#5eead4', label: 'Off' },
              { color: '#c4b5fd', label: 'Work' },
              { color: '#fdba74', label: 'Half' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color }} />
                <span className="text-gray-500" style={{ fontSize: 7 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { authStatus } = useAuth();

  // Authenticated → skip to app
  if (authStatus === 'signed_in') {
    return <Navigate to="/home" replace />;
  }

  // Brief neutral state while checking auth (usually <300ms with cached session)
  if (authStatus === 'initializing') {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <div className="min-h-screen">
      {/* Hero — deep blue gradient with phone mockup */}
      <section
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(165deg, #0369a1 0%, #0ea5e9 40%, #38bdf8 100%)' }}
      >
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.8 }}
          className="max-w-4xl relative z-10"
        >
          <p className="text-6xl mb-6">🤍</p>
          <h1 className="text-4xl sm:text-7xl font-bold text-white tracking-tight mb-4">
            White call.
          </h1>
          <p className="text-lg sm:text-2xl text-white/80 font-light leading-relaxed mb-10 max-w-lg mx-auto">
            Let your friends know you're thinking of them on call.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-8 py-4 bg-white text-sky-soft-700 rounded-full text-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg"
            >
              Get started
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 text-white/90 text-lg font-medium hover:text-white transition-colors"
            >
              Sign in
            </Link>
          </div>

          {/* Phone mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <PhoneMockup>
              <MockHomeScreen />
            </PhoneMockup>
          </motion.div>
        </motion.div>
      </section>

      {/* Calendar showcase — prominent feature */}
      <section className="py-16 sm:py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center gap-10 sm:gap-16">
            {/* Phone with calendar */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <PhoneMockup>
                <MockCalendarScreen />
              </PhoneMockup>
            </motion.div>

            {/* Text */}
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.6, delay: 0.15 }}
              viewport={{ once: true }}
              whileInView="animate"
              initial="initial"
              className="flex-1 text-center sm:text-left"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Your call schedule,<br />beautifully organized.
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-6">
                Tap to log shifts. See your month at a glance. Color-coded by type —
                call, work, day off, post-call. Rate past calls to track how you're doing.
              </p>
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                {[
                  { color: '#7dd3fc', label: 'Call' },
                  { color: '#5eead4', label: 'Off' },
                  { color: '#c4b5fd', label: 'Work' },
                  { color: '#fdba74', label: 'Half' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-gray-600">{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Emotional beat */}
      <section className="py-16 sm:py-24 px-6 bg-gray-50">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          whileInView="animate"
          initial="initial"
          className="max-w-2xl mx-auto text-center"
        >
          <p className="text-xl sm:text-2xl text-gray-600 font-light leading-relaxed">
            Call shifts are long. White call is rare.
            <br className="hidden sm:block" />{' '}
            But knowing someone noticed — that stays with you.
          </p>
        </motion.div>
      </section>

      {/* Profile insights — with phone mockup */}
      <section className="py-16 sm:py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center gap-12 sm:gap-16">
            {/* Text */}
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              whileInView="animate"
              initial="initial"
              className="flex-1 text-center sm:text-left"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Know your patterns.
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-6">
                Track your sleep, call frequency, and quality over time. See your q-rotation,
                busiest days, and how your friends support you.
              </p>
              <div className="space-y-3">
                {[
                  { emoji: '📊', text: 'Sleep trends across your last 20 calls' },
                  { emoji: '📅', text: 'Call frequency and rotation pattern' },
                  { emoji: '📤', text: 'Share beautiful recap cards to social media' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 justify-center sm:justify-start">
                    <span className="text-xl">{item.emoji}</span>
                    <span className="text-gray-600 text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Phone mockup */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <PhoneMockup>
                <MockProfileScreen />
              </PhoneMockup>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-16 sm:py-24 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            {...fadeUp}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            whileInView="animate"
            initial="initial"
            className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-16"
          >
            Built for life on call.
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {[
              {
                emoji: '🔔',
                title: 'Smart notifications',
                desc: 'Get reminded when friends are on call. Weekly recaps every Sunday.',
              },
              {
                emoji: '🔥',
                title: 'Build streaks',
                desc: 'Stay consistent supporting your friends. Your streak keeps you coming back.',
              },
              {
                emoji: '🏥',
                title: 'Find free days',
                desc: 'See when your friends are off call. Plan meetups around your schedules.',
              },
              {
                emoji: '🤳',
                title: 'Share your journey',
                desc: 'Monthly recaps, insights cards, and streak milestones — one tap to share.',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                {...fadeUp}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                viewport={{ once: true }}
                whileInView="animate"
                initial="initial"
                className="bg-white rounded-2xl p-6 shadow-sm"
              >
                <p className="text-3xl mb-3">{feature.emoji}</p>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — 3 taps */}
      <section className="py-16 sm:py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            {...fadeUp}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            whileInView="animate"
            initial="initial"
            className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-16"
          >
            Three taps. That's it.
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-8">
            {[
              {
                emoji: '👋',
                title: 'Add your friends',
                desc: 'Connect with the people you\'re training alongside.',
              },
              {
                emoji: '📅',
                title: 'Share your schedule',
                desc: 'Log your overnight, your short call, your post-call day.',
              },
              {
                emoji: '🤍',
                title: 'Send a white heart',
                desc: 'One tap. They\'ll know you\'re thinking of them.',
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                {...fadeUp}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                viewport={{ once: true }}
                whileInView="animate"
                initial="initial"
                className="text-center"
              >
                <p className="text-5xl mb-4">{step.emoji}</p>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA — blue again */}
      <section
        className="py-24 px-6"
        style={{ background: 'linear-gradient(165deg, #0369a1 0%, #0ea5e9 100%)' }}
      >
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          whileInView="animate"
          initial="initial"
          className="max-w-lg mx-auto text-center"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to support your team?
          </h2>
          <p className="text-white/70 mb-8">
            It takes 30 seconds to set up.
          </p>
          <Link
            to="/signup"
            className="inline-block px-8 py-4 bg-white text-sky-soft-700 rounded-full text-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg"
          >
            Create an account
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-400">
            WhiteCall — for Hong Kong medical residents
          </p>
        </div>
      </footer>
    </div>
  );
}
