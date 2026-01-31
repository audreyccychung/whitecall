// Compact stat display card for profile
import { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number | ReactNode;
  subtext?: string;
}

export function StatCard({ label, value, subtext }: StatCardProps) {
  const isTextValue = typeof value === 'string' || typeof value === 'number';

  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      {isTextValue ? (
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      ) : (
        <div className="flex justify-center items-center h-8">{value}</div>
      )}
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {subtext && (
        <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>
      )}
    </div>
  );
}
