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

        public void SendOtpEmail(string toEmail, string otp)
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
                Subject = "Your OTP Code",
                Body = $"Your OTP code is {otp}. It is valid for 5 minutes."
            };
            mail.To.Add(toEmail);

            client.Send(mail);
        }
    }
}
