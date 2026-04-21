import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingApi, resourceApi } from '../../api/api';
import './Booking.css';

const AdminBookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [resources, setResources] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  
  // Rejection Modal states
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingBooking, setRejectingBooking] = useState(null);
  const [tempReason, setTempReason] = useState('');

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
    try {
      await bookingApi.reject(rejectingBooking.id, tempReason);
      setBookings(bookings.map(b => b.id === rejectingBooking.id ? { ...b, status: 'REJECTED', adminReason: tempReason } : b));
      setIsRejectModalOpen(false);
      setRejectingBooking(null);
    } catch (err) {
      alert("Failed to reject booking: " + (err.response?.data?.message || err.message));
    }
  };

  const handleReject = async (id) => {
    // Legacy support if needed, but we use the modal now
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
                    <button className="btn-reject" onClick={() => handleOpenRejectModal(booking)}>
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {isRejectModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '20px'
        }} onClick={() => setIsRejectModalOpen(false)}>
          <div style={{
            background: 'rgba(23, 23, 23, 0.95)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '450px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#fff', marginBottom: '8px' }}>Reject Booking</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '24px' }}>
              Please provide a reason. The student will see this reason in their dashboard.
            </p>
            
            <textarea 
              autoFocus
              placeholder="e.g. The hall is undergoing maintenance."
              value={tempReason}
              onChange={e => setTempReason(e.target.value)}
              style={{
                width: '100%', minHeight: '120px', background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
                padding: '16px', color: '#fff', fontSize: '1rem', outline: 'none',
                resize: 'none', marginBottom: '24px'
              }}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setIsRejectModalOpen(false)} style={{
                flex: 1, padding: '14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent', color: '#fff', fontWeight: '600', cursor: 'pointer'
              }}>Cancel</button>
              <button onClick={handleConfirmReject} style={{
                flex: 1, padding: '14px', borderRadius: '14px', border: 'none',
                background: '#f87171', color: '#fff', fontWeight: '600', cursor: 'pointer'
              }}>Reject Now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookingManagement;

