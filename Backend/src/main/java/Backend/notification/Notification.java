package Backend.notification;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "notifications")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Notification {

    @Id
    private String id;

    /** The user who should receive this notification */
    private String userId;

    /** Short title, e.g. "Booking Approved" */
    private String title;

    /** Full message body */
    private String message;

    /** Type: BOOKING_APPROVED, BOOKING_REJECTED, TICKET_STATUS_CHANGED, TICKET_COMMENT */
    private String type;

    /** Optional reference id (bookingId, ticketId, etc.) */
    private String referenceId;

    private boolean read = false;

    private LocalDateTime createdAt = LocalDateTime.now();
}
