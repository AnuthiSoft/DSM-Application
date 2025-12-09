using DistributorManagementSystem.Server.Services;
using MongoDB.Bson;
using MongoDB.Driver;
using MongoDB.Driver.GridFS;

namespace DSM_Application.Server.Services
{
    public class ImageService
    {
        private readonly GridFSBucket _bucket;
        public ImageService(DistributorManagementSystem.Server.Services.MongoDbService mongo)
        {
            // Use any existing collection to access the original IMongoDatabase
            var database = mongo.Users.Database;

            _bucket = new GridFSBucket(database, new GridFSBucketOptions
            {
                BucketName = "images"
            });
        }

        public async Task<string> UploadAsync(Stream stream, string filename, string contentType)
        {
            var options = new GridFSUploadOptions
            {
                Metadata = new BsonDocument
            {
                { "contentType", contentType }
            }
            };

            var id = await _bucket.UploadFromStreamAsync(filename, stream, options);
            return id.ToString();
        }

        public async Task<(Stream, string?)> GetAsync(string id)
        {
            if (!ObjectId.TryParse(id, out var objectId))
                return (null, null);

            var filter = Builders<GridFSFileInfo>.Filter.Eq(f => f.Id, objectId);
            var fileInfo = await (await _bucket.FindAsync(filter)).FirstOrDefaultAsync();

            if (fileInfo == null)
                return (null, null);

            var ms = new MemoryStream();
            await _bucket.DownloadToStreamAsync(objectId, ms);
            ms.Position = 0;

            var contentType = fileInfo.Metadata?["contentType"]?.AsString ?? "application/octet-stream";

            return (ms, contentType);
        }
    }
}
