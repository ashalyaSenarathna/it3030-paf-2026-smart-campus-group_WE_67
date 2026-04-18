import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingApi, resourceApi } from '../../api/api';
import './Booking.css';

const AdminBookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [resources, setResources] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bookingsRes, resourcesRes] = await Promise.all([
        bookingApi.getAll(),
        resourceApi.getAll()
      ]);

      const resourceMap = {};
      resourcesRes.data.forEach(r => {
        resourceMap[r.id] = r.name;
      });
      
      setResources(resourceMap);
      setBookings(bookingsRes.data);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      if (!window.confirm("Approve this booking?")) return;
      await bookingApi.approve(id);
      setBookings(bookings.map(b => b.id === id ? { ...b, status: 'APPROVED' } : b));
    } catch (err) {
      alert("Failed to approve booking: " + (err.response?.data?.message || err.message));
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Please enter a reason for rejection:");
    if (!reason) return;
    try {
      await bookingApi.reject(id, reason);
      setBookings(bookings.map(b => b.id === id ? { ...b, status: 'REJECTED', adminReason: reason } : b));
    } catch (err) {
      alert("Failed to reject booking: " + (err.response?.data?.message || err.message));
    }
  };

  const filteredBookings = filter === 'All' ? bookings : bookings.filter(b => b.status?.toUpperCase() === filter.toUpperCase());

  if (loading) {
    return (
      <div className="bookings-dashboard">
        <div className="loader-container">
          <div className="premium-loader"></div>
          <p>Loading administrative dashboard...</p>
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
            Back to Dashboard
          </Link>
          <div className="admin-status-badge">
            <span className="pulse-dot"></span>
            System Administrator
          </div>
        </div>

        <div className="bookings-header">
          <div className="hero-badge">Control Center</div>
          <h1>Booking Requests</h1>
          <p>Review and manage all resource reservations across the campus facilities.</p>
          
          <div className="filter-shelf">
            <div className="filter-group">
              <label>Filter Requests</label>
              <div className="filter-buttons">
                {['All', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(f => (
                  <button 
                    key={f}
                    className={`filter-tag ${filter === f ? 'active' : ''}`}
                    onClick={() => setFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="booking-stats">
              <div className="stat-item">
                <span className="stat-value">{bookings.filter(b => b.status === 'PENDING').length}</span>
                <span className="stat-label">Pending</span>
              </div>
            </div>
          </div>
        </div>
        
        {filteredBookings.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon">📂</div>
            <h3>No requests found</h3>
            <p>There are no bookings matching your current filter criteria.</p>
            <button onClick={() => setFilter('All')} className="btn-cancel">Reset Filters</button>
          </div>
        ) : (
          <div className="bookings-grid">
            {filteredBookings.map((booking, index) => (
              <div key={booking.id} className="booking-card" style={{'--index': index}}>
                <div className="card-header">
                  <span className={`status-pill pill-${booking.status}`}>
                    <span className="status-dot"></span>
                    {booking.status}
                  </span>
                  <span className="booking-id">ID: {booking.id}</span>
                </div>

                <h3>{resources[booking.resourceId] || 'Resource #' + booking.resourceId}</h3>
                
                <div className="user-info-section">
                  <div className="user-meta">
                    <div className="info-icon">👤</div>
                    <div className="info-content">
                      <label>Requested By</label>
                      <span>{booking.userId}</span>
                    </div>
                  </div>
                </div>

                <div className="info-grid" style={{marginTop: '1.5rem'}}>
                  <div className="info-item">
                    <div className="info-icon">📅</div>
                    <div className="info-content">
                      <label>Date</label>
                      <span>{new Date(booking.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-icon">⏰</div>
                    <div className="info-content">
                      <label>Schedule</label>
                      <span>{booking.startTime.substring(0,5)} - {booking.endTime.substring(0,5)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="purpose-section">
                  <label>Booking Purpose</label>
                  <p>{booking.purpose}</p>
                </div>

                {booking.status === 'REJECTED' && booking.adminReason && (
                  <div className="admin-note">
                    <strong>Rejection Reason:</strong>
                    <p>{booking.adminReason}</p>
                  </div>
                )}

                {booking.status === 'PENDING' && (
                  <div className="booking-actions">
                    <button className="btn-approve" onClick={() => handleApprove(booking.id)}>
                      Approve
                    </button>
                    <button className="btn-reject" onClick={() => handleReject(booking.id)}>
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBookingManagement;

