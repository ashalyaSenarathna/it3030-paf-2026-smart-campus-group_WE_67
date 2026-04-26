package Backend.service.Booking;

import Backend.model.Booking.Booking;
import Backend.model.Booking.BookingStatus;
import Backend.repository.Booking.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    public Booking createBooking(Booking booking) {
        // --- LAYER: Failsafe Manual Check (Paranoid Mode) ---
        List<Booking> allDayBookings = bookingRepository.findByResourceIdAndDateAndStatusIn(
                booking.getResourceId(),
                booking.getDate(),
                java.util.Arrays.asList("PENDING", "APPROVED"));

        for (Booking existing : allDayBookings) {
            if (isOverlapping(booking.getStartTime(), booking.getEndTime(),
                    existing.getStartTime(), existing.getEndTime())) {
                throw new RuntimeException("Scheduling conflict: This time is already reserved by another booking.");
            }
        }
        // -----------------------------------------------------------

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

            // --- LAYER: Failsafe Manual Check (Paranoid Mode) ---
            List<Booking> allDayBookings = bookingRepository.findByResourceIdAndDateAndStatusIn(
                    bookingDetails.getResourceId(),
                    bookingDetails.getDate(),
                    java.util.Arrays.asList("PENDING", "APPROVED"));

            for (Booking existing : allDayBookings) {
                if (existing.getId().equals(id))
                    continue; // Skip self
                if (isOverlapping(bookingDetails.getStartTime(), bookingDetails.getEndTime(),
                        existing.getStartTime(), existing.getEndTime())) {
                    throw new RuntimeException(
                            "Scheduling conflict: This time is already reserved by another booking.");
                }
            }
            // -----------------------------------------------------------
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

    private boolean isOverlapping(java.time.LocalTime start1, java.time.LocalTime end1,
            java.time.LocalTime start2, java.time.LocalTime end2) {
        // Interval (start1, end1) overlaps (start2, end2) if:
        // start1 < end2 AND end1 > start2
        return start1.isBefore(end2) && end1.isAfter(start2);
    }
}
