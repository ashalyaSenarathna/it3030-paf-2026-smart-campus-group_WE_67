import React, { useState, useEffect } from 'react';
import { bookingApi } from '../../api/api';
import './Booking.css';

const RequestBookingModal = ({ resource, user, onClose, onSuccess, existingBooking = null }) => {
  const [formData, setFormData] = useState({
    date: existingBooking?.date || '',
    startTime: existingBooking?.startTime ? (Array.isArray(existingBooking.startTime) ? `${existingBooking.startTime[0].toString().padStart(2, '0')}:${existingBooking.startTime[1].toString().padStart(2, '0')}` : existingBooking.startTime.substring(0, 5)) : '',
    endTime: existingBooking?.endTime ? (Array.isArray(existingBooking.endTime) ? `${existingBooking.endTime[0].toString().padStart(2, '0')}:${existingBooking.endTime[1].toString().padStart(2, '0')}` : existingBooking.endTime.substring(0, 5)) : '',
    purpose: existingBooking?.purpose || '',
    expectedAttendees: existingBooking?.expectedAttendees || 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [existingBookings, setExistingBookings] = useState([]);

  useEffect(() => {
    if (formData.date && resource.id) {
      bookingApi.checkAvailability(resource.id, formData.date)
        .then(res => setExistingBookings(res.data))
        .catch(err => console.error("Error fetching availability:", err));
    }
  }, [formData.date, resource.id]);

  const isOverlapping = (start, end) => {
    if (!start || !end) return false;
    return existingBookings.some(b => {
      if (existingBooking && b.id === existingBooking.id) return false;
      const bStart = Array.isArray(b.startTime) ? `${b.startTime[0].toString().padStart(2, '0')}:${b.startTime[1].toString().padStart(2, '0')}` : b.startTime.substring(0, 5);
      const bEnd = Array.isArray(b.endTime) ? `${b.endTime[0].toString().padStart(2, '0')}:${b.endTime[1].toString().padStart(2, '0')}` : b.endTime.substring(0, 5);
      return (start < bEnd && end > bStart);
    });
  };

  const isWithinAllowedHours = (start, end) => {
    // If only start is selected, check it separately
    if (start && !end) return start >= "08:00" && start <= "18:00";
    // If both are selected, check both and the range
    if (start && end) return start >= "08:00" && end <= "18:00" && start < end;
    return true;
  };

  const hasConflict = isOverlapping(formData.startTime, formData.endTime);
  const isTimeInvalid = !isWithinAllowedHours(formData.startTime, formData.endTime);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError("Please log in to request a booking.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        resourceId: resource.id,
        userId: user.id || user.sub,
        date: formData.date,
        startTime: formData.startTime.length === 5 ? `${formData.startTime}:00` : formData.startTime,
        endTime: formData.endTime.length === 5 ? `${formData.endTime}:00` : formData.endTime,
        purpose: formData.purpose,
        expectedAttendees: parseInt(formData.expectedAttendees, 10),
      };

      if (existingBooking) {
        await bookingApi.update(existingBooking.id, payload);
      } else {
        await bookingApi.create(payload);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to process booking.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ub-modal-overlay" onClick={onClose}>
      <div className="ub-modal-content" onClick={e => e.stopPropagation()}>
        <div className="ub-modal-glow"></div>

        {/* Header */}
        <div className="ub-modal-header">
          <div className="ub-modal-title-stack">
            <span className="ub-modal-badge">{resource.type || 'Facility'}</span>
            <h2>{existingBooking ? 'Edit' : 'Book'} {resource.name}</h2>
            <p className="ub-modal-subtitle">{existingBooking ? 'Modify your current reservation details.' : 'Reserve this facility for your academic or event needs.'}</p>
          </div>
          <button className="ub-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Status/Zone */}
        <div className="ub-modal-status-zone">
          {existingBookings.length > 0 && (
            <div className="ub-availability-shelf">
              <div className="shelf-header">
                <span className="icon">📅</span>
                <label>Occupied Slots for this Date</label>
              </div>
              <div className="shelf-slots">
                {existingBookings.map(b => (
                  <span key={b.id} className="ub-slot-pill">
                    {Array.isArray(b.startTime) ? `${b.startTime[0]}:${b.startTime[1].toString().padStart(2, '0')}` : b.startTime.substring(0, 5)} -
                    {Array.isArray(b.endTime) ? `${b.endTime[0]}:${b.endTime[1].toString().padStart(2, '0')}` : b.endTime.substring(0, 5)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {error && <div className="ub-alert ub-alert-error">{error}</div>}
          {hasConflict && <div className="ub-alert ub-alert-warning">⚠️ This time slot overlaps with an existing reservation.</div>}
          {isTimeInvalid && formData.startTime && (
            <div className="ub-alert ub-alert-warning">
              🕒 Reservations are only allowed between <strong>08:00 AM</strong> and <strong>06:00 PM</strong>.
            </div>
          )}
        </div>

        <form className="ub-modal-form" onSubmit={handleSubmit}>
          <div className="ub-form-grid">
            {/* Date Field */}
            <div className="ub-field-group full">
              <label className="ub-field-label">Select Date</label>
              <div className="ub-input-wrapper">
                <span className="ub-input-icon">📅</span>
                <input
                  type="date"
                  name="date"
                  required
                  value={formData.date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Time Fields */}
            <div className="ub-field-group">
              <label className="ub-field-label">Start Time</label>
              <div className="ub-input-wrapper">
                <span className="ub-input-icon">🕒</span>
                <input type="time" name="startTime" required value={formData.startTime} onChange={handleChange} min="08:00" max="18:00" />
              </div>
            </div>
            <div className="ub-field-group">
              <label className="ub-field-label">End Time</label>
              <div className="ub-input-wrapper">
                <span className="ub-input-icon">🕒</span>
                <input type="time" name="endTime" required value={formData.endTime} onChange={handleChange} min="08:00" max="18:00" />
              </div>
            </div>

            {/* Attendees */}
            {resource.capacity > 0 && (
              <div className="ub-field-group full">
                <label className="ub-field-label">Expected Participants (Capacity: {resource.capacity})</label>
                <div className="ub-input-wrapper">
                  <span className="ub-input-icon">👥</span>
                  <input
                    type="number"
                    name="expectedAttendees"
                    min="1"
                    max={resource.capacity}
                    required
                    value={formData.expectedAttendees}
                    onChange={handleChange}
                  />
                  <div className="ub-capacity-bar">
                    <div
                      className="ub-capacity-progress"
                      style={{ width: `${Math.min(100, (formData.expectedAttendees / resource.capacity) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Purpose */}
            <div className="ub-field-group full">
              <label className="ub-field-label">Purpose of Booking</label>
              <div className="ub-input-wrapper">
                <textarea
                  name="purpose"
                  rows="3"
                  required
                  placeholder="Describe the nature of your event or meeting..."
                  value={formData.purpose}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>
          </div>

          <div className="ub-modal-footer">
            <button type="button" className="ub-btn-ghost" onClick={onClose}>Dismiss</button>
            <button
              type="submit"
              className={`ub-btn-action ${hasConflict || isTimeInvalid ? 'is-disabled' : ''}`}
              disabled={loading || hasConflict || isTimeInvalid}
            >
              {loading ? (
                <span className="ub-loading-state"><span className="spinner"></span> Processing...</span>
              ) : (
                hasConflict ? 'Time Conflict' : isTimeInvalid ? 'Invalid Time' : (existingBooking ? 'Save Changes' : 'Confirm Reservation')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestBookingModal;
