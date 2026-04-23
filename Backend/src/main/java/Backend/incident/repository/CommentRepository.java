package Backend.incident.repository;

import Backend.incident.model.Comment;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface CommentRepository extends MongoRepository<Comment, String> {
    List<Comment> findByTicketIdOrderByCreatedAtAsc(String ticketId);
    long countByTicketId(String ticketId);
    void deleteAllByTicketId(String ticketId);
}
