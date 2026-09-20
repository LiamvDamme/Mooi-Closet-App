$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$closetNode = Get-Command node -ErrorAction SilentlyContinue
if ($closetNode) { $closetRuntime = $closetNode.Source } else { $closetRuntime = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' }
if (!(Test-Path -LiteralPath $closetRuntime)) { throw 'Install Node.js 22 or newer, then run this file again.' }
& $closetRuntime server.js
