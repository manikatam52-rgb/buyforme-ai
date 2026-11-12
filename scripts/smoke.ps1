$base = 'http://localhost:5000'

# 1. Product search (mock catalogue)
$p = Invoke-RestMethod "$base/api/products?q=laptop&maxPrice=60000"
Write-Host "products: $($p.products.Count) matches, source=$($p.catalogSource)"

# 2. Register
$email = "smoke-$([guid]::NewGuid())@test.io"
$r = Invoke-RestMethod "$base/api/auth/register" -Method Post -ContentType 'application/json' `
  -Body (@{ name='Smoke Tester'; email=$email; password='supersecret1' } | ConvertTo-Json)
$h = @{ Authorization = "Bearer $($r.token)" }
Write-Host "auth ok: $($r.user.email)"

# 3. Add to cart + totals
$c = Invoke-RestMethod "$base/api/cart/items" -Method Post -Headers $h -ContentType 'application/json' `
  -Body (@{ productId='mock-lenovo-ideapad-slim5'; title='Lenovo IdeaPad Slim 5'; merchant='MockStore India'; unitPrice=57999; quantity=1 } | ConvertTo-Json)
Write-Host "cart total: $($c.totals.total) $($c.totals.currency) (tax $($c.totals.tax), shipping $($c.totals.shipping))"

# 4. Order creation must fail cleanly while PayPal is unconfigured (graceful 503)
try { Invoke-RestMethod "$base/api/orders/create" -Method Post -Headers $h | Out-Null }
catch { Write-Host "orders/create -> HTTP $($_.Exception.Response.StatusCode.value__) (expected 503, PayPal unconfigured)" }

# 5. Transactions endpoint
$t = Invoke-RestMethod "$base/api/transactions" -Headers $h
Write-Host "transactions: $($t.transactions.Count), totalSpent=$($t.totalSpent)"

# 6. Rate-limited / unauth checks
try { Invoke-RestMethod "$base/api/cart" | Out-Null } catch { Write-Host "unauth /cart -> HTTP $($_.Exception.Response.StatusCode.value__) (expect 401)" }

# 7. Integration status (honest report of optional sponsor integrations)
$i = Invoke-RestMethod "$base/api/integrations" -Headers $h
Write-Host "integrations: zapier=$($i.zapier.configured) elastic=$($i.elastic.configured) kernel=$($i.kernel.configured)"

# 8. Health with integration flags
$hp = Invoke-RestMethod "$base/health"
Write-Host "health: paypalConfigured=$($hp.paypalConfigured) productSource=$($hp.productSource)"

Write-Host 'SMOKE COMPLETE'
