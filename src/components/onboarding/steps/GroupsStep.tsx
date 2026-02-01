// Groups step - explain group functionality
export function GroupsStep() {
  return (
    <div className="text-center">
      {/* Emoji header */}
      <div className="text-6xl mb-4">🏥</div>

      {/* Title */}
      <h2 className="text-xl font-bold text-gray-800 mb-2">Find Free Days</h2>

      {/* Description */}
      <p className="text-gray-600 mb-6">
        Create a group to see when everyone's free and plan meetups around calls
      </p>

      {/* Visual demo - group card */}
      <div className="bg-gray-50 rounded-xl p-4 mx-auto max-w-xs">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">👩‍⚕️</span>
          <div className="text-left">
            <p className="font-medium text-gray-800 text-sm">Ro 1 PWH Med</p>
            <p className="text-xs text-gray-500">5 members</p>
          </div>
        </div>

        {/* Mock avatars */}
        <div className="flex items-center gap-1 mb-3">
          <div className="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center text-sm border-2 border-white">
            🐱
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-sm border-2 border-white -ml-2">
            🐻
          </div>
          <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-sm border-2 border-white -ml-2">
            🐶
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs border-2 border-white -ml-2 text-gray-600">
            +2
          </div>
        </div>

        {/* Next free day banner */}
        <div className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded-lg flex items-center gap-2">
          <span>🎉</span>
          <span>Next free day: Saturday</span>
        </div>
      </div>

      {/* Caption */}
      <p className="text-sm text-gray-500 mt-4">
        Find days when no one is on call
      </p>
    </div>
  );
}
