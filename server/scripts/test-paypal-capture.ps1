param([string]$Base = 'http://localhost:5000')
$email = "cap_$(Get-Random)@test.dev"
$reg = Invoke-RestMethod -Uri "$base/api/auth/register" -Method Post -ContentType 'application/json' -Body (@{ name='Cap'; email=$email; password='Test1234!' } | ConvertTo-Json)
$tok = $reg.token
Invoke-RestMethod -Uri "$base/api/cart/items" -Method Post -Headers @{Authorization="Bearer $tok"} -ContentType 'application/json' -Body '{"productId":"apgP7hH","title":"gram Ultraslim Laptop","merchant":"officedepot.com","unitPrice":499.99,"quantity":1}' | Out-Null
$o = Invoke-RestMethod -Uri "$base/api/orders/create" -Method Post -Headers @{Authorization="Bearer $tok"} -ContentType 'application/json' -Body '{}'
Write-Output "created: $($o.orderId)"

# 1) Capture before user approval -> must fail with 402, not 500
try {
  Invoke-RestMethod -Uri "$base/api/orders/$($o.orderId)/capture" -Method Post -Headers @{Authorization="Bearer $tok"} -ContentType 'application/json' -Body '{}' | Out-Null
  Write-Output "UNEXPECTED: capture succeeded before approval"
} catch {
  $resp = $_.Exception.Response
  $sr = New-Object IO.StreamReader($resp.GetResponseStream())
  Write-Output "unapproved capture -> HTTP $([int]$resp.StatusCode): $($sr.ReadToEnd())"
}

# 2) Unknown order id -> 404
try {
  Invoke-RestMethod -Uri "$base/api/orders/FAKE123/capture" -Method Post -Headers @{Authorization="Bearer $tok"} -ContentType 'application/json' -Body '{}' | Out-Null
  Write-Output "UNEXPECTED: fake order accepted"
} catch {
  $resp = $_.Exception.Response
  $sr = New-Object IO.StreamReader($resp.GetResponseStream())
  Write-Output "fake order -> HTTP $([int]$resp.StatusCode): $($sr.ReadToEnd())"
}

# 3) Another user trying to capture someone else's order -> 404
$reg2 = Invoke-RestMethod -Uri "$base/api/auth/register" -Method Post -ContentType 'application/json' -Body (@{ name='Other'; email="other_$(Get-Random)@test.dev"; password='Test1234!' } | ConvertTo-Json)
try {
  Invoke-RestMethod -Uri "$base/api/orders/$($o.orderId)/capture" -Method Post -Headers @{Authorization="Bearer $($reg2.token)"} -ContentType 'application/json' -Body '{}' | Out-Null
  Write-Output "UNEXPECTED: cross-user capture accepted"
} catch {
  $resp = $_.Exception.Response
  $sr = New-Object IO.StreamReader($resp.GetResponseStream())
  Write-Output "cross-user capture -> HTTP $([int]$resp.StatusCode): $($sr.ReadToEnd())"
}
