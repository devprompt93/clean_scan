import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav'
import ToiletCard from '../components/ToiletCard'
import { getToilets, getUsersWithLocal } from '../services/api'
import { MAJOR_CITIES, getAreasForCity, getUniqueAreasForCity } from '../lib/areaMappings'
import '../styles/toiletFilters.css'

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

  
  // Dependent dropdown options
  const [availableAreas, setAvailableAreas] = useState([])

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingToilet, setEditingToilet] = useState(null)
  const [addForm, setAddForm] = useState({
    name: '',
    area: '',
    city: '',
    description: '',
    trackerInstalled: false,
    lat: '',
    lng: '',
  })

  const navigate = useNavigate()

  const combinedToilets = useMemo(() => {
    try {
      const byId = new Map()
      ;(baseToilets || []).forEach(t => {
        if (t && t.id) byId.set(t.id, t)
      })
      ;(localToilets || []).forEach(t => {
        if (t && t.id) byId.set(t.id, t)
      })
      return Array.from(byId.values())
    } catch (error) {
      console.error('Error combining toilets:', error)
      return []
    }
  }, [baseToilets, localToilets])



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
        setBaseToilets(toiletsData || [])
        setProviders((usersData || []).filter(u => u && u.role === 'provider'))
      })
      .catch((error) => {
        console.error('Error loading initial data:', error)
        setBaseToilets([])
        setProviders([])
      })
      .finally(() => setLoading(false))
  }, [navigate])

  // Listen for provider assignment updates
  useEffect(() => {
    const handleAssignmentsUpdated = () => {
      // Refresh toilet data to get updated provider assignments
      getToilets().then(toiletsData => {
        setBaseToilets(toiletsData || [])
      }).catch(error => {
        console.error('Error refreshing toilets after assignment update:', error)
      })
    }

    window.addEventListener('assignments:updated', handleAssignmentsUpdated)
    
    return () => {
      window.removeEventListener('assignments:updated', handleAssignmentsUpdated)
    }
  }, [])

  // Update available areas when city changes
  useEffect(() => {
    try {
      if (cityFilter === 'All') {
        setAvailableAreas([])
        setAreaFilter('All')
      } else {
        const areas = getUniqueAreasForCity(cityFilter)
        setAvailableAreas(areas || [])
        setAreaFilter('All') // Reset area filter when city changes
      }
    } catch (error) {
      console.error('Error updating available areas:', error)
      setAvailableAreas([])
      setAreaFilter('All')
    }
  }, [cityFilter])



  const refresh = async () => {
    setLoading(true)
    try {
      const [toiletsData, usersData] = await Promise.all([getToilets(true), getUsersWithLocal()])
      setBaseToilets(toiletsData || [])
      setProviders((usersData || []).filter(u => u && u.role === 'provider'))
      try { setLocalToilets(JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]')) } catch { setLocalToilets([]) }
    } catch (error) {
      console.error('Error refreshing data:', error)
      setBaseToilets([])
      setProviders([])
    } finally {
      setLoading(false)
    }
  }

  const filteredToilets = useMemo(() => {
    try {
      const q = (search || '').trim().toLowerCase()
      return (combinedToilets || [])
        .filter(t => {
          if (!t) return false
          if (cityFilter !== 'All') {
            try {
              // Filter by city (toilets should have city property or be in the selected city's areas)
              const toiletCity = t.city || (t.area && getAreasForCity(cityFilter).includes(t.area) ? cityFilter : null)
              if (toiletCity !== cityFilter) return false
            } catch (error) {
              console.warn('Error filtering by city:', error)
              return false
            }
          }
          return true
        })
        .filter(t => (areaFilter === 'All' ? true : (t && t.area === areaFilter)))
        .filter(t => {
          if (!q) return true
          if (!t) return false
          try {
            const hay = `${t.name || ''} ${t.area || ''} ${t.city || ''}`.toLowerCase()
            return hay.includes(q)
          } catch (error) {
            console.warn('Error in search filter:', error)
            return false
          }
        })
    } catch (error) {
      console.error('Error filtering toilets:', error)
      return combinedToilets || []
    }
  }, [combinedToilets, cityFilter, areaFilter, search])

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
      provider: '',
      description: addForm.description || '',
    }
    const next = [newToilet, ...localToilets]
    setLocalToilets(next)
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(next)) } catch {}
    try { window.dispatchEvent(new Event('toilets:updated')) } catch {}
    setIsAddOpen(false)
    setAddForm({ name: '', area: '', city: '', description: '', trackerInstalled: false, lat: '', lng: '' })
  }

  const openEdit = (toilet) => {
    setEditingToilet(toilet)
    setAddForm({
      name: toilet.name || '',
      area: toilet.area || '',
      city: toilet.city || '',
      description: toilet.description || '',
      trackerInstalled: toilet.trackerInstalled || false,
      lat: toilet.gpsCoords?.[0]?.toString() || '',
      lng: toilet.gpsCoords?.[1]?.toString() || '',
    })
    setIsEditOpen(true)
  }

  const submitEdit = () => {
    if (!editingToilet) return
    
    const name = addForm.name.trim()
    const area = (addForm.city || addForm.area || '').trim()
    if (!name || !area) return alert('Name and area/city are required')
    
    const lat = addForm.lat ? Number(addForm.lat) : Number(0)
    const lng = addForm.lng ? Number(addForm.lng) : Number(0)
    
    const updatedToilet = {
      ...editingToilet,
      name,
      area,
      city: addForm.city,
      gpsCoords: [lat, lng],
      trackerInstalled: !!addForm.trackerInstalled,
      provider: editingToilet.provider || '',
      description: addForm.description || '',
    }
    
    // Update in localToilets
    const updatedLocalToilets = localToilets.map(t => 
      t.id === editingToilet.id ? updatedToilet : t
    )
    setLocalToilets(updatedLocalToilets)
    
    // Update in baseToilets if it exists there
    const updatedBaseToilets = baseToilets.map(t => 
      t.id === editingToilet.id ? updatedToilet : t
    )
    setBaseToilets(updatedBaseToilets)
    
    // Save to localStorage
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(updatedLocalToilets)) } catch {}
    try { window.dispatchEvent(new Event('toilets:updated')) } catch {}
    
    setIsEditOpen(false)
    setEditingToilet(null)
    setAddForm({ name: '', area: '', city: '', description: '', trackerInstalled: false, lat: '', lng: '' })
  }

  const deleteToilet = (toilet) => {
    if (!window.confirm(`Are you sure you want to delete the toilet "${toilet.name}"? This action cannot be undone.`)) {
      return
    }
    
    // Remove from localToilets
    const updatedLocalToilets = localToilets.filter(t => t.id !== toilet.id)
    setLocalToilets(updatedLocalToilets)
    
    // Remove from baseToilets if it exists there
    const updatedBaseToilets = baseToilets.filter(t => t.id !== toilet.id)
    setBaseToilets(updatedBaseToilets)
    
    // Save to localStorage
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(updatedLocalToilets)) } catch {}
    try { window.dispatchEvent(new Event('toilets:updated')) } catch {}
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

  // Prepare dropdown options for dependent filters (ensure uniqueness)
  const cityOptions = ['All', ...(MAJOR_CITIES || [])]
  const areaOptions = ['All', ...(availableAreas || [])]
  
  // Ensure all options have unique keys for React rendering
  const uniqueAreaOptions = [...new Set(areaOptions)]

  return (
    <div className="page-container">
      <TopNav user={user} />
      <div className="container" style={{ paddingTop: '40px' }}>
        {/* Unified Toilets Management Panel */}
        <div className="card mb-4">
          {/* Header Row */}
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="text-2xl font-bold mb-2">Manage Toilets</h1>
              <p className="text-gray">Search, filter, add, and manage toilets in the system.</p>
            </div>
          </div>

          {/* Search and Filters Row */}
          <div style={{ padding: 'var(--spacing-md)' }}>
            <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <input
                type="text"
                className="input"
                placeholder="Search by area or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ fontSize: '1rem' }}
              />
            </div>
            
            <div className="filter-row">
              <div className="form-group filter-group">
                <label className="label">City</label>
                <select className="input" value={cityFilter} onChange={(e)=>setCityFilter(e.target.value)}>
                  {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="filter-helper">Select a city to filter areas</div>
              </div>
              <div className="form-group filter-group">
                <label className="label">Area</label>
                <select className="input" value={areaFilter} onChange={(e)=>setAreaFilter(e.target.value)} disabled={cityFilter === 'All'}>
                  {uniqueAreaOptions.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <div className={`filter-helper ${cityFilter === 'All' ? 'filter-helper--disabled' : ''}`}>
                  {cityFilter === 'All' ? 'Select a city first' : `${uniqueAreaOptions.length - 1} areas available`}
                </div>
              </div>

              <button className="btn btn-secondary" onClick={refresh}>🔄 Refresh Toilets</button>
              <button 
                className="btn btn-outline" 
                onClick={() => {
                  setCityFilter('All')
                  setAreaFilter('All')
                  setSearch('')
                }}
                style={{ marginLeft: 'auto' }}
              >
                🗑️ Clear Filters
              </button>
            </div>
          </div>

          {/* Toilets Grid Section */}
          <div style={{ borderTop: '1px solid var(--gray-200)', padding: 'var(--spacing-md)' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0, marginBottom: 'var(--spacing-md)' }}>
              <div>
                <h2 className="card-title" style={{ margin: 0 }}>
                  {search || cityFilter !== 'All' || areaFilter !== 'All'
                    ? `Filtered Toilets (${filteredToilets.length})`
                    : `All Toilets (${combinedToilets.length})`}
                </h2>
                <p className="card-subtitle" style={{ margin: 0, marginTop: '4px' }}>
                  {search ? `Showing results for "${search}"` : 'Click on any toilet to view details, or use the Edit/Delete buttons to manage toilets'}
                </p>
              </div>
              <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>＋ Add Toilet</button>
            </div>
            <div className="grid grid-3">
              {(search || cityFilter !== 'All' || areaFilter !== 'All' ? filteredToilets : combinedToilets).map(t => (
                <ToiletCard
                  key={t.id}
                  toilet={t}
                  showProvider={true}
                  showActions={true}
                  providers={providers}
                  onClick={() => navigate(`/admin/toilet/${t.id}`)}
                  onEdit={openEdit}
                  onDelete={deleteToilet}
                />
              ))}
            </div>
            {(filteredToilets.length === 0) && (search || cityFilter !== 'All' || areaFilter !== 'All') && (
              <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--gray-600)' }}>
                <p>No toilets match the current search/filters.</p>
                <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>
                  Try adjusting your filters or search terms.
                </p>
                <button 
                  className="btn btn-outline btn-sm" 
                  onClick={() => {
                    setCityFilter('All')
                    setAreaFilter('All')
                    setSearch('')
                  }}
                  style={{ marginTop: '12px' }}
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
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
              {MAJOR_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Area (optional)</label>
            <input className="input" value={addForm.area} onChange={(e)=>setAddForm(f=>({ ...f, area: e.target.value }))} placeholder="e.g., Delft, Sandton" />
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

        {/* Edit Toilet Modal */}
        <Modal open={isEditOpen} title="Edit Toilet" onClose={() => setIsEditOpen(false)}>
          <div className="form-group">
            <label className="label">Name</label>
            <input className="input" value={addForm.name} onChange={(e)=>setAddForm(f=>({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="label">City</label>
            <select className="input" value={addForm.city} onChange={(e)=>setAddForm(f=>({ ...f, city: e.target.value }))}>
              <option value="">Select a city</option>
              {MAJOR_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Area (optional)</label>
            <input className="input" value={addForm.area} onChange={(e)=>setAddForm(f=>({ ...f, area: e.target.value }))} placeholder="e.g., Delft, Sandton" />
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
            <button className="btn btn-secondary" onClick={()=>setIsEditOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitEdit}>Update</button>
          </div>
        </Modal>
      </div>
    </div>
  )
}

export default AdminManageToilets


