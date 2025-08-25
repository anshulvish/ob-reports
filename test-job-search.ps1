# PowerShell script to test Job Search Exposure API

$url = "https://localhost:64547/api/engagement/job-search-exposure"
$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    startDate = "2025-08-20"
    endDate = "2025-08-25"
} | ConvertTo-Json

Write-Host "Testing Job Search Exposure API..."
Write-Host "URL: $url"
Write-Host "Body: $body"

try {
    # Skip certificate validation for localhost
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
    
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body
    
    Write-Host "`n=== API RESPONSE ==="
    $response | ConvertTo-Json -Depth 10
    
    Write-Host "`n=== ANALYSIS SUMMARY ==="
    if ($response.analysis) {
        foreach ($item in $response.analysis) {
            Write-Host "`nEndpoint/Path: $($item.endpoint) / $($item.path)"
            Write-Host "Total Responses: $($item.total_responses)"
            Write-Host "Unique Users: $($item.unique_users)"
            Write-Host "Is Step 4 Submit: $($item.is_step_4_submit)"
            Write-Host "Contains 'searchresult': $($item.contains_searchresult)"
            Write-Host "Contains 'job': $($item.contains_job)"
            Write-Host "Response Sample: $($item.response_sample)"
            Write-Host ("-" * 50)
        }
    }
}
catch {
    Write-Host "`nError occurred: $($_.Exception.Message)"
    Write-Host "Response: $($_.Exception.Response)"
}