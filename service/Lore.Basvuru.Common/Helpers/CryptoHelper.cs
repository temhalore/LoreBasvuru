using Lore.Basvuru.Common.Configuration;
using System.Security.Cryptography;
using System.Text;

namespace Lore.Basvuru.Common.Helpers
{
    public static class CryptoHelper
    {
        private static string GetKey()
        {
            var key = CoreConfig.EncryptionKey;
            if (string.IsNullOrWhiteSpace(key))
                key = "LoreBasvuru_Default_Key_2025!@#$";
            // AES-128 için 16 byte, AES-256 için 32 byte
            var keyBytes = Encoding.UTF8.GetBytes(key);
            var result = new byte[32];
            Buffer.BlockCopy(keyBytes, 0, result, 0, Math.Min(keyBytes.Length, 32));
            return Convert.ToBase64String(result);
        }

        public static string EncryptString(string plainText)
        {
            if (string.IsNullOrEmpty(plainText)) return plainText;
            try
            {
                var keyBytes = Convert.FromBase64String(GetKey());
                using var aes = Aes.Create();
                aes.Key = keyBytes;
                aes.GenerateIV();
                using var encryptor = aes.CreateEncryptor();
                var plainBytes = Encoding.UTF8.GetBytes(plainText);
                var cipherBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);
                var result = new byte[aes.IV.Length + cipherBytes.Length];
                Buffer.BlockCopy(aes.IV, 0, result, 0, aes.IV.Length);
                Buffer.BlockCopy(cipherBytes, 0, result, aes.IV.Length, cipherBytes.Length);
                return Convert.ToBase64String(result).Replace("+", "-").Replace("/", "_").Replace("=", "");
            }
            catch
            {
                return plainText;
            }
        }

        public static string DecryptString(string cipherText)
        {
            if (string.IsNullOrEmpty(cipherText)) return cipherText;
            try
            {
                cipherText = cipherText.Replace("-", "+").Replace("_", "/");
                var padding = (4 - cipherText.Length % 4) % 4;
                cipherText += new string('=', padding);
                var keyBytes = Convert.FromBase64String(GetKey());
                var fullBytes = Convert.FromBase64String(cipherText);
                using var aes = Aes.Create();
                aes.Key = keyBytes;
                var iv = new byte[16];
                Buffer.BlockCopy(fullBytes, 0, iv, 0, 16);
                aes.IV = iv;
                using var decryptor = aes.CreateDecryptor();
                var cipherBytes = new byte[fullBytes.Length - 16];
                Buffer.BlockCopy(fullBytes, 16, cipherBytes, 0, cipherBytes.Length);
                var plainBytes = decryptor.TransformFinalBlock(cipherBytes, 0, cipherBytes.Length);
                return Encoding.UTF8.GetString(plainBytes);
            }
            catch
            {
                return string.Empty;
            }
        }

        public static string EncryptLong(long value)
            => EncryptString(value.ToString());

        public static long DecryptLong(string? eid)
        {
            if (string.IsNullOrWhiteSpace(eid)) return 0;
            var plain = DecryptString(eid);
            return long.TryParse(plain, out var result) ? result : 0;
        }

        public static string GenerateToken()
        {
            return Convert.ToBase64String(RandomNumberGenerator.GetBytes(48))
                .Replace("+", "-").Replace("/", "_").Replace("=", "");
        }

        public static string HashPassword(string password, string salt)
        {
            using var sha = SHA256.Create();
            var combined = Encoding.UTF8.GetBytes(password + salt);
            return Convert.ToBase64String(sha.ComputeHash(combined));
        }

        public static string GenerateSalt()
        {
            return Convert.ToBase64String(RandomNumberGenerator.GetBytes(16));
        }
    }
}
