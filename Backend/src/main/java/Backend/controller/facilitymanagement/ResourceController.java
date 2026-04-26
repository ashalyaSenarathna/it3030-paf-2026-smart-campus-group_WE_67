package Backend.controller.facilitymanagement;

import Backend.model.Booking.Booking;
import Backend.model.facilitymanagement.Resource;
import Backend.notification.NotificationService;
import Backend.repository.Booking.BookingRepository;
import Backend.service.facilitymanagement.ResourceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for managing resources like labs, equipment, etc.
 * Base URL: /api/resources
 */
@RestController
@RequestMapping("/api/resources")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"}, allowCredentials = "true")
public class ResourceController {

    @Autowired
    private ResourceService resourceService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private BookingRepository bookingRepository;

    // [GET] /api/resources - Get a list of all resources
    @GetMapping
    public List<Resource> getAllResources() {
        return resourceService.getAllResources();
    }

    // [GET] /api/resources/{id} - Get a single resource by its ID
    @GetMapping("/{id}")
    public ResponseEntity<Resource> getResourceById(@PathVariable("id") String id) {
        return resourceService.getResourceById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // [POST] /api/resources - Add a new resource
    @PostMapping
    public Resource createResource(@RequestBody Resource resource) {
        Resource saved = resourceService.createResource(resource);
        try {
            notificationService.notifyAdminsResourceAdded(saved.getId(), saved.getName());
        } catch (Exception e) {
            System.err.println("Notification failed: " + e.getMessage());
        }
        return saved;
    }

    // [PUT] /api/resources/{id} - Update an existing resource's details
    @PutMapping("/{id}")
    public ResponseEntity<Resource> updateResource(@PathVariable("id") String id, @RequestBody Resource resourceDetails) {
        Resource updated = resourceService.updateResource(id, resourceDetails);
        if (updated != null) {
            try {
                notificationService.notifyAdminsResourceUpdated(updated.getId(), updated.getName());
            } catch (Exception e) {
                System.err.println("Notification failed: " + e.getMessage());
            }
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    // [DELETE] /api/resources/{id} - Delete a resource and notify affected users
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable String id) {
        try {
            String resourceName = resourceService.getResourceById(id)
                    .map(Resource::getName).orElse("a facility");
            List<Booking> bookings = bookingRepository.findByResourceId(id);
            if (bookings != null) {
                bookings.stream()
                    .filter(b -> b.getUserId() != null)
                    .forEach(b -> {
                        try {
                            notificationService.notifyUserResourceDeleted(b.getUserId(), resourceName);
                        } catch (Exception e) {
                            System.err.println("Notification failed: " + e.getMessage());
                        }
                    });
            }
            resourceService.deleteResource(id);
            try {
                notificationService.notifyAdminsResourceDeleted(id, resourceName);
            } catch (Exception e) {
                System.err.println("Notification failed: " + e.getMessage());
            }
        } catch (Exception e) {
            System.err.println("Delete resource notification error: " + e.getMessage());
            resourceService.deleteResource(id);
        }
        return ResponseEntity.ok().build();
    }
}
