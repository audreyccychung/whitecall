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
    <div className={`relative mx-auto ${className}`} style={{ width: 280 }}>
      {/* Phone frame */}
      <div className="bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-gray-900 rounded-b-2xl z-10" />
        {/* Screen */}
        <div className="bg-white rounded-[2rem] overflow-hidden" style={{ height: 520 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Mock home screen — friends on call with heart buttons
function MockHomeScreen() {
  const friends = [
    { name: 'Sarah', emoji: '🐱', color: 'bg-pink-200', sent: false },
    { name: 'Jason', emoji: '🐻', color: 'bg-blue-200', sent: true },
    { name: 'Wing Yan', emoji: '🐰', color: 'bg-purple-200', sent: false },
  ];
  return (
    <div className="h-full bg-gradient-to-br from-sky-50 to-white overflow-hidden">
      {/* Header */}
      <div className="bg-white px-4 py-3 shadow-sm">
        <p className="font-bold text-gray-800">WhiteCall</p>
      </div>
      <div className="px-4 py-3 space-y-3">
        {/* User status */}
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-lg">🐶</div>
            <div>
              <p className="text-sm font-medium text-gray-800">You received 3 hearts today</p>
              <p className="text-xs text-gray-500">On call · 12h remaining</p>
            </div>
          </div>
        </div>
        {/* Streak */}
        <div className="bg-gradient-to-r from-orange-100 to-amber-100 rounded-xl px-4 py-2 flex items-center justify-center gap-2">
          <span>🔥</span>
          <span className="font-semibold text-orange-700 text-sm">8-day streak!</span>
        </div>
        {/* Friends on call */}
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-700">Friends on call</p>
            <p className="text-xs text-gray-400">3 today</p>
          </div>
          <div className="space-y-1.5">
            {friends.map((f) => (
              <div key={f.name} className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full ${f.color} flex items-center justify-center text-sm`}>{f.emoji}</div>
                  <p className="text-sm font-medium text-gray-700">{f.name}</p>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${f.sent ? 'bg-pink-100' : 'bg-sky-100'}`}>
                  <span className="text-sm">{f.sent ? '💗' : '🤍'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Activity feed preview */}
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <p className="text-xs font-semibold text-gray-700 mb-2">Support Feed</p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-pink-200 flex items-center justify-center text-xs mt-0.5">🐱</div>
              <div>
                <p className="text-xs text-gray-600"><span className="font-medium">Sarah</span> rated her call</p>
                <p className="text-xs text-gray-400">Great · 5h sleep · 😴</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-xs mt-0.5">🐻</div>
              <div>
                <p className="text-xs text-gray-600"><span className="font-medium">Jason</span> rated his call</p>
                <p className="text-xs text-gray-400">Okay · 2h sleep · 😴</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mock profile screen — insights preview
function MockProfileScreen() {
  const bars = [3, 2, 5, 1, 4, 3, 6, 2, 4, 3];
  const barColors = ['#6b7280', '#1f2937', '#d1d5db', '#1f2937', '#ffffff', '#6b7280', '#d1d5db', '#1f2937', '#6b7280', '#d1d5db'];
  return (
    <div className="h-full bg-gradient-to-br from-sky-50 to-white overflow-hidden">
      <div className="bg-white px-4 py-3 shadow-sm">
        <p className="font-bold text-gray-800">Profile</p>
      </div>
      <div className="px-4 py-3 space-y-3">
        {/* Hero */}
        <div className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center text-xl">🐶</div>
          <div>
            <p className="font-bold text-gray-800 text-sm">Audrey</p>
            <p className="text-xs text-gray-500">@audreychung</p>
          </div>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: 'Calls', value: '6' },
            { label: 'Quality', value: '●' },
            { label: 'Avg Sleep', value: '3.2h' },
            { label: 'Support', value: '2.1 🤍' },
          ].map((s) => (
            <div key={s.label} className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-sm font-bold text-gray-800">{s.value}</p>
              <p className="text-[10px] text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
        {/* Sleep chart */}
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <p className="text-xs font-semibold text-gray-700 mb-2">Sleep Over Time</p>
          <div className="flex items-end gap-1" style={{ height: 60 }}>
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t"
                style={{
                  height: `${(h / 6) * 100}%`,
                  backgroundColor: barColors[i],
                  border: barColors[i] === '#ffffff' ? '1px solid #d1d5db' : 'none',
                }}
              />
            ))}
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-1">Avg 3.2h · 10 calls</p>
        </div>
        {/* Rating breakdown */}
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <p className="text-xs font-semibold text-gray-700 mb-2">Ratings</p>
          {[
            { label: 'Great', pct: 15, color: '#f9fafb', border: true },
            { label: 'Good', pct: 35, color: '#d1d5db', border: false },
            { label: 'Okay', pct: 35, color: '#6b7280', border: false },
            { label: 'Rough', pct: 15, color: '#1f2937', border: false },
          ].map((r) => (
            <div key={r.label} className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: r.color, border: r.border ? '1px solid #d1d5db' : 'none' }}
              />
              <span className="text-[10px] text-gray-500 w-8">{r.label}</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${r.pct}%`, backgroundColor: r.color, border: r.border ? '1px solid #d1d5db' : 'none' }} />
              </div>
            </div>
          ))}
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
          <h1 className="text-5xl sm:text-7xl font-bold text-white tracking-tight mb-4">
            White call.
          </h1>
          <p className="text-xl sm:text-2xl text-white/80 font-light leading-relaxed mb-10 max-w-lg mx-auto">
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

      {/* How it works */}
      <section className="py-24 px-6 bg-white">
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

      {/* Emotional beat */}
      <section className="py-24 px-6 bg-gray-50">
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
      <section className="py-24 px-6 bg-white">
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
      <section className="py-24 px-6 bg-gray-50">
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
