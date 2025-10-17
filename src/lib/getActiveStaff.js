// ✅ src/lib/getActiveStaff.js

// Save session data safely (browser only)
export function saveStaffSession(staff) {
  if (typeof window !== 'undefined' && window.localStorage && staff) {
    localStorage.setItem('staff_session_id', staff.id || '')
    localStorage.setItem('staff_name', staff.name || '')
    localStorage.setItem('staff_role', staff.role || '')
    localStorage.setItem('staff_login_time', new Date().toISOString())
  }
}

// Retrieve active staff session
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
  return null
}

// Clear session safely
export function clearStaffSession() {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('staff_session_id')
    localStorage.removeItem('staff_name')
    localStorage.removeItem('staff_role')
    localStorage.removeItem('staff_login_time')
  }
}