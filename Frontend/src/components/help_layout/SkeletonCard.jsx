
export default function SkeletonCard({ isDarkMode }) {
  return (
    <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border animate-pulse`}>
      <div className="flex items-start space-x-4">
        <div className={`w-12 h-12 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
        <div className="flex-1 space-y-3">
          <div className={`h-3 w-16 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
          <div className={`h-4 w-3/4 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
        </div>
      </div>
    </div>
  );
}