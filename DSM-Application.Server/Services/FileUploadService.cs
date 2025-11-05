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
                config["Cloudinary:ApiSecret"]);
            _cloudinary = new Cloudinary(account);
        }

        public async Task<string> UploadImageAsync(IFormFile file)
        {
            using var stream = file.OpenReadStream();
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, stream)
            };
            var uploadResult = await _cloudinary.UploadAsync(uploadParams);
            return uploadResult.SecureUrl.AbsoluteUri;
        }
    }
}
