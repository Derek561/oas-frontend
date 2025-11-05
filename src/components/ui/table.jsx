export function Table({ children, className = '', ...props }) {
  return (
    <table
      className={`w-full border-collapse border border-gray-200 rounded-xl overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </table>
  )
}
