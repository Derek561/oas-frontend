export function Button({ className = '', children, ...props }) {
  return (
    <button
      className={`bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 active:scale-[.98] transition ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
