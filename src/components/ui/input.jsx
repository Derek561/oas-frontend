export function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none ${className}`}
      {...props}
    />
  )
}
