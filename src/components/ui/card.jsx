export function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`rounded-2xl bg-white/10 backdrop-blur-md shadow-md border border-white/20 p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
