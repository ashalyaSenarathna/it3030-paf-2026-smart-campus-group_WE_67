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
        <p>Finalize and monitor all campus facility requests.</p>
      </header>

      {/* Stats Row */}
      <div className="stats-grid booking-stats-grid" style={{ marginBottom: '2.5rem' }}>
        <div className="stat-card booking-stat-card">
          <div className="booking-stat-icon">📋</div>
          <div className="label">Total Bookings</div>
          <div className="value">{bookingStats.total}</div>
          <div className="stat-meta">All reservations</div>
        </div>
        <div className="stat-card booking-stat-card pending-card">
          <div className="booking-stat-icon">⏳</div>
          <div className="label">Pending Review</div>
          <div className="value" style={{ color: '#fbbf24' }}>{bookingStats.pending}</div>
          <div className="stat-meta">Awaiting action</div>
        </div>
        <div className="stat-card booking-stat-card approved-card">
          <div className="booking-stat-icon">✅</div>
          <div className="label">Approved</div>
          <div className="value" style={{ color: '#34d399' }}>{bookingStats.approved}</div>
          <div className="stat-meta">Confirmed bookings</div>
        </div>
        <div className="stat-card booking-stat-card rejected-card">
          <div className="booking-stat-icon">❌</div>
          <div className="label">Rejected</div>
          <div className="value" style={{ color: '#f87171' }}>{bookingStats.rejected}</div>
          <div className="stat-meta">Declined requests</div>
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="booking-control-bar">
        <div className="booking-search-wrap">
          <span className="bk-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by facility or user..."
            value={bookingSearch}
            onChange={(e) => setBookingSearch(e.target.value)}
            className="booking-search-input"
          />
        </div>
        <div className="booking-filter-pills">
          {['All', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(f => (
            <button
              key={f}
              className={`bk-filter-pill ${bookingFilter === f ? 'active' : ''}`}
              onClick={() => setBookingFilter(f)}
            >
              {f === 'All' ? '🗂 All' : f === 'PENDING' ? '⏳ Pending' : f === 'APPROVED' ? '✅ Approved' : f === 'REJECTED' ? '❌ Rejected' : '🚫 Cancelled'}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="booking-results-meta">
        Showing <strong>{filteredBookings.length}</strong> of {bookings.length} bookings
        {bookingSearch && <span> · Filtered by "<em>{bookingSearch}</em>"</span>}
      </div>

      {/* Booking Cards */}
      {filteredBookings.length === 0 ? (
        <div className="empty-table-state booking-empty">
          <div className="empty-icon">📅</div>
          <h3>No reservations found</h3>
          <p>Try adjusting your search or filter criteria.</p>
          {bookingSearch && (
            <button className="bk-clear-btn" onClick={() => setBookingSearch('')}>Clear Search</button>
          )}
        </div>
      ) : (
        <div className="booking-cards-list">
          {filteredBookings.map((b, idx) => {
            const resourceName = resources.find(r => String(r.id) === String(b.resourceId))?.name || 'Unknown Facility';
            const statusLower = (b.status || '').toLowerCase();
            return (
              <div key={b.id} className={`booking-card-glass bk-status-${statusLower}`} style={{ animationDelay: `${idx * 0.05}s` }}>
                <div className="bk-card-left">
                  <div className="bk-resource-avatar">{resourceName.charAt(0)}</div>
                  <div className="bk-card-info">
                    <div className="bk-resource-name">{resourceName}</div>
                    <div className="bk-user-tag">👤 {b.userId || 'Unknown User'}</div>
                  </div>
                </div>
                <div className="bk-card-middle">
                  <div className="bk-detail-chip">
                    <span className="bk-chip-label">Date</span>
                    <span className="bk-chip-value">📆 {formatDate(b.date)}</span>
                  </div>
                  <div className="bk-detail-chip">
                    <span className="bk-chip-label">Time</span>
                    <span className="bk-chip-value">🕐 {formatTime(b.startTime)} – {formatTime(b.endTime)}</span>
                  </div>
                </div>
                <div className="bk-card-right">
                  <span className={`bk-status-badge bk-s-${statusLower}`}>{b.status}</span>
                  <div className="bk-action-group">
                    {b.status === 'PENDING' && (
                      <>
                        <button
                          className="bk-btn-approve"
                          title="Approve Booking"
                          onClick={() => handleBookingAction(b.id, 'APPROVE')}
                        >
                          ✓ Approve
                        </button>
                        <button
                          className="bk-btn-reject"
                          title="Reject Booking"
                          onClick={() => {
                            const reason = prompt('Rejection Reason:');
                            if (reason) handleBookingAction(b.id, 'REJECT', reason);
                          }}
                        >
                          ✕ Reject
                        </button>
                      </>
                    )}
                    {(b.status === 'APPROVED' || b.status === 'PENDING') && (
                      <button
                        className="bk-btn-delete"
                        title="Delete Booking"
                        onClick={() => handleBookingAction(b.id, 'CANCEL')}
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </div>
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

        /* ── Booking Tab Exclusive Styles ── */
        .booking-badge { background: rgba(251, 191, 36, 0.1); color: #fbbf24; border-color: rgba(251, 191, 36, 0.25); }
        .booking-stats-grid { grid-template-columns: repeat(4, 1fr); }
        .booking-stat-card { position: relative; overflow: hidden; transition: transform 0.3s, box-shadow 0.3s; }
        .booking-stat-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
        .booking-stat-icon { font-size: 1.5rem; margin-bottom: 0.75rem; }
        .pending-card { border-color: rgba(251, 191, 36, 0.15); }
        .approved-card { border-color: rgba(52, 211, 153, 0.15); }
        .rejected-card { border-color: rgba(248, 113, 113, 0.15); }

        .booking-control-bar { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; margin-bottom: 1.25rem; }
        .booking-search-wrap { position: relative; flex: 1; min-width: 220px; }
        .bk-search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 0.8rem; opacity: 0.5; pointer-events: none; }
        .booking-search-input { width: 100%; padding: 11px 16px 11px 38px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; color: #f8fafc; font-size: 0.9rem; transition: all 0.3s; box-sizing: border-box; }
        .booking-search-input::placeholder { color: #475569; }
        .booking-search-input:focus { outline: none; border-color: rgba(251,191,36,0.5); background: rgba(255,255,255,0.05); box-shadow: 0 0 20px rgba(251,191,36,0.07); }
        .booking-filter-pills { display: flex; gap: 8px; flex-wrap: wrap; }
        .bk-filter-pill { padding: 9px 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); color: #64748b; border-radius: 10px; cursor: pointer; font-size: 0.78rem; font-weight: 700; transition: all 0.25s; white-space: nowrap; }
        .bk-filter-pill:hover:not(.active) { background: rgba(255,255,255,0.05); color: #e2e8f0; }
        .bk-filter-pill.active { background: rgba(251,191,36,0.1); color: #fbbf24; border-color: rgba(251,191,36,0.35); }

        .booking-results-meta { font-size: 0.78rem; color: #475569; margin-bottom: 1.5rem; }
        .booking-results-meta strong { color: #94a3b8; }
        .booking-results-meta em { color: #8b5cf6; font-style: normal; }

        .booking-cards-list { display: flex; flex-direction: column; gap: 12px; }
        .booking-card-glass {
          display: flex; align-items: center; gap: 1.5rem;
          background: rgba(13,12,20,0.5); border: 1px solid rgba(255,255,255,0.05);
          border-radius: 20px; padding: 1.25rem 1.5rem;
          backdrop-filter: blur(10px);
          transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s;
          animation: fadeIn 0.4s cubic-bezier(0.16,1,0.3,1) both;
          border-left-width: 3px;
        }
        .booking-card-glass:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(0,0,0,0.3); }
        .bk-status-pending { border-left-color: #fbbf24; }
        .bk-status-approved { border-left-color: #34d399; }
        .bk-status-rejected { border-left-color: #f87171; }
        .bk-status-cancelled { border-left-color: #475569; }

        .bk-card-left { display: flex; align-items: center; gap: 14px; flex: 1.2; min-width: 0; }
        .bk-resource-avatar {
          width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
          background: linear-gradient(135deg, rgba(139,92,246,0.3), rgba(251,191,36,0.2));
          border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.25rem; font-weight: 900; color: #c084fc; text-transform: uppercase;
        }
        .bk-resource-name { font-weight: 700; font-size: 0.95rem; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .bk-user-tag { font-size: 0.78rem; color: #64748b; margin-top: 3px; }

        .bk-card-middle { display: flex; gap: 2rem; flex: 1; }
        .bk-detail-chip { display: flex; flex-direction: column; gap: 4px; }
        .bk-chip-label { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; }
        .bk-chip-value { font-size: 0.85rem; font-weight: 600; color: #cbd5e1; }

        .bk-card-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
        .bk-status-badge { display: inline-flex; align-items: center; padding: 5px 12px; border-radius: 100px; font-size: 0.68rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; }
        .bk-s-pending { background: rgba(251,191,36,0.12); color: #fbbf24; border: 1px solid rgba(251,191,36,0.25); }
        .bk-s-approved { background: rgba(52,211,153,0.12); color: #34d399; border: 1px solid rgba(52,211,153,0.25); }
        .bk-s-rejected { background: rgba(248,113,113,0.12); color: #f87171; border: 1px solid rgba(248,113,113,0.25); }
        .bk-s-cancelled { background: rgba(148,163,184,0.07); color: #94a3b8; border: 1px solid rgba(148,163,184,0.15); }

        .bk-action-group { display: flex; gap: 8px; align-items: center; }
        .bk-btn-approve { padding: 7px 14px; background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.3); color: #34d399; border-radius: 10px; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .bk-btn-approve:hover { background: rgba(52,211,153,0.2); transform: scale(1.05); box-shadow: 0 4px 12px rgba(52,211,153,0.2); }
        .bk-btn-reject { padding: 7px 14px; background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.3); color: #f87171; border-radius: 10px; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .bk-btn-reject:hover { background: rgba(248,113,113,0.2); transform: scale(1.05); box-shadow: 0 4px 12px rgba(248,113,113,0.2); }
        .bk-btn-delete { width: 34px; height: 34px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; font-size: 0.9rem; }
        .bk-btn-delete:hover { background: rgba(248,113,113,0.15); border-color: rgba(248,113,113,0.3); }

        .booking-empty { margin-top: 2rem; }
        .bk-clear-btn { margin-top: 1.5rem; padding: 9px 20px; background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.3); color: #8b5cf6; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 0.85rem; transition: all 0.2s; }
        .bk-clear-btn:hover { background: rgba(139,92,246,0.2); }

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
