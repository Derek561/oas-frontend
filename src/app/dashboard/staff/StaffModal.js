'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function StaffModal({ staff, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    name: staff?.name || '',
    role: staff?.role || '',
    email: staff?.email || '',
  })

  // 🔹 Handle input changes
  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // 🔹 Save or update staff
  async function handleSubmit(e) {
    e.preventDefault()

    try {
      let data, error

      if (staff?.id) {
        // 🔸 Update existing staff
        ;({ data, error } = await supabase
          .from('staff')
          .update({
            name: formData.name,
            role: formData.role,
            email: formData.email,
            updated_at: new Date(),
          })
          .eq('id', staff.id)
          .select())
      } else {
        // 🔸 Insert new staff
        ;({ data, error } = await supabase
          .from('staff')
          .insert([
            {
              name: formData.name,
              role: formData.role,
              email: formData.email,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ])
          .select())
      }

      console.log('Insert/Update result:', { data, error })
      if (error) throw error

      alert(`Staff member ${staff?.id ? 'updated' : 'added'} successfully.`)
      if (onSaved) onSaved()
      onClose()
    } catch (err) {
      console.error('Error saving staff:', err)
      alert('There was an error saving this staff record.')
    }
  }

  // 🔹 Delete a staff record
  async function handleDelete() {
    if (!staff?.id) return
    if (!confirm(`Delete ${staff.name}?`)) return

    try {
      const { error } = await supabase.from('staff').delete().eq('id', staff.id)
      if (error) throw error
      alert('Staff member deleted successfully.')
      if (onSaved) onSaved()
      onClose()
    } catch (err) {
      console.error('Error deleting staff:', err)
      alert('There was an error deleting this staff record.')
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {staff ? 'Edit Staff' : 'Add Staff'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            className="border p-2 w-full rounded"
            required
          />
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="border p-2 w-full rounded"
            required
          >
            <option value="">Select Role</option>
            <option value="Manager">Manager</option>
            <option value="Support Staff">Support Staff</option>
            <option value="Maintenance">Maintenance</option>
          </select>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="border p-2 w-full rounded"
            required
          />

          <div className="flex justify-between mt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Save
            </button>
            {staff && (
              <button
                type="button"
                onClick={handleDelete}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
