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

  const hasConflict = isOverlapping(formData.startTime, formData.endTime);

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
    <div className="booking-modal-overlay" onClick={onClose}>
      <div className="booking-modal" onClick={e => e.stopPropagation()}>
        <h2>{existingBooking ? 'Edit' : 'Book'} {resource.name}</h2>
        <p>{existingBooking ? 'Update your reservation details.' : 'Fill out the details below to request a booking.'}</p>
        
        {existingBookings.length > 0 && (
          <div className="availability-alert">
            <label>Reserved Times for this date:</label>
            <div className="reserved-slots-list">
              {existingBookings.map(b => (
                <span key={b.id} className="reserved-slot-tag">
                  {Array.isArray(b.startTime) ? `${b.startTime[0]}:${b.startTime[1].toString().padStart(2, '0')}` : b.startTime.substring(0, 5)} - 
                  {Array.isArray(b.endTime) ? `${b.endTime[0]}:${b.endTime[1].toString().padStart(2, '0')}` : b.endTime.substring(0, 5)}
                </span>
              ))}
            </div>
          </div>
        )}

        {error && <div className="booking-reason" style={{marginBottom: '1rem', background: 'rgba(248, 113, 113, 0.1)', color: '#f87171'}}>{error}</div>}
        {hasConflict && <div className="booking-reason" style={{marginBottom: '1rem', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24'}}>⚠️ The selected time overlaps with an existing booking.</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Date</label>
            <input type="date" name="date" required value={formData.date} onChange={handleChange} min={new Date().toISOString().split('T')[0]} />
          </div>
          
          <div className="time-row">
            <div className="form-group">
              <label>Start Time</label>
              <input type="time" name="startTime" required value={formData.startTime} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>End Time</label>
              <input type="time" name="endTime" required value={formData.endTime} onChange={handleChange} />
            </div>
          </div>
          
          <div className="form-group">
            <label>Purpose</label>
            <textarea name="purpose" rows="3" required placeholder="Why do you need this resource?" value={formData.purpose} onChange={handleChange}></textarea>
          </div>
          
          {resource.capacity > 0 && (
            <div className="form-group">
              <label>Expected Attendees (Max {resource.capacity})</label>
              <input type="number" name="expectedAttendees" min="1" max={resource.capacity} required value={formData.expectedAttendees} onChange={handleChange} />
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-submit" disabled={loading || hasConflict}>
              {loading ? 'Processing...' : (hasConflict ? 'Time Conflict' : (existingBooking ? 'Update Booking' : 'Request Booking'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestBookingModal;
