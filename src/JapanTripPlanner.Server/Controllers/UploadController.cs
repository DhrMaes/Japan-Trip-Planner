using JapanTripPlanner.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace JapanTripPlanner.Server.Controllers;

[ApiController]
[Route("api")]
public class UploadController : ControllerBase
{
    private readonly IUploadService _uploadService;

    public UploadController(IUploadService uploadService)
    {
        _uploadService = uploadService;
    }

    [HttpPost("upload")]
    [RequestSizeLimit(150 * 1024 * 1024)]
    public async Task<IActionResult> Upload([FromForm] IFormFile? image)
    {
        var file = image ?? Request.Form.Files.FirstOrDefault();
        if (file == null)
        {
            return BadRequest(new { error = "No file received." });
        }

        var (success, errorMessage, result) = await _uploadService.UploadFileAsync(file);
        if (!success)
        {
            return BadRequest(new { error = errorMessage });
        }

        return Ok(result);
    }

    [HttpGet("images")]
    public IActionResult GetImages()
    {
        return Ok(_uploadService.GetImages());
    }

    [HttpDelete("images/{filename}")]
    public IActionResult DeleteImage(string filename)
    {
        var success = _uploadService.DeleteImage(filename, out var error);
        if (!success)
        {
            if (error == "File not found.")
            {
                return NotFound(new { error });
            }
            return Problem(error);
        }

        return Ok(new { message = $"File {Path.GetFileName(filename)} removed." });
    }
}
