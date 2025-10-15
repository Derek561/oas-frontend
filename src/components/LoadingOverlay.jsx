'use client'
export default function LoadingOverlay({ text = 'Loading…' }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center space-y-3">
        <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-700 text-sm">{text}</p>
      </div>
    </div>
  )
}
