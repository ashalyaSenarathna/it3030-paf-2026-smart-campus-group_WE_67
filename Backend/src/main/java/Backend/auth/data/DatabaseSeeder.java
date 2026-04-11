package Backend.auth.data;

import Backend.auth.model.Role;
import Backend.auth.model.User;
import Backend.auth.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class DatabaseSeeder implements CommandLineRunner {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DatabaseSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        createUserIfMissing("admin@gmail.com", "admin123", "Admin User", Set.of(Role.ROLE_ADMIN));
        createUserIfMissing("tech@gmail.com", "tech123", "Technician User", Set.of(Role.ROLE_TECHNICIAN));
    }

    private void createUserIfMissing(String email, String password, String name, Set<Role> roles) {
        if (userRepository.findByEmail(email).isEmpty()) {
            User user = new User();
            user.setEmail(email);
            user.setName(name);
            user.setPassword(passwordEncoder.encode(password));
            user.setRoles(roles);
            user.setAuthProvider("LOCAL");
            userRepository.save(user);
        }
    }
}

