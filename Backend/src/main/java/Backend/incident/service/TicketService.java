package Backend.incident.service;

import Backend.incident.dto.CommentRequest;
import Backend.incident.dto.TicketRequest;
import Backend.incident.dto.TicketStatusUpdate;
import Backend.incident.model.*;
import Backend.incident.repository.CommentRepository;
import Backend.incident.repository.TicketHistoryRepository;
import Backend.incident.repository.TicketRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class TicketService {

    private final TicketRepository ticketRepo;
    private final CommentRepository commentRepo;
    private final TicketHistoryRepository historyRepo;

    @Value("${incident.upload.dir:uploads/incident}")
    private String uploadDir;

    public TicketService(TicketRepository ticketRepo,
                         CommentRepository commentRepo,
                         TicketHistoryRepository historyRepo) {
        this.ticketRepo = ticketRepo;
        this.commentRepo = commentRepo;
        this.historyRepo = historyRepo;
    }

    // ──────────── Helper ────────────

    private UserRef buildUserRef(String userId, String userName, String userEmail, String userRole) {
        return new UserRef(userId, userName, userEmail, userRole);
    }

    private Pageable buildPageable(int page, int size, String sortBy, String direction) {
        Sort sort = "asc".equalsIgnoreCase(direction)
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        return PageRequest.of(page, size, sort);
    }

    // ──────────── Tickets ────────────

    public Ticket createTicket(TicketRequest req,
                               String userId, String userName, String userEmail, String userRole) {
        Ticket ticket = new Ticket();
        ticket.setTitle(req.getTitle());
        ticket.setDescription(req.getDescription());
        ticket.setCategory(TicketCategory.valueOf(req.getCategory()));
        ticket.setPriority(TicketPriority.valueOf(req.getPriority()));
        ticket.setLocation(req.getLocation());
        ticket.setContactEmail(req.getContactEmail());
        ticket.setContactPhone(req.getContactPhone());
        ticket.setCreatedBy(buildUserRef(userId, userName, userEmail, userRole));
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());
        Ticket saved = ticketRepo.save(ticket);

        // Record initial history
        recordHistory(saved.getId(), null, TicketStatus.OPEN.name(), userName, null);
        return saved;
    }

    public Page<Ticket> getAllTickets(int page, int size, String sortBy, String direction,
                                      String status, String priority, String keyword) {
        Pageable pageable = buildPageable(page, size, sortBy, direction);
        if (keyword != null && !keyword.isBlank()) return ticketRepo.searchByKeyword(keyword.trim(), pageable);
        if (status != null && !status.isBlank() && priority != null && !priority.isBlank())
            return ticketRepo.findByStatusAndPriority(TicketStatus.valueOf(status), TicketPriority.valueOf(priority), pageable);
        if (status != null && !status.isBlank()) return ticketRepo.findByStatus(TicketStatus.valueOf(status), pageable);
        if (priority != null && !priority.isBlank()) return ticketRepo.findByPriority(TicketPriority.valueOf(priority), pageable);
        return ticketRepo.findAll(pageable);
    }

    public Page<Ticket> getMyTickets(String userId, int page, int size, String sortBy, String direction) {
        return ticketRepo.findByCreatedById(userId, buildPageable(page, size, sortBy, direction));
    }

    public Page<Ticket> getAssignedTickets(String techId, int page, int size, String sortBy, String direction) {
        return ticketRepo.findByAssignedToId(techId, buildPageable(page, size, sortBy, direction));
    }

    public Ticket getById(String id) {
        return ticketRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
    }

    public Ticket updateStatus(String id, TicketStatusUpdate req,
                               String userId, String userName, String userRole) {
        Ticket ticket = getById(id);
        String fromStatus = ticket.getStatus().name();
        TicketStatus newStatus = TicketStatus.valueOf(req.getNewStatus());

        ticket.setStatus(newStatus);
        ticket.setUpdatedAt(LocalDateTime.now());

        if (newStatus == TicketStatus.RESOLVED && req.getNotes() != null)
            ticket.setResolutionNotes(req.getNotes());
        if (newStatus == TicketStatus.REJECTED && req.getReason() != null)
            ticket.setRejectionReason(req.getReason());

        Ticket saved = ticketRepo.save(ticket);
        recordHistory(id, fromStatus, newStatus.name(), userName, req.getReason());
        return saved;
    }

    public Ticket assignTechnician(String id, String techId, String techName, String techEmail) {
        Ticket ticket = getById(id);
        ticket.setAssignedTo(new UserRef(techId, techName, techEmail, "TECHNICIAN"));
        ticket.setUpdatedAt(LocalDateTime.now());
        return ticketRepo.save(ticket);
    }

    public void deleteTicket(String id) {
        ticketRepo.deleteById(id);
        commentRepo.deleteAllByTicketId(id);
        historyRepo.deleteAllByTicketId(id);
    }

    public Map<String, Long> getDashboardStats(String userId, String userRole) {
        Map<String, Long> stats = new LinkedHashMap<>();
        stats.put("totalTickets", ticketRepo.count());
        stats.put("openTickets", ticketRepo.countByStatus(TicketStatus.OPEN));
        stats.put("inProgressTickets", ticketRepo.countByStatus(TicketStatus.IN_PROGRESS));
        stats.put("resolvedTickets", ticketRepo.countByStatus(TicketStatus.RESOLVED));
        stats.put("closedTickets", ticketRepo.countByStatus(TicketStatus.CLOSED));
        stats.put("rejectedTickets", ticketRepo.countByStatus(TicketStatus.REJECTED));
        stats.put("myTickets", ticketRepo.countByCreatedById(userId));
        stats.put("myOpenTickets", ticketRepo.countByCreatedByIdAndStatus(userId, TicketStatus.OPEN));
        return stats;
    }

    // ──────────── Comments ────────────

    public Comment addComment(String ticketId, CommentRequest req,
                              String userId, String userName, String userEmail, String userRole) {
        Ticket ticket = getById(ticketId);
        Comment comment = new Comment();
        comment.setTicketId(ticketId);
        comment.setContent(req.getContent());
        comment.setAuthor(buildUserRef(userId, userName, userEmail, userRole));
        comment.setCreatedAt(LocalDateTime.now());
        comment.setUpdatedAt(LocalDateTime.now());
        Comment saved = commentRepo.save(comment);

        // Update comment count
        ticket.setCommentCount((int) commentRepo.countByTicketId(ticketId));
        ticket.setUpdatedAt(LocalDateTime.now());
        ticketRepo.save(ticket);
        return saved;
    }

    public List<Comment> getComments(String ticketId) {
        return commentRepo.findByTicketIdOrderByCreatedAtAsc(ticketId);
    }

    public Comment editComment(String ticketId, String commentId, CommentRequest req,
                               String userId, String userRole) {
        Comment comment = commentRepo.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
        boolean isOwner = comment.getAuthor() != null && userId.equals(comment.getAuthor().getId());
        boolean isAdmin = "ADMIN".equals(userRole);
        if (!isOwner && !isAdmin)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized to edit this comment");
        comment.setContent(req.getContent());
        comment.setEdited(true);
        comment.setUpdatedAt(LocalDateTime.now());
        return commentRepo.save(comment);
    }

    public void deleteComment(String ticketId, String commentId, String userId, String userRole) {
        Comment comment = commentRepo.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
        boolean isOwner = comment.getAuthor() != null && userId.equals(comment.getAuthor().getId());
        boolean isAdmin = "ADMIN".equals(userRole);
        if (!isOwner && !isAdmin)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized to delete this comment");
        commentRepo.deleteById(commentId);

        // Decrement count
        Ticket ticket = getById(ticketId);
        ticket.setCommentCount((int) commentRepo.countByTicketId(ticketId));
        ticket.setUpdatedAt(LocalDateTime.now());
        ticketRepo.save(ticket);
    }

    // ──────────── Attachments ────────────

    public Ticket uploadAttachments(String ticketId, MultipartFile[] files) throws IOException {
        Ticket ticket = getById(ticketId);
        if (ticket.getAttachments().size() + files.length > 3)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Max 3 attachments per ticket");

        Path dir = Paths.get(uploadDir, ticketId);
        Files.createDirectories(dir);

        for (MultipartFile file : files) {
            String uid = UUID.randomUUID().toString();
            String storedName = uid + "_" + file.getOriginalFilename();
            Files.copy(file.getInputStream(), dir.resolve(storedName), StandardCopyOption.REPLACE_EXISTING);

            Attachment att = new Attachment();
            att.setId(uid);
            att.setOriginalFileName(file.getOriginalFilename());
            att.setStoredFileName(storedName);
            att.setContentType(file.getContentType());
            att.setSize(file.getSize());
            ticket.getAttachments().add(att);
        }
        ticket.setUpdatedAt(LocalDateTime.now());
        return ticketRepo.save(ticket);
    }

    public Path getAttachmentPath(String ticketId, String attachmentId) {
        Ticket ticket = getById(ticketId);
        Attachment att = ticket.getAttachments().stream()
                .filter(a -> a.getId().equals(attachmentId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found"));
        return Paths.get(uploadDir, ticketId, att.getStoredFileName());
    }

    public Attachment getAttachmentMeta(String ticketId, String attachmentId) {
        Ticket ticket = getById(ticketId);
        return ticket.getAttachments().stream()
                .filter(a -> a.getId().equals(attachmentId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found"));
    }

    public Ticket deleteAttachment(String ticketId, String attachmentId, String userId, String userRole) throws IOException {
        Ticket ticket = getById(ticketId);
        boolean isOwner = ticket.getCreatedBy() != null && userId.equals(ticket.getCreatedBy().getId());
        boolean isAdmin = "ADMIN".equals(userRole);
        boolean isTech  = "TECHNICIAN".equals(userRole);
        if (!isOwner && !isAdmin && !isTech)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized");

        Attachment att = ticket.getAttachments().stream()
                .filter(a -> a.getId().equals(attachmentId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found"));

        Path file = Paths.get(uploadDir, ticketId, att.getStoredFileName());
        Files.deleteIfExists(file);

        ticket.getAttachments().removeIf(a -> a.getId().equals(attachmentId));
        ticket.setUpdatedAt(LocalDateTime.now());
        return ticketRepo.save(ticket);
    }

    // ──────────── History ────────────

    public List<TicketHistory> getHistory(String ticketId) {
        return historyRepo.findByTicketIdOrderByChangedAtAsc(ticketId);
    }

    private void recordHistory(String ticketId, String from, String to, String changedBy, String reason) {
        TicketHistory h = new TicketHistory();
        h.setTicketId(ticketId);
        h.setFromStatus(from);
        h.setToStatus(to);
        h.setChangedBy(changedBy);
        h.setReason(reason);
        h.setChangedAt(LocalDateTime.now());
        historyRepo.save(h);
    }
}
