// Welcome step - introduce the core concept
export function WelcomeStep() {
  return (
    <div className="text-center">
      {/* Emoji header */}
      <div className="text-6xl mb-4">🤍</div>

      {/* Title */}
      <h2 className="text-xl font-bold text-gray-800 mb-2">Welcome to WhiteCall</h2>

      {/* Description */}
      <p className="text-gray-600 mb-6">
        Support friends on tough call days with a simple tap
      </p>

      {/* Visual demo */}
      <div className="bg-gray-50 rounded-xl p-4 mx-auto max-w-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mock avatar */}
            <div className="w-10 h-10 rounded-full bg-pink-200 flex items-center justify-center text-lg">
              🐱
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-800 text-sm">Sarah</p>
              <p className="text-xs text-red-500">On call today</p>
            </div>
          </div>
          {/* Heart button mock */}
          <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
            <span className="text-lg">❤️</span>
          </div>
        </div>
      </div>

      {/* Caption */}
      <p className="text-sm text-gray-500 mt-4">
        Tap the heart to let them know you care
      </p>
    </div>
  );
}
