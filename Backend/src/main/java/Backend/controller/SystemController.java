package Backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/system")
public class SystemController {

    @Autowired
    private MongoTemplate mongoTemplate;

    @GetMapping("/db-status")
    public Map<String, Object> getDbStatus() {
        Map<String, Object> status = new HashMap<>();
        
        // Add Auth Status
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Map<String, Object> authInfo = new HashMap<>();
        if (auth != null) {
            authInfo.put("principal", auth.getName());
            authInfo.put("authenticated", auth.isAuthenticated());
            authInfo.put("authorities", auth.getAuthorities().stream().map(a -> a.getAuthority()).collect(Collectors.toList()));
        } else {
            authInfo.put("authenticated", false);
        }
        status.put("auth", authInfo);

        try {
            Set<String> collections = mongoTemplate.getCollectionNames();
            status.put("connected", true);
            status.put("database", mongoTemplate.getDb().getName());
            status.put("collections", collections);
            
            Map<String, Long> counts = new HashMap<>();
            for (String coll : collections) {
                counts.put(coll, mongoTemplate.getCollection(coll).countDocuments());
            }
            status.put("counts", counts);
        } catch (Exception e) {
            status.put("connected", false);
            status.put("error", e.getMessage());
        }
        return status;
    }

    @Autowired
    private Backend.auth.data.DatabaseSeeder seeder;

    @GetMapping("/force-seed")
    public Map<String, String> forceSeed() {
        try {
            seeder.run();
            return Map.of("message", "Seeding triggered successfully");
        } catch (Exception e) {
            return Map.of("error", e.getMessage());
        }
    }
}
