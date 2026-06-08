using BCrypt.Net;

namespace HelpdeskApi.Helpers
{
    public class PasswordHelper : IPasswordHelper
    {
        public string Hash(string plain)
        {
            return BCrypt.Net.BCrypt.HashPassword(plain, workFactor: 12);
        }

        public bool Verify(string plain, string hash)
        {
            return BCrypt.Net.BCrypt.Verify(plain, hash);
        }

        public bool IsPasswordValid(string password)
        {
            if (string.IsNullOrWhiteSpace(password) || password.Length < 8)
            {
                return false;
            }

            var hasUpper = false;
            var hasLower = false;
            var hasDigit = false;
            var hasSpecial = false;

            foreach (var character in password)
            {
                if (char.IsUpper(character))
                {
                    hasUpper = true;
                }
                else if (char.IsLower(character))
                {
                    hasLower = true;
                }
                else if (char.IsDigit(character))
                {
                    hasDigit = true;
                }
                else if (!char.IsLetterOrDigit(character))
                {
                    hasSpecial = true;
                }
            }

            return hasUpper && hasLower && hasDigit && hasSpecial;
        }
    }
}