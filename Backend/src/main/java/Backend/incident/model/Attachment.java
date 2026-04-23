package Backend.incident.model;

public class Attachment {
    private String id;
    private String originalFileName;
    private String storedFileName;
    private String contentType;
    private long size;

    public Attachment() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getOriginalFileName() { return originalFileName; }
    public void setOriginalFileName(String originalFileName) { this.originalFileName = originalFileName; }
    public String getStoredFileName() { return storedFileName; }
    public void setStoredFileName(String storedFileName) { this.storedFileName = storedFileName; }
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public long getSize() { return size; }
    public void setSize(long size) { this.size = size; }
}
