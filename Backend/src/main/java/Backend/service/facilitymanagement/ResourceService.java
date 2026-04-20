package Backend.service.facilitymanagement;

import Backend.model.facilitymanagement.Resource;
import Backend.model.Booking.Booking;
import Backend.repository.facilitymanagement.ResourceRepository;
import Backend.repository.Booking.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ResourceService {

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private BookingRepository bookingRepository;

    public List<Resource> getAllResources() {
        return resourceRepository.findAll();
    }

    public Optional<Resource> getResourceById(String id) {
        return resourceRepository.findById(id);
    }

    public Resource createResource(Resource resource) {
        return resourceRepository.save(resource);
    }

    public Resource updateResource(String id, Resource resourceDetails) {
        Optional<Resource> optionalResource = resourceRepository.findById(id);
        if (optionalResource.isPresent()) {
            Resource resource = optionalResource.get();
            resource.setName(resourceDetails.getName());
            resource.setType(resourceDetails.getType());
            resource.setCapacity(resourceDetails.getCapacity());
            resource.setLocation(resourceDetails.getLocation());
            resource.setDescription(resourceDetails.getDescription());
            resource.setStatus(resourceDetails.getStatus());
            resource.setAvailableFrom(resourceDetails.getAvailableFrom());
            resource.setAvailableTo(resourceDetails.getAvailableTo());
            return resourceRepository.save(resource);
        }
        return null;
    }

    public void deleteResource(String id) {
        // First delete all bookings associated with this resource
        List<Booking> bookings = bookingRepository.findByResourceId(id);
        if (bookings != null && !bookings.isEmpty()) {
            bookingRepository.deleteAll(bookings);
        }
        resourceRepository.deleteById(id);
    }
}
