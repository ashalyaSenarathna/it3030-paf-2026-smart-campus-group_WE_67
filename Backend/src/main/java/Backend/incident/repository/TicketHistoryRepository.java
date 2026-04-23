package Backend.incident.repository;

import Backend.incident.model.TicketHistory;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface TicketHistoryRepository extends MongoRepository<TicketHistory, String> {
    List<TicketHistory> findByTicketIdOrderByChangedAtAsc(String ticketId);
    void deleteAllByTicketId(String ticketId);
}
