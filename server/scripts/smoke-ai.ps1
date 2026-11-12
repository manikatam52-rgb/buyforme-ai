# Quick AI smoke test: registers a fresh user and calls /api/ai/chat
$base = 'http://localhost:5000'
$email = "smoke_$(Get-Random)@test.dev"
$reg = Invoke-RestMethod -Uri "$base/api/auth/register" -Method Post -ContentType 'application/json' -Body (@{ name = 'Smoke'; email = $email; password = 'Test1234!' } | ConvertTo-Json)
$tok = $reg.token
Write-Output "registered: $email"

$body = '{"message":"Find me wireless earbuds under 100 dollars"}'
$ai = Invoke-RestMethod -Uri "$base/api/ai/chat" -Method Post -Headers @{ Authorization = "Bearer $tok" } -ContentType 'application/json' -Body $body -TimeoutSec 110
Write-Output "reply: $($ai.reply)"
Write-Output "products: $($ai.products.Count)"
Write-Output "intent: $(($ai.intent | ConvertTo-Json -Compress))"
