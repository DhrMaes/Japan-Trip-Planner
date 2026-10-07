using System.IO.Compression;
using JapanTripPlanner.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace JapanTripPlanner.Server.Controllers;

[ApiController]
[Route("api/backup")]
public class BackupController : ControllerBase
{
    private readonly IUploadService _uploadService;

    public BackupController(IUploadService uploadService)
    {
        _uploadService = uploadService;
    }

    [HttpPost("export")]
    public async Task<IActionResult> Export()
    {
        using var reader = new StreamReader(Request.Body);
        var rawJsonPayload = await reader.ReadToEndAsync();

        if (string.IsNullOrWhiteSpace(rawJsonPayload))
        {
            return BadRequest(new { error = "No data received for export." });
        }

        var memoryStream = new MemoryStream();
        using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, leaveOpen: true))
        {
            var jsonEntry = archive.CreateEntry("japan-trip-data.json", CompressionLevel.Optimal);
            await using (var entryStream = jsonEntry.Open())
            await using (var writer = new StreamWriter(entryStream))
            {
                await writer.WriteAsync(rawJsonPayload);
            }

            var uploadsPath = _uploadService.UploadsPath;
            if (Directory.Exists(uploadsPath))
            {
                var files = Directory.GetFiles(uploadsPath);
                foreach (var filePath in files)
                {
                    var fileName = Path.GetFileName(filePath);
                    var entry = archive.CreateEntry($"uploads/{fileName}", CompressionLevel.Optimal);
                    await using var fs = System.IO.File.OpenRead(filePath);
                    await using var entryStream = entry.Open();
                    await fs.CopyToAsync(entryStream);
                }
            }
        }

        memoryStream.Position = 0;
        var zipFileName = $"japan-trip-backup-{DateTime.UtcNow:yyyy-MM-dd}.zip";
        return File(memoryStream, "application/zip", zipFileName);
    }

    [HttpPost("import")]
    [RequestSizeLimit(150 * 1024 * 1024)]
    public async Task<IActionResult> Import()
    {
        if (!Request.HasFormContentType)
        {
            return BadRequest(new { error = "Request must be multipart/form-data." });
        }

        var form = await Request.ReadFormAsync();
        var file = form.Files.FirstOrDefault();

        if (file == null || file.Length == 0)
        {
            return BadRequest(new { error = "No backup file received." });
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        string jsonData = string.Empty;
        var uploadsPath = _uploadService.UploadsPath;

        if (extension == ".zip")
        {
            await using var stream = file.OpenReadStream();
            using var archive = new ZipArchive(stream, ZipArchiveMode.Read);

            foreach (var entry in archive.Entries)
            {
                if (entry.FullName.Equals("japan-trip-data.json", StringComparison.OrdinalIgnoreCase) ||
                    entry.FullName.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
                {
                    using var streamReader = new StreamReader(entry.Open());
                    jsonData = await streamReader.ReadToEndAsync();
                }
                else if (entry.FullName.StartsWith("uploads/", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrEmpty(entry.Name))
                {
                    var destPath = Path.Combine(uploadsPath, Path.GetFileName(entry.Name));
                    using var entryStream = entry.Open();
                    using var outStream = System.IO.File.Create(destPath);
                    await entryStream.CopyToAsync(outStream);
                }
            }
        }
        else if (extension == ".json")
        {
            using var streamReader = new StreamReader(file.OpenReadStream());
            jsonData = await streamReader.ReadToEndAsync();
        }
        else
        {
            return BadRequest(new { error = "Please upload a .zip or .json backup file." });
        }

        if (string.IsNullOrWhiteSpace(jsonData))
        {
            return BadRequest(new { error = "Could not find valid data in the backup." });
        }

        return Content(jsonData, "application/json");
    }
}
