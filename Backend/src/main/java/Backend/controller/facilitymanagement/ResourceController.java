package Backend.controller.facilitymanagement;

import Backend.model.facilitymanagement.Resource;
import Backend.service.facilitymanagement.ResourceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"}, allowCredentials = "true")
public class ResourceController {

    @Autowired
    private ResourceService resourceService;

    @GetMapping
    public List<Resource> getAllResources() {
        return resourceService.getAllResources();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resource> getResourceById(@PathVariable String id) {
        return resourceService.getResourceById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Resource createResource(@RequestBody Resource resource) {
        return resourceService.createResource(resource);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Resource> updateResource(@PathVariable String id, @RequestBody Resource resourceDetails) {
        Resource updatedResource = resourceService.updateResource(id, resourceDetails);
        if (updatedResource != null) {
            return ResponseEntity.ok(updatedResource);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable String id) {
        resourceService.deleteResource(id);
        return ResponseEntity.ok().build();
    }
}
