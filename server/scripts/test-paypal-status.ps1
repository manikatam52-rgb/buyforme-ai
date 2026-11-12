param([string]$Base = 'http://localhost:5000')
$tok = (Invoke-RestMethod -Uri "$base/api/auth/register" -Method Post -ContentType 'application/json' -Body (@{ name='Tx'; email="tx_$(Get-Random)@test.dev"; password='Test1234!' } | ConvertTo-Json)).token
Invoke-RestMethod -Uri "$base/api/cart/items" -Method Post -Headers @{Authorization="Bearer $tok"} -ContentType 'application/json' -Body '{"productId":"apgP7hH","title":"gram Ultraslim Laptop","merchant":"officedepot.com","unitPrice":499.99,"quantity":1}' | Out-Null
$o = Invoke-RestMethod -Uri "$base/api/orders/create" -Method Post -Headers @{Authorization="Bearer $tok"} -ContentType 'application/json' -Body '{}'
$s = Invoke-RestMethod -Uri "$base/api/orders/$($o.orderId)" -Headers @{Authorization="Bearer $tok"}
Write-Output "order status doc: $($s | ConvertTo-Json -Compress)"
$h = Invoke-RestMethod -Uri "$base/api/transactions" -Headers @{Authorization="Bearer $tok"}
Write-Output "history count: $($h.transactions.Count) totalSpent: $($h.totalSpent) currency: $($h.currency)"
