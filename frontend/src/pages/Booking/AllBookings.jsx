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

  // Helper to determine if a booking is currently "LIVE"
  const isLive = (date, startTime, endTime) => {
    try {
      const now = new Date();
      let bDate;
      if (Array.isArray(date)) {
        bDate = new Date(date[0], date[1] - 1, date[2]);
      } else {
        bDate = new Date(date);
      }

      const isToday = bDate.toDateString() === now.toDateString();
      if (!isToday) return false;

      const [sH, sM] = Array.isArray(startTime) ? startTime : startTime.split(':').map(Number);
      const [eH, eM] = Array.isArray(endTime) ? endTime : endTime.split(':').map(Number);

      const start = sH * 60 + (sM || 0);
      const end = eH * 60 + (eM || 0);
      const current = now.getHours() * 60 + now.getMinutes();

      return current >= start && current <= end;
    } catch (e) { return false; }
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
        // Use startsWith for strict prefix matching as requested
        return resourceName.startsWith(lowerSearch) || resourceLocation.startsWith(lowerSearch);
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
    <div className="ub-page">
      {/* ── Ambient Background Glows ── */}
      <div className="ub-ambient-glow ub-glow-1"></div>
      <div className="ub-ambient-glow ub-glow-2"></div>
      <div className="ub-ambient-glow ub-glow-4"></div>

      <main className="ub-container">
        {/* ── Premium Hero Section ── */}
        <div className="ub-hero-section">
          <div className="ub-hero-badge animate-float">
            <span className="ub-badge-dot"></span>
            University Schedule
          </div>
          <h1 className="ub-main-title">Campus Reservations</h1>
          <p className="ub-sub-title">View all active room, hall, and facility bookings across the entire campus ecosystem.</p>

          <div className="ub-stats-row">
            <div className="ub-summary-card">
              <div className="ub-card-inner">
                <span className="ub-card-icon">📚</span>
                <div className="ub-card-data">
                  <span className="ub-data-num">{filteredBookings.length}</span>
                  <span className="ub-data-label">Active Schedule</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Interactive Filter Shelf ── */}
        <div className="all-filter-shelf">
          <div className="all-search-wrapper">
            <div className="ub-search-glass">
              <span className="ub-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Find facility or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="all-filter-group">
            <div className="ub-shelf-actions">
              {['ALL', 'APPROVED', 'PENDING'].map(s => (
                <button
                  key={s}
                  className={`ub-pill-btn ${statusFilter === s ? 'is-active' : ''}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="all-filter-group">
            <select
              className="ub-select-premium"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              {RESOURCE_TYPES.map(type => (
                <option key={type} value={type}>
                  {RESOURCE_TYPE_ICONS[type] || '🏫'} {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Results count meta ── */}
        <div className="ub-meta-row" style={{ marginTop: '2rem' }}>
          Displaying <strong>{filteredBookings.length}</strong> active reservations
        </div>

        {/* ── Booking Records ── */}
        {filteredBookings.length === 0 ? (
          <div className="ub-empty-state animate-in">
            <div className="ub-empty-decor"></div>
            <div className="ub-empty-icon">🔍</div>
            <h3>No reservations found</h3>
            <p>
              {searchTerm
                ? `No results found for "${searchTerm}" in the current schedule.`
                : "There are no active bookings matching your selected filters."}
            </p>
            <Link to="/facility-management/resource-catalogue" className="ub-action-btn-main">Make a Reservation</Link>
          </div>
        ) : (
          <div className="ub-records-grid">
            {filteredBookings.map((booking, index) => {
              const res = resources[booking.resourceId] || { name: 'Campus Facility', location: 'University', type: 'Facility' };
              const status = (booking.status || 'PENDING').toUpperCase();
              const live = isLive(booking.date, booking.startTime, booking.endTime);

              return (
                <div
                  key={booking.id}
                  className={`ub-booking-card s-border-${status.toLowerCase()} ${live ? 'is-live-pulse' : ''}`}
                  style={{ '--entry-delay': `${index * 0.05}s` }}
                >
                  <div className="ub-card-shine"></div>
                  <div className="ub-card-spotlight"></div>

                  {/* Card Header */}
                  <div className="ub-card-header">
                    <div className="ub-header-left">
                      <span className={`ub-status-tag tag-${status.toLowerCase()}`}>
                        <span className="ub-tag-dot"></span>
                        {status}
                      </span>
                      {live && (
                        <span className="ub-live-badge">
                          <span className="live-dot"></span>
                          LIVE NOW
                        </span>
                      )}
                    </div>
                    <span className="ub-res-type-label">
                      {RESOURCE_TYPE_ICONS[res.type] || '🏫'} {res.type}
                    </span>
                  </div>

                  <h2 className="ub-facility-name">{res.name}</h2>

                  {/* Details Flex */}
                  <div className="ub-detail-stack" style={{ gap: '0.75rem' }}>
                    <div className="ub-detail-row">
                      <span className="ub-detail-icon small">📍</span>
                      <div className="ub-detail-text">
                        <label>Location</label>
                        <span>{res.location}</span>
                      </div>
                    </div>
                    <div className="ub-detail-row">
                      <span className="ub-detail-icon small">📅</span>
                      <div className="ub-detail-text">
                        <label>Date</label>
                        <span>{formatDate(booking.date)}</span>
                      </div>
                    </div>
                    <div className="ub-detail-row">
                      <span className="ub-detail-icon small">🕒</span>
                      <div className="ub-detail-text">
                        <label>Time Slot</label>
                        <span>{formatTime(booking.startTime)} — {formatTime(booking.endTime)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Purpose Box */}
                  <div className="ub-purpose-box">
                    <label>Activity</label>
                    <p>{booking.purpose || 'University activity'}</p>
                  </div>

                  {/* Actions Footer */}
                  <div className="ub-card-footer" style={{ border: 'none', paddingTop: '0' }}>
                    <div className="ub-attendee-stat">
                      <span className="icon">👥</span>
                      <strong>{booking.expectedAttendees || 0}</strong>
                      <span className="label">Expected Participants</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="ub-site-footer">
        <p>© 2026 Smart Campus Schedule Management</p>
      </footer>
    </div>
  );
};

export default AllBookings;