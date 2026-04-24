package Backend.notification;

import Backend.auth.model.Role;
import Backend.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    // ── Core ─────────────────────────────────────────────────────────────────

    public Notification createNotification(String userId, String title, String message,
                                           String type, String referenceId) {
        Notification n = new Notification();
        n.setUserId(userId);
        n.setTitle(title);
        n.setMessage(message);
        n.setType(type);
        n.setReferenceId(referenceId);
        n.setRead(false);
        n.setCreatedAt(LocalDateTime.now());
        return notificationRepository.save(n);
    }

    /** Send the same notification to every admin */
    public void notifyAllAdmins(String title, String message, String type, String referenceId) {
        userRepository.findByRolesContaining(Role.ROLE_ADMIN)
                .forEach(admin -> createNotification(admin.getId(), title, message, type, referenceId));
    }

    /** Send the same notification to every technician */
    public void notifyAllTechnicians(String title, String message, String type, String referenceId) {
        userRepository.findByRolesContaining(Role.ROLE_TECHNICIAN)
                .forEach(tech -> createNotification(tech.getId(), title, message, type, referenceId));
    }

    // ── Booking — user-facing ─────────────────────────────────────────────────

    public void notifyBookingCreated(String userId, String bookingId, String resourceName) {
        createNotification(userId,
            "Booking Submitted 📋",
            "Your booking request for \"" + resourceName + "\" has been submitted and is pending review.",
            "BOOKING_CREATED", bookingId);
    }

    public void notifyBookingUpdated(String userId, String bookingId, String resourceName) {
        createNotification(userId,
            "Booking Updated ✏️",
            "Your booking for \"" + resourceName + "\" has been updated and is pending review.",
            "BOOKING_UPDATED", bookingId);
    }

    public void notifyBookingCancelled(String userId, String bookingId, String resourceName) {
        createNotification(userId,
            "Booking Cancelled 🚫",
            "Your booking for \"" + resourceName + "\" has been cancelled.",
            "BOOKING_CANCELLED", bookingId);
    }

    public void notifyBookingApproved(String userId, String bookingId, String resourceName) {
        createNotification(userId,
            "Booking Approved ✅",
            "Your booking for \"" + resourceName + "\" has been approved.",
            "BOOKING_APPROVED", bookingId);
    }

    public void notifyBookingRejected(String userId, String bookingId, String resourceName, String reason) {
        String msg = "Your booking for \"" + resourceName + "\" was rejected.";
        if (reason != null && !reason.isBlank()) msg += " Reason: " + reason;
        createNotification(userId, "Booking Rejected ❌", msg, "BOOKING_REJECTED", bookingId);
    }

    // ── Booking — admin-facing ────────────────────────────────────────────────

    public void notifyAdminsBookingCreated(String bookingId, String resourceName, String userName) {
        notifyAllAdmins(
            "New Booking Request 📬",
            userName + " submitted a booking for \"" + resourceName + "\". Awaiting review.",
            "ADMIN_BOOKING_NEW", bookingId);
    }

    public void notifyAdminsBookingUpdated(String bookingId, String resourceName, String userName) {
        notifyAllAdmins(
            "Booking Edited ✏️",
            userName + " edited their booking for \"" + resourceName + "\". Back to pending.",
            "ADMIN_BOOKING_EDITED", bookingId);
    }

    public void notifyAdminsBookingCancelled(String bookingId, String resourceName, String userName) {
        notifyAllAdmins(
            "Booking Cancelled 🚫",
            userName + " cancelled their booking for \"" + resourceName + "\".",
            "ADMIN_BOOKING_CANCELLED", bookingId);
    }

    public void notifyAdminsBookingApproved(String bookingId, String resourceName, String userName) {
        notifyAllAdmins(
            "Booking Approved ✅",
            "Booking for \"" + resourceName + "\" by " + userName + " was approved.",
            "ADMIN_BOOKING_APPROVED", bookingId);
    }

    public void notifyAdminsBookingRejected(String bookingId, String resourceName, String userName, String reason) {
        String msg = "Booking for \"" + resourceName + "\" by " + userName + " was rejected.";
        if (reason != null && !reason.isBlank()) msg += " Reason: " + reason;
        notifyAllAdmins("Booking Rejected ❌", msg, "ADMIN_BOOKING_REJECTED", bookingId);
    }

    // ── Resource — admin-facing ───────────────────────────────────────────────

    public void notifyAdminsResourceAdded(String resourceId, String resourceName) {
        notifyAllAdmins(
            "Resource Added 🏢",
            "New resource \"" + resourceName + "\" has been added.",
            "RESOURCE_ADDED", resourceId);
    }

    public void notifyAdminsResourceUpdated(String resourceId, String resourceName) {
        notifyAllAdmins(
            "Resource Updated 🔄",
            "Resource \"" + resourceName + "\" has been updated.",
            "RESOURCE_UPDATED", resourceId);
    }

    public void notifyAdminsResourceDeleted(String resourceId, String resourceName) {
        notifyAllAdmins(
            "Resource Deleted 🗑️",
            "Resource \"" + resourceName + "\" has been deleted.",
            "RESOURCE_DELETED", resourceId);
    }

    // ── Resource — user-facing (booked resource removed) ─────────────────────

    public void notifyUserResourceDeleted(String userId, String resourceName) {
        createNotification(userId,
            "Booked Resource Removed ⚠️",
            "The resource \"" + resourceName + "\" you had booked has been removed and your booking cancelled.",
            "RESOURCE_DELETED_USER", null);
    }

    // ── Ticket ────────────────────────────────────────────────────────────────

    public void notifyTicketStatusChanged(String userId, String ticketId, String newStatus) {
        createNotification(userId,
            "Ticket Status Updated 🔧",
            "Your support ticket status changed to: " + newStatus,
            "TICKET_STATUS_CHANGED", ticketId);
    }

    public void notifyTicketComment(String userId, String ticketId, String commenterName) {
        createNotification(userId,
            "New Comment on Ticket 💬",
            commenterName + " commented on your support ticket.",
            "TICKET_COMMENT", ticketId);
    }

    // ── Read / Delete ─────────────────────────────────────────────────────────

    public List<Notification> getNotificationsForUser(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    public Notification markAsRead(String notificationId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        n.setRead(true);
        return notificationRepository.save(n);
    }

    public void markAllAsRead(String userId) {
        List<Notification> unread = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().filter(n -> !n.isRead()).toList();
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    public void deleteNotification(String notificationId) {
        notificationRepository.deleteById(notificationId);
    }
}
