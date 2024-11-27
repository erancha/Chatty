param (
    [bool]$skipBuild,
    [bool]$deleteStack,
    [bool]$deployFrontend
)

$scriptName = Split-Path -Leaf $PSCommandPath

. ./get-ElapsedTimeFormatted.ps1
$startTime = Get-Date
$formattedElapsedTime = Get-ElapsedTimeFormatted -startTime $startTime
Write-Host "`n$(Get-Date -Format 'HH:mm:ss'), elapsed $formattedElapsedTime : $scriptName ..." -ForegroundColor White -BackgroundColor DarkBlue

if (-not $skipBuild) {
    ../dev-build-deploy.ps1
}

if ($deleteStack) {
    $validInput = $false
    while (-not $validInput) {
        $formattedElapsedTime = Get-ElapsedTimeFormatted -startTime $startTime
        $message = "`n$(Get-Date -Format 'HH:mm:ss'), elapsed $formattedElapsedTime : Stack deployed. Continue to [d]elete the Stack or E[x]it ?"
        Write-Host $message  -ForegroundColor White -BackgroundColor DarkGray
        $userInput = Read-Host ">"
        $formattedElapsedTime = Get-ElapsedTimeFormatted -startTime $startTime

        if ($userInput -eq 'x' -or $userInput -eq 'X' -or $userInput -eq 'q' -or $userInput -eq 'Q') {
            Write-Host "$(Get-Date -Format 'HH:mm:ss'), elapsed $formattedElapsedTime : Exiting the script."
            $validInput = $true
        }
        elseif ($userInput -eq 'd' -or $userInput -eq 'D') {
            Write-Host "$(Get-Date -Format 'HH:mm:ss'), elapsed $formattedElapsedTime : Continuing to delete the stack..."
            $deleteStack = $true
            $validInput = $true
        }
        else {
            Write-Host "Invalid input. Please enter 'd' or 'x'."
        }
    }
}

$commonConstants = ./constants.ps1

if ($deleteStack) {
    $formattedElapsedTime = Get-ElapsedTimeFormatted -startTime $startTime
    Write-Host "`n$(Get-Date -Format 'HH:mm:ss'), elapsed $formattedElapsedTime : Deleting stack '$($commonConstants.stackName)' ..."
    aws cloudformation delete-stack --stack-name $commonConstants.stackName --region $commonConstants.region
    aws cloudformation wait stack-delete-complete --stack-name $commonConstants.stackName --region $commonConstants.region
}

./list-all-non-default-resources.ps1 -region $commonConstants.region | Select-String "$($commonConstants.stackName)"

if ($deployFrontend) {
    ./deploy-frontend-distribution.ps1
}

$formattedElapsedTime = Get-ElapsedTimeFormatted -startTime $startTime
Write-Host "`n$(Get-Date -Format 'HH:mm:ss'), elapsed $formattedElapsedTime : Completed $scriptName." -ForegroundColor Blue