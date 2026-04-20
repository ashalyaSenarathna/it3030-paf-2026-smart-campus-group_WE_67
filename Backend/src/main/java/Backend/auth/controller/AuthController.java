package Backend.auth.controller;

import Backend.auth.dto.LoginRequest;
import Backend.auth.model.Role;
import Backend.auth.model.User;
import Backend.auth.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"}, allowCredentials = "true")
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final UserService userService;

    public AuthController(AuthenticationManager authenticationManager, UserService userService) {
        this.authenticationManager = authenticationManager;
        this.userService = userService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        request.getSession(true);

        User user = userService.findByUsername(loginRequest.getUsername()).orElseThrow();
        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "email", user.getEmail() != null ? user.getEmail() : "",
                "name", user.getName(),
                "roles", user.getRoles().stream().map(Role::name).collect(Collectors.toList())
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        request.getSession().invalidate();
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> currentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated"));
        }

        String username;
        if (authentication instanceof OAuth2AuthenticationToken oauthToken) {
            OAuth2User oauth2User = oauthToken.getPrincipal();
            // Google usually provides 'email' attribute.
            username = oauth2User.getAttribute("email");
        } else {
            username = authentication.getName();
        }

        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Identity not found in principal"));
        }

        System.out.println("Processing /me for identity: " + username);

        Optional<User> userOpt = userService.findByUsername(username);
        
        if (userOpt.isEmpty()) {
            // Try by email as fallback
            userOpt = userService.findByEmail(username);
        }

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "User session valid but user not found in database for: " + username));
        }

        User user = userOpt.get();
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUsername() != null ? user.getUsername() : "");
        response.put("email", user.getEmail() != null ? user.getEmail() : "");
        response.put("name", user.getName() != null ? user.getName() : "Student");
        response.put("roles", user.getRoles() != null ? 
            user.getRoles().stream().map(Role::name).collect(Collectors.toList()) : 
            Collections.emptyList());
        
        return ResponseEntity.ok(response);
    }
}

