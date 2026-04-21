import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { resourceApi, bookingApi, adminApi } from '../../api/api';
import { RESOURCE_TYPES, RESOURCE_STATUSES } from './resourceConstants';

// ── Campus Location Suggestions ──
const CAMPUS_LOCATIONS = [
  ...Array.from({ length: 7 }, (_, i) => `Main Building, Floor ${i + 1}`),
  ...Array.from({ length: 14 }, (_, i) => `New Building, Floor ${i + 1}`),
];

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
  
  // Rejection Modal states
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingBooking, setRejectingBooking] = useState(null);
  const [tempReason, setTempReason] = useState('');

  const defaultForm = { 
    name: '', 
    type: 'Lecture Hall', 
    capacity: '', 
    location: '', 
    description: '', 
    status: 'Available',
    availableFrom: '08:00',
    availableTo: '18:00'
  };
  const [formData, setFormData] = useState(defaultForm);

  const [debugMessage, setDebugMessage] = useState('Initializing...');
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [dbStatus, setDbStatus] = useState(null);

  // Location autocomplete state
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(0);
  const locationInputRef = useRef(null);

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

  const handleLogout = () => {
    if (onLogout) onLogout();
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
      const sanitizedData = {
        ...formData,
        capacity: parseInt(formData.capacity) || 0,
        availableFrom: formData.availableFrom || '08:00',
        availableTo: formData.availableTo || '18:00'
      };
      if (editingResource) {
        await resourceApi.update(editingResource.id, sanitizedData);
        showNotification('Facility updated successfully!');
      } else {
        await resourceApi.create(sanitizedData);
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

  const handleOpenRejectModal = (booking) => {
    setRejectingBooking(booking);
    setTempReason('');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!tempReason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }
    await handleBookingAction(rejectingBooking.id, 'REJECT', tempReason);
    setIsRejectModalOpen(false);
    setRejectingBooking(null);
    showNotification('Booking rejected with reason.');
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

  const renderDashboard = () => {
    const filteredUsers = users.filter(u =>
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username?.toLowerCase().includes(userSearch.toLowerCase())
    );

    // Backend returns roles as plain strings e.g. ["ROLE_ADMIN"] (Java enum serialized)
    const isAdmin = (u) => u.roles?.some(r => {
      const roleName = typeof r === 'string' ? r : (r?.name || r?.authority || '');
      return roleName.toUpperCase().includes('ADMIN');
    });
    const isStudent = (u) => u.roles?.some(r => {
      const roleName = typeof r === 'string' ? r : (r?.name || r?.authority || '');
      return roleName.toUpperCase().includes('STUDENT');
    });
    const isTech = (u) => u.roles?.some(r => {
      const roleName = typeof r === 'string' ? r : (r?.name || r?.authority || '');
      return roleName.toUpperCase().includes('TECH');
    });
    const adminUsers = users.filter(isAdmin);
    const userStats = {
      admin: adminUsers.length,
      student: users.filter(isStudent).length,
      tech: users.filter(isTech).length,
    };
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
          <div className="stat-card admin-persons-card">
            <div className="label">Administrators</div>
            <div className="admin-persons-list">
              {adminUsers.length === 0 ? (
                <div style={{ color: '#475569', fontSize: '0.8rem' }}>No admins found</div>
              ) : (
                adminUsers.map(a => (
                  <div key={a.id} className="admin-person-row">
                    <div className="admin-person-avatar">
                      {(a.name || a.username || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div className="admin-person-info">
                      <div className="admin-person-name">{a.name || a.username || 'Admin'}</div>
                      <div className="admin-person-role">Administrator</div>
                    </div>
                  </div>
                ))
              )}
            </div>
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
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        {u.roles?.map((r, idx) => {
                          const roleName = typeof r === 'string' ? r : (r?.name || r?.authority || '');
                          const label = roleName.replace(/^ROLE_/i, '');
                          const cssClass = label.toLowerCase();
                          return (
                            <span key={idx} className={`status-dot-pill role-badge role-${cssClass}`}>
                              {label}
                            </span>
                          );
                        })}
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
                <th>{filteredResources.some(r => r.type === 'Equipment') ? 'Capacity / Qty' : 'Capacity'}</th>
                <th>{filteredResources.some(r => r.type === 'Equipment') ? 'Location / Pick-up' : 'Location'}</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 700 }}>
                    <div>{r.name}</div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      🕒 {r.availableFrom || '08:00'} - {r.availableTo || '18:00'}
                    </div>
                  </td>
                  <td><span className="type-tag">{r.type}</span></td>
                  <td>{r.type === 'Equipment' ? r.capacity : `${r.capacity} Seats`}</td>
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

  const filteredBookings = bookings.filter(b =>
    bookingFilter === 'All' || (b.status || '').toUpperCase() === bookingFilter.toUpperCase()
  ).filter(b => {
    if (!bookingSearch) return true;
    const resourceName = resources.find(r => String(r.id) === String(b.resourceId))?.name || '';
    return (
      resourceName.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      (b.userId || '').toLowerCase().includes(bookingSearch.toLowerCase())
    );
  });

  const bookingStats = {
    total: bookings.length,
    pending: bookings.filter(b => (b.status || '').toUpperCase() === 'PENDING').length,
    approved: bookings.filter(b => (b.status || '').toUpperCase() === 'APPROVED').length,
    rejected: bookings.filter(b => (b.status || '').toUpperCase() === 'REJECTED').length,
  };

  const renderBookings = () => (
    <div className="tab-pane animate-in">
      <header className="tab-header">
        <div className="hero-badge booking-badge">Reservation Control</div>
        <h1>Booking Management</h1>
        <p>Review, approve, and monitor all campus facility reservation requests.</p>
      </header>

      {/* ── Premium Stats Row ── */}
      <div className="bk-stats-row">
        <div className="bk-stat-tile bk-tile-total">
          <div className="bk-tile-glow"></div>
          <div className="bk-tile-icon">📋</div>
          <div className="bk-tile-value">{bookingStats.total}</div>
          <div className="bk-tile-label">Total Bookings</div>
        </div>
        <div className="bk-stat-tile bk-tile-pending">
          <div className="bk-tile-glow"></div>
          <div className="bk-tile-icon">⏳</div>
          <div className="bk-tile-value" style={{ color: '#fbbf24' }}>{bookingStats.pending}</div>
          <div className="bk-tile-label">Pending Review</div>
          {bookingStats.pending > 0 && <div className="bk-tile-urgent-dot"></div>}
        </div>
        <div className="bk-stat-tile bk-tile-approved">
          <div className="bk-tile-glow"></div>
          <div className="bk-tile-icon">✅</div>
          <div className="bk-tile-value" style={{ color: '#34d399' }}>{bookingStats.approved}</div>
          <div className="bk-tile-label">Approved</div>
        </div>
        <div className="bk-stat-tile bk-tile-rejected">
          <div className="bk-tile-glow"></div>
          <div className="bk-tile-icon">❌</div>
          <div className="bk-tile-value" style={{ color: '#f87171' }}>{bookingStats.rejected}</div>
          <div className="bk-tile-label">Rejected</div>
        </div>
      </div>

      {/* ── Search + Filter Bar ── */}
      <div className="bk-control-bar">
        <div className="bk-search-glass">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            placeholder="Search by facility or user..."
            value={bookingSearch}
            onChange={(e) => setBookingSearch(e.target.value)}
            className="booking-search-input"
          />
        </div>
        <div className="bk-filter-row">
          {[['All','All','#8b5cf6'], ['PENDING','⏳ Pending','#fbbf24'], ['APPROVED','✅ Approved','#34d399'], ['REJECTED','❌ Rejected','#f87171'], ['CANCELLED','🚫 Cancelled','#94a3b8']].map(([val, label, color]) => (
            <button
              key={val}
              className={`bk-filter-pill-v2 ${bookingFilter === val ? 'active' : ''}`}
              style={bookingFilter === val ? { '--pill-color': color } : {}}
              onClick={() => setBookingFilter(val)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results meta ── */}
      <div className="booking-results-meta">
        Showing <strong>{filteredBookings.length}</strong> of {bookings.length} reservations
        {bookingSearch && <span> · searching for "<em>{bookingSearch}</em>"</span>}
        {bookingSearch && <button className="bk-inline-clear" onClick={() => setBookingSearch('')}>✕ clear</button>}
      </div>

      {/* ── Booking Cards ── */}
      {filteredBookings.length === 0 ? (
        <div className="bk-empty-state">
          <div className="bk-empty-orb"></div>
          <div className="bk-empty-icon">🗓️</div>
          <h3>No reservations found</h3>
          <p>Try adjusting your search or filter criteria.</p>
          {bookingSearch && (
            <button className="bk-clear-btn" onClick={() => setBookingSearch('')}>Clear Search</button>
          )}
        </div>
      ) : (
        <div className="bk-cards-grid">
          {filteredBookings.map((b, idx) => {
            const resourceName = resources.find(r => String(r.id) === String(b.resourceId))?.name || 'Unknown Facility';
            const resourceObj = resources.find(r => String(r.id) === String(b.resourceId));
            const statusLower = (b.status || '').toLowerCase();
            return (
              <div
                key={b.id}
                className={`bk-premium-card bk-status-${statusLower}`}
                style={{ '--anim-delay': `${idx * 0.06}s` }}
              >
                {/* Gloss reflection */}
                <div className="bk-card-shine"></div>

                {/* Top row: avatar + name + status badge */}
                <div className="bk-premium-top">
                  <div className={`bk-p-avatar bk-avatar-${statusLower}`}>
                    {resourceName.charAt(0).toUpperCase()}
                  </div>
                  <div className="bk-p-title-block">
                    <div className="bk-p-resource-name">{resourceName}</div>
                    {resourceObj?.type && <div className="bk-p-resource-type">{resourceObj.type}</div>}
                  </div>
                  <span className={`bk-badge-v2 bk-badge-${statusLower}`}>
                    <span className="bk-badge-dot"></span>
                    {b.status}
                  </span>
                </div>

                {/* User info */}
                <div className="bk-p-user-row">
                  <span className="bk-p-user-icon">👤</span>
                  <span className="bk-p-user-id">{b.userId || 'Unknown User'}</span>
                </div>

                {/* Detail chips grid */}
                <div className="bk-p-chips">
                  <div className="bk-p-chip">
                    <span className="bk-p-chip-icon">📅</span>
                    <div>
                      <div className="bk-p-chip-label">Date</div>
                      <div className="bk-p-chip-val">{formatDate(b.date)}</div>
                    </div>
                  </div>
                  <div className="bk-p-chip">
                    <span className="bk-p-chip-icon">🕐</span>
                    <div>
                      <div className="bk-p-chip-label">Time Slot</div>
                      <div className="bk-p-chip-val">{formatTime(b.startTime)} — {formatTime(b.endTime)}</div>
                    </div>
                  </div>
                  {b.purpose && (
                    <div className="bk-p-chip bk-p-chip-wide">
                      <span className="bk-p-chip-icon">📝</span>
                      <div>
                        <div className="bk-p-chip-label">Purpose</div>
                        <div className="bk-p-chip-val bk-p-purpose">{b.purpose}</div>
                      </div>
                    </div>
                  )}
                  {b.adminReason && b.status === 'REJECTED' && (
                    <div className="bk-p-chip bk-p-chip-wide bk-chip-reason">
                      <span className="bk-p-chip-icon">🚫</span>
                      <div>
                        <div className="bk-p-chip-label">Rejection Reason</div>
                        <div className="bk-p-chip-val">{b.adminReason}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action footer */}
                {(b.status === 'PENDING' || b.status === 'APPROVED') && (
                  <div className="bk-p-actions">
                    {b.status === 'PENDING' && (
                      <>
                        <button
                          className="bk-p-btn bk-p-btn-approve"
                          onClick={() => handleBookingAction(b.id, 'APPROVE')}
                        >
                          <span>✓</span> Approve
                        </button>
                        <button
                          className="bk-p-btn bk-p-btn-reject"
                          onClick={() => handleOpenRejectModal(b)}
                        >
                          <span>✕</span> Reject
                        </button>
                      </>
                    )}
                    <button
                      className="bk-p-btn bk-p-btn-delete"
                      title="Delete Booking"
                      onClick={() => handleBookingAction(b.id, 'CANCEL')}
                    >
                      🗑
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
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
            { id: TABS.DASHBOARD, icon: '👥', label: 'Dashboard' },
            { id: TABS.RESOURCES, icon: '🏢', label: 'Resources' },
            { id: TABS.BOOKINGS, icon: '📅', label: 'Bookings' },
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

      {/* Rejection Modal */}
      {isRejectModalOpen && (
        <div className="modal-root-glass" onClick={() => setIsRejectModalOpen(false)}>
          <div className="modal-box-premium" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Reject Reservation</h2>
              <button className="modal-close-x" onClick={() => setIsRejectModalOpen(false)}>&times;</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Please provide a brief reason for declining this request. This will be visible to the student.
              </p>
              <div className="f-group full">
                <label>Rejection Reason</label>
                <textarea 
                  required 
                  rows="4"
                  value={tempReason}
                  onChange={e => setTempReason(e.target.value)}
                  placeholder="e.g. This slot is reserved for a special department event."
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '12px',
                    color: '#fff',
                    fontFamily: 'inherit',
                    resize: 'none'
                  }}
                />
              </div>
              <div className="modal-footer" style={{ marginTop: '2rem', display: 'flex', gap: '10px' }}>
                <button 
                  className="btn-cancel-modal" 
                  onClick={() => setIsRejectModalOpen(false)}
                  style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', borderRadius: '12px', cursor: 'pointer', fontWeight: 700 }}
                >
                  Cancel
                </button>
                <button 
                  className="btn-add-premium" 
                  onClick={handleConfirmReject}
                  style={{ flex: 2, padding: '12px', background: '#f87171', border: 'none', color: '#fff', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, boxShadow: '0 4px 15px rgba(248,113,113,0.3)' }}
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <label>{formData.type === 'Equipment' ? 'Quantity' : 'Capacity'}</label>
                <input 
                  type="number" 
                  required 
                  value={formData.capacity} 
                  placeholder="0"
                  onChange={e => {
                    const val = e.target.value;
                    setFormData({ ...formData, capacity: val === '' ? '' : parseInt(val) });
                  }} 
                />
              </div>
              <div className="f-group full" style={{ position: 'relative' }}>
                <label>{formData.type === 'Equipment' ? 'Pick-up Location' : 'Location'}</label>
                {formData.type === 'Equipment' ? (
                  <input
                    type="text"
                    required
                    value={formData.location}
                    placeholder="e.g. IT Admin Room"
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                  />
                ) : (
                  <>
                    <input
                      ref={locationInputRef}
                      type="text"
                      required
                      autoComplete="off"
                      value={formData.location}
                      placeholder="Type 'M' for Main Building or 'N' for New Building..."
                      onChange={e => {
                        const val = e.target.value;
                        setFormData({ ...formData, location: val });
                        if (val.trim().length > 0) {
                          const filtered = CAMPUS_LOCATIONS.filter(loc =>
                            loc.toLowerCase().startsWith(val.toLowerCase())
                          );
                          setLocationSuggestions(filtered);
                          setShowLocationSuggestions(filtered.length > 0);
                          setActiveSuggestionIdx(0);
                        } else {
                          setShowLocationSuggestions(false);
                          setLocationSuggestions([]);
                        }
                      }}
                      onKeyDown={e => {
                        if (!showLocationSuggestions || locationSuggestions.length === 0) return;
                        if (e.key === 'Tab') {
                          e.preventDefault();
                          setFormData({ ...formData, location: locationSuggestions[activeSuggestionIdx] });
                          setShowLocationSuggestions(false);
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setActiveSuggestionIdx(prev => (prev + 1) % locationSuggestions.length);
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setActiveSuggestionIdx(prev => (prev - 1 + locationSuggestions.length) % locationSuggestions.length);
                        } else if (e.key === 'Enter' && showLocationSuggestions) {
                          e.preventDefault();
                          setFormData({ ...formData, location: locationSuggestions[activeSuggestionIdx] });
                          setShowLocationSuggestions(false);
                        } else if (e.key === 'Escape') {
                          setShowLocationSuggestions(false);
                        }
                      }}
                      onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 150)}
                      onFocus={e => {
                        const val = e.target.value;
                        if (val.trim().length > 0) {
                          const filtered = CAMPUS_LOCATIONS.filter(loc =>
                            loc.toLowerCase().startsWith(val.toLowerCase())
                          );
                          if (filtered.length > 0) {
                            setLocationSuggestions(filtered);
                            setShowLocationSuggestions(true);
                            setActiveSuggestionIdx(0);
                          }
                        }
                      }}
                    />
                    {showLocationSuggestions && locationSuggestions.length > 0 && (
                      <div className="loc-autocomplete-dropdown">
                        <div className="loc-ac-hint">Press <kbd>Tab</kbd> or <kbd>Enter</kbd> to select · <kbd>↑↓</kbd> to navigate</div>
                        {locationSuggestions.map((loc, idx) => (
                          <div
                            key={loc}
                            className={`loc-ac-item ${idx === activeSuggestionIdx ? 'active' : ''}`}
                            onMouseDown={e => {
                              e.preventDefault();
                              setFormData({ ...formData, location: loc });
                              setShowLocationSuggestions(false);
                            }}
                            onMouseEnter={() => setActiveSuggestionIdx(idx)}
                          >
                            <span className="loc-ac-icon">{loc.startsWith('Main') ? '🏛️' : '🏢'}</span>
                            <span className="loc-ac-text">
                              <strong>{loc.split(',')[0]}</strong>{loc.includes(',') ? ',' + loc.split(',').slice(1).join(',') : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="f-group full">
                <label>Status</label>
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                  {RESOURCE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="f-group" style={{ opacity: formData.status === 'Available' ? 1 : 0.5 }}>
                <label>{formData.type === 'Equipment' ? 'Available From' : 'Opening Time'} {formData.status !== 'Available' && <small>(N/A for {formData.status})</small>}</label>
                <input 
                  type="time" 
                  disabled={formData.status !== 'Available'}
                  value={formData.availableFrom} 
                  onChange={e => setFormData({ ...formData, availableFrom: e.target.value })} 
                />
              </div>
              <div className="f-group" style={{ opacity: formData.status === 'Available' ? 1 : 0.5 }}>
                <label>{formData.type === 'Equipment' ? 'Available Until' : 'Closing Time'} {formData.status !== 'Available' && <small>(N/A for {formData.status})</small>}</label>
                <input 
                  type="time" 
                  disabled={formData.status !== 'Available'}
                  value={formData.availableTo} 
                  onChange={e => setFormData({ ...formData, availableTo: e.target.value })} 
                />
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
        .filter-select-wrap select option { background: #0d0c14; color: #fff; }
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

        /* ── Location Autocomplete Styles ── */
        .loc-autocomplete-dropdown { position: absolute; top: 100%; left: 0; right: 0; z-index: 100; margin-top: 6px; background: #13121f; border: 1px solid rgba(139,92,246,0.25); border-radius: 16px; padding: 8px 0; max-height: 260px; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(139,92,246,0.08); backdrop-filter: blur(20px); animation: fadeIn 0.25s ease; }
        .loc-autocomplete-dropdown::-webkit-scrollbar { width: 6px; }
        .loc-autocomplete-dropdown::-webkit-scrollbar-track { background: transparent; }
        .loc-autocomplete-dropdown::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.25); border-radius: 10px; }
        .loc-ac-hint { padding: 6px 16px 10px; font-size: 0.65rem; color: #475569; letter-spacing: 0.03em; border-bottom: 1px solid rgba(255,255,255,0.04); margin-bottom: 4px; }
        .loc-ac-hint kbd { display: inline-block; padding: 1px 6px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; font-size: 0.6rem; color: #8b5cf6; font-family: inherit; margin: 0 2px; }
        .loc-ac-item { display: flex; align-items: center; gap: 12px; padding: 10px 16px; cursor: pointer; transition: all 0.15s ease; border-left: 3px solid transparent; }
        .loc-ac-item:hover, .loc-ac-item.active { background: rgba(139,92,246,0.08); border-left-color: #8b5cf6; }
        .loc-ac-item.active { background: rgba(139,92,246,0.12); }
        .loc-ac-icon { font-size: 1.1rem; flex-shrink: 0; }
        .loc-ac-text { font-size: 0.85rem; color: #cbd5e1; }
        .loc-ac-text strong { color: #f1f5f9; font-weight: 700; }

        .modal-f-actions { grid-column: span 2; display: flex; gap: 1rem; margin-top: 2rem; }
        .m-btn-pri { flex: 1; background: #8b5cf6; color: #fff; border: none; padding: 14px; border-radius: 14px; font-weight: 700; cursor: pointer; }
        .m-btn-sec { flex: 1; background: rgba(255,255,255,0.03); color: #94a3b8; border: 1px solid rgba(255,255,255,0.08); padding: 14px; border-radius: 14px; font-weight: 700; cursor: pointer; }

        .coming-soon-card-glass { height: 200px; background: rgba(13, 12, 20, 0.4); border: 2px dashed rgba(255,255,255,0.05); border-radius: 24px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
        .cs-glow { position: absolute; width: 150px; height: 150px; background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%); animation: pulseBg 4s infinite alternate; }
        .coming-soon-card-glass span { color: #475569; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; font-size: 0.8rem; z-index: 1; }

        .animate-in { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseBg { from { transform: scale(1); opacity: 0.5; } to { transform: scale(1.5); opacity: 1; } }

        /* ══════════════════════════════════════════
           BOOKING TAB — PREMIUM REDESIGN v2
        ══════════════════════════════════════════ */
        .booking-badge { background: rgba(251, 191, 36, 0.1); color: #fbbf24; border-color: rgba(251, 191, 36, 0.25); }

        /* ── Stats Tiles ── */
        .bk-stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; margin-bottom: 2.5rem; }
        .bk-stat-tile {
          position: relative; overflow: hidden;
          background: rgba(13,12,20,0.5); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 24px; padding: 1.75rem 1.5rem;
          backdrop-filter: blur(12px);
          transition: transform 0.35s cubic-bezier(0.4,0,0.2,1), box-shadow 0.35s;
          cursor: default;
        }
        .bk-stat-tile:hover { transform: translateY(-6px); box-shadow: 0 24px 50px rgba(0,0,0,0.35); }
        .bk-tile-glow { position: absolute; top: -40px; right: -40px; width: 120px; height: 120px; border-radius: 50%; opacity: 0.15; filter: blur(30px); pointer-events: none; }
        .bk-tile-total .bk-tile-glow { background: #8b5cf6; }
        .bk-tile-pending .bk-tile-glow { background: #fbbf24; }
        .bk-tile-approved .bk-tile-glow { background: #34d399; }
        .bk-tile-rejected .bk-tile-glow { background: #f87171; }
        .bk-tile-pending { border-color: rgba(251,191,36,0.18); }
        .bk-tile-approved { border-color: rgba(52,211,153,0.18); }
        .bk-tile-rejected { border-color: rgba(248,113,113,0.18); }
        .bk-tile-icon { font-size: 1.6rem; margin-bottom: 1rem; }
        .bk-tile-value { font-size: 2.8rem; font-weight: 900; line-height: 1; margin-bottom: 0.4rem; }
        .bk-tile-label { font-size: 0.68rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: #475569; }
        .bk-tile-urgent-dot {
          position: absolute; top: 1.25rem; right: 1.25rem;
          width: 10px; height: 10px; border-radius: 50%; background: #fbbf24;
          box-shadow: 0 0 0 4px rgba(251,191,36,0.2);
          animation: bkPulse 1.8s infinite;
        }
        @keyframes bkPulse { 0%,100% { transform: scale(1); box-shadow: 0 0 0 4px rgba(251,191,36,0.2); } 50% { transform: scale(1.15); box-shadow: 0 0 0 8px rgba(251,191,36,0); } }

        /* ── Control Bar ── */
        .bk-control-bar { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; margin-bottom: 1.25rem; padding: 1.25rem 1.5rem; background: rgba(13,12,20,0.4); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; backdrop-filter: blur(12px); }
        .bk-search-glass { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 200px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 10px 16px; transition: all 0.3s; }
        .bk-search-glass:focus-within { border-color: rgba(139,92,246,0.5); background: rgba(255,255,255,0.05); box-shadow: 0 0 0 3px rgba(139,92,246,0.08); }
        .bk-search-glass svg { color: #475569; flex-shrink: 0; }
        .booking-search-input { background: transparent; border: none; color: #f8fafc; font-size: 0.9rem; width: 100%; box-sizing: border-box; outline: none; }
        .booking-search-input::placeholder { color: #475569; }
        .bk-filter-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .bk-filter-pill-v2 {
          padding: 9px 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);
          color: #64748b; border-radius: 12px; cursor: pointer; font-size: 0.78rem; font-weight: 700;
          transition: all 0.25s cubic-bezier(0.4,0,0.2,1); white-space: nowrap; font-family: inherit;
        }
        .bk-filter-pill-v2:hover:not(.active) { background: rgba(255,255,255,0.06); color: #e2e8f0; border-color: rgba(255,255,255,0.12); }
        .bk-filter-pill-v2.active { background: rgba(var(--pill-color-rgb, 139,92,246),0.12); color: var(--pill-color, #8b5cf6); border-color: var(--pill-color, #8b5cf6); box-shadow: 0 4px 16px rgba(var(--pill-color-rgb, 139,92,246),0.15); transform: translateY(-1px); }

        /* ── Results meta ── */
        .booking-results-meta { font-size: 0.78rem; color: #475569; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .booking-results-meta strong { color: #94a3b8; }
        .booking-results-meta em { color: #8b5cf6; font-style: normal; }
        .bk-inline-clear { background: none; border: 1px solid rgba(248,113,113,0.25); color: #f87171; border-radius: 8px; padding: 3px 10px; font-size: 0.72rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .bk-inline-clear:hover { background: rgba(248,113,113,0.1); }

        /* ── Empty State ── */
        .bk-empty-state { position: relative; text-align: center; padding: 5rem 2rem; background: rgba(255,255,255,0.01); border-radius: 32px; border: 2px dashed rgba(255,255,255,0.05); overflow: hidden; }
        .bk-empty-orb { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 300px; height: 300px; background: radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%); border-radius: 50%; pointer-events: none; }
        .bk-empty-icon { font-size: 3rem; margin-bottom: 1.5rem; opacity: 0.5; position: relative; }
        .bk-empty-state h3 { font-size: 1.25rem; font-weight: 800; margin-bottom: 0.5rem; color: #f8fafc; position: relative; }
        .bk-empty-state p { color: #64748b; position: relative; }
        .bk-clear-btn { margin-top: 1.5rem; padding: 9px 20px; background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.3); color: #8b5cf6; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 0.85rem; transition: all 0.2s; position: relative; }
        .bk-clear-btn:hover { background: rgba(139,92,246,0.2); transform: translateY(-2px); }

        /* ── Premium Card Grid ── */
        .bk-cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); gap: 1.5rem; }
        .bk-premium-card {
          position: relative; overflow: hidden;
          background: rgba(13,12,20,0.55);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 24px; padding: 1.75rem;
          backdrop-filter: blur(16px);
          transition: transform 0.4s cubic-bezier(0.23,1,0.32,1), box-shadow 0.4s, border-color 0.4s;
          animation: fadeIn 0.5s cubic-bezier(0.16,1,0.3,1) var(--anim-delay, 0s) both;
          display: flex; flex-direction: column; gap: 1.25rem;
          border-left: 3px solid transparent;
        }
        .bk-premium-card:hover { transform: translateY(-8px) scale(1.01); box-shadow: 0 30px 60px rgba(0,0,0,0.4); border-color: rgba(255,255,255,0.15); }
        .bk-status-pending.bk-premium-card { border-left-color: #fbbf24; }
        .bk-status-approved.bk-premium-card { border-left-color: #34d399; }
        .bk-status-rejected.bk-premium-card { border-left-color: #f87171; }
        .bk-status-cancelled.bk-premium-card { border-left-color: #475569; }
        .bk-card-shine { position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%); pointer-events: none; }

        /* Card Top Row */
        .bk-premium-top { display: flex; align-items: center; gap: 14px; }
        .bk-p-avatar {
          width: 52px; height: 52px; border-radius: 16px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.4rem; font-weight: 900; text-transform: uppercase;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .bk-avatar-pending { background: linear-gradient(135deg, rgba(251,191,36,0.25), rgba(251,191,36,0.1)); color: #fbbf24; }
        .bk-avatar-approved { background: linear-gradient(135deg, rgba(52,211,153,0.25), rgba(52,211,153,0.1)); color: #34d399; }
        .bk-avatar-rejected { background: linear-gradient(135deg, rgba(248,113,113,0.25), rgba(248,113,113,0.1)); color: #f87171; }
        .bk-avatar-cancelled { background: linear-gradient(135deg, rgba(148,163,184,0.15), rgba(148,163,184,0.05)); color: #94a3b8; }
        .bk-p-title-block { flex: 1; min-width: 0; }
        .bk-p-resource-name { font-size: 1.1rem; font-weight: 800; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.01em; }
        .bk-p-resource-type { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #0ea5e9; margin-top: 3px; }

        /* Status badge v2 */
        .bk-badge-v2 { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 100px; font-size: 0.68rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; flex-shrink: 0; }
        .bk-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
        .bk-badge-pending { background: rgba(251,191,36,0.12); color: #fbbf24; border: 1px solid rgba(251,191,36,0.28); }
        .bk-badge-pending .bk-badge-dot { animation: bkPulse 1.8s infinite; }
        .bk-badge-approved { background: rgba(52,211,153,0.12); color: #34d399; border: 1px solid rgba(52,211,153,0.28); }
        .bk-badge-rejected { background: rgba(248,113,113,0.12); color: #f87171; border: 1px solid rgba(248,113,113,0.28); }
        .bk-badge-cancelled { background: rgba(148,163,184,0.07); color: #94a3b8; border: 1px solid rgba(148,163,184,0.18); }

        /* User row */
        .bk-p-user-row { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: rgba(255,255,255,0.02); border-radius: 10px; border: 1px solid rgba(255,255,255,0.04); }
        .bk-p-user-icon { font-size: 0.9rem; }
        .bk-p-user-id { font-size: 0.82rem; color: #64748b; font-weight: 600; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        /* Chips grid */
        .bk-p-chips { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .bk-p-chip { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; background: rgba(255,255,255,0.02); border-radius: 14px; border: 1px solid rgba(255,255,255,0.04); transition: background 0.2s; }
        .bk-p-chip:hover { background: rgba(255,255,255,0.04); }
        .bk-p-chip-wide { grid-column: span 2; }
        .bk-chip-reason { border-color: rgba(248,113,113,0.15); background: rgba(248,113,113,0.04); }
        .bk-p-chip-icon { font-size: 1rem; flex-shrink: 0; padding-top: 1px; }
        .bk-p-chip-label { font-size: 0.6rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: #475569; margin-bottom: 3px; }
        .bk-p-chip-val { font-size: 0.85rem; font-weight: 600; color: #cbd5e1; }
        .bk-p-purpose { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* Action footer */
        .bk-p-actions { display: flex; gap: 10px; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.05); align-items: center; }
        .bk-p-btn { display: flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: 12px; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.25s cubic-bezier(0.4,0,0.2,1); font-family: inherit; }
        .bk-p-btn-approve { background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.3); color: #34d399; flex: 1; justify-content: center; }
        .bk-p-btn-approve:hover { background: rgba(52,211,153,0.22); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(52,211,153,0.2); }
        .bk-p-btn-reject { background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.3); color: #f87171; flex: 1; justify-content: center; }
        .bk-p-btn-reject:hover { background: rgba(248,113,113,0.22); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(248,113,113,0.2); }
        .bk-p-btn-delete { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); color: #64748b; width: 40px; height: 40px; padding: 0; justify-content: center; border-radius: 12px; font-size: 0.95rem; }
        .bk-p-btn-delete:hover { background: rgba(248,113,113,0.12); border-color: rgba(248,113,113,0.3); color: #f87171; transform: translateY(-2px); }

        /* ── Administrators persons card ── */
        .admin-persons-card { border-color: rgba(168, 85, 247, 0.2) !important; }
        .admin-persons-list { display: flex; flex-direction: column; gap: 10px; margin-top: 0.75rem; }
        .admin-person-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: rgba(168,85,247,0.06); border: 1px solid rgba(168,85,247,0.12); border-radius: 12px; transition: background 0.2s; }
        .admin-person-row:hover { background: rgba(168,85,247,0.12); }
        .admin-person-avatar { width: 34px; height: 34px; border-radius: 10px; background: linear-gradient(135deg, #7c3aed, #a855f7); display: flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: 900; color: #fff; flex-shrink: 0; box-shadow: 0 4px 10px rgba(168,85,247,0.3); }
        .admin-person-info { min-width: 0; }
        .admin-person-name { font-weight: 700; font-size: 0.85rem; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .admin-person-role { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #a855f7; margin-top: 1px; }

        @media (max-width: 1024px) {
          .dashboard-sections-layout { grid-template-columns: 1fr; }
          .sidebar-glass { width: 80px; }
          .nav-t, .sidebar-brand, .sidebar-footer span { display: none; }
          .sidebar-nav-item { justify-content: center; padding: 15px; }
          .booking-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .booking-card-glass { flex-wrap: wrap; }
          .bk-card-middle { flex-wrap: wrap; gap: 1rem; }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
