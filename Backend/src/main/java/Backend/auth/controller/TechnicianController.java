package Backend.auth.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tech")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"}, allowCredentials = "true")
public class TechnicianController {

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<?> dashboard() {
        return ResponseEntity.ok("Technician dashboard loaded successfully.");
    }
}

