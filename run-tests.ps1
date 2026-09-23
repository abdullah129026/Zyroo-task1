$baseUrl = "http://localhost:3001/api"
$token = $null
$documentId = $null

# Test 1: Register User
Write-Host "`n========== TEST 1: REGISTER USER ==========" -ForegroundColor Green
$registerBody = '{"name":"Test User","email":"testuser@example.com","password":"TestPass123!"}'
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/register" -Method POST -ContentType "application/json" -Body $registerBody -UseBasicParsing -TimeoutSec 10
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ SUCCESS: User registered!" -ForegroundColor Green
    Write-Host "  User ID: $($data.data.id)" -ForegroundColor Cyan
    Write-Host "  Email: $($data.data.email)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Login User
Write-Host "`n========== TEST 2: LOGIN USER ==========" -ForegroundColor Green
$loginBody = '{"email":"testuser@example.com","password":"TestPass123!"}'
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $loginBody -UseBasicParsing -TimeoutSec 10
    $data = $response.Content | ConvertFrom-Json
    $token = $data.data.token
    Write-Host "✓ SUCCESS: User logged in!" -ForegroundColor Green
    Write-Host "  Token: $($token.Substring(0, 50))..." -ForegroundColor Cyan
} catch {
    Write-Host "✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Upload Document
Write-Host "`n========== TEST 3: UPLOAD DOCUMENT ==========" -ForegroundColor Green
$headers = @{Authorization = "Bearer $token"}
$filePath = "C:\Users\Shahid computers\Downloads\sample_doc.txt"

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/documents" -Method POST -Headers $headers -Form @{file = Get-Item -Path $filePath} -UseBasicParsing -TimeoutSec 30
    $data = $response.Content | ConvertFrom-Json
    $documentId = $data.data.id
    Write-Host "✓ SUCCESS: Document uploaded!" -ForegroundColor Green
    Write-Host "  Document ID: $documentId" -ForegroundColor Cyan
    Write-Host "  Status: $($data.data.status)" -ForegroundColor Cyan
    Write-Host "  Filename: $($data.data.filename)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 4: Wait for Processing
Write-Host "`n========== TEST 4: WAIT FOR PROCESSING ==========" -ForegroundColor Green
Write-Host "Waiting 60 seconds for document to be processed..." -ForegroundColor Yellow
for ($i = 0; $i -lt 6; $i++) {
    Start-Sleep -Seconds 10
    Write-Host "  [$($i * 10 + 10)/60] seconds elapsed..." -ForegroundColor Yellow
}

# Test 5: Check Document Status
Write-Host "`n========== TEST 5: CHECK DOCUMENT STATUS ==========" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/documents" -Method GET -Headers $headers -UseBasicParsing -TimeoutSec 10
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ SUCCESS: Retrieved documents!" -ForegroundColor Green
    Write-Host "  Total Documents: $($data.data.Count)" -ForegroundColor Cyan
    foreach ($doc in $data.data) {
        Write-Host "  - Document: $($doc.filename)" -ForegroundColor Cyan
        Write-Host "    Status: $($doc.status)" -ForegroundColor $(if ($doc.status -eq "ready") { "Green" } else { "Yellow" })
        Write-Host "    Chunks: $($doc.chunkCount)" -ForegroundColor Cyan
        Write-Host "    Embedded: $($doc.embeddedChunkCount)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Get Document Details
Write-Host "`n========== TEST 6: GET DOCUMENT DETAILS ==========" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/documents/$documentId" -Method GET -Headers $headers -UseBasicParsing -TimeoutSec 10
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ SUCCESS: Retrieved document details!" -ForegroundColor Green
    Write-Host "  Status: $($data.data.status)" -ForegroundColor Cyan
    Write-Host "  Total Chunks: $($data.data.chunkCount)" -ForegroundColor Cyan
    Write-Host "  Embedded Chunks: $($data.data.embeddedChunkCount)" -ForegroundColor Cyan
    if ($data.data.chunks.Count -gt 0) {
        Write-Host "  First Chunk Preview: $($data.data.chunks[0].text.Substring(0, 80))..." -ForegroundColor Cyan
    }
} catch {
    Write-Host "✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Semantic Search
Write-Host "`n========== TEST 7: SEMANTIC SEARCH ==========" -ForegroundColor Green
$searchBody = '{"query":"What is machine learning?","topK":5}'
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/documents/search" -Method POST -Headers $headers -ContentType "application/json" -Body $searchBody -UseBasicParsing -TimeoutSec 30
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ SUCCESS: Search completed!" -ForegroundColor Green
    Write-Host "  Query: $($data.data.query)" -ForegroundColor Cyan
    Write-Host "  Results Found: $($data.data.totalResults)" -ForegroundColor Cyan
    if ($data.data.results.Count -gt 0) {
        Write-Host "  Top Result Similarity: $($data.data.results[0].similarity)" -ForegroundColor Cyan
        Write-Host "  Top Result Text: $($data.data.results[0].text.Substring(0, 80))..." -ForegroundColor Cyan
    }
} catch {
    Write-Host "✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 8: Get Statistics
Write-Host "`n========== TEST 8: GET STATISTICS ==========" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/documents/stats" -Method GET -Headers $headers -UseBasicParsing -TimeoutSec 10
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ SUCCESS: Retrieved statistics!" -ForegroundColor Green
    Write-Host "  Total Documents: $($data.data.totalDocuments)" -ForegroundColor Cyan
    Write-Host "  Ready: $($data.data.readyCount) | Processing: $($data.data.processingCount) | Failed: $($data.data.failedCount)" -ForegroundColor Cyan
    Write-Host "  Total Chunks: $($data.data.totalChunks)" -ForegroundColor Cyan
    Write-Host "  Embedded Chunks: $($data.data.embeddedChunks)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========== ALL TESTS COMPLETED ==========" -ForegroundColor Green
