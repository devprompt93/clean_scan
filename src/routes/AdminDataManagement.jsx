import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav'
import { getUsers } from '../services/api'

const CITIES = ['Cape Town', 'Durban', 'Johannesburg']
const CITY_PREFIX = {
  'Cape Town': 'CPT',
  'Durban': 'DBN',
  'Johannesburg': 'JHB',
}

function generateNextProviderCode(city, users) {
  const prefix = CITY_PREFIX[city]
  const numbers = users
    .filter(u => u.role === 'provider' && u.city === city && typeof u.providerCode === 'string' && u.providerCode.startsWith(prefix + '-'))
    .map(u => parseInt(u.providerCode.split('-')[1] || '0', 10))
    .filter(n => !isNaN(n))
  const next = (numbers.length ? Math.max(...numbers) : 0) + 1
  return `${prefix}-${String(next).padStart(3, '0')}`
}

function ensureProviderCode(user, users) {
  if (user.role !== 'provider' || !user.city) return user
  if (user.providerCode && user.providerCode.startsWith(CITY_PREFIX[user.city] + '-')) return user
  return { ...user, providerCode: generateNextProviderCode(user.city, users) }
}

const Modal = ({ open, title, children, onClose }) => {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="card" style={{ width: '100%', maxWidth: 520 }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title" style={{ margin: 0 }}>{title}</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: 'var(--spacing-md)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

const AdminDataManagement = () => {
  const [user, setUser] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const [cityFilter, setCityFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('providerCode')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
  const pageSize = 8

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [pending, setPending] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
    if (!currentUser.id || currentUser.role !== 'admin') {
      navigate('/login')
      return
    }
    setUser(currentUser)

    const local = localStorage.getItem('admin_dm_users')
    if (local) {
      try {
        const parsed = JSON.parse(local)
        setUsers(parsed)
        setLoading(false)
        return
      } catch {}
    }

    getUsers()
      .then(base => {
        // Seed with city/code if possible (leave empty by default)
        const seeded = base.map(u => ({ ...u, city: u.city || '', providerCode: u.role === 'provider' ? '' : undefined }))
        setUsers(seeded)
      })
      .finally(() => setLoading(false))
  }, [navigate])

  useEffect(() => {
    localStorage.setItem('admin_dm_users', JSON.stringify(users))
  }, [users])

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem('pending_registrations') || '[]')
      setPending(p)
    } catch {
      setPending([])
    }
  }, [])

  const refreshPending = () => {
    try {
      const p = JSON.parse(localStorage.getItem('pending_registrations') || '[]')
      setPending(p)
    } catch {
      setPending([])
    }
  }

  const approvePending = (pid) => {
    const item = pending.find(p => p.id === pid)
    if (!item) return
    const fullName = `${item.firstName} ${item.lastName}`.trim()
    let newUser = { id: `local_${Date.now()}`, name: fullName, role: 'provider', city: item.city, providerCode: '', email: (item.email || '').toLowerCase(), password: item.password }
    newUser = ensureProviderCode(newUser, users)
    setUsers(prev => [newUser, ...prev])
    const updated = pending.filter(p => p.id !== pid)
    setPending(updated)
    localStorage.setItem('pending_registrations', JSON.stringify(updated))
  }

  const rejectPending = (pid) => {
    const updated = pending.filter(p => p.id !== pid)
    setPending(updated)
    localStorage.setItem('pending_registrations', JSON.stringify(updated))
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users
      .filter(u => (cityFilter === 'All' ? true : u.city === cityFilter))
      .filter(u => {
        if (!q) return true
        const hay = `${u.name || ''} ${u.providerCode || ''} ${u.id || ''}`.toLowerCase()
        return hay.includes(q)
      })
  }, [users, cityFilter, search])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      const aVal = (a[sortBy] || '').toString().toLowerCase()
      const bVal = (b[sortBy] || '').toString().toLowerCase()
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return arr
  }, [filtered, sortBy, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const pageItems = useMemo(() => sorted.slice((page - 1) * pageSize, page * pageSize), [sorted, page])

  const toggleSort = (key) => {
    if (sortBy === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortBy(key); setSortDir('asc') }
  }

  const openAdd = () => { setIsAddOpen(true) }
  const openEdit = (u) => { setEditingUser(u); setIsEditOpen(true) }

  const handleDelete = (id) => {
    const u = users.find(x => x.id === id)
    const label = u?.name || id
    if (!window.confirm(`Delete user "${label}"? This cannot be undone.`)) return
    setUsers(prev => prev.filter(x => x.id !== id))
    // Clean up assignments
    try {
      const raw = localStorage.getItem('providerAssignments')
      if (raw) {
        const assignments = JSON.parse(raw)
        if (assignments && assignments[id]) {
          delete assignments[id]
          localStorage.setItem('providerAssignments', JSON.stringify(assignments))
        }
      }
    } catch {}
  }

  const [addForm, setAddForm] = useState({ name: '', role: 'provider', city: 'Cape Town' })

  const submitAdd = () => {
    if (!addForm.name.trim()) return alert('Name is required')
    if (!addForm.role) return alert('Role is required')
    let newUser = {
      id: `local_${Date.now()}`,
      name: addForm.name.trim(),
      role: addForm.role,
      city: addForm.role === 'provider' ? addForm.city : '',
      providerCode: addForm.role === 'provider' ? '' : undefined,
      username: '',
      password: '',
    }
    if (newUser.role === 'provider') {
      newUser = ensureProviderCode(newUser, users)
    }
    setUsers(prev => [newUser, ...prev])
    setIsAddOpen(false)
    setAddForm({ name: '', role: 'provider', city: 'Cape Town' })
  }

  const [editForm, setEditForm] = useState({ id: '', name: '', role: 'provider', city: 'Cape Town', providerCode: '' })
  useEffect(() => {
    if (!isEditOpen || !editingUser) return
    setEditForm({
      id: editingUser.id,
      name: editingUser.name || '',
      role: editingUser.role || 'provider',
      city: editingUser.city || 'Cape Town',
      providerCode: editingUser.providerCode || '',
    })
  }, [isEditOpen, editingUser])

  const submitEdit = () => {
    if (!editForm.name.trim()) return alert('Name is required')
    setUsers(prev => {
      const copy = prev.map(u => ({ ...u }))
      const idx = copy.findIndex(u => u.id === editForm.id)
      if (idx === -1) return prev
      const before = copy[idx]
      copy[idx].name = editForm.name.trim()
      copy[idx].role = editForm.role
      copy[idx].city = editForm.role === 'provider' ? editForm.city : ''
      if (copy[idx].role !== 'provider') {
        copy[idx].providerCode = undefined
      } else {
        // update providerCode if city changed or missing
        if (!before.providerCode || before.city !== copy[idx].city || !before.providerCode.startsWith(CITY_PREFIX[copy[idx].city] + '-')) {
          copy[idx].providerCode = generateNextProviderCode(copy[idx].city, copy)
        }
      }
      return copy
    })
    setIsEditOpen(false)
  }

  if (loading) {
    return (
      <div className="page-container">
        <TopNav user={user} />
        <div className="container" style={{ paddingTop: '40px', textAlign: 'center' }}>
          <div className="spinner" style={{ width: '40px', height: '40px' }} />
          <p className="mt-3">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <TopNav user={user} />
      <div className="container" style={{ paddingTop: '40px' }}>
        <div className="card mb-4">
          <h1 className="text-2xl font-bold mb-2">Data Management</h1>
          <p className="text-gray">Manage users, filter providers by city, and maintain city-based provider IDs.</p>
        </div>

        <div className="card mb-4">
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">City</label>
              <select className="input" value={cityFilter} onChange={(e) => { setCityFilter(e.target.value); setPage(1) }}>
                <option>All</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ flex: 1, minWidth: 220, marginBottom: 0 }}>
              <label className="label">Search</label>
              <input className="input" placeholder="Filter by name or Provider ID" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
            </div>

            <div style={{ marginLeft: 'auto' }}>
              <button className="btn btn-primary" onClick={openAdd}>＋ Add User</button>
              <button className="btn btn-secondary ml-2" onClick={refreshPending}>🔄 Refresh Pending</button>
              {pending.length > 0 && (
                <span className="badge badge-warning ml-2">Pending: {pending.length}</span>
              )}
            </div>
          </div>
        </div>

        {pending.length > 0 && (
          <div className="card mb-4">
            <div className="card-header">
              <h2 className="card-title">Pending Provider Registrations</h2>
              <p className="card-subtitle">Review registrations submitted by providers and add them to the system</p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>City</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map(p => (
                    <tr key={p.id}>
                      <td>{p.firstName} {p.lastName}</td>
                      <td>{p.city}</td>
                      <td>{new Date(p.createdAt).toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                          <button className="btn btn-success btn-sm" onClick={() => approvePending(p.id)}>Approve & Add</button>
                          <button className="btn btn-error btn-sm" onClick={() => rejectPending(p.id)}>Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('providerCode')}>Provider ID {sortBy==='providerCode' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('name')}>Name {sortBy==='name' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('role')}>Role {sortBy==='role' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('city')}>City {sortBy==='city' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map(u => (
                  <tr key={u.id}>
                    <td>{u.role === 'provider' ? (u.providerCode || '—') : '—'}</td>
                    <td>{u.name}</td>
                    <td>{u.role}</td>
                    <td>{u.role === 'provider' ? (u.city || '—') : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>Edit</button>
                        <button className="btn btn-error btn-sm" onClick={() => handleDelete(u.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sorted.length === 0 && (
            <div className="text-center text-gray" style={{ padding: 'var(--spacing-lg)' }}>No users match your filters.</div>
          )}

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--spacing-md)' }}>
            <div className="text-sm text-gray">Page {page} of {totalPages}</div>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <button className="btn btn-secondary btn-sm" disabled={page<=1} onClick={() => setPage(p => Math.max(1, p-1))}>Prev</button>
              <button className="btn btn-secondary btn-sm" disabled={page>=totalPages} onClick={() => setPage(p => Math.min(totalPages, p+1))}>Next</button>
            </div>
          </div>
        </div>

        {/* Add Modal */}
        <Modal open={isAddOpen} title="Add User" onClose={() => setIsAddOpen(false)}>
          <div className="form-group">
            <label className="label">Name</label>
            <input className="input" value={addForm.name} onChange={(e)=>setAddForm(f=>({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="label">Role</label>
            <select className="input" value={addForm.role} onChange={(e)=>setAddForm(f=>({ ...f, role: e.target.value }))}>
              <option value="provider">Provider</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {addForm.role === 'provider' && (
            <div className="form-group">
              <label className="label">City</label>
              <select className="input" value={addForm.city} onChange={(e)=>setAddForm(f=>({ ...f, city: e.target.value }))}>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={()=>setIsAddOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitAdd}>Save</button>
          </div>
        </Modal>

        {/* Edit Modal */}
        <Modal open={isEditOpen} title="Edit User" onClose={() => setIsEditOpen(false)}>
          <div className="form-group">
            <label className="label">Name</label>
            <input className="input" value={editForm.name} onChange={(e)=>setEditForm(f=>({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="label">Role</label>
            <select className="input" value={editForm.role} onChange={(e)=>setEditForm(f=>({ ...f, role: e.target.value }))}>
              <option value="provider">Provider</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {editForm.role === 'provider' && (
            <div className="form-group">
              <label className="label">City</label>
              <select className="input" value={editForm.city} onChange={(e)=>setEditForm(f=>({ ...f, city: e.target.value }))}>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
          {editForm.role === 'provider' && (
            <div className="form-group">
              <label className="label">Provider ID</label>
              <input className="input" value={editForm.providerCode} readOnly placeholder="Auto-generated" />
              <div className="text-xs text-gray">Changes when city changes.</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={()=>setIsEditOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitEdit}>Save</button>
          </div>
        </Modal>
      </div>
    </div>
  )
}

export default AdminDataManagement 