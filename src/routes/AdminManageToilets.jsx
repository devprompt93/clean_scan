import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav'
import ToiletCard from '../components/ToiletCard'
import { getToilets, getUsersWithLocal } from '../services/api'
import { SA_CITIES } from '../lib/cities'

const LOCAL_KEY = 'admin_mt_toilets'

const Modal = ({ open, title, children, onClose }) => {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="card" style={{ width: '100%', maxWidth: 560 }}>
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

const AdminManageToilets = () => {
  const [user, setUser] = useState(null)
  const [baseToilets, setBaseToilets] = useState([])
  const [localToilets, setLocalToilets] = useState([])
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('All')
  const [areaFilter, setAreaFilter] = useState('All')
  const [providerFilter, setProviderFilter] = useState('All')

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({
    name: '',
    area: '',
    city: '',
    provider: '',
    description: '',
    trackerInstalled: false,
    lat: '',
    lng: '',
  })

  const navigate = useNavigate()

  const combinedToilets = useMemo(() => {
    const byId = new Map()
    baseToilets.forEach(t => byId.set(t.id, t))
    localToilets.forEach(t => byId.set(t.id, t))
    return Array.from(byId.values())
  }, [baseToilets, localToilets])

  const areaOptions = useMemo(() => {
    const set = new Set(combinedToilets.map(t => t.area).filter(Boolean))
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))]
  }, [combinedToilets])

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
    if (!currentUser.id || currentUser.role !== 'admin') {
      navigate('/login')
      return
    }
    setUser(currentUser)

    try {
      const local = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]')
      setLocalToilets(local)
    } catch {
      setLocalToilets([])
    }

    Promise.all([getToilets(), getUsersWithLocal()])
      .then(([toiletsData, usersData]) => {
        setBaseToilets(toiletsData)
        setProviders(usersData.filter(u => u.role === 'provider'))
      })
      .finally(() => setLoading(false))
  }, [navigate])

  const refresh = async () => {
    setLoading(true)
    try {
      const [toiletsData, usersData] = await Promise.all([getToilets(true), getUsersWithLocal()])
      setBaseToilets(toiletsData)
      setProviders(usersData.filter(u => u.role === 'provider'))
      try { setLocalToilets(JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]')) } catch { setLocalToilets([]) }
    } finally {
      setLoading(false)
    }
  }

  const filteredToilets = useMemo(() => {
    const q = search.trim().toLowerCase()
    return combinedToilets
      .filter(t => {
        if (cityFilter !== 'All') {
          const inName = (t.name || '').toLowerCase().includes(cityFilter.toLowerCase())
          const inArea = (t.area || '').toLowerCase().includes(cityFilter.toLowerCase())
          if (!inName && !inArea) return false
        }
        return true
      })
      .filter(t => (areaFilter === 'All' ? true : (t.area === areaFilter)))
      .filter(t => (providerFilter === 'All' ? true : (t.provider === providerFilter)))
      .filter(t => {
        if (!q) return true
        const hay = `${t.name || ''} ${t.area || ''}`.toLowerCase()
        return hay.includes(q)
      })
  }, [combinedToilets, cityFilter, areaFilter, providerFilter, search])

  const submitAdd = () => {
    const name = addForm.name.trim()
    const area = (addForm.city || addForm.area || '').trim()
    if (!name || !area) return alert('Name and area/city are required')
    const id = `local_toilet_${Date.now()}`
    const lat = addForm.lat ? Number(addForm.lat) : 0
    const lng = addForm.lng ? Number(addForm.lng) : 0
    const newToilet = {
      id,
      name,
      area,
      gpsCoords: [lat, lng],
      trackerInstalled: !!addForm.trackerInstalled,
      status: 'Pending',
      lastCleaned: new Date().toISOString(),
      provider: addForm.provider || '',
      description: addForm.description || '',
    }
    const next = [newToilet, ...localToilets]
    setLocalToilets(next)
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(next)) } catch {}
    try { window.dispatchEvent(new Event('toilets:updated')) } catch {}
    setIsAddOpen(false)
    setAddForm({ name: '', area: '', city: '', provider: '', description: '', trackerInstalled: false, lat: '', lng: '' })
  }

  if (loading) {
    return (
      <div className="page-container">
        <TopNav user={user} />
        <div className="container" style={{ paddingTop: '40px', textAlign: 'center' }}>
          <div className="spinner" style={{ width: '40px', height: '40px' }} />
          <p className="mt-3">Loading toilets...</p>
        </div>
      </div>
    )
  }

  const providerOptions = [{ id: 'All', name: 'All' }, ...providers]

  return (
    <div className="page-container">
      <TopNav user={user} />
      <div className="container" style={{ paddingTop: '40px' }}>
        <div className="card mb-4">
          <h1 className="text-2xl font-bold mb-2">Manage Toilets</h1>
          <p className="text-gray">Search, filter, add, and manage toilets in the system.</p>
        </div>

        {/* Search and Actions */}
        <div className="card mb-4">
          <div className="card-header">
            <h2 className="card-title">Search & Actions</h2>
            <p className="card-subtitle">Search by area or city. Use filters below to refine further.</p>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input
              type="text"
              className="input"
              placeholder="Search by area or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ fontSize: '1rem' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap', marginTop: 'var(--spacing-md)' }}>
            <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>＋ Add Toilet</button>
            <button className="btn btn-secondary" onClick={refresh}>🔄 Refresh Toilets</button>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-4">
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ minWidth: 200, marginBottom: 0 }}>
              <label className="label">City</label>
              <select className="input" value={cityFilter} onChange={(e)=>setCityFilter(e.target.value)}>
                <option>All</option>
                {SA_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ minWidth: 200, marginBottom: 0 }}>
              <label className="label">Area</label>
              <select className="input" value={areaFilter} onChange={(e)=>setAreaFilter(e.target.value)}>
                {areaOptions.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ minWidth: 240, marginBottom: 0 }}>
              <label className="label">Provider</label>
              <select className="input" value={providerFilter} onChange={(e)=>setProviderFilter(e.target.value)}>
                {providerOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Toilets Grid */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              {search || cityFilter !== 'All' || areaFilter !== 'All' || providerFilter !== 'All'
                ? `Filtered Toilets (${filteredToilets.length})`
                : `All Toilets (${combinedToilets.length})`}
            </h2>
            <p className="card-subtitle">
              {search ? `Showing results for "${search}"` : 'Click on any toilet to view detailed information'}
            </p>
          </div>
          <div className="grid grid-3">
            {(search || cityFilter !== 'All' || areaFilter !== 'All' || providerFilter !== 'All' ? filteredToilets : combinedToilets).map(t => (
              <ToiletCard
                key={t.id}
                toilet={t}
                showProvider={true}
                onClick={() => navigate(`/admin/toilet/${t.id}`)}
              />
            ))}
          </div>
          {(filteredToilets.length === 0) && (search || cityFilter !== 'All' || areaFilter !== 'All' || providerFilter !== 'All') && (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--gray-600)' }}>
              <p>No toilets match the current search/filters.</p>
            </div>
          )}
        </div>

        {/* Add Toilet Modal */}
        <Modal open={isAddOpen} title="Add Toilet" onClose={() => setIsAddOpen(false)}>
          <div className="form-group">
            <label className="label">Name</label>
            <input className="input" value={addForm.name} onChange={(e)=>setAddForm(f=>({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="label">City</label>
            <select className="input" value={addForm.city} onChange={(e)=>setAddForm(f=>({ ...f, city: e.target.value }))}>
              <option value="">Select a city</option>
              {SA_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Area (optional)</label>
            <input className="input" value={addForm.area} onChange={(e)=>setAddForm(f=>({ ...f, area: e.target.value }))} placeholder="e.g., Delft, Sandton" />
          </div>
          <div className="form-group">
            <label className="label">Provider</label>
            <select className="input" value={addForm.provider} onChange={(e)=>setAddForm(f=>({ ...f, provider: e.target.value }))}>
              <option value="">Unassigned</option>
              {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Description (optional)</label>
            <textarea className="input" value={addForm.description} onChange={(e)=>setAddForm(f=>({ ...f, description: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="label">Latitude</label>
              <input className="input" value={addForm.lat} onChange={(e)=>setAddForm(f=>({ ...f, lat: e.target.value }))} placeholder="-33.92" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="label">Longitude</label>
              <input className="input" value={addForm.lng} onChange={(e)=>setAddForm(f=>({ ...f, lng: e.target.value }))} placeholder="18.42" />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Tracker Installed</label>
            <select className="input" value={addForm.trackerInstalled ? 'yes' : 'no'} onChange={(e)=>setAddForm(f=>({ ...f, trackerInstalled: e.target.value === 'yes' }))}>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={()=>setIsAddOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitAdd}>Save</button>
          </div>
        </Modal>
      </div>
    </div>
  )
}

export default AdminManageToilets


