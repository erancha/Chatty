	$frontendFolder = Join-Path -Path $PSScriptRoot -ChildPath "../../frontend"
	Set-Location $frontendFolder
	npm install
	npm start