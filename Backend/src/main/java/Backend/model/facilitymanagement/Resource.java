package Backend.model.facilitymanagement;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "resources")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Resource {
    @Id
    private String id;
    private String name;
    private String type;
    private int capacity;
    private String location;
    private String description;
    private String status;
    private String availableFrom;
    private String availableTo;
}
