param(
  [string]$InputPath = 'C:\Users\78630\.codex\sessions\2026\08\23\rollout-2026-08-23T16-38-48-01a02dc5-b9bf-72d3-bba4-02727dbe08b4.jsonl',
  [string]$OutputPath = '',
  [int]$IntervalMs = 1000
)

$node = (Get-Command node -ErrorAction Stop).Source
$scriptPath = Join-Path $PSScriptRoot 'rollout_backup.mjs'
$outputDirectory = Join-Path $PSScriptRoot 'session_backups'
if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  $baseName = [System.IO.Path]::GetFileNameWithoutExtension($InputPath)
  $OutputPath = Join-Path $outputDirectory ($baseName + '.md')
}
$arguments = @($scriptPath, '--input', $InputPath, '--output', $OutputPath, '--watch', '--interval', $IntervalMs)
$process = Start-Process -FilePath $node -ArgumentList $arguments -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -PassThru

[PSCustomObject]@{
  ProcessId = $process.Id
  InputPath = $InputPath
  OutputPath = $OutputPath
  OutputDirectory = $outputDirectory
  Status = 'watching'
} | Format-List
