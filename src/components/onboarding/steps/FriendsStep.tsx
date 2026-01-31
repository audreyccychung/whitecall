// Friends step - explain adding friends
export function FriendsStep() {
  return (
    <div className="text-center">
      {/* Emoji header */}
      <div className="text-6xl mb-4">👥</div>

      {/* Title */}
      <h2 className="text-xl font-bold text-gray-800 mb-2">Connect With Friends</h2>

      {/* Description */}
      <p className="text-gray-600 mb-6">
        Add colleagues by their username to support each other
      </p>

      {/* Visual demo - add friend form */}
      <div className="bg-gray-50 rounded-xl p-4 mx-auto max-w-xs">
        <div className="flex gap-2">
          <div className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-left text-sm text-gray-400">
            @sarah_md
          </div>
          <div className="px-4 py-2 bg-sky-soft-500 text-white rounded-lg text-sm font-medium">
            Add
          </div>
        </div>

        {/* Mock added friends */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg">
            <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-xs">
              🐻
            </div>
            <span className="text-sm text-gray-700">Mike</span>
            <span className="ml-auto text-xs text-green-600">Added</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg">
            <div className="w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center text-xs">
              🐰
            </div>
            <span className="text-sm text-gray-700">Lisa</span>
            <span className="ml-auto text-xs text-green-600">Added</span>
          </div>
        </div>
      </div>

      {/* Caption */}
      <p className="text-sm text-gray-500 mt-4">
        Share your username with colleagues
      </p>
    </div>
  );
}
