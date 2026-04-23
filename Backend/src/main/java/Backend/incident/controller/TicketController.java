package Backend.incident.controller;

import Backend.incident.dto.CommentRequest;
import Backend.incident.dto.TicketRequest;
import Backend.incident.dto.TicketStatusUpdate;
import Backend.incident.model.*;
import Backend.incident.service.TicketService;
import Backend.auth.model.User;
import Backend.auth.service.UserService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"}, allowCredentials = "true")
public class TicketController {

    private final TicketService ticketService;
    private final UserService userService;

    public TicketController(TicketService ticketService, UserService userService) {
        this.ticketService = ticketService;
        this.userService = userService;
    }

    // ── Helper: extract user info from request headers ──
    private String hdr(HttpHeaders h, String key, String fallback) {
        String v = h.getFirst(key);
        return (v != null && !v.isBlank()) ? v : fallback;
    }

    private String mapRole(String roleHeader) {
        if (roleHeader == null) return "USER";
        return switch (roleHeader.toUpperCase()) {
            case "ADMIN", "ROLE_ADMIN" -> "ADMIN";
            case "TECHNICIAN", "ROLE_TECHNICIAN" -> "TECHNICIAN";
            default -> "USER";
        };
    }

    // ──────────── Tickets ────────────

    @PostMapping
    public ResponseEntity<Ticket> create(@RequestBody TicketRequest req,
                                         @RequestHeader HttpHeaders headers) {
        String userId   = hdr(headers, "X-User-Id", "anonymous");
        String userName = hdr(headers, "X-User-Name", "Unknown");
        String userEmail= hdr(headers, "X-User-Email", "");
        String userRole = mapRole(hdr(headers, "X-User-Role", "USER"));
        Ticket ticket = ticketService.createTicket(req, userId, userName, userEmail, userRole);
        return ResponseEntity.status(HttpStatus.CREATED).body(ticket);
    }

    @GetMapping
    public ResponseEntity<Page<Ticket>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(ticketService.getAllTickets(page, size, sortBy, direction, status, priority, keyword));
    }

    @GetMapping("/my")
    public ResponseEntity<Page<Ticket>> getMy(
            @RequestHeader HttpHeaders headers,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        String userId = hdr(headers, "X-User-Id", "anonymous");
        return ResponseEntity.ok(ticketService.getMyTickets(userId, page, size, sortBy, direction));
    }

    @GetMapping("/assigned")
    public ResponseEntity<Page<Ticket>> getAssigned(
            @RequestHeader HttpHeaders headers,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        String userId = hdr(headers, "X-User-Id", "anonymous");
        return ResponseEntity.ok(ticketService.getAssignedTickets(userId, page, size, sortBy, direction));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Long>> dashboard(@RequestHeader HttpHeaders headers) {
        String userId   = hdr(headers, "X-User-Id", "anonymous");
        String userRole = mapRole(hdr(headers, "X-User-Role", "USER"));
        return ResponseEntity.ok(ticketService.getDashboardStats(userId, userRole));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getById(@PathVariable String id) {
        return ResponseEntity.ok(ticketService.getById(id));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Ticket> updateStatus(@PathVariable String id,
                                               @RequestBody TicketStatusUpdate req,
                                               @RequestHeader HttpHeaders headers) {
        String userId   = hdr(headers, "X-User-Id", "anonymous");
        String userName = hdr(headers, "X-User-Name", "Unknown");
        String userRole = mapRole(hdr(headers, "X-User-Role", "USER"));
        return ResponseEntity.ok(ticketService.updateStatus(id, req, userId, userName, userRole));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<Ticket> reject(@PathVariable String id,
                                         @RequestBody Map<String, String> body,
                                         @RequestHeader HttpHeaders headers) {
        String userName = hdr(headers, "X-User-Name", "Admin");
        String userId   = hdr(headers, "X-User-Id", "anonymous");
        TicketStatusUpdate upd = new TicketStatusUpdate();
        upd.setNewStatus("REJECTED");
        upd.setReason(body.get("reason"));
        return ResponseEntity.ok(ticketService.updateStatus(id, upd, userId, userName, "ADMIN"));
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<Ticket> assign(@PathVariable String id,
                                         @RequestParam String technicianId,
                                         @RequestHeader HttpHeaders headers) {
        // Look up technician details from main backend user store
        Optional<User> techOpt = userService.findById(technicianId);
        String techName  = techOpt.map(u -> u.getName() != null ? u.getName() : u.getUsername()).orElse("Technician");
        String techEmail = techOpt.map(User::getEmail).orElse("");
        return ResponseEntity.ok(ticketService.assignTechnician(id, technicianId, techName, techEmail));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id,
                                        @RequestHeader HttpHeaders headers) {
        ticketService.deleteTicket(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<TicketHistory>> history(@PathVariable String id) {
        return ResponseEntity.ok(ticketService.getHistory(id));
    }

    // ──────────── Comments ────────────

    @GetMapping("/{ticketId}/comments")
    public ResponseEntity<List<Comment>> getComments(@PathVariable String ticketId) {
        return ResponseEntity.ok(ticketService.getComments(ticketId));
    }

    @PostMapping("/{ticketId}/comments")
    public ResponseEntity<Comment> addComment(@PathVariable String ticketId,
                                              @RequestBody CommentRequest req,
                                              @RequestHeader HttpHeaders headers) {
        String userId   = hdr(headers, "X-User-Id", "anonymous");
        String userName = hdr(headers, "X-User-Name", "Unknown");
        String userEmail= hdr(headers, "X-User-Email", "");
        String userRole = mapRole(hdr(headers, "X-User-Role", "USER"));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.addComment(ticketId, req, userId, userName, userEmail, userRole));
    }

    @PutMapping("/{ticketId}/comments/{commentId}")
    public ResponseEntity<Comment> editComment(@PathVariable String ticketId,
                                               @PathVariable String commentId,
                                               @RequestBody CommentRequest req,
                                               @RequestHeader HttpHeaders headers) {
        String userId   = hdr(headers, "X-User-Id", "anonymous");
        String userRole = mapRole(hdr(headers, "X-User-Role", "USER"));
        return ResponseEntity.ok(ticketService.editComment(ticketId, commentId, req, userId, userRole));
    }

    @DeleteMapping("/{ticketId}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable String ticketId,
                                              @PathVariable String commentId,
                                              @RequestHeader HttpHeaders headers) {
        String userId   = hdr(headers, "X-User-Id", "anonymous");
        String userRole = mapRole(hdr(headers, "X-User-Role", "USER"));
        ticketService.deleteComment(ticketId, commentId, userId, userRole);
        return ResponseEntity.noContent().build();
    }

    // ──────────── Attachments ────────────

    @PostMapping("/{ticketId}/attachments")
    public ResponseEntity<Ticket> uploadAttachments(@PathVariable String ticketId,
                                                     @RequestParam("files") MultipartFile[] files) throws IOException {
        return ResponseEntity.ok(ticketService.uploadAttachments(ticketId, files));
    }

    @GetMapping("/{ticketId}/attachments/{attachmentId}/download")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable String ticketId,
                                                        @PathVariable String attachmentId) throws MalformedURLException {
        Path filePath = ticketService.getAttachmentPath(ticketId, attachmentId);
        Attachment meta = ticketService.getAttachmentMeta(ticketId, attachmentId);
        Resource resource = new UrlResource(filePath.toUri());
        if (!resource.exists())
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(meta.getContentType() != null ? meta.getContentType() : "application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + meta.getOriginalFileName() + "\"")
                .body(resource);
    }

    @DeleteMapping("/{ticketId}/attachments/{attachmentId}")
    public ResponseEntity<Ticket> deleteAttachment(@PathVariable String ticketId,
                                                    @PathVariable String attachmentId,
                                                    @RequestHeader HttpHeaders headers) throws IOException {
        String userId   = hdr(headers, "X-User-Id", "anonymous");
        String userRole = mapRole(hdr(headers, "X-User-Role", "USER"));
        return ResponseEntity.ok(ticketService.deleteAttachment(ticketId, attachmentId, userId, userRole));
    }

    // ──────────── Users (technicians list) ────────────

    @GetMapping("/users/technicians")
    public ResponseEntity<List<Map<String, Object>>> getTechnicians() {
        List<Map<String, Object>> techs = userService.findAllTechnicians().stream()
                .map(u -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", u.getId());
                    m.put("fullName", u.getName() != null ? u.getName() : u.getUsername());
                    m.put("email", u.getEmail() != null ? u.getEmail() : "");
                    m.put("role", "TECHNICIAN");
                    return m;
                }).collect(Collectors.toList());
        return ResponseEntity.ok(techs);
    }
}
