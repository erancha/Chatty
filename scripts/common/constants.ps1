$originalLocation = Get-Location
try {
    Set-Location $PSScriptRoot

    $currentBranch = git rev-parse --abbrev-ref HEAD
    $isMainBranch = $currentBranch -eq 'main'

    $appName = ../get-app-name.ps1
    if ($isMainBranch) {
        $stackName = $appName
    }
    else {
        $stackName = "${appName}-f1"
    }

    $appFolder = "$PSScriptRoot/../.."
    return @{
        isMainBranch            = $isMainBranch
        stackName               = $stackName
        configFilePath          = "${appFolder}/frontend/public/appConfig.json"
        lastDevConfigFilePath   = "${appFolder}/frontend/appConfigDev.json"
        region                  = aws configure get region # "eu-west-1"
    }
}
finally {
    Set-Location $originalLocation
}