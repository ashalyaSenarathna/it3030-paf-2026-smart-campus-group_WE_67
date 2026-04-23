package Backend.incident.repository;

import Backend.incident.model.Ticket;
import Backend.incident.model.TicketPriority;
import Backend.incident.model.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

public interface TicketRepository extends MongoRepository<Ticket, String> {

    Page<Ticket> findByCreatedById(String userId, Pageable pageable);

    Page<Ticket> findByAssignedToId(String technicianId, Pageable pageable);

    Page<Ticket> findAll(Pageable pageable);

    Page<Ticket> findByStatus(TicketStatus status, Pageable pageable);

    Page<Ticket> findByPriority(TicketPriority priority, Pageable pageable);

    Page<Ticket> findByStatusAndPriority(TicketStatus status, TicketPriority priority, Pageable pageable);

    @Query("{ $or: [ { 'title': { $regex: ?0, $options: 'i' } }, { 'description': { $regex: ?0, $options: 'i' } }, { 'location': { $regex: ?0, $options: 'i' } } ] }")
    Page<Ticket> searchByKeyword(String keyword, Pageable pageable);

    long countByCreatedById(String userId);

    long countByStatus(TicketStatus status);

    long countByCreatedByIdAndStatus(String userId, TicketStatus status);
}
