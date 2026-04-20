package Backend.service.facilitymanagement;

import Backend.model.facilitymanagement.Resource;
import Backend.repository.facilitymanagement.ResourceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ResourceService {

    @Autowired
    private ResourceRepository resourceRepository;

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
        resourceRepository.deleteById(id);
    }
}
