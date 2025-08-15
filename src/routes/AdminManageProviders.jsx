import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav'
import '../styles/providers.css'
import { 
  getToilets, 
  getUsers, 
  getUsersWithLocal, 
  getProviderAssignments, 
  saveProviderAssignments 
} from '../services/api'
import { SA_CITIES, ensureProviderCode, generateNextProviderCode, getCityPrefix } from '../lib/cities'

// Use shared cities and code helpers

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

const AdminManageProviders = () => {
  const [user, setUser] = useState(null)

  // Users and provider management (from Data Management)
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
  const [pendingPage, setPendingPage] = useState(1)
  const [activeTab, setActiveTab] = useState('providers')

  // Provider assignment management (from Providers page)
  const [toilets, setToilets] = useState([])
  const [assignments, setAssignments] = useState({})
  const [saving, setSaving] = useState(false)

  const navigate = useNavigate()

  // Bootstrap auth and data
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
    if (!currentUser.id || currentUser.role !== 'admin') {
      navigate('/login')
      return
    }
    setUser(currentUser)

    // Users: prefer local override cache if present; else fetch base
    const local = localStorage.getItem('admin_dm_users')
    let loadUsers
    if (local) {
      try {
        const parsed = JSON.parse(local)
        loadUsers = Promise.resolve(parsed)
      } catch {
        loadUsers = getUsers()
      }
    } else {
      loadUsers = getUsers()
    }

    Promise.all([loadUsers, getToilets(), getProviderAssignments()])
      .then(([usersData, toiletsData, existingAssignments]) => {
        const seeded = usersData.map(u => ({ ...u, city: u.city || '', providerCode: u.role === 'provider' ? (u.providerCode || '') : undefined }))
        setUsers(seeded)
        setToilets(toiletsData)
        setAssignments(existingAssignments)
      })
      .finally(() => setLoading(false))
  }, [navigate])

  // Refresh providers list and assignments on toilets or users changes
  useEffect(() => {
    const reload = () => {
      Promise.all([getUsersWithLocal(), getToilets(), getProviderAssignments()])
        .then(([usersData, toiletsData, existingAssignments]) => {
          const seeded = usersData.map(u => ({ ...u, city: u.city || '', providerCode: u.role === 'provider' ? (u.providerCode || '') : undefined }))
          setUsers(seeded)
          setToilets(toiletsData)
          setAssignments(existingAssignments)
        })
    }
    const onStorage = (e) => {
      if (e.key === 'admin_mt_toilets' || e.key === 'admin_dm_users' || e.key === 'providerAssignments') reload()
    }
    const onCustom = (e) => {
      if (e.type === 'toilets:updated' || e.type === 'assignments:updated') reload()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('toilets:updated', onCustom)
    window.addEventListener('assignments:updated', onCustom)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('toilets:updated', onCustom)
      window.removeEventListener('assignments:updated', onCustom)
    }
  }, [])

  // Persist users to localStorage for cross-page consistency and refreshes
  useEffect(() => {
    try { localStorage.setItem('admin_dm_users', JSON.stringify(users)) } catch {}
  }, [users])

  // Load pending registrations indicator
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem('pending_registrations') || '[]')
      setPending(p)
    } catch {
      setPending([])
    }
  }, [])

  // Reset pagination on tab switch
  useEffect(() => {
    if (activeTab === 'providers') setPage(1)
    else setPendingPage(1)
  }, [activeTab])

  // Derived providers list from users
  const providers = useMemo(() => users.filter(u => u.role === 'provider'), [users])

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

  // Pending pagination derived data
  const pendingTotalPages = useMemo(() => Math.max(1, Math.ceil(pending.length / pageSize)), [pending, pageSize])
  const pendingPageItems = useMemo(() => pending.slice((pendingPage - 1) * pageSize, pendingPage * pageSize), [pending, pendingPage, pageSize])

  // Clamp pending page if list shrinks
  useEffect(() => {
    setPendingPage(p => Math.min(p, pendingTotalPages))
  }, [pendingTotalPages])

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
        const next = JSON.parse(raw)
        if (next && next[id]) {
          delete next[id]
          localStorage.setItem('providerAssignments', JSON.stringify(next))
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
        const prefix = getCityPrefix(copy[idx].city)
        if (!before.providerCode || before.city !== copy[idx].city || !before.providerCode.startsWith(prefix + '-')) {
          copy[idx].providerCode = generateNextProviderCode(copy[idx].city, copy)
        }
      }
      return copy
    })
    setIsEditOpen(false)
  }

  // Assignment handlers
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
      // Save assignments
      saveProviderAssignments(assignments)
      
      // Update toilet records with provider assignments
      const updatedToilets = toilets.map(toilet => {
        // Find which provider is assigned to this toilet
        let assignedProvider = null
        for (const [providerId, toiletIds] of Object.entries(assignments)) {
          if (toiletIds.includes(toilet.id)) {
            const provider = users.find(u => u.id === providerId)
            assignedProvider = provider ? provider.id : null
            break
          }
        }
        
        return {
          ...toilet,
          provider: assignedProvider || ''
        }
      })
      
      // Update local storage with updated toilets
      try {
        localStorage.setItem('admin_toilets', JSON.stringify(updatedToilets))
      } catch {}
      
      // Update state
      setToilets(updatedToilets)
      
      // Dispatch events to notify other components
      try { 
        window.dispatchEvent(new Event('assignments:updated'))
        window.dispatchEvent(new Event('toilets:updated'))
      } catch {}
      
      alert('Assignments saved and toilet records updated successfully!')
    } catch (error) {
      console.error('Error saving assignments:', error)
      alert('Error saving assignments. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const refreshUsers = async () => {
    const merged = await getUsersWithLocal()
    const seeded = merged.map(u => ({ ...u, city: u.city || '', providerCode: u.role === 'provider' ? (u.providerCode || '') : undefined }))
    setUsers(seeded)
  }

  if (loading) {
    return (
      <div className="page-container">
        <TopNav user={user} />
        <div className="container" style={{ paddingTop: '40px', textAlign: 'center' }}>
          <div className="spinner" style={{ width: '40px', height: '40px' }} />
          <p className="mt-3">Loading provider tools...</p>
        </div>
      </div>
    )
  }

  // Shared Pagination component
  const Pagination = ({ page, totalPages, onChange }) => {
    const createPages = () => {
      const pages = []
      if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        if (page > 3) pages.push('…')
        const start = Math.max(2, page - 1)
        const end = Math.min(totalPages - 1, page + 1)
        for (let i = start; i <= end; i++) pages.push(i)
        if (page < totalPages - 2) pages.push('…')
        pages.push(totalPages)
      }
      return pages
    }
    const pages = createPages()
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--spacing-md)' }}>
        <div className="text-sm text-gray">Page {page} of {totalPages}</div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button className="btn btn-secondary btn-sm" disabled={page<=1} onClick={() => onChange(page-1)}>Prev</button>
          {pages.map((p, idx) => (
            typeof p === 'number' ? (
              <button
                key={`p-${p}-${idx}`}
                onClick={() => onChange(p)}
                className={`btn btn-sm ${p===page ? 'btn-primary' : 'btn-secondary'}`}
                style={{ minWidth: 32 }}
                aria-current={p===page ? 'page' : undefined}
              >{p}</button>
            ) : (
              <span key={`e-${idx}`} className="text-sm text-gray" style={{ padding: '0 4px' }}>…</span>
            )
          ))}
          <button className="btn btn-secondary btn-sm" disabled={page>=totalPages} onClick={() => onChange(page+1)}>Next</button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <TopNav user={user} />
      <div className="container" style={{ paddingTop: '40px' }}>
        {/* Unified Providers Panel */}
        <div className="card providers-panel mb-4">
          {/* Header Row */}
          <div className="providers-panel__header">
            <h1 className="providers-panel__title">Manage Providers</h1>
            <div className="providers-panel__actions">
              <button className="btn btn-primary" onClick={openAdd}>＋ Add User</button>
            </div>
          </div>

          {/* Controls Row */}
          <div className="providers-panel__controls">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">City</label>
              <select className="input" value={cityFilter} onChange={(e) => { setCityFilter(e.target.value); setPage(1) }}>
                <option>All</option>
                {SA_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ flex: 1, minWidth: 220, marginBottom: 0 }}>
              <label className="label">Search</label>
              <input className="input" placeholder="Filter by name or Provider ID" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="providers-panel__tabs">
            <button
              className={`tab ${activeTab === 'providers' ? 'tab--active' : ''}`}
              onClick={() => setActiveTab('providers')}
              aria-pressed={activeTab==='providers'}
            >
              Providers Table
            </button>
            <button
              className={`tab ${activeTab === 'pending' ? 'tab--active' : ''}`}
              onClick={() => setActiveTab('pending')}
              aria-pressed={activeTab==='pending'}
            >
              <span>Pending Providers</span>
              {pending.length > 0 && (
                <span className="tab__badge" aria-label={`Pending providers: ${pending.length}`}>{pending.length}</span>
              )}
            </button>
          </div>

          {/* Shared Table Slot */}
          <div className="providers-panel__table">
            {activeTab === 'pending' ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead>
                    <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>City</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Submitted</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPageItems.map((p, idx) => (
                      <tr key={p.id} style={{ background: idx % 2 ? 'var(--gray-25, #fafafa)' : 'white' }}>
                        <td style={{ padding: '10px' }}>{p.firstName} {p.lastName}</td>
                        <td style={{ padding: '10px' }}>{p.city}</td>
                        <td style={{ padding: '10px' }}>{new Date(p.createdAt).toLocaleString()}</td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                            <button className="btn btn-success btn-sm" onClick={() => {
                              const item = pending.find(x => x.id === p.id)
                              if (!item) return
                              const fullName = `${item.firstName} ${item.lastName}`.trim()
                              let newUser = { id: `local_${Date.now()}`, name: fullName, role: 'provider', city: item.city, providerCode: '', email: (item.email || '').toLowerCase(), password: item.password }
                              newUser = ensureProviderCode(newUser, users)
                              setUsers(prev => [newUser, ...prev])
                              const updated = pending.filter(x => x.id !== p.id)
                              setPending(updated)
                              localStorage.setItem('pending_registrations', JSON.stringify(updated))
                              localStorage.setItem('pending_registrations_ts', String(Date.now()))
                              try { window.dispatchEvent(new Event('pending:updated')) } catch {}
                              const newTotal = Math.max(1, Math.ceil((updated.length) / pageSize))
                              setPendingPage(p => Math.min(p, newTotal))
                            }}>Approve & Add</button>
                            <button className="btn btn-error btn-sm" onClick={() => {
                              const updated = pending.filter(x => x.id !== p.id)
                              setPending(updated)
                              localStorage.setItem('pending_registrations', JSON.stringify(updated))
                              localStorage.setItem('pending_registrations_ts', String(Date.now()))
                              try { window.dispatchEvent(new Event('pending:updated')) } catch {}
                              const newTotal = Math.max(1, Math.ceil((updated.length) / pageSize))
                              setPendingPage(p => Math.min(p, newTotal))
                            }}>Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="providers-panel__pagination">
                  <Pagination page={pendingPage} totalPages={pendingTotalPages} onChange={(p) => setPendingPage(p)} />
                </div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead>
                    <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                      <th style={{ cursor: 'pointer', padding: '12px', textAlign: 'left' }} onClick={() => toggleSort('providerCode')}>Provider ID {sortBy==='providerCode' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                      <th style={{ cursor: 'pointer', padding: '12px', textAlign: 'left' }} onClick={() => toggleSort('name')}>Name {sortBy==='name' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                      <th style={{ cursor: 'pointer', padding: '12px', textAlign: 'left' }} onClick={() => toggleSort('role')}>Role {sortBy==='role' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                      <th style={{ cursor: 'pointer', padding: '12px', textAlign: 'left' }} onClick={() => toggleSort('city')}>City {sortBy==='city' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((u, idx) => (
                      <tr key={u.id} style={{ background: idx % 2 ? 'var(--gray-25, #fafafa)' : 'white' }}>
                        <td style={{ padding: '10px' }}>{u.role === 'provider' ? (u.providerCode || '—') : '—'}</td>
                        <td style={{ padding: '10px' }}>{u.name}</td>
                        <td style={{ padding: '10px' }}>{u.role}</td>
                        <td style={{ padding: '10px' }}>{u.role === 'provider' ? (u.city || '—') : '—'}</td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>Edit</button>
                            <button className="btn btn-error btn-sm" onClick={() => handleDelete(u.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="providers-panel__pagination">
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onChange={(p) => setPage(p)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Removed separate providers table card; now rendered within the tabbed container above */}

        {/* Provider Assignment Tools (base layout) */}
        <div className="card mb-4">
          <h2 className="card-title">Provider Assignments</h2>
          <p className="card-subtitle">Assign toilets to providers. Changes are saved to your browser for now.</p>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap', marginTop: 'var(--spacing-md)' }}>
            <button className={`btn btn-primary ${saving ? 'loading' : ''}`} disabled={saving} onClick={saveAll}>
              {saving ? <span className="spinner"></span> : '💾'} Save Assignments
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/admin')}>
              ← Back to Dashboard
            </button>
            <button className="btn btn-secondary" onClick={refreshUsers}>
              🔄 Refresh Providers
            </button>
          </div>
        </div>

        <div className="grid grid-2">
          {providers.map(p => (
            <div key={p.id} className="card">
              <div className="card-header">
                <h3 className="card-title" style={{ margin: 0 }}>{p.name}</h3>
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
                    {SA_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
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
                {SA_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
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

export default AdminManageProviders


