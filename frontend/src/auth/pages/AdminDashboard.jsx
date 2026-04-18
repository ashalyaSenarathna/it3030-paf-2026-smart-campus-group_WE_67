import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resourceApi, bookingApi, adminApi } from '../../api/api';
import { RESOURCE_TYPES, RESOURCE_STATUSES } from './resourceConstants';

const TABS = {
  DASHBOARD: 'Dashboard',
  RESOURCES: 'Manage Resources',
  BOOKINGS: 'Booking Management',
  USERS: 'User Management',
  MAINTENANCE: 'Maintenance & Support'
};

const AdminDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(TABS.DASHBOARD);

  // State for data
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalResources: 0,
    pendingBookings: 0,
    totalBookings: 0,
    availableResources: 0,
    totalUsers: 0
  });

  // State for UI controls
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');
  const [resourceFilter, setResourceFilter] = useState('All');
  const [resourceStatusFilter, setResourceStatusFilter] = useState('All');
  const [bookingFilter, setBookingFilter] = useState('All');
  const [userSearch, setUserSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const defaultForm = { name: '', type: 'Lecture Hall', capacity: 0, location: '', description: '', status: 'Available' };
  const [formData, setFormData] = useState(defaultForm);

  const [debugMessage, setDebugMessage] = useState('Initializing...');
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [dbStatus, setDbStatus] = useState(null);

  const showNotification = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const formatTime = (time) => {
    if (!time) return '--:--';
    if (Array.isArray(time)) {
      const [h, m] = time;
      return `${h.toString().padStart(2, '0')}:${(m || 0).toString().padStart(2, '0')}`;
    }
    if (typeof time === 'string') return time.substring(0, 5);
    return String(time);
  };

  const formatDate = (date) => {
    if (!date) return 'Invalid Date';
    if (Array.isArray(date)) {
      const [y, m, d] = date;
      return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    const d = new Date(date);
    return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    setDebugMessage('Syncing with backend...');

    let resData = [];
    let bookData = [];
    let userData = [];
    let syncError = null;

    try {
      const resResponse = await resourceApi.getAll();
      const rRaw = resResponse.data;
      resData = Array.isArray(rRaw) ? rRaw : (rRaw?.value || rRaw?.content || []);
      setResources(resData);
    } catch (err) {
      console.error("Resource Sync Error:", err);
      if (err.status === 401) syncError = 'Login required';
      else setDebugMessage(`Resource error: ${err.message}`);
    }

    try {
      const bookResponse = await bookingApi.getAll();
      const bRaw = bookResponse.data;
      bookData = Array.isArray(bRaw) ? bRaw : (bRaw?.value || bRaw?.content || []);
      setBookings(bookData);
      console.log("Bookings payload:", bookData);
    } catch (err) {
      console.error("Booking Sync Error:", err);
      if (err.status === 401) syncError = 'Login required';
      else setDebugMessage(`Booking error: ${err.message}`);
    }

    try {
      const userResponse = await adminApi.getUsers();
      userData = userResponse.data;
      setUsers(userData);
      console.log("Users fetched successfully:", userData.length);
    } catch (err) {
      console.error("User Sync Error:", err);
      if (err.status === 401) {
        setDebugMessage(prev => prev + " | User list access unauthorized (401)");
      } else {
        setDebugMessage(prev => prev + ` | User error: ${err.message}`);
      }
    }

    if (syncError) {
      setDebugMessage(`Sync issue: ${syncError}`);
    } else {
      setDebugMessage(`Synced ${resData.length} facilities, ${bookData.length} reservations, and ${userData.length} users.`);
    }

    setStats({
      totalResources: resData.length,
      totalBookings: bookData.length,
      pendingBookings: bookData.filter(b => (b.status || '').toUpperCase() === 'PENDING').length,
      availableResources: resData.filter(r => (r.status || '').toLowerCase() === 'available').length,
      totalUsers: userData.length
    });

    setIsLoading(false);
  };

  const runDiagnostics = async () => {
    try {
      const response = await fetch('/api/system/db-status');
      const data = await response.json();
      setDbStatus(data);
      setShowDiagnostics(true);
    } catch (err) {
      alert("Diagnostic failed: " + err.message);
    }
  };

  const handleForceSeed = async () => {
    if (!window.confirm("This will attempt to populate missing data. Proceed?")) return;
    try {
      const response = await fetch('/api/system/force-seed');
      const data = await response.json();
      alert(data.message || data.error);
      fetchAllData();
    } catch (err) {
      alert("Seeding failed: " + err.message);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleLogout = async () => {
    await onLogout();
    navigate('/login');
  };

  const handleOpenModal = (resource = null) => {
    if (resource) {
      setEditingResource(resource);
      setFormData(resource);
    } else {
      setEditingResource(null);
      setFormData(defaultForm);
    }
    setIsModalOpen(true);
  };

  const handleSaveResource = async (e) => {
    e.preventDefault();
    try {
      if (editingResource) {
        await resourceApi.update(editingResource.id, formData);
        showNotification('Facility updated successfully!');
      } else {
        await resourceApi.create(formData);
        showNotification('New facility registered!');
      }
      setIsModalOpen(false);
      fetchAllData();
    } catch (err) {
      showNotification('Error saving facility');
    }
  };

  const handleDeleteResource = async (id) => {
    if (window.confirm("Delete this resource?")) {
      try {
        await resourceApi.delete(id);
        showNotification('Resource deleted.');
        fetchAllData();
      } catch (err) {
        showNotification('Delete failed');
      }
    }
  };

  const handleBookingAction = async (id, action, reason = null) => {
    try {
      if (action === 'APPROVE') {
        if (!window.confirm("Approve this request?")) return;
        await bookingApi.approve(id);
      } else if (action === 'REJECT') {
        await bookingApi.reject(id, reason);
      } else if (action === 'CANCEL') {
        if (!window.confirm("Are you sure you want to permanently DELETE this booking?")) return;
        await bookingApi.cancel(id);
        showNotification('Booking deleted from database.');
      }
      fetchAllData();
    } catch (err) {
      alert("Action failed: " + err.message);
    }
  };

  const renderDashboard = () => (
    <div className="tab-pane animate-in">
      <header className="tab-header" style={{ marginBottom: '2rem' }}>
        <span className="sc-badge">SYSTEM HUB</span>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Overview</h1>
            <p>Welcome back, <strong>{user?.username || 'Admin'}</strong>. Monitoring campus health...</p>
          </div>
          <div className="debug-infobar" style={{ fontSize: '0.7rem', color: '#64748b', background: 'rgba(255,255,255,0.02)', padding: '5px 12px', borderRadius: '8px', display: 'flex', gap: '15px', alignItems: 'center' }}>
            <span>📡 {debugMessage}</span>
            <button onClick={runDiagnostics} style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', color: '#8b5cf6', borderRadius: '4px', padding: '2px 8px', fontSize: '0.6rem', cursor: 'pointer' }}>Troubleshoot</button>
          </div>
        </div>
      </header>

      {showDiagnostics && dbStatus && (
        <div className="diagnostics-panel animate-in" style={{ background: 'rgba(13, 12, 20, 0.6)', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ color: '#8b5cf6', fontWeight: 800 }}>System Diagnostics</h3>
            <button onClick={() => setShowDiagnostics(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>Close</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <p><strong>Database:</strong> {dbStatus.database}</p>
              <p><strong>Connected:</strong> {dbStatus.connected ? '✅ Yes' : '❌ No'}</p>
              <p><strong>Auth User:</strong> {dbStatus.auth?.principal || 'None'}</p>
              <p><strong>Status:</strong> {dbStatus.auth?.authenticated ? '✅ Authenticated' : '❌ Unauthenticated'}</p>
              <p><strong>Backend Roles:</strong> {dbStatus.auth?.authorities?.join(', ') || 'None'}</p>
            </div>
            <div>
              <p><strong>Record Counts:</strong></p>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {Object.entries(dbStatus.counts || {}).map(([c, count]) => (
                  <li key={c}>{c}: {count}</li>
                ))}
              </ul>
            </div>
          </div>
          <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
            <p style={{ color: '#64748b', marginBottom: '1rem' }}>If counts are 0, your database is empty. You can force seed sample data:</p>
            <button onClick={handleForceSeed} className="btn-approve-sm">Force Sync Sample Data</button>
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card overflow-hidden">
          <div className="label">Total Facilities</div>
          <div className="value">{stats.totalResources}</div>
          <div className="stat-meta">Across all campus zones</div>
        </div>
        <div className="stat-card">
          <div className="label">Available Now</div>
          <div className="value" style={{ color: '#34d399' }}>{stats.availableResources}</div>
          <div className="stat-meta">Units ready for use</div>
        </div>
        <div className="stat-card">
          <div className="label">Registered Users</div>
          <div className="value" style={{ color: '#a855f7' }}>{stats.totalUsers}</div>
          <div className="stat-meta">Unified community</div>
        </div>
      </div>

      <div className="dashboard-sections-layout" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2.5rem', marginTop: '3rem' }}>
        <section className="recent-activity-section">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Latest Reservations</h2>
            <button onClick={() => setActiveTab(TABS.BOOKINGS)} style={{ background: 'none', border: 'none', color: '#8b5cf6', cursor: 'pointer', fontWeight: 600 }}>View All</button>
          </div>
          <div className="activity-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {bookings.filter(b => (b.status || '').toUpperCase() === 'PENDING').slice(0, 4).length === 0 ? (
              <div className="activity-item-glass" style={{ justifyContent: 'center', color: '#64748b' }}>No pending requests</div>
            ) : (
              bookings.filter(b => (b.status || '').toUpperCase() === 'PENDING').slice(0, 4).map(b => (
                <div key={b.id} className="activity-item-glass">
                  <div className="item-main">
                    <div className="item-title">{resources.find(r => String(r.id) === String(b.resourceId))?.name || 'Resource'}</div>
                    <div className="item-sub">{b.userId} • {formatDate(b.date)}</div>
                  </div>
                  <div className="item-actions">
                    <button className="btn-approve-sm" onClick={() => handleBookingAction(b.id, 'APPROVE')}>Approve</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="shortcuts-section">
          <div className="shortcut-grid">
            <div className="shortcut-card-glass" onClick={() => setActiveTab(TABS.RESOURCES)}>
              <span className="sc-icon">🏢</span>
              <div className="sc-text">Manage Assets</div>
            </div>
            <div className="shortcut-card-glass" onClick={() => setActiveTab(TABS.BOOKINGS)}>
              <span className="sc-icon">📅</span>
              <div className="sc-text">Review Bookings</div>
            </div>
            <div className="shortcut-card-glass" onClick={() => setActiveTab(TABS.USERS)}>
              <span className="sc-icon">👥</span>
              <div className="sc-text">User Directory</div>
            </div>
          </div>
          <div className="shortcut-card-glass" style={{ marginTop: '1rem', width: '100%', opacity: 0.5 }} onClick={() => navigate('/profile/admin')}>
            <span className="sc-icon">👤</span>
            <div className="sc-text">Admin Profile</div>
          </div>
        </section>
      </div>
    </div>
  );

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = resourceFilter === 'All' || r.type === resourceFilter;
    const matchesStatus = resourceStatusFilter === 'All' || r.status === resourceStatusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const renderResources = () => (
    <div className="tab-pane animate-in">
      <header className="tab-header">
        <div className="hero-badge">Asset Control</div>
        <h1>Manage Resources</h1>
        <p>Update, delete or register new campus facilities.</p>
      </header>

      <div className="stats-grid" style={{ marginBottom: '2.5rem' }}>
        <div className="stat-card">
          <div className="label">Total Facilities</div>
          <div className="value">{stats.totalResources}</div>
        </div>
        <div className="stat-card">
          <div className="label">Available</div>
          <div className="value" style={{ color: '#34d399' }}>{stats.availableResources}</div>
        </div>
        <div className="stat-card">
          <div className="label">Under Maintenance</div>
          <div className="value" style={{ color: '#fbbf24' }}>{resources.filter(r => r.status === 'Maintenance').length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Occupied/Other</div>
          <div className="value" style={{ color: '#64748b' }}>{resources.length - stats.availableResources - resources.filter(r => r.status === 'Maintenance').length}</div>
        </div>
      </div>

      <div className="action-bar-premium">
        <div className="action-left-group">
          <div className="search-box-wrap">
            <span className="search-icon-glass">🔍</span>
            <input
              type="text"
              placeholder="Search by name or id..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-select-wrap">
            <select value={resourceFilter} onChange={(e) => setResourceFilter(e.target.value)}>
              <option value="All">All Categories</option>
              {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="filter-select-wrap">
            <select value={resourceStatusFilter} onChange={(e) => setResourceStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              {RESOURCE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="action-right-group">
          <button className="btn-add-premium" onClick={() => handleOpenModal()}>
            <span className="plus-icon">+</span> Register Facility
          </button>
        </div>
      </div>

      <div className="table-responsive-glass">
        {filteredResources.length === 0 ? (
          <div className="empty-table-state">
            <div className="empty-icon">🏢</div>
            <h3>No facilities found</h3>
            <p>Try refreshing or searching with a different term.</p>
          </div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Facility Name</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 700 }}>{r.name}</td>
                  <td><span className="type-tag">{r.type}</span></td>
                  <td>{r.capacity} Seats</td>
                  <td>{r.location}</td>
                  <td><span className={`status-dot-pill status-${(r.status || '').toLowerCase()}`}>{r.status}</span></td>
                  <td>
                    <div className="action-row">
                      <button className="tab-icon-btn" onClick={() => handleOpenModal(r)}>✏️</button>
                      <button className="tab-icon-btn delete" onClick={() => handleDeleteResource(r.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderBookings = () => (
    <div className="tab-pane animate-in">
      <header className="tab-header">
        <div className="hero-badge">Reservation Control</div>
        <h1>Booking Management</h1>
        <p>Finalize and monitor all campus facility requests.</p>
      </header>

      <div className="filter-pill-shelf">
        {['All', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(f => (
          <button
            key={f}
            className={`filter-pill ${bookingFilter === f ? 'active' : ''}`}
            onClick={() => setBookingFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="table-responsive-glass">
        {bookings.length === 0 ? (
          <div className="empty-table-state">
            <div className="empty-icon">📁</div>
            <h3>No reservations found</h3>
            <p>The campus booking ledger is currently empty.</p>
          </div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Facility</th>
                <th>Requested By</th>
                <th>Time Window</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.filter(b => bookingFilter === 'All' || (b.status || '').toUpperCase() === bookingFilter.toUpperCase()).map(b => (
                <tr key={b.id}>
                  <td>{formatDate(b.date)}</td>
                  <td style={{ fontWeight: 700 }}>{resources.find(r => String(r.id) === String(b.resourceId))?.name || 'Loading...'}</td>
                  <td style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{b.userId}</td>
                  <td>{formatTime(b.startTime)} — {formatTime(b.endTime)}</td>
                  <td><span className={`status-dot-pill status-${(b.status || '').toLowerCase()}`}>{b.status}</span></td>
                  <td>
                    {b.status === 'PENDING' && (
                      <div className="action-row">
                        <button title="Approve" className="tab-icon-btn approve" onClick={() => handleBookingAction(b.id, 'APPROVE')}>✅</button>
                        <button title="Reject" className="tab-icon-btn reject" onClick={() => {
                          const reason = prompt("Rejection Reason:");
                          if (reason) handleBookingAction(b.id, 'REJECT', reason);
                        }}>❌</button>
                      </div>
                    )}
                    {(b.status === 'APPROVED' || b.status === 'PENDING') && (
                      <button title="Delete Booking" className="tab-icon-btn delete" onClick={() => handleBookingAction(b.id, 'CANCEL')}>🗑️</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderUsers = () => {
    const filteredUsers = users.filter(u => 
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username?.toLowerCase().includes(userSearch.toLowerCase())
    );

    const userStats = {
      admin: users.filter(u => u.roles?.some(r => r.name === 'ROLE_ADMIN' || r.name === 'ADMIN')).length,
      student: users.filter(u => u.roles?.some(r => r.name === 'ROLE_STUDENT' || r.name === 'STUDENT')).length,
      tech: users.filter(u => u.roles?.some(r => r.name === 'ROLE_TECHNICIAN' || r.name === 'TECHNICIAN')).length,
    };
    
    // Corrected stats logic
    const studentCount = userStats.student;

    return (
      <div className="tab-pane animate-in">
        <header className="tab-header">
          <div className="hero-badge" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.2)' }}>User Directory</div>
          <h1>Community Management</h1>
          <p>View and manage all members of the Smart Campus.</p>
        </header>

        <div className="stats-grid" style={{ marginBottom: '2.5rem' }}>
          <div className="stat-card">
            <div className="label">Total Members</div>
            <div className="value">{users.length}</div>
          </div>
          <div className="stat-card">
            <div className="label">Students</div>
            <div className="value" style={{ color: '#34d399' }}>{studentCount}</div>
          </div>
          <div className="stat-card">
            <div className="label">Technicians</div>
            <div className="value" style={{ color: '#fbbf24' }}>{userStats.tech}</div>
          </div>
          <div className="stat-card">
            <div className="label">Administrators</div>
            <div className="value" style={{ color: '#a855f7' }}>{userStats.admin}</div>
          </div>
        </div>

        <div className="action-bar-premium">
          <div className="action-left-group" style={{ maxWidth: '400px' }}>
            <div className="search-box-wrap">
              <span className="search-icon-glass">🔍</span>
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="action-right-group">
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Showing {filteredUsers.length} users</p>
          </div>
        </div>

        <div className="table-responsive-glass">
          {filteredUsers.length === 0 ? (
            <div className="empty-table-state">
              <div className="empty-icon">👥</div>
              <h3>No users found</h3>
            </div>
          ) : (
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Digital Identity</th>
                  <th>Roles</th>
                  <th>Provider</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{u.name || 'Anonymous'}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{u.username}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.email}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        {u.roles?.map(r => (
                          <span key={r.id} className={`status-dot-pill role-badge role-${r.name?.toLowerCase().replace('role_', '')}`}>
                            {r.name?.replace('ROLE_', '')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className="type-tag">{u.authProvider || 'Local'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="admin-loading-screen">
        <div className="premium-loader"></div>
        <p>Syncing campus data...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-root">
      <aside className="sidebar-glass">
        <div className="sidebar-brand">
          <div className="brand-dot"></div>
          Smart Campus
        </div>
        <nav className="sidebar-nav-container">
          {[
            { id: TABS.DASHBOARD, icon: '📊', label: 'Dashboard' },
            { id: TABS.RESOURCES, icon: '🏢', label: 'Resources' },
            { id: TABS.BOOKINGS, icon: '📅', label: 'Bookings' },
            { id: TABS.USERS, icon: '👥', label: 'Users' },
            { id: TABS.MAINTENANCE, icon: '🛠️', label: 'Support' }
          ].map((tab) => (
            <div
              key={tab.id}
              className={`sidebar-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="nav-i">{tab.icon}</span>
              <span className="nav-t">{tab.label}</span>
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="btn-logout-sidebar" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      <main className="main-viewport-glass">
        {activeTab === TABS.DASHBOARD && renderDashboard()}
        {activeTab === TABS.RESOURCES && renderResources()}
        {activeTab === TABS.BOOKINGS && renderBookings()}
        {activeTab === TABS.USERS && renderUsers()}
        {activeTab === TABS.MAINTENANCE && (
          <div className="tab-pane animate-in">
            <header className="tab-header">
              <h1>Maintenance Hub</h1>
              <p>Ticketing system is launching soon.</p>
            </header>
            <div className="coming-soon-card-glass">
              <div className="cs-glow"></div>
              <span>Development in Progress</span>
            </div>
          </div>
        )}
      </main>

      {/* Success/Error Toast */}
      {toast && <div className="toast-premium animate-in">✅ {toast}</div>}

      {isModalOpen && (
        <div className="modal-root-glass" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box-premium" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{editingResource ? 'Update Facility' : 'Register New Facility'}</h2>
              <button className="modal-close-x" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSaveResource} className="modal-form-grid">
              <div className="f-group full">
                <label>Resource Name</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Auditorium A" />
              </div>
              <div className="f-group">
                <label>Category</label>
                <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                  {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="f-group">
                <label>Capacity</label>
                <input type="number" required value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })} />
              </div>
              <div className="f-group full">
                <label>Location</label>
                <input type="text" required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Building 02, Floor 03" />
              </div>
              <div className="f-group full">
                <label>Status</label>
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                  {RESOURCE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="modal-f-actions">
                <button type="button" className="m-btn-sec" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-add-premium" style={{ flex: 1, justifyContent: 'center' }} disabled={isLoading}>
                  {isLoading ? 'Processing...' : (editingResource ? 'Update Facility' : 'Register Facility')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .admin-dashboard-root { display: flex; min-height: 100vh; background: #050508; color: #f8fafc; font-family: 'Plus Jakarta Sans', sans-serif; }
        .sidebar-glass { width: 260px; background: rgba(13, 12, 20, 0.4); border-right: 1px solid rgba(255,255,255,0.05); backdrop-filter: blur(20px); display: flex; flex-direction: column; padding: 2rem 0; }
        .sidebar-brand { padding: 0 2rem; font-size: 1.25rem; font-weight: 800; display: flex; align-items: center; gap: 10px; margin-bottom: 3rem; }
        .brand-dot { width: 10px; height: 10px; background: #8b5cf6; border-radius: 50%; box-shadow: 0 0 15px #8b5cf6; }
        .sidebar-nav-container { flex: 1; padding: 0 1rem; }
        .sidebar-nav-item { display: flex; align-items: center; gap: 15px; padding: 14px 20px; border-radius: 12px; cursor: pointer; color: #64748b; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); margin-bottom: 6px; }
        .sidebar-nav-item:hover { background: rgba(255,255,255,0.03); color: #fff; }
        .sidebar-nav-item.active { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
        .main-viewport-glass { flex: 1; padding: 3rem 6%; overflow-y: auto; height: 100vh; }
        .sidebar-footer { padding: 0 1rem; }
        
        .admin-loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; width: 100vw; background: #050508; color: #64748b; gap: 2rem; }
        .premium-loader { width: 50px; height: 50px; border: 3px solid rgba(139, 92, 246, 0.1); border-top-color: #8b5cf6; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .empty-table-state { text-align: center; padding: 5rem 2rem; background: rgba(255,255,255,0.01); border-radius: 32px; border: 2px dashed rgba(255,255,255,0.05); }
        .empty-icon { font-size: 3rem; margin-bottom: 1.5rem; opacity: 0.5; }
        .empty-table-state h3 { font-size: 1.25rem; font-weight: 800; margin-bottom: 0.5rem; color: #f8fafc; }
        .empty-table-state p { color: #64748b; }

        .hero-badge { display: inline-block; padding: 6px 14px; background: rgba(139, 92, 246, 0.1); color: #c084fc; border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 50px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1rem; }
        .tab-header h1 { font-size: 2.5rem; font-weight: 900; margin-bottom: 0.5rem; letter-spacing: -0.02em; }
        .tab-header p { color: #64748b; margin-bottom: 3rem; }

        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
        .stat-card { background: rgba(13, 12, 20, 0.4); border: 1px solid rgba(255,255,255,0.05); padding: 2rem; border-radius: 28px; backdrop-filter: blur(10px); }
        .stat-card .label { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.1em; margin-bottom: 1rem; }
        .stat-card .value { font-size: 2.5rem; font-weight: 900; line-height: 1; }
        .stat-meta { font-size: 0.75rem; color: #475569; margin-top: 10px; }

        .activity-item-glass { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem; background: rgba(255,255,255,0.02); border-radius: 18px; border: 1px solid rgba(255,255,255,0.04); }
        .item-title { font-weight: 700; margin-bottom: 4px; }
        .item-sub { font-size: 0.8rem; color: #64748b; }

        .shortcut-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .shortcut-card-glass { padding: 1.5rem; background: rgba(255,255,255,0.02); border-radius: 20px; border: 1px solid rgba(255,255,255,0.04); cursor: pointer; transition: all 0.3s; text-align: center; }
        .shortcut-card-glass:hover { background: rgba(139, 92, 246, 0.05); border-color: rgba(139, 92, 246, 0.2); transform: translateY(-4px); }
        .sc-icon { font-size: 1.5rem; display: block; margin-bottom: 10px; }
        .sc-text { font-size: 0.85rem; font-weight: 700; }

        .table-controls-glass { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; gap: 1.5rem; }
        .search-box { flex: 1; position: relative; }
        .search-box input { width: 100%; padding: 12px 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; color: #fff; font-size: 0.9rem; transition: all 0.3s; }
        .search-box input:focus { background: rgba(255,255,255,0.05); border-color: #8b5cf6; outline: none; box-shadow: 0 0 20px rgba(139, 92, 246, 0.1); }
        
        .category-select-glass select { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; color: #fff; padding: 12px 20px; font-weight: 600; cursor: pointer; }
        .category-select-glass select:focus { outline: none; border-color: #8b5cf6; }

        .filter-pill-shelf { display: flex; gap: 10px; margin-bottom: 2rem; flex-wrap: wrap; }
        .filter-pill { padding: 10px 20px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); color: #64748b; border-radius: 12px; cursor: pointer; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; transition: all 0.3s; }
        .filter-pill.active { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; border-color: #8b5cf6; }
        .filter-pill:hover:not(.active) { background: rgba(255,255,255,0.05); color: #fff; }

        .action-bar-premium { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; gap: 1rem; }
        .action-left-group { display: flex; gap: 1rem; flex: 1; }
        .search-box-wrap { flex: 1; position: relative; }
        .search-icon-glass { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); opacity: 0.5; font-size: 0.8rem; }
        .search-box-wrap input { width: 100%; padding: 12px 15px 12px 40px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; color: #fff; }
        .filter-select-wrap select { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; color: #fff; padding: 12px 15px; cursor: pointer; min-width: 150px; }
        .btn-add-premium { background: #8b5cf6; color: #fff; border: none; padding: 12px 24px; border-radius: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 10px 20px rgba(139, 92, 246, 0.2); transition: all 0.3s; }
        .btn-add-premium:hover { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(139, 92, 246, 0.4); }
        .toast-premium { position: fixed; bottom: 30px; right: 30px; background: #0d0c14; border: 1px solid #8b5cf6; padding: 12px 24px; border-radius: 14px; font-weight: 700; box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 5000; }

        .premium-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
        .premium-table th { text-align: left; padding: 1rem; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.1em; }
        .premium-table td { background: rgba(255,255,255,0.02); padding: 1.25rem 1rem; border-top: 1px solid rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.04); }
        .premium-table td:first-child { border-left: 1px solid rgba(255,255,255,0.04); border-top-left-radius: 16px; border-bottom-left-radius: 16px; }
        .premium-table td:last-child { border-right: 1px solid rgba(255,255,255,0.04); border-top-right-radius: 16px; border-bottom-right-radius: 16px; }

        .type-tag { font-size: 0.75rem; background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); }
        .status-dot-pill { display: inline-flex; align-items: center; gap: 8px; padding: 4px 12px; border-radius: 100px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
        .status-dot-pill::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
        .status-available { background: rgba(52, 211, 153, 0.1); color: #34d399; }
        .status-pending { background: rgba(251, 191, 36, 0.1); color: #fbbf24; }
        .status-rejected { background: rgba(248, 113, 113, 0.1); color: #f87171; }
        .status-approved { background: rgba(52, 211, 153, 0.1); color: #34d399; }
        .status-cancelled { background: rgba(148, 163, 184, 0.1); color: #94a3b8; }

        .role-badge { border: 1px solid rgba(255,255,255,0.05); }
        .role-admin { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
        .role-student { background: rgba(14, 165, 233, 0.1); color: #0ea5e9; }
        .role-technician { background: rgba(251, 191, 36, 0.1); color: #fbbf24; }

        .action-row { display: flex; gap: 8px; }
        .tab-icon-btn { width: 32px; height: 32px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .tab-icon-btn:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); }
        .tab-icon-btn.approve:hover { background: rgba(52, 211, 153, 0.2); }
        .tab-icon-btn.reject:hover { background: rgba(248, 113, 113, 0.2); }

        .btn-add-glow { background: #8b5cf6; color: #fff; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; box-shadow: 0 10px 20px rgba(139, 92, 246, 0.3); transition: all 0.3s; }
        .btn-add-glow:hover { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(139, 92, 246, 0.5); }
        .btn-logout-sidebar { width: 100%; background: rgba(248, 113, 113, 0.05); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.1); padding: 12px; border-radius: 12px; cursor: pointer; font-weight: 700; transition: all 0.2s; }
        .btn-logout-sidebar:hover { background: rgba(248, 113, 113, 0.15); border-color: rgba(248, 113, 113, 0.3); }

        .btn-approve-sm { background: rgba(52, 211, 153, 0.1); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.2); padding: 6px 14px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .btn-approve-sm:hover { background: rgba(52, 211, 153, 0.2); transform: scale(1.05); }

        .modal-root-glass { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(15px); display: flex; justify-content: center; align-items: center; z-index: 2000; }
        .modal-box-premium { background: #0d0c14; border: 1px solid rgba(255,255,255,0.06); padding: 3rem; border-radius: 32px; width: 95%; max-width: 550px; box-shadow: 0 40px 100px rgba(0,0,0,0.8); }
        .modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
        .modal-head h2 { font-size: 1.75rem; font-weight: 800; letter-spacing: -0.02em; color: #fff; }
        .modal-close-x { background: none; border: none; color: #64748b; font-size: 2rem; cursor: pointer; }

        .modal-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .f-group.full { grid-column: span 2; }
        .f-group label { display: block; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.1em; margin-bottom: 0.75rem; }
        .f-group input, .f-group select { width: 100%; padding: 12px 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; color: #fff; appearance: none; }
        .f-group select option { background: #0d0c14; color: #fff; }
        .f-group input:focus, .f-group select:focus { outline: none; border-color: #8b5cf6; background: rgba(255,255,255,0.05); }

        .modal-f-actions { grid-column: span 2; display: flex; gap: 1rem; margin-top: 2rem; }
        .m-btn-pri { flex: 1; background: #8b5cf6; color: #fff; border: none; padding: 14px; border-radius: 14px; font-weight: 700; cursor: pointer; }
        .m-btn-sec { flex: 1; background: rgba(255,255,255,0.03); color: #94a3b8; border: 1px solid rgba(255,255,255,0.08); padding: 14px; border-radius: 14px; font-weight: 700; cursor: pointer; }

        .coming-soon-card-glass { height: 200px; background: rgba(13, 12, 20, 0.4); border: 2px dashed rgba(255,255,255,0.05); border-radius: 24px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
        .cs-glow { position: absolute; width: 150px; height: 150px; background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%); animation: pulseBg 4s infinite alternate; }
        .coming-soon-card-glass span { color: #475569; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; font-size: 0.8rem; z-index: 1; }

        .animate-in { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseBg { from { transform: scale(1); opacity: 0.5; } to { transform: scale(1.5); opacity: 1; } }

        @media (max-width: 1024px) {
          .dashboard-sections-layout { grid-template-columns: 1fr; }
          .sidebar-glass { width: 80px; }
          .nav-t, .sidebar-brand, .sidebar-footer span { display: none; }
          .sidebar-nav-item { justify-content: center; padding: 15px; }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
