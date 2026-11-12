param([string]$Base = 'http://localhost:5000')
$email = "pay_$(Get-Random)@test.dev"
$reg = Invoke-RestMethod -Uri "$base/api/auth/register" -Method Post -ContentType 'application/json' -Body (@{ name='Pay'; email=$email; password='Test1234!' } | ConvertTo-Json)
$tok = $reg.token
Invoke-RestMethod -Uri "$base/api/cart/items" -Method Post -Headers @{Authorization="Bearer $tok"} -ContentType 'application/json' -Body '{"productId":"apgP7hH","title":"gram Ultraslim Laptop","merchant":"officedepot.com","unitPrice":499.99,"quantity":1}' | Out-Null
try {
  $o = Invoke-RestMethod -Uri "$base/api/orders/create" -Method Post -Headers @{Authorization="Bearer $tok"} -ContentType 'application/json' -Body '{}'
  Write-Output "ORDER CREATED: $($o.orderId) total=$($o.totals.total) $($o.totals.currency) status=$($o.status)"
} catch {
  $resp = $_.Exception.Response
  if ($resp) {
    $sr = New-Object IO.StreamReader($resp.GetResponseStream())
    Write-Output "HTTP $([int]$resp.StatusCode): $($sr.ReadToEnd())"
  } else { Write-Output "ERR: $($_.Exception.Message)" }
}
