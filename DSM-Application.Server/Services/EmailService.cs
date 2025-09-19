using System.Net;
using System.Net.Mail;

namespace DSM_Application.Server.Services
{
    public class EmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }
           // Existing OTP email method (still synchronous)
        public async Task SendOtpEmailAsync(string toEmail, string otp)
        {
            await SendEmailAsync(
                toEmail,
                "Your OTP Code",
                $"Your OTP code is {otp}. It is valid for 5 minutes."
            );
        }
        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            try
            {
                var smtpHost = _config["Email:SmtpHost"];
            var smtpPort = int.Parse(_config["Email:SmtpPort"]);
            var smtpUser = _config["Email:Username"];
            var smtpPass = _config["Email:Password"];

            using var client = new SmtpClient(smtpHost, smtpPort)
            {
                Credentials = new NetworkCredential(smtpUser, smtpPass),
                EnableSsl = true
            };

            var mail = new MailMessage
            {
                From = new MailAddress(smtpUser),
                Subject = subject,
                Body = body,
                IsBodyHtml = false // set true if you want HTML formatting
            
        };

            mail.To.Add(toEmail);

           
                await client.SendMailAsync(mail); // ✅ async call
                Console.WriteLine($"✅ Email sent to {toEmail} successfully.");

            }
            catch (SmtpException ex)
            {
                Console.WriteLine($"[EmailService] Failed to send email: {ex.Message}");
                throw;
            }
        }
    }
}
