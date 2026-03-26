// Call frequency insights: rotation pattern, monthly comparison
interface CallFrequencyProps {
  avgGapDays: number | null;
  callsThisMonth: number;
  lastMonthCalls: number;
  totalCalls: number;
}

export function CallFrequency({ avgGapDays, callsThisMonth, lastMonthCalls, totalCalls }: CallFrequencyProps) {
  if (totalCalls === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <p className="text-sm text-gray-500">Log calls to see frequency stats</p>
      </div>
    );
  }

  const rotationNumber = avgGapDays !== null ? Math.round(avgGapDays) : null;

  return (
    <div>
      <h4 className="text-xs font-medium text-gray-500 mb-3">Call Frequency</h4>

      {/* Rotation headline */}
      {rotationNumber !== null && totalCalls >= 5 && (
        <div className="mb-3">
          <p className="text-2xl font-bold text-gray-800">q{rotationNumber}d</p>
          <p className="text-xs text-gray-500">
            Every {avgGapDays!.toFixed(1)} days on average
          </p>
        </div>
      )}

      {/* Monthly comparison */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">This month</span>
          <span className="font-medium text-gray-800">{callsThisMonth}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Last month</span>
          <span className="font-medium text-gray-800">{lastMonthCalls}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">All time</span>
          <span className="font-medium text-gray-800">{totalCalls}</span>
        </div>
      </div>
    </div>
  );
}
