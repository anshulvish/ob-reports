using HealthcareAnalyticsWeb.Extensions;
using Serilog;
using Azure.Identity;

var builder = WebApplication.CreateBuilder(args);

// Configure Azure Key Vault for production
if (builder.Environment.IsProduction())
{
    var keyVaultName = "onbrdrp-devsand-wus-kv-1";
    var keyVaultUri = new Uri($"https://{keyVaultName}.vault.azure.net/");
    
    builder.Configuration.AddAzureKeyVault(
        keyVaultUri,
        new DefaultAzureCredential(new DefaultAzureCredentialOptions
        {
            // Use managed identity in production
            ExcludeVisualStudioCredential = true,
            ExcludeVisualStudioCodeCredential = true,
            ExcludeAzureCliCredential = false, // Keep for deployment
            ExcludeInteractiveBrowserCredential = true
        }));
}

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/healthcare-analytics-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Configure OpenAPI/Swagger with NSwag
builder.Services.AddOpenApiDocument(document =>
{
    document.Title = "Aya Healthcare Analytics API";
    document.Version = "1.0";
    document.Description = "API for healthcare onboarding analytics with BigQuery integration";
    document.DocumentName = "v1";
});

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:3000", "https://localhost:3000")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

// Add custom services (will be implemented in extensions)
builder.Services.AddApplicationServices(builder.Configuration);

// Add hosted services
builder.Services.AddHostedService<HealthcareAnalyticsWeb.Services.BigQueryInitializationService>();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    // Use NSwag OpenAPI
    app.UseOpenApi();
    app.UseSwaggerUi(settings =>
    {
        settings.DocumentPath = "/swagger/v1/swagger.json";
        settings.Path = "/swagger";
        settings.DocumentTitle = "Aya Healthcare Analytics API";
    });
}

app.UseHttpsRedirection();

// Serve static files (React app)
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();

// Map API controllers
app.MapControllers();

// Fallback to index.html for client-side routing
app.MapFallbackToFile("index.html");

try
{
    Log.Information("Starting Aya Healthcare Analytics Web Application");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}