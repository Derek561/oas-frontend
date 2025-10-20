export function logoutStaff() {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('staff_session_id')
    localStorage.removeItem('staff_name')
    localStorage.removeItem('staff_role')
    localStorage.removeItem('staff_login_time')
  }

  // Optional redirect (only works client-side)
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}
