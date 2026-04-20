package Backend.model.Booking;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalTime;

@Document(collection = "bookings")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Booking {
    @Id
    private String id;
    
    private String resourceId;
    private String userId;
    
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    
    private String purpose;
    private Integer expectedAttendees;
    
    private BookingStatus status;
    private String adminReason;
}
