namespace JapanTripPlanner.Server.Services;

public interface IUploadService
{
    string UploadsPath { get; }
    Task<(bool Success, string? ErrorMessage, object? Result)> UploadFileAsync(IFormFile file);
    IEnumerable<object> GetImages();
    bool DeleteImage(string filename, out string? errorMessage);
}

public class UploadService : IUploadService
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif", ".heic", ".pdf"
    };

    public string UploadsPath { get; }

    public UploadService(IConfiguration configuration, IWebHostEnvironment environment)
    {
        var configuredUploads = configuration["JapanTripPlanner:UploadsDirectory"] ?? "uploads";
        UploadsPath = Path.IsPathRooted(configuredUploads)
            ? configuredUploads
            : Path.Combine(environment.ContentRootPath, configuredUploads);

        if (!Directory.Exists(UploadsPath))
        {
            Directory.CreateDirectory(UploadsPath);
        }
    }

    public async Task<(bool Success, string? ErrorMessage, object? Result)> UploadFileAsync(IFormFile file)
    {
        if (file.Length == 0)
        {
            return (false, "No file received.", null);
        }

        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(ext) || !AllowedExtensions.Contains(ext))
        {
            return (false, $"File type '{ext}' is not permitted.", null);
        }

        var rawName = Path.GetFileNameWithoutExtension(file.FileName);
        var cleanName = string.Concat(rawName.Where(c => char.IsLetterOrDigit(c) || c is '-' or '_'));
        if (string.IsNullOrWhiteSpace(cleanName)) cleanName = "file";

        var uniqueFileName = $"{DateTime.UtcNow:yyyyMMdd_HHmmss}_{Guid.NewGuid().ToString("N")[..6]}_{cleanName}{ext.ToLowerInvariant()}";
        var destinationFilePath = Path.Combine(UploadsPath, uniqueFileName);

        await using (var stream = File.Create(destinationFilePath))
        {
            await file.CopyToAsync(stream);
        }

        var result = new
        {
            url = $"/uploads/{uniqueFileName}",
            filename = uniqueFileName,
            originalName = file.FileName,
            sizeBytes = file.Length,
            uploadedAtUtc = DateTimeOffset.UtcNow
        };

        return (true, null, result);
    }

    public IEnumerable<object> GetImages()
    {
        if (!Directory.Exists(UploadsPath))
        {
            return Enumerable.Empty<object>();
        }

        return Directory.GetFiles(UploadsPath)
            .Select(f => new FileInfo(f))
            .OrderByDescending(f => f.CreationTimeUtc)
            .Select(f => new
            {
                filename = f.Name,
                url = $"/uploads/{f.Name}",
                sizeBytes = f.Length,
                createdUtc = f.CreationTimeUtc
            });
    }

    public bool DeleteImage(string filename, out string? errorMessage)
    {
        var safeFileName = Path.GetFileName(filename);
        var targetPath = Path.Combine(UploadsPath, safeFileName);

        if (!File.Exists(targetPath))
        {
            errorMessage = "File not found.";
            return false;
        }

        try
        {
            File.Delete(targetPath);
            errorMessage = null;
            return true;
        }
        catch (Exception ex)
        {
            errorMessage = $"Could not delete file: {ex.Message}";
            return false;
        }
    }
}
