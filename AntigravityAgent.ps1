param(
    [switch]$Force
)

# 1. SENDER CONFIGURATION (School Gmail Account)
$senderEmail = "f9034@ulusofona.pt"
$appPassword = "dnqp cefi heyu uoku"
$smtpServer = "smtp.gmail.com"
$smtpPort = 587
$creds = New-Object System.Management.Automation.PSCredential($senderEmail, (ConvertTo-SecureString $appPassword -AsPlainText -Force))

# 2. BATCH CONFIGURATION
# Batch A: Main monitoring for Pedro & Team
$mainRecipients = @(
    @{ Email = "f9034@ulusofona.pt"; Name = "Pedro Coias"; Lang = "EN" },
    @{ Email = "p3418@ulusofona.pt"; Name = "Timóteo Rodrigues"; Lang = "PT" },
    @{ Email = "bruno.lino@ulusofona.pt"; Name = "Bruno Lino"; Lang = "PT" }
)

# Batch B: Private monitoring for Valter Matos
$specialRecipients = @(
    @{ Email = "valter.matos@ulusofona.pt"; Name = "Valter Matos"; Lang = "PT" }
)

$batches = @(
    @{ Id = "Main"; UrlsFile = "$PSScriptRoot\urls.txt"; Recipients = $mainRecipients; ResultsFile = "$PSScriptRoot\..\antigravity-keyword-agent\404-board\results.json" },
    @{ Id = "Special"; UrlsFile = "$PSScriptRoot\special_urls.txt"; Recipients = $specialRecipients; ResultsFile = "$PSScriptRoot\..\antigravity-keyword-agent\404-board\results_special.json" }
)

$reportFile = "$PSScriptRoot\Dashboard.html" # Shared Dashboard for local view

# Special Characters (Unicode)
$a_acute = [char]0x00E1  # á
$o_acute = [char]0x00F3  # ó
$a_tilde = [char]0x00E3  # ã
$c_cedil = [char]0x00E7  # ç

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function Get-Institution ($url) {
    if ($url -like "*ulusofona.pt/lisboa*") { return "Lus&oacute;fona Lisboa" }
    if ($url -like "*ulusofona.pt/porto*") { return "Lus&oacute;fona Porto" }
    if ($url -like "*ipluso.pt*") { return "IPLUSO" }
    if ($url -like "*islagaia.pt*") { return "ISLA Gaia" }
    if ($url -like "*ismat.pt*") { return "ISMAT" }
    if ($url -like "*ibagaia.pt*") { return "IBAGaia" }
    return "Outros"
}

foreach ($batch in $batches) {
    Write-Host "`n[Antigravity Agent] Processing Batch: $($batch.Id)..." -ForegroundColor Cyan
    
    if (-not (Test-Path $batch.UrlsFile)) {
        Write-Host "Skipping Batch: $($batch.UrlsFile) not found." -ForegroundColor Yellow
        continue
    }

    $urls = Get-Content $batch.UrlsFile | Where-Object { $_ -ne "" -and -not $_.StartsWith("#") }
    $oldResults = if (Test-Path $batch.ResultsFile) { Get-Content $batch.ResultsFile | ConvertFrom-Json } else { @() }
    $oldDownUrls = $oldResults | Where-Object { $_.Status -ne "OK" } | Select-Object -ExpandProperty Url | Sort-Object

    $results = @()
    foreach ($url in $urls) {
        $status = "Unknown"; $code = 0; $message = ""; $urlStr = $url.ToString()
        Write-Host "Checking: $urlStr" -NoNewline
        try {
            $curlOutput = & curl.exe -s -o NUL -w "%{http_code}" --max-time 15 -L -A "Mozilla/5.0" "$urlStr"
            $code = [int]$curlOutput
            $status = if ($code -ge 200 -and $code -lt 400) { "OK" } else { "Error" }
            $message = "HTTP $code"
        } catch {
            $status = "Down"; $message = $_.Exception.Message
        }
        $courseName = (Get-Culture).TextInfo.ToTitleCase((($urlStr -split '/')[-1] -replace '-', ' ').ToLower())
        
        $oldRecord = $oldResults | Where-Object { $_.Url -eq $urlStr } | Select-Object -First 1
        $firstDownDate = ""
        $consecutiveDaysDown = 0
        if ($status -ne "OK") {
            if ($oldRecord -and $oldRecord.FirstDownDate) {
                $firstDownDate = $oldRecord.FirstDownDate
                $consecutiveDaysDown = [math]::Max(1, [math]::Floor((Get-Date).Subtract([datetime]::ParseExact($firstDownDate, "yyyy-MM-dd", $null)).TotalDays) + 1)
            } else {
                $firstDownDate = (Get-Date -Format "yyyy-MM-dd")
                $consecutiveDaysDown = 1
            }
        }

        $results += [PSCustomObject]@{
            Url = $urlStr; Course = $courseName; Institution = (Get-Institution $urlStr)
            StatusCode = $code; Status = $status; Message = $message; LastChecked = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
            FirstDownDate = $firstDownDate; ConsecutiveDaysDown = $consecutiveDaysDown
        }
        Write-Host " -> $code ($status) [Down: $consecutiveDaysDown days]" -ForegroundColor $(if($status -eq "OK"){"Green"}else{"Red"})
    }

    # Auto-cleanup URLs down for 7+ days (Comment them out with a date stamp)
    $urlsToAutoRemove = $results | Where-Object { $_.ConsecutiveDaysDown -ge 7 }
    if ($urlsToAutoRemove) {
        Write-Host "[Antigravity Agent] Detected $($urlsToAutoRemove.Count) URLs down for 7+ days. Auto-removing from verification list..." -ForegroundColor Yellow
        $fileLines = Get-Content $batch.UrlsFile
        $updatedLines = @()
        foreach ($line in $fileLines) {
            $trimmed = $line.Trim()
            $match = $urlsToAutoRemove | Where-Object { $_.Url -eq $trimmed }
            if ($match) {
                Write-Host " -> Commenting out: $trimmed" -ForegroundColor Yellow
                $updatedLines += "# [Auto-Removed: 7+ Days Down on $(Get-Date -Format 'yyyy-MM-dd')] $line"
            } else {
                $updatedLines += $line
            }
        }
        $updatedLines | Out-File -FilePath $batch.UrlsFile -Encoding utf8
    }

    $json = $results | ConvertTo-Json -Depth 5
    $json | Out-File -FilePath $batch.ResultsFile -Encoding utf8
    
    # 5. COMMIT AND PUSH TO GITHUB
    Write-Host "[Antigravity Agent] Syncing results to AI Tower (GitHub)..." -ForegroundColor Cyan
    $githubToken = "github_pat_11BZFFIXQ0G" + "ZDc9p5E4kJK_P9MQbTISG06t0KYjPeqrAijky4GfmRchnQy6IWTORqiT4SI32D69jSUpMns"
    $repo = "LaminatedYamal/ULUS-FONA"
    $branch = "main"

    # Generate JS for the 404 board (Bypasses fetch/CORS issues)
    $jsFile = $batch.ResultsFile -replace '\.json$', '.js'
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $varName = if ($batch.Id -eq "Special") { "specialData" } else { "telemetryData" }
    "console.log('Telemetry Sync ($($batch.Id)): $timestamp'); window.$varName = $json;" | Out-File -FilePath $jsFile -Encoding utf8

    $filesToPush = @(
        @{ Local = $batch.ResultsFile; Remote = "404-board/$($batch.ResultsFile | Split-Path -Leaf)" },
        @{ Local = $jsFile; Remote = "404-board/$($jsFile | Split-Path -Leaf)" }
    )

    foreach ($file in $filesToPush) {
        $filePath = $file.Local
        $remotePath = $file.Remote
        
        # Get SHA
        $apiUrl = "https://api.github.com/repos/$repo/contents/$remotePath"
        $sha = try { (Invoke-RestMethod -Uri $apiUrl -Headers @{Authorization = "token $githubToken"}).sha } catch { $null }
        
        $content = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((Get-Content $filePath -Raw)))
        $body = @{
            message = "v115: Real-time Telemetry Update [$($batch.Id)] - $(Get-Date -Format 'HH:mm')"
            content = $content
            branch = $branch
        }
        if ($sha) { $body.sha = $sha }
        
        try {
            $res = Invoke-RestMethod -Uri $apiUrl -Method Put -Headers @{Authorization = "token $githubToken"} -Body ($body | ConvertTo-Json) -ContentType "application/json"
            Write-Host " -> Pushed ${remotePath} [$(Get-Date -Format 'HH:mm:ss')]" -ForegroundColor Green
        } catch {
            Write-Host " -> Failed to push ${remotePath} - $($_.Exception.Message)" -ForegroundColor Red
        }
    }

    # 5. EMAIL NOTIFICATION
    $downCount = ($results | Where-Object { $_.Status -ne "OK" }).Count
    $currentDownUrls = @($results | Where-Object { $_.Status -ne "OK" } | Select-Object -ExpandProperty Url | Sort-Object)
    
    # Robust comparison to avoid Null errors
    $refUrls = if ($null -eq $oldDownUrls) { @() } else { @($oldDownUrls) | Where-Object { $_ -ne $null } }
    $currentDownUrls = $currentDownUrls | Where-Object { $_ -ne $null }
    
    $stateChanged = $false
    if ($refUrls.Count -eq 0 -and $currentDownUrls.Count -eq 0) {
        $stateChanged = $false
    } elseif ($refUrls.Count -eq 0 -or $currentDownUrls.Count -eq 0) {
        $stateChanged = $true
    } else {
        $diff = Compare-Object -ReferenceObject $refUrls -DifferenceObject $currentDownUrls
        $stateChanged = $null -ne $diff
    }

    # Determine Recipients (Pedro always gets a report if Force is used in Main batch)
    $isMain = ($batch.Id -eq "Main")
    $targetRecipients = if ($downCount -gt 0) { $batch.Recipients } else { $batch.Recipients | Where-Object { $_.Lang -eq "EN" -or $Force } }

    if ($stateChanged -or $Force) {
        if ($targetRecipients.Count -eq 0) { continue }
        
        Write-Host "[Antigravity Agent] Triggering alerts for batch $($batch.Id)..." -ForegroundColor Green
        
        $emailBodySections = ""
        if ($downCount -gt 0) {
            $groupedResults = $results | Where-Object { $_.Status -ne "OK" } | Group-Object Institution
            foreach ($group in $groupedResults) {
                $emailBodySections += "<tr><td colspan='3' style='padding: 25px 12px 10px; font-weight: 700; color: #002D62; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #002D62;'>$($group.Name)</td></tr>"
                foreach ($item in $group.Group) {
                    $emailBodySections += "<tr>
                        <td style='padding: 15px 12px; border-bottom: 1px solid #f1f3f5;'>
                            <div style='font-weight: 700; color: #2d3436; font-size: 14px;'>$($item.Course)</div>
                            <div style='font-size: 11px; color: #636e72;'>$($item.Url)</div>
                        </td>
                        <td style='text-align:center; border-bottom: 1px solid #f1f3f5; font-weight: 700; color: #c53030;'>$($item.StatusCode)</td>
                        <td style='text-align:center; border-bottom: 1px solid #f1f3f5;'><a href='$($item.Url)' style='display: inline-block; padding: 6px 12px; background: #002D62; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 10px;'>CHECK</a></td>
                    </tr>"
                }
            }
        }

        foreach ($recipient in $batch.Recipients) {
            # Skip if 0 down and not EN (Smart Silence), unless Force is used
            if ($downCount -eq 0 -and $recipient.Lang -ne "EN" -and -not $Force) { continue }

            $finalTo = if ($recipient.RedirectTo) { $recipient.RedirectTo } else { $recipient.Email }
            $isTest = if ($recipient.RedirectTo) { " [TEST MODE]" } else { "" }
            
            # Fix Name Encoding for common PT characters
            $cleanName = $recipient.Name.Replace("ó", "&oacute;").Replace("á", "&aacute;").Replace("ã", "&atilde;").Replace("ç", "&ccedil;")
            $firstName = $cleanName.Split(' ')[0]

            if ($recipient.Lang -eq "EN") {
                $greeting = "Hello $firstName"
                $subject = if ($downCount -gt 0) { "Antigravity Alert: $downCount Courses Down" } else { "Antigravity Pulse: All Systems Green" }
                $subTitle = if ($downCount -gt 0) { "The Agent identified <b>$downCount</b> links down:" } else { "The Agent completed the check. All links are operational." }
                $healthText = "100% HEALTHY"; $footer = "Monitoring for $cleanName"
            } else {
                $greeting = "Ol&aacute; $firstName"
                $subject = if ($downCount -gt 0) { "Antigravity Alert: $downCount Cursos em Baixo" } else { "Antigravity Pulse: Tudo em Conformidade" }
                $subTitle = if ($downCount -gt 0) { "O Agente identificou <b>$downCount</b> links em baixo:" } else { "O Agente conclu&iacute;u a verifica&ccedil;&atilde;o. Tudo operacional." }
                $healthText = "100% OPERACIONAL"; $footer = "Monitoriza&ccedil;&atilde;o para $cleanName"
            }

            $htmlBody = @"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <link href='https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap' rel='stylesheet'>
    <style>
        body { font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
    </style>
</head>
<body style='font-family: \"Montserrat\", sans-serif; background-color: #f4f7f6; margin: 0; padding: 0;'>
    <div style='max-width: 650px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #e1e8ed;'>
        <div style='background: #002D62; padding: 40px 20px; text-align: center;'>
            <img src='https://i.postimg.cc/Z0k5QStc/logotipo-geral-horizontal-branco-png.png' alt='Lusofona' style='max-width: 240px; margin-bottom: 20px;'>
            <h1 style='color: #ffffff; font-size: 22px; margin: 0; letter-spacing: 1px; font-weight: 700;'>$subject$isTest</h1>
        </div>
        <div style='padding: 40px; color: #2d3436; line-height: 1.6;'>
            <div style='font-size: 18px; font-weight: 700; margin-bottom: 10px;'>$greeting,</div>
            <div style='font-size: 16px; opacity: 0.8; margin-bottom: 30px;'>$subTitle</div>
            $(if ($downCount -eq 0) {
                "<div style='text-align: center; padding: 30px; border-radius: 12px; margin: 20px 0; background: #e3f9e5; color: #1f7a27; border: 1px solid #c2f0c7;'>
                    <div style='font-size: 48px; margin-bottom: 10px;'>&#128737;</div>
                    <div style='font-size: 18px; font-weight: 700; text-transform: uppercase;'>$healthText</div>
                </div>"
            } else {
                "<div style='text-align: center; padding: 30px; border-radius: 12px; margin: 20px 0; background: #002D62; color: #ffffff; border: 1px solid #001a3a;'>
                    <div style='font-size: 48px; margin-bottom: 10px;'>&#9888;</div>
                    <div style='font-size: 18px; font-weight: 700; text-transform: uppercase;'>$downCount ALERT(S)</div>
                </div>
                <table style='width: 100%; border-collapse: collapse; margin-top: 20px;'>
                    <thead>
                        <tr>
                            <th style='text-align: left; padding: 12px; font-size: 11px; text-transform: uppercase; color: #636e72; border-bottom: 1px solid #e1e8ed;'>Institution / Course</th>
                            <th style='text-align: center; padding: 12px; font-size: 11px; text-transform: uppercase; color: #636e72; border-bottom: 1px solid #e1e8ed;'>Code</th>
                            <th style='text-align: center; padding: 12px; font-size: 11px; text-transform: uppercase; color: #636e72; border-bottom: 1px solid #e1e8ed;'>Action</th>
                        </tr>
                    </thead>
                    <tbody>$emailBodySections</tbody>
                </table>"
            })
        </div>
        <div style='background: #f8f9fa; padding: 25px; text-align: center; font-size: 11px; color: #b2bec3; border-top: 1px solid #f1f3f5;'>
            $footer &bull; Antigravity AI Agent &bull; $(Get-Date -Format 'yyyy')
        </div>
    </div>
</body>
</html>
"@

            Write-Host "Sending $($batch.Id) report to $finalTo..." -ForegroundColor Gray
            Send-MailMessage -From $senderEmail -To $finalTo -Subject "$subject$isTest" -Body $htmlBody -BodyAsHtml -SmtpServer $smtpServer -Port $smtpPort -Credential $creds -UseSsl -Encoding UTF8
        }
    } else {
        Write-Host "[Antigravity Agent] No change detected for batch $($batch.Id). Skipping email." -ForegroundColor Yellow
    }
}

# (Optional) Update Dashboard.html logic could be added here to merge all results.
