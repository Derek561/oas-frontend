'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import StaffModal from '@/components/modals/StaffModal'

export default function StaffPage() {
  const [staffList, setStaffList] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Load staff on mount
  async function loadStaff() {
    setLoading(true)
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('name')

    if (!error) setStaffList(data)
    setLoading(false)
  }

  useEffect(() => {
    loadStaff()
  }, [])

  function openAdd() {
    setSelectedStaff(null)
    setModalOpen(true)
  }

  function openEdit(staff) {
    setSelectedStaff(staff)
    setModalOpen(true)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Staff</h1>
        <button
          onClick={openAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add Staff
        </button>
      </div>

      {loading ? (
        <p>Loading staff...</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Name</th>
              <th className="border p-2 text-left">Role</th>
              <th className="border p-2 text-left">Email</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {staffList.map((s) => (
              <tr key={s.id}>
                <td className="border p-2">{s.name}</td>
                <td className="border p-2">{s.role}</td>
                <td className="border p-2">{s.email}</td>
                <td className="border p-2 text-center">
                  <button
                    onClick={() => openEdit(s)}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <StaffModal
          staff={selectedStaff}
          onClose={() => setModalOpen(false)}
          onSaved={loadStaff}
        />
      )}
    </div>
  )
}
