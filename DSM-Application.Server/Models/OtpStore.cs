using System.Collections.Concurrent;

namespace DSM_Application.Server.Models
{
    public class OtpStore
    {
        private static readonly ConcurrentDictionary<string, (string Otp, DateTime Expiry)> _otps
            = new ConcurrentDictionary<string, (string, DateTime)>();

        public static void SaveOtp(string email, string otp)
        {
            _otps[email] = (otp, DateTime.UtcNow.AddMinutes(5));
        }

        // ✅ Only verifies, does not remove
        public static bool VerifyOtp(string email, string otp)
        {
            return _otps.TryGetValue(email, out var entry)
                && entry.Expiry > DateTime.UtcNow
                && entry.Otp == otp;
        }
       

        // ✅ Call this manually after password reset
        public static void RemoveOtp(string email)
        {
            _otps.TryRemove(email, out _);
        }
      

    }
}
