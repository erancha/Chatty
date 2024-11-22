$scriptName = Split-Path -Leaf $PSCommandPath
Write-Host " $scriptName ..." -ForegroundColor White -BackgroundColor DarkBlue

. ./get-ElapsedTimeFormatted.ps1
$startTime = Get-Date

$region = aws configure get region

# Retrieve all Lambda layers in the specified region
Write-Host "Collecting layers in region: $region"
$layers = aws lambda list-layers --region $region --query 'Layers[*].LayerName' --output json | ConvertFrom-Json

foreach ($layerName in $layers) {
    Write-Host "`nProcessing layer: $layerName"

    # Retrieve versions for the current layer
    $versions = aws lambda list-layer-versions --layer-name $layerName --region $region --query 'LayerVersions[*].Version' --output json | ConvertFrom-Json
    $latestVersion = $versions[0]

    foreach ($version in $versions) {
        if ($version -ne $latestVersion) {
            Write-Host "Deleting $layerName version $version" -ForegroundColor Magenta
            aws lambda delete-layer-version --layer-name $layerName --version-number $version --region $region
        }
        else {
            Write-Host "Skipping latest version: $version" -ForegroundColor Green
        }
    }
}

$formattedElapsedTime = Get-ElapsedTimeFormatted -startTime $startTime
Write-Host "`n$(Get-Date -Format 'HH:mm:ss'), elapsed $formattedElapsedTime : Completed $scriptName." -ForegroundColor Blue
