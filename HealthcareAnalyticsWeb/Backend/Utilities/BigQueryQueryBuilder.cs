using HealthcareAnalyticsWeb.Configuration;
using HealthcareAnalyticsWeb.Services.Interfaces;

namespace HealthcareAnalyticsWeb.Utilities;

public static class BigQueryQueryBuilder
{
    public static string BuildEventsQuery(BigQueryConfig config, DateTime startDate, DateTime endDate, FilterCriteria? filters = null)
    {
        var startDateStr = startDate.ToString("yyyyMMdd");
        var endDateStr = endDate.ToString("yyyyMMdd");
        
        var baseQuery = $@"
            WITH
                raw_events AS (
                    SELECT *
                    FROM `{config.ProjectId}.{config.DatasetId}.events_*`
                    WHERE _TABLE_SUFFIX BETWEEN '{startDateStr}' AND '{endDateStr}'
                    UNION ALL
                    SELECT *
                    FROM `{config.ProjectId}.{config.DatasetId}.events_intraday_*`
                    WHERE _TABLE_SUFFIX = FORMAT_DATE('%Y%m%d', CURRENT_DATE())
                ),
                flattened_params AS (
                    SELECT
                        TIMESTAMP_MICROS(e.event_timestamp) AS event_timestamp,
                        -- Parse localTimestamp for timezone analysis
                        CASE 
                            WHEN (SELECT p.value.string_value FROM UNNEST(e.event_params) AS p WHERE p.key = 'localTimestamp') IS NOT NULL 
                            THEN TIMESTAMP((SELECT p.value.string_value FROM UNNEST(e.event_params) AS p WHERE p.key = 'localTimestamp'))
                            ELSE TIMESTAMP_MICROS(e.event_timestamp)
                        END AS local_timestamp,
                        e.event_name,
                        -- Core tracking parameters
                        (SELECT COALESCE(p.value.string_value, CAST(p.value.int_value AS STRING)) FROM UNNEST(e.event_params) AS p WHERE p.key = 'sessionId') AS sessionId,
                        (SELECT COALESCE(p.value.string_value, CAST(p.value.int_value AS STRING)) FROM UNNEST(e.event_params) AS p WHERE p.key = 'userId') AS userId,
                        (SELECT COALESCE(p.value.string_value, CAST(p.value.int_value AS STRING)) FROM UNNEST(e.event_params) AS p WHERE p.key = 'userEmail') AS userEmail,
                        (SELECT COALESCE(p.value.string_value, CAST(p.value.int_value AS STRING)) FROM UNNEST(e.event_params) AS p WHERE p.key = 'eventId') AS eventId,
                        (SELECT COALESCE(p.value.string_value, CAST(p.value.int_value AS STRING)) FROM UNNEST(e.event_params) AS p WHERE p.key = 'screenName') AS screenName,
                        (SELECT COALESCE(p.value.string_value, CAST(p.value.int_value AS STRING)) FROM UNNEST(e.event_params) AS p WHERE p.key = 'schemaVersion') AS schemaVersion,
                        (SELECT COALESCE(p.value.string_value, CAST(p.value.int_value AS STRING)) FROM UNNEST(e.event_params) AS p WHERE p.key = 'appVersion') AS appVersion,
                        (SELECT COALESCE(p.value.string_value, CAST(p.value.int_value AS STRING)) FROM UNNEST(e.event_params) AS p WHERE p.key = 'appName') AS appName,
                        -- Timing fields
                        (SELECT COALESCE(p.value.string_value, CAST(p.value.int_value AS STRING)) FROM UNNEST(e.event_params) AS p WHERE p.key = 'timeSpent') AS timeSpent,
                        (SELECT COALESCE(p.value.string_value, CAST(p.value.int_value AS STRING)) FROM UNNEST(e.event_params) AS p WHERE p.key = 'startTime') AS startTime,
                        (SELECT COALESCE(p.value.string_value, CAST(p.value.int_value AS STRING)) FROM UNNEST(e.event_params) AS p WHERE p.key = 'endTime') AS endTime,
                        (SELECT COALESCE(p.value.string_value, CAST(p.value.int_value AS STRING)) FROM UNNEST(e.event_params) AS p WHERE p.key = 'totalTimeSpent') AS totalTimeSpent,
                        -- Geographic data
                        e.geo.country,
                        e.geo.region,
                        e.geo.city,
                        -- Device info reconstruction (chunked data)
                        (SELECT STRING_AGG(
                            COALESCE(p.value.string_value, CAST(p.value.int_value AS STRING)), 
                            '' ORDER BY CAST(REGEXP_EXTRACT(p.key, r'deviceInfo_(\\d+)') AS INT64)
                        ) FROM UNNEST(e.event_params) AS p WHERE STARTS_WITH(p.key, 'deviceInfo_')) AS deviceInfo,
                        -- Response data reconstruction
                        (SELECT STRING_AGG(
                            COALESCE(p.value.string_value, CAST(p.value.int_value AS STRING)), 
                            '' ORDER BY CAST(REGEXP_EXTRACT(p.key, r'responseData_(\\d+)') AS INT64)
                        ) FROM UNNEST(e.event_params) AS p WHERE STARTS_WITH(p.key, 'responseData_')) AS responseData
                    FROM raw_events AS e
                    WHERE e.event_name IN ('aifp_screen_view', 'aifp_exit_onboarding', 'aifp_complete_onboarding', 'aifp_api_call')
                )
            SELECT *
            FROM flattened_params
            WHERE 1=1";

        // Apply filters
        if (filters?.ExcludeTestUsers == true)
        {
            baseQuery += @"
                AND NOT (LOWER(COALESCE(userId, '')) LIKE '%test%' 
                        OR LOWER(COALESCE(userId, '')) LIKE '%qa%' 
                        OR LOWER(COALESCE(userEmail, '')) LIKE '%test%')";
        }

        if (!string.IsNullOrEmpty(filters?.SchemaVersion))
        {
            baseQuery += $" AND schemaVersion = '{filters.SchemaVersion}'";
        }

        if (!string.IsNullOrEmpty(filters?.Country))
        {
            baseQuery += $" AND LOWER(country) = LOWER('{filters.Country}')";
        }

        baseQuery += " ORDER BY event_timestamp DESC";
        
        if (config.MaxResults > 0)
        {
            baseQuery += $" LIMIT {config.MaxResults}";
        }

        return baseQuery;
    }

    public static string BuildScreenFlowQuery(BigQueryConfig config, DateTime startDate, DateTime endDate, FilterCriteria? filters = null)
    {
        var eventsQuery = BuildEventsQuery(config, startDate, endDate, filters)
            .Replace("SELECT *", "SELECT sessionId, userId, screenName, event_timestamp")
            .Replace("ORDER BY event_timestamp DESC", "");

        return $@"
            WITH user_sessions AS (
                SELECT 
                    sessionId,
                    userId,
                    ARRAY_AGG(
                        STRUCT(screenName, event_timestamp) 
                        ORDER BY event_timestamp
                    ) as screen_sequence
                FROM (
                    {eventsQuery}
                )
                WHERE event_name = 'aifp_screen_view'
                  AND screenName IS NOT NULL 
                  AND screenName != ''
                GROUP BY sessionId, userId
                HAVING COUNT(*) > 1  -- Only sessions with multiple screens
            ),
            screen_transitions AS (
                SELECT 
                    sessionId,
                    userId,
                    LAG(screen.screenName) OVER (PARTITION BY sessionId ORDER BY screen.event_timestamp) as from_screen,
                    screen.screenName as to_screen,
                    screen.event_timestamp
                FROM user_sessions,
                UNNEST(screen_sequence) as screen
            ),
            transition_analysis AS (
                SELECT 
                    from_screen,
                    to_screen,
                    COUNT(*) as transition_count,
                    -- Detect backward transitions using predefined stage order
                    CASE 
                        WHEN from_screen = 'dy-quiz/1' AND to_screen = 'welcome' THEN true
                        WHEN from_screen = 'dy-quiz/2' AND to_screen IN ('welcome', 'dy-quiz/1') THEN true  
                        WHEN from_screen = 'step/1' AND to_screen IN ('welcome', 'dy-quiz/1', 'dy-quiz/2') THEN true
                        WHEN from_screen = 'step/2' AND to_screen IN ('welcome', 'dy-quiz/1', 'dy-quiz/2', 'step/1') THEN true
                        WHEN from_screen = 'step/3' AND to_screen IN ('welcome', 'dy-quiz/1', 'dy-quiz/2', 'step/1', 'step/2') THEN true
                        WHEN from_screen = 'job-suggestions/1' AND to_screen IN ('welcome', 'dy-quiz/1', 'dy-quiz/2', 'step/1', 'step/2', 'step/3') THEN true
                        WHEN from_screen = 'job-suggestions/2' AND to_screen IN ('welcome', 'dy-quiz/1', 'dy-quiz/2', 'step/1', 'step/2', 'step/3', 'job-suggestions/1') THEN true
                        WHEN from_screen = 'outro' AND to_screen != 'outro' THEN true
                        ELSE false
                    END as is_backward
                FROM screen_transitions
                WHERE from_screen IS NOT NULL
                GROUP BY from_screen, to_screen
            )
            SELECT 
                from_screen,
                to_screen,
                transition_count,
                is_backward,
                ROUND(100.0 * transition_count / SUM(transition_count) OVER (), 2) as percentage
            FROM transition_analysis
            ORDER BY transition_count DESC";
    }

    public static string BuildUserSessionsQuery(BigQueryConfig config, DateTime startDate, DateTime endDate, FilterCriteria? filters = null)
    {
        var eventsQuery = BuildEventsQuery(config, startDate, endDate, filters);

        return $@"
            WITH session_events AS (
                {eventsQuery}
            ),
            session_aggregates AS (
                SELECT 
                    sessionId,
                    userId,
                    userEmail,
                    MIN(event_timestamp) as session_start,
                    MAX(event_timestamp) as session_end,
                    TIMESTAMP_DIFF(MAX(event_timestamp), MIN(event_timestamp), SECOND) as duration_seconds,
                    COUNT(*) as event_count,
                    ARRAY_AGG(DISTINCT screenName IGNORE NULLS) as screens_viewed,
                    COUNT(DISTINCT screenName) as unique_screens,
                    COUNTIF(event_name = 'aifp_screen_view') as screen_views,
                    COUNTIF(event_name = 'aifp_complete_onboarding') > 0 as completed,
                    ANY_VALUE(country) as country,
                    ANY_VALUE(region) as region,
                    ANY_VALUE(city) as city,
                    ANY_VALUE(deviceInfo) as device_info
                FROM session_events
                GROUP BY sessionId, userId, userEmail
            )
            SELECT 
                sessionId,
                userId,
                userEmail,
                session_start,
                session_end,
                duration_seconds,
                event_count,
                screens_viewed,
                unique_screens,
                screen_views,
                completed,
                country,
                region,
                city,
                device_info
            FROM session_aggregates
            WHERE duration_seconds > 0  -- Filter out invalid sessions
            ORDER BY session_start DESC";
    }

    public static string BuildUserJourneyQuery(BigQueryConfig config, string userIdentifier)
    {
        var whereClause = userIdentifier.Contains("@") 
            ? $"userEmail = '{userIdentifier}'" 
            : $"userId = '{userIdentifier}'";

        return $@"
            WITH user_events AS (
                SELECT *
                FROM `{config.ProjectId}.{config.DatasetId}.events_*`
                WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY))
                  AND event_name IN ('aifp_screen_view', 'aifp_exit_onboarding', 'aifp_complete_onboarding')
                UNION ALL
                SELECT *
                FROM `{config.ProjectId}.{config.DatasetId}.events_intraday_*`
                WHERE _TABLE_SUFFIX = FORMAT_DATE('%Y%m%d', CURRENT_DATE())
                  AND event_name IN ('aifp_screen_view', 'aifp_exit_onboarding', 'aifp_complete_onboarding')
            ),
            flattened_user_events AS (
                SELECT
                    TIMESTAMP_MICROS(e.event_timestamp) AS event_timestamp,
                    e.event_name,
                    (SELECT p.value.string_value FROM UNNEST(e.event_params) AS p WHERE p.key = 'sessionId') AS sessionId,
                    (SELECT p.value.string_value FROM UNNEST(e.event_params) AS p WHERE p.key = 'userId') AS userId,
                    (SELECT p.value.string_value FROM UNNEST(e.event_params) AS p WHERE p.key = 'userEmail') AS userEmail,
                    (SELECT p.value.string_value FROM UNNEST(e.event_params) AS p WHERE p.key = 'screenName') AS screenName
                FROM user_events AS e
                WHERE ({whereClause.Replace("'", "")})
            )
            SELECT *
            FROM flattened_user_events
            ORDER BY event_timestamp ASC";
    }
}