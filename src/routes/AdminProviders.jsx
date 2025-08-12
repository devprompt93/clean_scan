import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav'
import { getToilets, getUsersWithLocal, getProviderAssignments, saveProviderAssignments } from '../services/api'

const AdminProviders = () => {
  const [user, setUser] = useState(null)
  const [providers, setProviders] = useState([])
  const [toilets, setToilets] = useState([])
  const [assignments, setAssignments] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
    if (!currentUser.id || currentUser.role !== 'admin') {
      navigate('/login')
      return
    }
    setUser(currentUser)

    Promise.all([getUsersWithLocal(), getToilets(), getProviderAssignments()])
      .then(([users, toiletsData, existingAssignments]) => {
        setProviders(users.filter(u => u.role === 'provider'))
        setToilets(toiletsData)
        setAssignments(existingAssignments)
      })
      .finally(() => setLoading(false))
  }, [navigate])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'admin_dm_users') {
        getUsersWithLocal().then(users => setProviders(users.filter(u => u.role === 'provider')))
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const refreshProviders = async () => {
    const users = await getUsersWithLocal()
    setProviders(users.filter(u => u.role === 'provider'))
  }

  const handleToggleAssignment = (providerId, toiletId) => {
    setAssignments(prev => {
      const current = new Set(prev[providerId] || [])
      if (current.has(toiletId)) current.delete(toiletId)
      else current.add(toiletId)
      return { ...prev, [providerId]: Array.from(current) }
    })
  }

  const saveAll = async () => {
    setSaving(true)
    try {
      saveProviderAssignments(assignments)
      alert('Assignments saved locally. In production, this would call the backend.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <TopNav user={user} />
        <div className="container" style={{ paddingTop: '40px', textAlign: 'center' }}>
          <div className="spinner" style={{ width: '40px', height: '40px' }} />
          <p className="mt-3">Loading providers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <TopNav user={user} />
      <div className="container" style={{ paddingTop: '40px' }}>
        <div className="card mb-4">
          <h1 className="text-2xl font-bold mb-2">Provider Management</h1>
          <p className="text-gray">Assign toilets to providers. Changes are saved to your browser for now.</p>
        </div>

        <div className="card mb-4">
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
            <button className={`btn btn-primary ${saving ? 'loading' : ''}`} disabled={saving} onClick={saveAll}>
              {saving ? <span className="spinner"></span> : '💾'} Save Assignments
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/admin')}>
              ← Back to Dashboard
            </button>
            <button className="btn btn-secondary" onClick={refreshProviders}>
              🔄 Refresh Providers
            </button>
          </div>
        </div>

        <div className="grid grid-2">
          {providers.map(p => (
            <div key={p.id} className="card">
              <div className="card-header">
                <h2 className="card-title">{p.name}</h2>
                <p className="card-subtitle">ID: {p.id}</p>
              </div>

              <div style={{ maxHeight: 320, overflow: 'auto', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)' }}>
                <table className="table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Assign</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Toilet</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Area</th>
                    </tr>
                  </thead>
                  <tbody>
                    {toilets.map(t => {
                      const checked = (assignments[p.id] || []).includes(t.id)
                      return (
                        <tr key={t.id}>
                          <td style={{ padding: '8px' }}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggleAssignment(p.id, t.id)}
                            />
                          </td>
                          <td style={{ padding: '8px' }}>
                            <div style={{ fontWeight: 500 }}>{t.name}</div>
                            <div className="text-xs text-gray">{t.id}</div>
                          </td>
                          <td style={{ padding: '8px' }}>{t.area}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 text-sm text-gray">
                Assigned: <strong>{(assignments[p.id] || []).length}</strong> / {toilets.length}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminProviders 