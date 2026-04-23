package Backend.controller.Booking;

import Backend.model.Booking.Booking;
import Backend.notification.NotificationService;
import Backend.repository.facilitymanagement.ResourceRepository;
import Backend.auth.repository.UserRepository;
import Backend.service.Booking.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"}, allowCredentials = "true")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private Backend.repository.Booking.BookingRepository bookingRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private UserRepository userRepository;

    private String getResourceName(String resourceId) {
        return resourceRepository.findById(resourceId).map(r -> r.getName()).orElse("a facility");
    }

    private String getUserDisplayName(String userId) {
        if (userId == null) return "A user";
        return userRepository.findById(userId)
                .map(u -> u.getName() != null ? u.getName() : u.getUsername())
                .orElse("A user");
    }

    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody Booking booking) {
        try {
            Booking saved = bookingService.createBooking(booking);
            try {
                String resourceName = getResourceName(saved.getResourceId());
                String userName = getUserDisplayName(saved.getUserId());
                notificationService.notifyBookingCreated(saved.getUserId(), saved.getId(), resourceName);
                notificationService.notifyAdminsBookingCreated(saved.getId(), resourceName, userName);
            } catch (Exception notifEx) {
                // Log but don't fail the booking
                System.err.println("Notification failed: " + notifEx.getMessage());
            }
            return ResponseEntity.ok(saved);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/availability")
    public ResponseEntity<List<Booking>> getAvailability(@RequestParam("resourceId") String resourceId, @RequestParam("date") String date) {
        LocalDate localDate = LocalDate.parse(date);
        List<Booking> bookings = bookingRepository.findByResourceIdAndDateAndStatusIn(
                resourceId,
                localDate,
                Arrays.asList("PENDING", "APPROVED")
        );
        return ResponseEntity.ok(bookings);
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveBooking(@PathVariable("id") String id) {
        try {
            Booking booking = bookingService.approveBooking(id);
            try {
                String resourceName = getResourceName(booking.getResourceId());
                String userName = getUserDisplayName(booking.getUserId());
                // Notify the booking owner
                notificationService.notifyBookingApproved(booking.getUserId(), id, resourceName);
                // Notify all admins (audit trail)
                notificationService.notifyAdminsBookingApproved(id, resourceName, userName);
            } catch (Exception notifEx) {
                System.err.println("Notification failed: " + notifEx.getMessage());
            }
            return ResponseEntity.ok(booking);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectBooking(@PathVariable("id") String id, @RequestBody Map<String, String> payload) {
        try {
            String reason = payload.get("reason");
            if (reason == null || reason.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Reason is required to reject a booking"));
            }
            Booking booking = bookingService.rejectBooking(id, reason);
            try {
                String resourceName = getResourceName(booking.getResourceId());
                String userName = getUserDisplayName(booking.getUserId());
                // Notify the booking owner
                notificationService.notifyBookingRejected(booking.getUserId(), id, resourceName, reason);
                // Notify all admins (audit trail)
                notificationService.notifyAdminsBookingRejected(id, resourceName, userName, reason);
            } catch (Exception notifEx) {
                System.err.println("Notification failed: " + notifEx.getMessage());
            }
            return ResponseEntity.ok(booking);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable("id") String id) {
        try {
            Booking booking = bookingRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Booking not found"));
            String resourceName = getResourceName(booking.getResourceId());
            String userName = getUserDisplayName(booking.getUserId());
            bookingService.cancelBooking(id);
            try {
                notificationService.notifyBookingCancelled(booking.getUserId(), id, resourceName);
                notificationService.notifyAdminsBookingCancelled(id, resourceName, userName);
            } catch (Exception notifEx) {
                System.err.println("Notification failed: " + notifEx.getMessage());
            }
            return ResponseEntity.ok(Map.of("message", "Booking deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Booking>> getBookingsByUser(@PathVariable("userId") String userId) {
        return ResponseEntity.ok(bookingService.getBookingsByUser(userId));
    }

    @GetMapping
    public ResponseEntity<List<Booking>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBooking(@PathVariable("id") String id, @RequestBody Booking booking) {
        try {
            Booking updated = bookingService.updateBooking(id, booking);
            try {
                String resourceName = getResourceName(updated.getResourceId());
                String userName = getUserDisplayName(updated.getUserId());
                notificationService.notifyBookingUpdated(updated.getUserId(), id, resourceName);
                notificationService.notifyAdminsBookingUpdated(id, resourceName, userName);
            } catch (Exception notifEx) {
                System.err.println("Notification failed: " + notifEx.getMessage());
            }
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
