# Test 1: Register User
Write-Host "=== TEST 1: Register User ===" -ForegroundColor Green
$registerBody = @{
    name = "Test User"
    email = "testuser@example.com"
    password = "TestPass123!"
} | ConvertTo-Json

$registerResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/register" -Method POST -ContentType "application/json" -Body $registerBody -UseBasicParsing
$registerData = $registerResponse.Content | ConvertFrom-Json

Write-Host "Response:" -ForegroundColor Yellow
$registerData | ConvertTo-Json

# Extract user ID
$userId = $registerData.data.id
Write-Host "User ID: $userId" -ForegroundColor Cyan

# Test 2: Login
Write-Host "`n=== TEST 2: Login ===" -ForegroundColor Green
$loginBody = @{
    email = "testuser@example.com"
    password = "TestPass123!"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody -UseBasicParsing
$loginData = $loginResponse.Content | ConvertFrom-Json

Write-Host "Response:" -ForegroundColor Yellow
$loginData | ConvertTo-Json

# Extract token
$token = $loginData.data.token
Write-Host "Token: $($token.Substring(0, 50))..." -ForegroundColor Cyan

# Test 3: Create sample file
Write-Host "`n=== TEST 3: Create Sample PDF ===" -ForegroundColor Green
$pdfContent = "%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< >>
stream
BT
/F1 12 Tf
100 700 Td
(Machine Learning is a subset of artificial intelligence) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000229 00000 n 
0000000334 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
413
%%EOF"

$pdfPath = "C:\Users\Shahid computers\Downloads\sample_test.pdf"
Set-Content -Path $pdfPath -Value $pdfContent -Encoding ASCII
Write-Host "Sample PDF created at: $pdfPath" -ForegroundColor Cyan

# Test 4: Upload Document
Write-Host "`n=== TEST 4: Upload Document ===" -ForegroundColor Green
$headers = @{
    Authorization = "Bearer $token"
}

$uploadResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/documents" -Method POST -Headers $headers -Form @{file=Get-Item -Path $pdfPath} -UseBasicParsing
$uploadData = $uploadResponse.Content | ConvertFrom-Json

Write-Host "Response:" -ForegroundColor Yellow
$uploadData | ConvertTo-Json

$documentId = $uploadData.data.id
Write-Host "Document ID: $documentId" -ForegroundColor Cyan
Write-Host "Document Status: $($uploadData.data.status)" -ForegroundColor Cyan

# Test 5: Wait and check document status
Write-Host "`n=== TEST 5: Wait for Processing (60 seconds) ===" -ForegroundColor Green
Start-Sleep -Seconds 60

Write-Host "`n=== TEST 6: Check Document Status ===" -ForegroundColor Green
$listResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/documents" -Method GET -Headers $headers -UseBasicParsing
$listData = $listResponse.Content | ConvertFrom-Json

Write-Host "Response:" -ForegroundColor Yellow
$listData | ConvertTo-Json

# Test 7: Get document details
Write-Host "`n=== TEST 7: Get Document Details ===" -ForegroundColor Green
$detailResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/documents/$documentId" -Method GET -Headers $headers -UseBasicParsing
$detailData = $detailResponse.Content | ConvertFrom-Json

Write-Host "Response:" -ForegroundColor Yellow
Write-Host "Document Status: $($detailData.data.status)" -ForegroundColor Cyan
Write-Host "Total Chunks: $($detailData.data.chunkCount)" -ForegroundColor Cyan
Write-Host "Embedded Chunks: $($detailData.data.embeddedChunkCount)" -ForegroundColor Cyan
Write-Host "First Chunk: $($detailData.data.chunks[0].text.Substring(0, 100))..." -ForegroundColor Cyan

# Test 8: Semantic Search
Write-Host "`n=== TEST 8: Semantic Search ===" -ForegroundColor Green
$searchBody = @{
    query = "What is machine learning?"
    topK = 5
} | ConvertTo-Json

$searchResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/documents/search" -Method POST -Headers $headers -ContentType "application/json" -Body $searchBody -UseBasicParsing
$searchData = $searchResponse.Content | ConvertFrom-Json

Write-Host "Search Query: $($searchData.data.query)" -ForegroundColor Yellow
Write-Host "Results Found: $($searchData.data.totalResults)" -ForegroundColor Cyan
if ($searchData.data.results.Count -gt 0) {
    Write-Host "Top Result Similarity: $($searchData.data.results[0].similarity)" -ForegroundColor Cyan
    Write-Host "Top Result Text: $($searchData.data.results[0].text.Substring(0, 100))..." -ForegroundColor Cyan
}

Write-Host "`n=== ALL TESTS COMPLETED ===" -ForegroundColor Green
