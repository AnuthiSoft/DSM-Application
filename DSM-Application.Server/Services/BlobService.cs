using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace DSM_Application.Server.Services
{
    public class BlobService
    {
        private readonly BlobContainerClient _container;

        public BlobService(IConfiguration configuration)
        {
            var connectionString = configuration["AzureBlob:ConnectionString"];
            var containerName = configuration["AzureBlob:ContainerName"];

            var blobServiceClient = new BlobServiceClient(connectionString);
            _container = blobServiceClient.GetBlobContainerClient(containerName);
        }

        public async Task<string> UploadAsync(IFormFile file)
        {
            var blobName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var blobClient = _container.GetBlobClient(blobName);

            using var stream = file.OpenReadStream();
            await blobClient.UploadAsync(stream, new BlobHttpHeaders
            {
                ContentType = file.ContentType
            });

            // ✅ FULL URL
            return blobClient.Uri.ToString();
        }
        public async Task<byte[]?> DownloadAsync(string blobName)
        {
            try
            {
                var blobClient = _container.GetBlobClient(blobName);
                var result = await blobClient.DownloadContentAsync();
                return result.Value.Content.ToArray();
            }
            catch
            {
                return null;
            }
        }

    }
}
