namespace DSM_Application.Server.Models.DTOs
{
    public class SendOtpDto
    {
        public string PhoneNumber { get; set; }
    }

    public class VerifyOtpDto
    {
        public string PhoneNumber { get; set; }
        public string Code { get; set; }
    }
}
