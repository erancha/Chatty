$originalLocation = Get-Location
try {
    Set-Location $PSScriptRoot
    $scriptName = Split-Path -Leaf $PSCommandPath

    . ./common/get-ElapsedTimeFormatted.ps1
    $startTime = Get-Date
    $formattedElapsedTime = Get-ElapsedTimeFormatted -startTime $startTime
    Write-Host "`n$(Get-Date -Format 'HH:mm:ss'), elapsed $formattedElapsedTime : $scriptName ..." -ForegroundColor White -BackgroundColor DarkBlue

    $commonConstants = ./common/constants.ps1
    Set-Variable -Name 'TEMPLATE_FILE' -Value "$PSScriptRoot/template.yaml" -Option Constant 

    $formattedElapsedTime = Get-ElapsedTimeFormatted -startTime $startTime
    Write-Host "`n$(Get-Date -Format 'HH:mm:ss'), elapsed $formattedElapsedTime : Validating the cloudformation template .."
    sam validate --template-file $TEMPLATE_FILE --lint # | ForEach-Object { $_ -split ',' } | ForEach-Object { $_.Trim() }
    if ($LASTEXITCODE -eq 0) {
        $skipFixedLambdaLayers = $true
        $formattedElapsedTime = Get-ElapsedTimeFormatted -startTime $startTime
        if ($skipFixedLambdaLayers) {
            Write-Host "`n$(Get-Date -Format 'HH:mm:ss'), elapsed $formattedElapsedTime : Skipping awssdkv3, jsonwebtoken and ioredis !" -ForegroundColor Yellow -BackgroundColor DarkGreen
        } else {
            Write-Host "`n$(Get-Date -Format 'HH:mm:ss'), elapsed $formattedElapsedTime : Preparing lambda layers .."
            $appFolder = (Split-Path $PSScriptRoot -Parent)
            $folderBeforeLayers = Get-Location

            Set-Location "${appFolder}/backend/layers/awssdkv3/nodejs/"
            npm install
            Set-Location ..
            Compress-Archive -Update -Path * -DestinationPath ../awssdkv3-layer.zip

            Set-Location "${appFolder}/backend/layers/jsonwebtoken/nodejs/"
            npm install
            Set-Location ..
            Compress-Archive -Update -Path * -DestinationPath ../jsonwebtoken-layer.zip

            Set-Location "${appFolder}/backend/layers/ioredis/nodejs/"
            npm install
            Set-Location ..
            Compress-Archive -Update -Path * -DestinationPath ../ioredis-layer.zip

            Set-Location $folderBeforeLayers
        }

        $formattedElapsedTime = Get-ElapsedTimeFormatted -startTime $startTime
        Write-Host "`n$(Get-Date -Format 'HH:mm:ss'), elapsed $formattedElapsedTime : sam build --template-file $TEMPLATE_FILE ..`n"
        sam build --template-file $TEMPLATE_FILE # > $null
        if ($LASTEXITCODE -eq 0) {
            $formattedElapsedTime = Get-ElapsedTimeFormatted -startTime $startTime
            Write-Host "`n$(Get-Date -Format 'HH:mm:ss'), elapsed $formattedElapsedTime : Build completed. Deploying .."

            # Build the parameter overrides string dynamically
            $parameterOverrides = @(
                "S3PublicAccess=true",
                "ExistingUserPoolId='eu-central-1_OHq1aZYju'",
                "ExistingCognitoDomain='ena-575491442067.auth.eu-central-1.amazoncognito.com'",
                "ExistingIdentityPoolId='eu-central-1:e9f848f2-a3ed-43f9-8ddb-833ca34233ba'",
                "ExistingElasticacheRedisClusterAddress='en-elasticache-redis-cluster.hz2zez.0001.euc1.cache.amazonaws.com:6379'",
                "ExistingVpcId='vpc-08016eb77e7ac9962'",
                "ExistingPrivateSubnetId='subnet-00a1db5158e0a7992'",
                "ExistingMessagesTableStreamArn='arn:aws:dynamodb:eu-central-1:575491442067:table/cht-messages/stream/2024-12-03T15:56:33.705'",
                "ExistingMessagesTableName='cht-messages'"

                $formattedElapsedTime = Get-ElapsedTimeFormatted -startTime $startTime
                Write-Host "`n$(Get-Date -Format 'HH:mm:ss'), elapsed $formattedElapsedTime : Remember to add/remove !!!!!!!!!!!SG as an inbound rule to !!!!!MyElasticacheRedisSG !" -BackgroundColor DarkMagenta
            )

            if ($commonConstants.isMainBranch) {
                $parameterOverrides += "StageName='prod'"
                $parameterOverrides += "AllowOnlyCloudfrontOrigin=true"
            }
            else {
                # In feature branch, reuse the following resources from the main branch:
                # $parameterOverrides += "ExistingMessagesTableName='cht-messages'"
            }

            # Join the parameter overrides into a single string
            $parameterOverridesString = $parameterOverrides -join " "

            $formattedElapsedTime = Get-ElapsedTimeFormatted -startTime $startTime
            Write-Host "`n$(Get-Date -Format 'HH:mm:ss'), elapsed $formattedElapsedTime : Starting a deployment, stack '$($commonConstants.stackName)' .."
            sam deploy --region $commonConstants.region --template-file $TEMPLATE_FILE --stack-name $commonConstants.stackName `
                --capabilities CAPABILITY_IAM `
                --fail-on-empty-changeset false `
                --resolve-s3 `
                --parameter-overrides $parameterOverridesString
            $formattedElapsedTime = Get-ElapsedTimeFormatted -startTime $startTime
            if (($LASTEXITCODE -ne 0) -and ($LASTEXITCODE -ne 1)) {
                Write-Host "`n$(Get-Date -Format 'HH:mm:ss'), elapsed $formattedElapsedTime : Deployment failed with exit code ${LASTEXITCODE}."
            }
            else {
                if ($LASTEXITCODE -eq 1) {
                    Write-Host "`n$(Get-Date -Format 'HH:mm:ss'), elapsed $formattedElapsedTime : Deployment completed with no changes to deploy. Stack '$($commonConstants.stackName)' is up to date."
                    ./common/update-app-config-dev.ps1
                }
                else {
                    Write-Host "`n$(Get-Date -Format 'HH:mm:ss'), elapsed $formattedElapsedTime : Deployment completed successfully." -ForegroundColor Green
                    ./common/update-app-config-dev.ps1
                    # ./common/utils/delete-lambda-layers.ps1
                }
            }
        }
        else {
            $formattedElapsedTime = Get-ElapsedTimeFormatted -startTime $startTime
            Write-Host "`n$(Get-Date -Format 'HH:mm:ss'), elapsed $formattedElapsedTime : SAM build failed."
        }
    }

    $formattedElapsedTime = Get-ElapsedTimeFormatted -startTime $startTime
    Write-Host "`n$(Get-Date -Format 'HH:mm:ss'), elapsed $formattedElapsedTime : Completed $scriptName." -ForegroundColor Blue

    # Write-Host "`n$(Get-Date -Format 'HH:mm:ss'), elapsed $formattedElapsedTime : Testing all HTTP requests deployed by the stack ..."
    # ./test-web-api.ps1 # -parallelCount 5 -iterationsCount 10
}
finally {
    Set-Location $originalLocation
}