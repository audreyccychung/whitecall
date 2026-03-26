// Landing page — Apple-style marketing page for unauthenticated visitors
// Authenticated users redirect straight to /home
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

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
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="min-h-[85vh] flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.8 }}
          className="max-w-lg"
        >
          <p className="text-6xl mb-8">🤍</p>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight mb-6">
            White call.
          </h1>
          <p className="text-xl sm:text-2xl text-gray-500 font-light leading-relaxed mb-12">
            Let your friends know you're thinking of them on call.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white rounded-full text-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Get started
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 text-gray-600 text-lg font-medium hover:text-gray-900 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </motion.div>
      </section>

      {/* How it works */}
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
      <section className="py-24 px-6">
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

      {/* Features */}
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
                emoji: '📊',
                title: 'Track your trends',
                desc: 'Sleep patterns, call frequency, and rating breakdowns — all in one place.',
              },
              {
                emoji: '📤',
                title: 'Share your stats',
                desc: 'Generate beautiful recap cards for social media with one tap.',
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

      {/* Final CTA */}
      <section className="py-24 px-6">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          whileInView="animate"
          initial="initial"
          className="max-w-lg mx-auto text-center"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Ready to support your team?
          </h2>
          <p className="text-gray-500 mb-8">
            It takes 30 seconds to set up.
          </p>
          <Link
            to="/signup"
            className="inline-block px-8 py-4 bg-gray-900 text-white rounded-full text-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Create an account
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-400">
            WhiteCall — for Hong Kong medical residents
          </p>
        </div>
      </footer>
    </div>
  );
}
