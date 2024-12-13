$commonConstants = . ../constants.ps1

# Set the threshold time to 5 minutes ago
$thresholdTime = (Get-Date).AddMinutes(-5).ToUniversalTime()

# Get all CloudWatch log groups
Write-Host "Fetching log groups from region: $($commonConstants.region)"
$logGroupsJson = aws logs describe-log-groups --region $commonConstants.region

# Check if the command succeeded and has output
if ($logGroupsJson) {
    $logGroups = $logGroupsJson | ConvertFrom-Json

    if ($logGroups.logGroups.Count -gt 0) {
        foreach ($logGroup in $logGroups.logGroups) {
            # Get all log streams in the log group
            $logStreamsJson = aws logs describe-log-streams --log-group-name $logGroup.logGroupName --region $commonConstants.region
            $logStreams = $logStreamsJson | ConvertFrom-Json

            if ($logStreams.logStreams.Count -gt 0) {
                foreach ($logStream in $logStreams.logStreams) {
                    # Convert lastIngestionTime from milliseconds to DateTime
                    $lastIngestionTime = [System.DateTime]::FromFileTimeUtc($logStream.lastIngestionTime * 10000 + 116444736000000000)

                    # Check if the log stream is older than 5 minutes
                    if ($lastIngestionTime -lt $thresholdTime) {
                        # Delete the log stream
                        Write-Output "Deleting log stream: $($logStream.logStreamName) from log group: $($logGroup.logGroupName)"
                        aws logs delete-log-stream --log-group-name $logGroup.logGroupName --log-stream-name $logStream.logStreamName --region $commonConstants.region
                    }
                }

                # Check if there are any log streams left in the log group
                $remainingLogStreamsJson = aws logs describe-log-streams --log-group-name $logGroup.logGroupName --region $commonConstants.region
                $remainingLogStreams = $remainingLogStreamsJson | ConvertFrom-Json

                if ($remainingLogStreams.logStreams.Count -eq 0) {
                    # Delete the log group if no log streams remain
                    Write-Output "Deleting log group: $($logGroup.logGroupName) as it has no remaining log streams."
                    aws logs delete-log-group --log-group-name $logGroup.logGroupName --region $commonConstants.region
                }
            } else {
                Write-Host "No log streams found in log group $($logGroup.logGroupName). Deleting the log group."
                aws logs delete-log-group --log-group-name $logGroup.logGroupName --region $commonConstants.region
            }
        }
    } else {
        Write-Host "No log groups found in the specified region."
    }
} else {
    Write-Host "Failed to retrieve log groups. Please check your AWS CLI configuration and permissions."
}
