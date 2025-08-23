// src/components/LoadingSpinner.js
export default function LoadingSpinner({ size = "h-32 w-32", color = "border-blue-600" }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className={`animate-spin rounded-full ${size} border-b-2 ${color}`}></div>
    </div>
  );
}