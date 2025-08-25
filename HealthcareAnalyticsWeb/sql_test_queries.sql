-- Test queries to validate SQL syntax fixes

-- 1. EngagementController - GetEngagementMetrics query structure
WITH user_engagement AS (
    SELECT 
        user_pseudo_id,
        COUNT(DISTINCT CASE WHEN event_name = 'session_start' THEN 
            (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') 
        END) as session_count,
        COUNT(*) as total_events,
        COUNT(DISTINCT event_name) as unique_events,
        MIN(event_timestamp) as first_event_timestamp,
        MAX(event_timestamp) as last_event_timestamp,
        COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN 
            (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location')
        END) as unique_pages_viewed,
        AVG(CASE WHEN event_name = 'page_view' THEN 
            (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'engagement_time_msec')
        END) as avg_engagement_time_msec,
        COUNT(CASE WHEN event_name = 'aifp_screen_view' THEN 1 END) as screen_views,
        COUNT(CASE WHEN event_name LIKE 'aifp_%' AND event_name != 'aifp_screen_view' THEN 1 END) as aifp_interactions
    FROM `project.dataset.events_20250818`
    WHERE user_pseudo_id IS NOT NULL AND event_name IS NOT NULL
    GROUP BY user_pseudo_id  -- ✅ FIXED: Added GROUP BY for non-aggregated columns
),
engagement_metrics AS (
    SELECT
        COUNT(*) as total_users,
        AVG(session_count) as avg_sessions_per_user,
        AVG(total_events) as avg_events_per_user,
        AVG(unique_events) as avg_unique_events_per_user,
        AVG(unique_pages_viewed) as avg_pages_per_user,
        AVG((last_event_timestamp - first_event_timestamp) / 1000000) as avg_session_duration_seconds,
        AVG(avg_engagement_time_msec / 1000) as avg_engagement_time_seconds,
        AVG(screen_views) as avg_screen_views_per_user,
        AVG(aifp_interactions) as avg_aifp_interactions_per_user
    FROM user_engagement
)
SELECT 'engagement_metrics_test' as test_type, * FROM engagement_metrics;

-- 2. AnalyticsController - BuildEngagementQuery structure  
WITH user_events AS (
    SELECT 
        user_pseudo_id,
        event_name,
        event_timestamp,
        COUNT(*) as event_count,
        MIN(event_timestamp) as first_event,
        MAX(event_timestamp) as last_event
    FROM `project.dataset.events_20250818`
    WHERE event_name IS NOT NULL
    GROUP BY user_pseudo_id, event_name, event_timestamp  -- ✅ FIXED: Added GROUP BY for all non-aggregated columns
)
SELECT 
    user_pseudo_id,
    event_name,
    SUM(event_count) as total_events,
    MIN(first_event) as first_event_time,
    MAX(last_event) as last_event_time
FROM user_events
GROUP BY user_pseudo_id, event_name
LIMIT 100;

-- 3. UserSessions query structure
WITH user_sessions AS (
    SELECT 
        user_pseudo_id,
        (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') as session_id,
        MIN(event_timestamp) as session_start,
        MAX(event_timestamp) as session_end,
        COUNT(*) as event_count,
        COUNT(DISTINCT event_name) as unique_events,
        COUNT(CASE WHEN event_name = 'page_view' THEN 1 END) as page_views,
        COUNT(CASE WHEN event_name = 'aifp_screen_view' THEN 1 END) as screen_views
    FROM `project.dataset.events_20250818`
    WHERE user_pseudo_id IS NOT NULL 
        AND (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') IS NOT NULL
    GROUP BY user_pseudo_id, session_id  -- ✅ FIXED: Added GROUP BY for session grouping
    HAVING session_id IS NOT NULL
)
SELECT 
    user_pseudo_id,
    session_id,
    session_start,
    session_end,
    (session_end - session_start) / 1000000 as session_duration_seconds,
    event_count,
    unique_events,
    page_views,
    screen_views,
    CASE 
        WHEN event_count >= 20 THEN 'High'
        WHEN event_count >= 5 THEN 'Medium'
        ELSE 'Low'
    END as engagement_level
FROM user_sessions
ORDER BY session_start DESC
LIMIT 100;