using Google.Cloud.BigQuery.V2;
using HealthcareAnalyticsWeb.Models.BigQuery;

namespace HealthcareAnalyticsWeb.Extensions;

public static class BigQueryExtensions
{
    public static T SafeGetValue<T>(this BigQueryRow row, string fieldName, T? defaultValue = default(T))
    {
        try
        {
            var field = row[fieldName];
            if (field == null) return defaultValue;
            
            if (typeof(T) == typeof(DateTime))
            {
                if (field is DateTime dt) return (T)(object)dt;
                if (field is string str && DateTime.TryParse(str, out var parsedDate))
                    return (T)(object)parsedDate;
                return defaultValue;
            }
            
            if (typeof(T) == typeof(string))
            {
                return (T)(object)(field.ToString() ?? string.Empty);
            }
            
            return (T)Convert.ChangeType(field, typeof(T));
        }
        catch
        {
            return defaultValue;
        }
    }

    public static OnboardingEvent MapRowToEvent(this BigQueryRow row)
    {
        return new OnboardingEvent
        {
            EventTimestamp = row.SafeGetValue<DateTime>("event_timestamp"),
            LocalTimestamp = row.SafeGetValue<DateTime>("local_timestamp", row.SafeGetValue<DateTime>("event_timestamp")),
            EventName = row.SafeGetValue<string>("event_name"),
            SessionId = row.SafeGetValue<string>("sessionId"),
            UserId = row.SafeGetValue<string>("userId"),
            UserEmail = row.SafeGetValue<string>("userEmail"),
            EventId = row.SafeGetValue<string>("eventId"),
            SchemaVersion = row.SafeGetValue<string>("schemaVersion"),
            AppVersion = row.SafeGetValue<string>("appVersion"),
            AppName = row.SafeGetValue<string>("appName"),
            ScreenName = row.SafeGetValue<string>("screenName"),
            TimeSpent = row.SafeGetValue<string>("timeSpent"),
            StartTime = row.SafeGetValue<string>("startTime"),
            EndTime = row.SafeGetValue<string>("endTime"),
            TotalTimeSpent = row.SafeGetValue<string>("totalTimeSpent"),
            SessionStartTime = row.SafeGetValue<string>("sessionStartTime"),
            Endpoint = row.SafeGetValue<string>("endpoint"),
            Method = row.SafeGetValue<string>("method"),
            StatusCode = row.SafeGetValue<string>("statusCode"),
            Error = row.SafeGetValue<string>("error"),
            ExitLocation = row.SafeGetValue<string>("exitLocation"),
            CurrentStep = row.SafeGetValue<string>("currentStep"),
            ResponseData = row.SafeGetValue<string>("responseData"),
            DeviceInfo = row.SafeGetValue<string>("deviceInfo"),
            JobPreferences = row.SafeGetValue<string>("jobPreferences"),
            Country = row.SafeGetValue<string>("country"),
            Region = row.SafeGetValue<string>("region"),
            City = row.SafeGetValue<string>("city"),
            FeatureFlags = new Dictionary<string, string>() // Will be populated when feature flag data is available
        };
    }
}