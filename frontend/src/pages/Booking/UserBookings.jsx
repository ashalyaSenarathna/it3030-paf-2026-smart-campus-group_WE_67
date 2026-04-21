import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bookingApi, resourceApi } from '../../api/api';
import RequestBookingModal from './RequestBookingModal';
import './Booking.css';

const UserBookings = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [resources, setResources] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editingBooking, setEditingBooking] = useState(null);
  const [resourceDetails, setResourceDetails] = useState([]);
  const [scrolled, setScrolled] = useState(false);

  const isAdmin = user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('ADMIN');
  const isStudent = user?.roles?.includes('ROLE_STUDENT') || user?.roles?.includes('STUDENT');
  const isTech = user?.roles?.includes('ROLE_TECHNICIAN') || user?.roles?.includes('TECHNICIAN');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      if (onLogout) await onLogout();
    } finally {
      navigate('/login');
    }
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
      return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    }
    const d = new Date(date);
    return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.id) { setLoading(false); return; }
        const [bookingsRes, resourcesRes] = await Promise.all([
          bookingApi.getByUser(user.id),
          resourceApi.getAll()
        ]);
        const resourceMap = {};
        resourcesRes.data.forEach(r => { resourceMap[r.id] = r.name; });
        setResources(resourceMap);
        setResourceDetails(resourcesRes.data);
        setBookings(bookingsRes.data);
        setFilteredBookings(bookingsRes.data);
      } catch (err) {
        console.error('Error fetching bookings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    if (statusFilter.toUpperCase() === 'ALL') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter(b => b.status?.toUpperCase() === statusFilter.toUpperCase()));
    }
  }, [statusFilter, bookings]);

  const handleUpdateSuccess = () => { setEditingBooking(null); window.location.reload(); };
  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await bookingApi.cancel(id);
      window.location.reload();
    } catch (err) {
      alert('Failed to cancel booking: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="ub-page">
        <div className="loader-container">
          <div className="premium-loader"></div>
          <p>Gathering your reservations...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="ub-page">
        <div className="empty-state-card" style={{ marginTop: '20vh' }}>
          <div className="empty-icon-glow">🔐</div>
          <h3>Authentication Required</h3>
          <p className="empty-description">Please log in to view and manage your bookings.</p>
          <Link to="/login" className="btn-primary-glow">Sign In Now</Link>
        </div>
      </div>
    );
  }

  const totalCount = bookings.length;
  const approvedCount = bookings.filter(b => b.status?.toUpperCase() === 'APPROVED').length;
  const pendingCount = bookings.filter(b => b.status?.toUpperCase() === 'PENDING').length;

  return (
    <div className="ub-page">
      {/* Ambient background glows */}
      <div className="ub-blob ub-blob-1" aria-hidden="true"></div>
      <div className="ub-blob ub-blob-2" aria-hidden="true"></div>



      {/* ─── MAIN CONTENT ─── */}
      <main className="ub-main">
        {/* Hero */}
        <div className="ub-hero">
          <div className="ub-hero-badge">📋 Resource Management</div>
          <h1 className="ub-hero-title">My Bookings</h1>
          <p className="ub-hero-sub">Track, manage, and monitor your campus facility reservations in real-time.</p>

          {/* Stats */}
          <div className="ub-stats-row">
            <div className="ub-stat-pill">
              <span className="ub-stat-num">{totalCount}</span>
              <span className="ub-stat-label">Total</span>
            </div>
            <div className="ub-stat-pill ub-stat-pill--approved">
              <span className="ub-stat-num">{approvedCount}</span>
              <span className="ub-stat-label">Confirmed</span>
            </div>
            <div className="ub-stat-pill ub-stat-pill--pending">
              <span className="ub-stat-num">{pendingCount}</span>
              <span className="ub-stat-label">Pending</span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="ub-filter-bar">
          <span className="ub-filter-label">Filter by Status</span>
          <div className="ub-filter-pills">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(s => (
              <button
                key={s}
                className={`ub-filter-btn ${statusFilter === s ? 'ub-filter-btn--active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                <span className={`ub-dot ub-dot--${s.toLowerCase()}`}></span>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        {filteredBookings.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon-glow">{statusFilter === 'ALL' ? '📅' : '🔍'}</div>
            <h3>{statusFilter === 'ALL' ? 'No Active Reservations' : `No ${statusFilter.toLowerCase()} bookings`}</h3>
            <p className="empty-description">
              {statusFilter === 'ALL'
                ? 'Your reservation list is empty. Discover and book premium campus facilities today.'
                : `We couldn't find any bookings matching the ${statusFilter.toLowerCase()} criteria.`}
            </p>
            {statusFilter === 'ALL' ? (
              <Link to="/facility-management/resource-catalogue" className="btn-primary-glow">Explore Catalogue</Link>
            ) : (
              <button onClick={() => setStatusFilter('ALL')} className="btn-secondary-glass">Clear Filters</button>
            )}
          </div>
        ) : (
          <div className="bookings-masonry">
            {filteredBookings.map((booking, index) => (
              <div
                key={booking.id}
                className={`booking-glass-card status-border-${booking.status}`}
                style={{ '--index': index }}
              >
                <div className="card-glass-shine"></div>

                {/* Card Header */}
                <div className="card-header">
                  <div className={`status-pill pill-${booking.status?.toString().toUpperCase()}`}>
                    <span className="status-dot-animated"></span>
                    {booking.status}
                  </div>
                  <div className="booking-id">#{booking.id.toString().slice(-6)}</div>
                </div>

                <h3 className="resource-name">{resources[booking.resourceId] || 'Campus Resource'}</h3>

                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                    </div>
                    <div className="info-content">
                      <label>Reservation Date</label>
                      <span>{formatDate(booking.date)}</span>
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                    </div>
                    <div className="info-content">
                      <label>Time Slot</label>
                      <span>{formatTime(booking.startTime)} — {formatTime(booking.endTime)}</span>
                    </div>
                  </div>
                </div>

                <div className="purpose-section">
                  <label>Purpose</label>
                  <p>{booking.purpose}</p>
                </div>

                {booking.status === 'REJECTED' && booking.adminReason && (
                  <div className="admin-note">
                    <strong>Rejection Reason:</strong>
                    <p>{booking.adminReason}</p>
                  </div>
                )}

                <div className="card-footer">
                  <div className="footer-actions">
                    {(booking.status === 'PENDING' || booking.status === 'APPROVED') && (
                      <>
                        <button
                          className="ub-btn-edit"
                          onClick={() => setEditingBooking(booking)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn-cancel-glass"
                          onClick={() => handleCancel(booking.id)}
                        >
                          Cancel Booking
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="ub-footer">
        <p>© 2026 Smart Campus — WE_146_3.1</p>
      </footer>

      {/* Edit Modal */}
      {editingBooking && (
        <RequestBookingModal
          resource={resourceDetails.find(r => r.id === editingBooking.resourceId) || { name: 'Resource', id: editingBooking.resourceId }}
          user={user}
          existingBooking={editingBooking}
          onClose={() => setEditingBooking(null)}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
};

export default UserBookings;
