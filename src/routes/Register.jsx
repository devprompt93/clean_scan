import { useState } from 'react'
import { SA_CITIES } from '../lib/cities'
import { useNavigate, Link } from 'react-router-dom'

// Use shared SA cities list

const Register = () => {
  const [form, setForm] = useState({ firstName: '', lastName: '', city: 'Cape Town', email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim()) {
      alert('Please enter your first and last name')
      return
    }
    if (!form.email.trim()) {
      alert('Please enter your email')
      return
    }
    if (!form.password.trim()) {
      alert('Please enter your password')
      return
    }
    setSubmitting(true)
    try {
      const pending = JSON.parse(localStorage.getItem('pending_registrations') || '[]')
      pending.push({
        id: `pending_${Date.now()}`,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        city: form.city,
        email: form.email.trim().toLowerCase(),
        password: form.password,
        createdAt: new Date().toISOString(),
      })
      localStorage.setItem('pending_registrations', JSON.stringify(pending))
      localStorage.setItem('pending_registrations_ts', String(Date.now()))
      alert('Registration submitted. An admin will review and add you to the system.')
      navigate('/login')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-container">
      <div className="container" style={{ maxWidth: '420px', paddingTop: '80px' }}>
        <div className="card">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-primary mb-2">Provider Registration</h1>
            <p className="text-gray">Submit your details. Admin approval required.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">First Name</label>
              <input className="input" value={form.firstName} onChange={(e)=>setForm(f=>({ ...f, firstName: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">Last Name</label>
              <input className="input" value={form.lastName} onChange={(e)=>setForm(f=>({ ...f, lastName: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={(e)=>setForm(f=>({ ...f, email: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input type="password" className="input" value={form.password} onChange={(e)=>setForm(f=>({ ...f, password: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">City</label>
              <select className="input" value={form.city} onChange={(e)=>setForm(f=>({ ...f, city: e.target.value }))}>
                {SA_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button type="submit" className={`btn btn-primary btn-lg ${submitting ? 'loading' : ''}`} disabled={submitting}>
              {submitting ? <span className="spinner"></span> : null}
              Submit Registration
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/login" className="text-sm">Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register 