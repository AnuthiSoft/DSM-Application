namespace DSM_Application.Server.Models.DTOs
{
    public class ConnectionRequestDto
    {
        public string ConnectionId { get; set; }
        public string CustomerId { get; set; }
        public string Name { get; set; }      // Customer Name
        public string Email { get; set; }     // Customer Email
        public string PhoneNumber { get; set; } // Customer Phone
        public DateTime ConnectedOn { get; set; } = DateTime.UtcNow;
        public string Status { get; set; }    // Connection Status
    }
}
