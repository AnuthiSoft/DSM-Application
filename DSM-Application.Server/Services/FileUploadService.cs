using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace DSM_Application.Server.Services
{
    public class FileUploadService
    {
        private readonly Cloudinary _cloudinary;

        public FileUploadService(IConfiguration config)
        {
            var account = new Account(
       config["Cloudinary:CloudName"],
       config["Cloudinary:ApiKey"],
       config["Cloudinary:ApiSecret"]
   );
            _cloudinary = new Cloudinary(account);
            _cloudinary.Api.Secure = true; // use https
        }

        public async Task<string> UploadImageAsync(IFormFile file, string? folder = "dsm-app")
        {
            if (file == null || file.Length == 0) return string.Empty;

            using var stream = file.OpenReadStream();
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Folder = folder, // optional: stores under folder in Cloudinary
                PublicId = Path.GetFileNameWithoutExtension(file.FileName) + "-" + Guid.NewGuid().ToString("N"),
                Overwrite = false
            };

            var result = await _cloudinary.UploadAsync(uploadParams);
            if (result.StatusCode == System.Net.HttpStatusCode.OK || result.StatusCode == System.Net.HttpStatusCode.Created)
            {
                return result.SecureUrl.ToString();
            }

            // Log result.Error if needed
            return string.Empty;
        }

        public async Task<bool> DeleteImageByPublicIdAsync(string publicId)
        {
            var deletionParams = new DeletionParams(publicId);
            var result = await _cloudinary.DestroyAsync(deletionParams);
            return result.Result == "ok" || result.Result == "not found";
        }
    }
}
