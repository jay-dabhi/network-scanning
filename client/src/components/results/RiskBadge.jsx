export default function RiskBadge({ level, score }) {
  const getBadgeStyles = () => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getBadgeStyles()}`}>
      <span className="font-bold uppercase text-xs">{level || 'Unknown'}</span>
      {score !== undefined && (
        <span className="text-xs">({score}/100)</span>
      )}
    </div>
  );
}
