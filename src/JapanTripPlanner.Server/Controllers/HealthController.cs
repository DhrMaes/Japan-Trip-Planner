using Microsoft.AspNetCore.Mvc;

namespace JapanTripPlanner.Server.Controllers;

[ApiController]
[Route("[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            status = "healthy",
            service = "JapanTripPlanner.Server",
            utcTime = DateTimeOffset.UtcNow
        });
    }
}
