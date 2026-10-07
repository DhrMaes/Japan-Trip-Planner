using JapanTripPlanner.Server.Services;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.FileProviders;

namespace JapanTripPlanner.Server;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        // Service registrations
        builder.Services.AddControllers();
        builder.Services.AddSingleton<IUploadService, UploadService>();

        builder.Services.Configure<FormOptions>(options =>
        {
            options.MultipartBodyLengthLimit = 150 * 1024 * 1024;
        });

        builder.Services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
            {
                policy.AllowAnyOrigin()
                      .AllowAnyHeader()
                      .AllowAnyMethod();
            });
        });

        var app = builder.Build();

        app.UseCors();

        var contentRoot = app.Environment.ContentRootPath;

        var candidateFrontendPaths = new[]
        {
            Path.Combine(contentRoot, "..", "JapanTripPlanner.App", "dist"),
            Path.Combine(contentRoot, "wwwroot"),
            Path.Combine(AppContext.BaseDirectory, "wwwroot")
        };

        var frontendPath = candidateFrontendPaths.FirstOrDefault(Directory.Exists)
            ?? Path.Combine(contentRoot, "wwwroot");

        if (!Directory.Exists(frontendPath))
        {
            Directory.CreateDirectory(frontendPath);
        }

        var uploadService = app.Services.GetRequiredService<IUploadService>();
        var uploadsPath = uploadService.UploadsPath;

        var defaultFileOptions = new DefaultFilesOptions
        {
            FileProvider = new PhysicalFileProvider(frontendPath),
            RequestPath = ""
        };
        defaultFileOptions.DefaultFileNames.Clear();
        defaultFileOptions.DefaultFileNames.Add("index.html");

        app.UseDefaultFiles(defaultFileOptions);

        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new PhysicalFileProvider(frontendPath),
            RequestPath = ""
        });

        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new PhysicalFileProvider(uploadsPath),
            RequestPath = "/uploads"
        });

        app.MapControllers();

        app.MapFallback(async context =>
        {
            var indexHtmlPath = Path.Combine(frontendPath, "index.html");
            if (File.Exists(indexHtmlPath))
            {
                context.Response.ContentType = "text/html; charset=utf-8";
                await context.Response.SendFileAsync(indexHtmlPath);
            }
            else
            {
                context.Response.StatusCode = 404;
                await context.Response.WriteAsync("Japan Trip Planner frontend not found.");
            }
        });

        app.Run();
    }
}
