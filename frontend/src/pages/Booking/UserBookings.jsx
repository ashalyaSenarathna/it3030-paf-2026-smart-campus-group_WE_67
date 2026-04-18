import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingApi, resourceApi } from '../../api/api';
import RequestBookingModal from './RequestBookingModal';
import './Booking.css';

const UserBookings = ({ user }) => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [resources, setResources] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editingBooking, setEditingBooking] = useState(null);
  const [resourceDetails, setResourceDetails] = useState([]); // Store raw resource objects

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
        if (!user?.id) {
          setLoading(false);
          return;
        }

        const [bookingsRes, resourcesRes] = await Promise.all([
          bookingApi.getByUser(user.id),
          resourceApi.getAll()
        ]);

        const resourceMap = {};
        resourcesRes.data.forEach(r => {
          resourceMap[r.id] = r.name;
        });
        
        setResources(resourceMap);
        setResourceDetails(resourcesRes.data);
        setBookings(bookingsRes.data);
        setFilteredBookings(bookingsRes.data);
      } catch (err) {
        console.error("Error fetching bookings:", err);
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

  const handleUpdateSuccess = () => {
    setEditingBooking(null);
    window.location.reload();
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await bookingApi.cancel(id);
      window.location.reload();
    } catch (err) {
      alert("Failed to cancel booking: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="bookings-dashboard">
        <div className="loader-container">
          <div className="premium-loader"></div>
          <p>Gathering your reservations...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bookings-dashboard">
        <div className="empty-state-card">
          <div className="empty-icon">🔐</div>
          <h2>Authentication Required</h2>
          <p>Please log in to view and manage your resource bookings.</p>
          <Link to="/login" className="btn-submit">Sign In Now</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bookings-dashboard">
      <div className="dashboard-content-wrapper">
        <div className="catalogue-topbar">
          <Link to="/" className="back-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back to Home
          </Link>
          <div className="user-badge">
            <div className="user-avatar">{user.username?.charAt(0) || user.email?.charAt(0) || 'U'}</div>
            <span>{user.username || user.email}</span>
          </div>
        </div>

        <div className="bookings-hero">
          <div className="hero-badge">Resource Management</div>
          <h1 className="glitch-text" data-text="My Bookings">My Bookings</h1>
          <p className="hero-subtitle">
            Track, manage, and monitor your campus facility reservations in real-time.
          </p>
          
          <div className="filter-shelf">
            <div className="filter-main">
              <div className="filter-group">
                <label>Filter by Status</label>
                <div className="filter-buttons">
                  {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(status => (
                    <button 
                      key={status}
                      className={`filter-tag ${statusFilter.toUpperCase() === status.toUpperCase() ? 'active' : ''}`}
                      onClick={() => setStatusFilter(status)}
                    >
                      <span className={`status-dot-sm ${status.toLowerCase()}`}></span>
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="booking-stats-horizontal">
              <div className="stat-card">
                <div className="stat-value">{bookings.length}</div>
                <div className="stat-label">Total Requests</div>
              </div>
              <div className="stat-card approved">
                <div className="stat-value">
                  {bookings.filter(b => b.status?.toString().toUpperCase() === 'APPROVED').length}
                </div>
                <div className="stat-label">Confirmed</div>
              </div>
            </div>
          </div>
        </div>
        
        {filteredBookings.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon-glow">
              {statusFilter === 'ALL' ? '📅' : '🔍'}
            </div>
            <h3>{statusFilter === 'ALL' ? 'No Active Reservations' : `No ${statusFilter.toLowerCase()} bookings found`}</h3>
            <p className="empty-description">
              {statusFilter === 'ALL' 
                ? "Your reservation list is empty. Discover and book premium campus facilities today."
                : `We couldn't find any bookings matching the ${statusFilter.toLowerCase()} criteria.`}
            </p>
            {statusFilter === 'ALL' ? (
              <Link to="/facility-management/resource-catalogue" className="btn-primary-glow">
                Explore Catalogue
              </Link>
            ) : (
              <button onClick={() => setStatusFilter('ALL')} className="btn-secondary-glass">Clear All Filters</button>
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
                <div className="card-header">
                  <div className={`status-pill pill-${booking.status?.toString().toUpperCase()}`}>
                    <span className="status-dot-animated"></span>
                    {booking.status}
                  </div>
                  <div className="booking-id">ID: {booking.id.toString().slice(-6)}</div>
                </div>
                
                <h3 className="resource-name">{resources[booking.resourceId] || 'Campus Resource'}</h3>
                
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    </div>
                    <div className="info-content">
                      <label>Reservation Date</label>
                      <span>{formatDate(booking.date)}</span>
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
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
                    <strong>Reason for Rejection:</strong>
                    <p>{booking.adminReason}</p>
                  </div>
                )}

                <div className="card-footer">
                  <div className="footer-actions">
                    {(booking.status === 'PENDING' || booking.status === 'APPROVED') && (
                      <>
                        <button 
                          className="btn-submit-sm" 
                          style={{ marginRight: '10px', background: 'rgba(139, 92, 246, 0.2)', border: '1px solid #8b5cf6', color: '#fff', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' }}
                          onClick={() => setEditingBooking(booking)}
                        >
                          Edit
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
      </div>
      
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

