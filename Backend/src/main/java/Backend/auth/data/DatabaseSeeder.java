package Backend.auth.data;

import Backend.auth.model.Role;
import Backend.auth.model.User;
import Backend.auth.repository.UserRepository;
import Backend.model.Booking.Booking;
import Backend.model.Booking.BookingStatus;
import Backend.model.facilitymanagement.Resource;
import Backend.repository.BookingRepository;
import Backend.repository.facilitymanagement.ResourceRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Component
public class DatabaseSeeder implements CommandLineRunner {
    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final BookingRepository bookingRepository;
    private final PasswordEncoder passwordEncoder;

    public DatabaseSeeder(UserRepository userRepository, 
                          ResourceRepository resourceRepository, 
                          BookingRepository bookingRepository,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.resourceRepository = resourceRepository;
        this.bookingRepository = bookingRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        System.out.println("--- Database Seeding Started ---");
        
        // 1. Seed Users
        createUserIfMissing("admin", "admin@gmail.com", "admin123", "Admin", Set.of(Role.ROLE_ADMIN));
        createUserIfMissing("tech", "tech@gmail.com", "tech123", "Technician User", Set.of(Role.ROLE_TECHNICIAN));
        createUserIfMissing("student", "student@gmail.com", "student123", "Student User", Set.of(Role.ROLE_STUDENT));
        
        System.out.println("Checking resource count: " + resourceRepository.count());
        // 2. Seed Resources if missing
        if (resourceRepository.count() == 0) {
            List<Resource> resources = new ArrayList<>();
            resources.add(new Resource(null, "Main Auditorium", "Lecture Hall", 500, "Building A, Floor 1", "Large auditorium for major events", "Available"));
            resources.add(new Resource(null, "Physics Lab 01", "Lab", 40, "Building B, Floor 2", "Fully equipped physics laboratory", "Available"));
            resources.add(new Resource(null, "Conference Room B", "Meeting Room", 15, "Building C, Floor 3", "Private meeting room with AV setup", "Available"));
            resources.add(new Resource(null, "Indoor Sports Center", "Sports Facility", 100, "Campus West Zone", "Basketball and badminton courts", "Available"));
            resources.add(new Resource(null, "Smart Classroom 402", "Lecture Hall", 60, "Building D, Floor 4", "Modern classroom with interactive boards", "Available"));
            
            resourceRepository.saveAll(resources);
            System.out.println("Seeded 5 resources.");
        }

        System.out.println("Checking booking count: " + bookingRepository.count());
        // 3. Seed Sample Bookings if missing
        if (bookingRepository.count() <= 2) { // Small count means likely only sample data exists
            List<Resource> allResources = resourceRepository.findAll();
            User student = userRepository.findByUsername("student").orElse(null);
            User tech = userRepository.findByUsername("tech").orElse(null);

            if (!allResources.isEmpty() && student != null && tech != null) {
                // If bookings exist with 'student' or 'tech' as literal userId strings, fix them to real IDs
                List<Booking> allBookings = bookingRepository.findAll();
                boolean seeded = false;
                
                for (Booking b : allBookings) {
                    if ("student".equals(b.getUserId()) || b.getUserId() == null) {
                        b.setUserId(student.getId());
                        bookingRepository.save(b);
                        seeded = true;
                    } else if ("tech".equals(b.getUserId())) {
                        b.setUserId(tech.getId());
                        bookingRepository.save(b);
                        seeded = true;
                    }
                }

                if (allBookings.isEmpty()) {
                    Booking b1 = new Booking();
                    b1.setResourceId(allResources.get(0).getId());
                    b1.setUserId(student.getId());
                    b1.setDate(LocalDate.now().plusDays(2));
                    b1.setStartTime(LocalTime.of(9, 0));
                    b1.setEndTime(LocalTime.of(12, 0));
                    b1.setPurpose("Annual Seminar");
                    b1.setExpectedAttendees(200);
                    b1.setStatus(BookingStatus.PENDING);
                    
                    Booking b2 = new Booking();
                    b2.setResourceId(allResources.get(1).getId());
                    b2.setUserId(tech.getId());
                    b2.setDate(LocalDate.now().plusDays(1));
                    b2.setStartTime(LocalTime.of(14, 0));
                    b2.setEndTime(LocalTime.of(16, 0));
                    b2.setPurpose("Equipment Calibration");
                    b2.setExpectedAttendees(5);
                    b2.setStatus(BookingStatus.APPROVED);

                    bookingRepository.save(b1);
                    bookingRepository.save(b2);
                    seeded = true;
                }
                
                if (seeded) System.out.println("Seeded/Updated sample bookings with REAL user IDs.");
            } else {
                System.out.println("Resources or users missing, skipping booking seed.");
            }
        }
        System.out.println("--- Database Seeding Finished ---");
    }

    private User createUserIfMissing(String username, String email, String password, String name, Set<Role> roles) {
        return userRepository.findByUsername(username).orElseGet(() -> {
            User user = new User();
            user.setUsername(username);
            user.setEmail(email);
            user.setName(name);
            user.setPassword(passwordEncoder.encode(password));
            user.setRoles(roles);
            user.setAuthProvider("LOCAL");
            return userRepository.save(user);
        });
    }
}

