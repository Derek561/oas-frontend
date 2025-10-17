export function getActiveStaff() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const staffId = localStorage.getItem('staff_session_id')
    const staffName = localStorage.getItem('staff_name')
    const staffRole = localStorage.getItem('staff_role')

    if (staffId && staffName) {
      return {
        id: staffId,
        name: staffName,
        role: staffRole || 'Staff',
      }
    }
  }

  // Fallback if not in browser or no session
  return null
}
