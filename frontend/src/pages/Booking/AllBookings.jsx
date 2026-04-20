import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingApi, resourceApi } from '../../api/api';
import { RESOURCE_TYPES, RESOURCE_TYPE_ICONS } from '../facility-management/resourceConstants';
import './Booking.css';

const AllBookings = ({ user }) => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [resources, setResources] = useState({});
  const [resourceDetails, setResourceDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

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
        const [bookingsRes, resourcesRes] = await Promise.all([
          bookingApi.getAll(),
          resourceApi.getAll()
        ]);

        const resourceMap = {};
        resourcesRes.data.forEach(r => {
          resourceMap[r.id] = {
            name: r.name,
            location: r.location,
            type: r.type
          };
        });
        
        setResources(resourceMap);
        setResourceDetails(resourcesRes.data);
        
        // Show all bookings, but maybe prioritize Approved ones for a public view
        // Filtering out CANCELLED/REJECTED for the public "Bookings" view to keep it clean
        const activeBookings = bookingsRes.data.filter(b => 
            b.status?.toUpperCase() === 'APPROVED' || b.status?.toUpperCase() === 'PENDING'
        );
        
        setBookings(activeBookings);
        setFilteredBookings(activeBookings);
      } catch (err) {
        console.error("Error fetching bookings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let result = bookings;
    
    if (statusFilter !== 'ALL') {
      result = result.filter(b => b.status?.toUpperCase() === statusFilter.toUpperCase());
    }

    if (typeFilter !== 'ALL') {
      result = result.filter(b => resources[b.resourceId]?.type === typeFilter);
    }
    
    if (searchTerm.trim() !== '') {
      result = result.filter(b => {
        const resourceName = resources[b.resourceId]?.name?.toLowerCase() || '';
        const resourceLocation = resources[b.resourceId]?.location?.toLowerCase() || '';
        const lowerSearch = searchTerm.toLowerCase();
        return resourceName.includes(lowerSearch) || resourceLocation.includes(lowerSearch);
      });
    }
    
    setFilteredBookings(result);
  }, [searchTerm, statusFilter, typeFilter, bookings, resources]);

  if (loading) {
    return (
      <div className="bookings-dashboard">
        <div className="loader-container">
          <div className="premium-loader"></div>
          <p>Scanning university schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bookings-dashboard">
      <div className="dashboard-content-wrapper">


        <div className="bookings-hero">
          <div className="hero-badge">University Schedule</div>
          <h1 className="glitch-text" data-text="Resource Bookings">Campus Reservations</h1>
          <p className="hero-subtitle">
            View all active room, hall, and facility bookings across the campus.
          </p>
          
          <div className="filter-shelf">
            <div className="filter-main">
              <div className="search-bar-glass">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input 
                  type="text" 
                  placeholder="Search by Hall or Location..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="filter-group">
                <div className="filter-buttons">
                  {['ALL', 'APPROVED', 'PENDING'].map(status => (
                    <button 
                      key={status}
                      className={`filter-tag ${statusFilter === status ? 'active' : ''}`}
                      onClick={() => setStatusFilter(status)}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <select 
                  className="filter-select-glass"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="ALL">All Resource Types</option>
                  {RESOURCE_TYPES.map(type => (
                    <option key={type} value={type}>
                      {RESOURCE_TYPE_ICONS[type] || '🏫'} {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="booking-stats-horizontal">
              <div className="stat-card">
                <div className="stat-value">{filteredBookings.length}</div>
                <div className="stat-label">Active Bookings</div>
              </div>
            </div>
          </div>
        </div>
        
        {filteredBookings.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon-glow">📅</div>
            <h3>No Active Reservations Found</h3>
            <p className="empty-description">
              There are no {statusFilter !== 'ALL' ? statusFilter.toLowerCase() : ''} bookings matching your request at the moment.
            </p>
            <Link to="/facility-management/resource-catalogue" className="btn-primary-glow">
              Book a Resource
            </Link>
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
                  <div className="resource-type-small">{resources[booking.resourceId]?.type || 'Facility'}</div>
                </div>
                
                <h3 className="resource-name">{resources[booking.resourceId]?.name || 'Campus Resource'}</h3>
                
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    </div>
                    <div className="info-content">
                      <label>Location</label>
                      <span>{resources[booking.resourceId]?.location || 'University Campus'}</span>
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    </div>
                    <div className="info-content">
                      <label>Date</label>
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
                  <label>Booking Purpose</label>
                  <p>{booking.purpose}</p>
                </div>
                
                <div className="card-footer" style={{ marginTop: 'auto', paddingTop: '20px' }}>
                  <div className="attendee-badge">
                    <span className="icon">👥</span> {booking.expectedAttendees || 0} Expected
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllBookings;
