export function Label({ className = '', children, ...props }) {
  return (
    <label
      className={`text-sm font-medium text-gray-700 mb-1 block ${className}`}
      {...props}
    >
      {children}
    </label>
  )
}
