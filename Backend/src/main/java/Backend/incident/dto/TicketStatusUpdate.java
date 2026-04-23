package Backend.incident.dto;

public class TicketStatusUpdate {
    private String newStatus;
    private String notes;
    private String reason;

    public String getNewStatus() { return newStatus; }
    public void setNewStatus(String newStatus) { this.newStatus = newStatus; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
