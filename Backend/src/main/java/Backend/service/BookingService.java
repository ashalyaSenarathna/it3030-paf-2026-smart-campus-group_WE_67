package Backend.service;

import Backend.model.Booking.Booking;
import Backend.model.Booking.BookingStatus;
import Backend.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    public Booking createBooking(Booking booking) {
        // Check for conflicts
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                booking.getResourceId(),
                booking.getDate(),
                booking.getStartTime(),
                booking.getEndTime()
        );

        if (!conflicts.isEmpty()) {
            throw new RuntimeException("Scheduling conflict: the resource is already booked for this time range.");
        }

        booking.setStatus(BookingStatus.PENDING);
        return bookingRepository.save(booking);
    }

    public Booking approveBooking(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        booking.setStatus(BookingStatus.APPROVED);
        return bookingRepository.save(booking);
    }

    public Booking rejectBooking(String bookingId, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        booking.setStatus(BookingStatus.REJECTED);
        booking.setAdminReason(reason);
        return bookingRepository.save(booking);
    }

    public void cancelBooking(String bookingId) {
        if (!bookingRepository.existsById(bookingId)) {
            throw new RuntimeException("Booking not found");
        }
        bookingRepository.deleteById(bookingId);
    }

    public List<Booking> getBookingsByUser(String userId) {
        return bookingRepository.findByUserId(userId);
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public Booking updateBooking(String id, Booking bookingDetails) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        // Only allow editing if pending or approved
        if (booking.getStatus() == BookingStatus.REJECTED || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Cannot edit a booking that is " + booking.getStatus());
        }

        // Check for conflicts if time/date/resource changed
        if (!booking.getResourceId().equals(bookingDetails.getResourceId()) ||
            !booking.getDate().equals(bookingDetails.getDate()) ||
            !booking.getStartTime().equals(bookingDetails.getStartTime()) ||
            !booking.getEndTime().equals(bookingDetails.getEndTime())) {
            
            List<Booking> conflicts = bookingRepository.findConflictingBookings(
                    bookingDetails.getResourceId(),
                    bookingDetails.getDate(),
                    bookingDetails.getStartTime(),
                    bookingDetails.getEndTime()
            );
            
            // Exclude current booking from conflict check
            conflicts.removeIf(b -> b.getId().equals(id));

            if (!conflicts.isEmpty()) {
                throw new RuntimeException("Scheduling conflict: the resource is already booked for this time range.");
            }
        }

        booking.setResourceId(bookingDetails.getResourceId());
        booking.setDate(bookingDetails.getDate());
        booking.setStartTime(bookingDetails.getStartTime());
        booking.setEndTime(bookingDetails.getEndTime());
        booking.setPurpose(bookingDetails.getPurpose());
        booking.setExpectedAttendees(bookingDetails.getExpectedAttendees());
        // Reset status to pending if it was approved and then edited? 
        // For simplicity, let's keep it pending if edited.
        booking.setStatus(BookingStatus.PENDING);
        
        return bookingRepository.save(booking);
    }
}
