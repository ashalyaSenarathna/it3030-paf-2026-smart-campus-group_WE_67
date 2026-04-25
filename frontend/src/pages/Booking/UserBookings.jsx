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

  const isExpired = (b) => {
    if ((b.status || '').toUpperCase() !== 'APPROVED') return false;
    try {
      let endDateTime;
      if (Array.isArray(b.date)) {
        const [y, m, d] = b.date;
        const endTimeArr = Array.isArray(b.endTime) ? b.endTime : [0, 0];
        const [h, min] = endTimeArr;
        endDateTime = new Date(y, m - 1, d, h, min);
      } else {
        endDateTime = new Date(b.date);
        const endTimeStr = typeof b.endTime === 'string' ? b.endTime : '00:00';
        const [h, min] = endTimeStr.split(':');
        endDateTime.setHours(parseInt(h) || 0, parseInt(min) || 0, 0, 0);
      }
      return endDateTime < new Date();
    } catch (e) {
      return false;
    }
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
      {/* ── Ambient Background Glows ── */}
      <div className="ub-ambient-glow ub-glow-1"></div>
      <div className="ub-ambient-glow ub-glow-2"></div>
      <div className="ub-ambient-glow ub-glow-3"></div>

      <main className="ub-container">
        {/* ── Premium Hero Section ── */}
        <div className="ub-hero-section">
          <div className="ub-hero-badge animate-float">
            <span className="ub-badge-dot"></span>
            My Personal Space
          </div>
          <h1 className="ub-main-title">My Bookings</h1>
          <p className="ub-sub-title">Manage and track all your facility reservations across the campus campus.</p>

          <div className="ub-summary-grid">
            <div className="ub-summary-card">
              <div className="ub-card-inner">
                <span className="ub-card-icon">🗂️</span>
                <div className="ub-card-data">
                  <span className="ub-data-num">{totalCount}</span>
                  <span className="ub-data-label">Total Requests</span>
                </div>
              </div>
            </div>
            <div className="ub-summary-card ub-card-confirmed">
              <div className="ub-card-inner">
                <span className="ub-card-icon">✅</span>
                <div className="ub-card-data">
                  <span className="ub-data-num">{approvedCount}</span>
                  <span className="ub-data-label">Confirmed</span>
                </div>
              </div>
            </div>
            <div className="ub-summary-card ub-card-pending">
              <div className="ub-card-inner">
                <span className="ub-card-icon">⏳</span>
                <div className="ub-card-data">
                  <span className="ub-data-num">{pendingCount}</span>
                  <span className="ub-data-label">Pending Review</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Interactive Filter Shelf ── */}
        <div className="ub-shelf">
          <div className="ub-shelf-label">Filter by Status</div>
          <div className="ub-shelf-actions">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(s => (
              <button
                key={s}
                className={`ub-pill-btn ${statusFilter === s ? 'is-active' : ''}`}
                data-status={s.toLowerCase()}
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* ── Results count meta ── */}
        <div className="ub-meta-row">
          Showing <strong>{filteredBookings.length}</strong> reservations
          {statusFilter !== 'ALL' && <span className="ub-tag-inline">Filtered by {statusFilter}</span>}
        </div>

        {/* ── Booking Records ── */}
        {filteredBookings.length === 0 ? (
          <div className="ub-empty-state animate-in">
            <div className="ub-empty-decor"></div>
            <div className="ub-empty-icon">📂</div>
            <h3>No bookings found</h3>
            <p>You haven't made any reservations under this category yet.</p>
            {statusFilter === 'ALL' ? (
              <Link to="/facility-management/resource-catalogue" className="ub-action-btn-main">Explore Catalogue</Link>
            ) : (
              <button onClick={() => setStatusFilter('ALL')} className="ub-action-btn-alt">Reset Filters</button>
            )}
          </div>
        ) : (
          <div className="ub-records-grid">
            {filteredBookings.map((booking, index) => {
              const rName = resources[booking.resourceId] || 'Campus Facility';
              const expired = isExpired(booking);
              const displayStatus = expired ? 'EXPIRED' : (booking.status || 'PENDING').toUpperCase();
              const status = (booking.status || 'PENDING').toUpperCase();

              return (
                <div
                  key={booking.id}
                  className={`ub-booking-card s-border-${displayStatus.toLowerCase()}`}
                  style={{ '--entry-delay': `${index * 0.08}s`, opacity: expired ? 0.8 : 1 }}
                >


                  <div className="ub-card-shine"></div>
                  
                  {/* Card Header */}
                  <div className="ub-card-header">
                    <span className={`ub-status-tag tag-${displayStatus.toLowerCase()}`}>
                      <span className="ub-tag-dot"></span>
                      {displayStatus}
                    </span>

                    <span className="ub-card-id">#{booking.id.toString().slice(-6)}</span>
                  </div>

                  <h2 className="ub-facility-name">{rName}</h2>

                  {/* Details Flex */}
                  <div className="ub-detail-stack">
                    <div className="ub-detail-row">
                      <span className="ub-detail-icon">📅</span>
                      <div className="ub-detail-text">
                        <label>Reservation Date</label>
                        <span>{formatDate(booking.date)}</span>
                      </div>
                    </div>
                    <div className="ub-detail-row">
                      <span className="ub-detail-icon">🕒</span>
                      <div className="ub-detail-text">
                        <label>Assigned Slot</label>
                        <span>{formatTime(booking.startTime)} — {formatTime(booking.endTime)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Purpose Box */}
                  <div className="ub-purpose-box">
                    <label>Stated Purpose</label>
                    <p>{booking.purpose || 'No purpose stated'}</p>
                  </div>

                  {status === 'REJECTED' && booking.adminReason && (
                    <div className="ub-feedback-box">
                      <div className="ub-feedback-header">Admin Feedback</div>
                      <p>{booking.adminReason}</p>
                    </div>
                  )}

                  {/* Actions Footer */}
                  {(status === 'PENDING' || status === 'APPROVED') && (
                    <div className="ub-card-footer">
                      <button
                        className="ub-footer-btn ub-edit-btn"
                        onClick={() => setEditingBooking(booking)}
                      >
                        ✏️ Edit Request
                      </button>
                      <button
                        className="ub-footer-btn ub-cancel-btn"
                        onClick={() => handleCancel(booking.id)}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="ub-site-footer">
        <p>© 2026 Smart Campus Management System</p>
      </footer>

      {/* ── Edit Modal ── */}
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
