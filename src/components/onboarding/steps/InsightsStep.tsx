// Insights step - show users they can track and share call trends
export function InsightsStep() {
  return (
    <div className="text-center">
      {/* Emoji header */}
      <div className="text-6xl mb-4">📊</div>

      {/* Title */}
      <h2 className="text-xl font-bold text-gray-800 mb-2">Track Your Trends</h2>

      {/* Description */}
      <p className="text-gray-600 mb-6">
        See your sleep patterns, call frequency, and rating breakdown over time
      </p>

      {/* Visual demo - mini insights preview */}
      <div className="bg-gray-50 rounded-xl p-4 mx-auto max-w-xs">
        {/* Mini sleep bars */}
        <div className="flex items-end justify-between gap-1 mb-3" style={{ height: 40 }}>
          {[3, 2, 4, 1, 3, 5, 2].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-gray-400"
              style={{ height: `${(h / 5) * 100}%` }}
            />
          ))}
        </div>
        <p className="text-xs text-gray-500 mb-3">Sleep trends across your calls</p>

        {/* Share hint */}
        <div className="bg-sky-50 text-sky-700 text-sm px-3 py-2 rounded-lg flex items-center gap-2">
          <span>📤</span>
          <span>Share your insights to social media</span>
        </div>
      </div>

      {/* Caption */}
      <p className="text-sm text-gray-500 mt-4">
        Tap the share icon on your Profile page
      </p>
    </div>
  );
}
