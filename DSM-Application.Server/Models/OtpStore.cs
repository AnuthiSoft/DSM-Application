using System.Collections.Concurrent;

namespace DSM_Application.Server.Models
{
    public static class OtpStore
    {
        // email → (otp, verified)
        private static readonly ConcurrentDictionary<string, (string Otp, bool Verified)> _store
            = new();

        public static void SaveOtp(string email, string otp)
        {
            _store[email] = (otp, false);
        }

        public static bool VerifyOtp(string email, string otp)
        {
            return _store.TryGetValue(email, out var entry) &&
                   entry.Otp == otp;
        }

        public static void MarkVerified(string email)
        {
            if (_store.TryGetValue(email, out var entry))
            {
                _store[email] = (entry.Otp, true);
            }
        }

        public static bool IsVerified(string email)
        {
            return _store.TryGetValue(email, out var entry) &&
                   entry.Verified;
        }

        public static void RemoveOtp(string email)
        {
            _store.TryRemove(email, out _);
        }
    }
}
