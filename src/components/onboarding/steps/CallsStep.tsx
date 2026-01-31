// Calls step - explain marking call days
export function CallsStep() {
  return (
    <div className="text-center">
      {/* Emoji header */}
      <div className="text-6xl mb-4">📅</div>

      {/* Title */}
      <h2 className="text-xl font-bold text-gray-800 mb-2">Mark Your Call Days</h2>

      {/* Description */}
      <p className="text-gray-600 mb-6">
        Tap dates when you're on call so friends can support you
      </p>

      {/* Visual demo - mini calendar */}
      <div className="bg-gray-50 rounded-xl p-4 mx-auto max-w-xs">
        <div className="text-xs text-gray-500 mb-2 font-medium">January 2026</div>
        <div className="grid grid-cols-7 gap-1 text-xs">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-gray-400 text-center py-1">{day}</div>
          ))}
          {/* Empty cells for offset */}
          {[...Array(3)].map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {/* Days 1-14 */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((day) => (
            <div
              key={day}
              className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${
                day === 7 || day === 14
                  ? 'bg-sky-soft-500 text-white font-medium'
                  : 'text-gray-600'
              }`}
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Caption */}
      <p className="text-sm text-gray-500 mt-4">
        Friends will see when you're on call
      </p>
    </div>
  );
}
