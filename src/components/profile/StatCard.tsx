// Compact stat display card for profile
interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
}

export function StatCard({ label, value, subtext }: StatCardProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {subtext && (
        <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>
      )}
    </div>
  );
}
