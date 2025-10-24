# Script para comprimir imágenes del slideshow
# Reduce el tamaño manteniendo buena calidad (85%)

$sourceFolder = "frontend\public\assets\images"
$backupFolder = "frontend\public\assets\images\originales"

# Crear carpeta de backup si no existe
if (-not (Test-Path $backupFolder)) {
    New-Item -ItemType Directory -Path $backupFolder | Out-Null
    Write-Host "[OK] Carpeta de backup creada: $backupFolder" -ForegroundColor Green
}

# Obtener imágenes del slideshow
$images = Get-ChildItem "$sourceFolder\IMG_*.jpg"

Write-Host "`n[ANALISIS] Imagenes encontradas:" -ForegroundColor Cyan
Write-Host "Total de imagenes: $($images.Count)" -ForegroundColor Yellow

# Cargar assemblies necesarios
Add-Type -AssemblyName System.Drawing

$totalOriginal = 0
$totalCompressed = 0

foreach ($image in $images) {
    $originalSize = $image.Length
    $totalOriginal += $originalSize
    
    # Backup original
    $backupPath = Join-Path $backupFolder $image.Name
    if (-not (Test-Path $backupPath)) {
        Copy-Item $image.FullName $backupPath
        Write-Host "  [BACKUP] $($image.Name)" -ForegroundColor Gray
    }
    
    # Cargar imagen
    $img = [System.Drawing.Image]::FromFile($image.FullName)
    
    # Calcular nuevo tamaño (máximo 1920px de ancho)
    $maxWidth = 1920
    $ratio = $img.Width / $img.Height
    
    if ($img.Width -gt $maxWidth) {
        $newWidth = $maxWidth
        $newHeight = [int]($maxWidth / $ratio)
    } else {
        $newWidth = $img.Width
        $newHeight = $img.Height
    }
    
    # Crear nueva imagen redimensionada
    $newImg = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
    $graphics = [System.Drawing.Graphics]::FromImage($newImg)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $graphics.DrawImage($img, 0, 0, $newWidth, $newHeight)
    
    # Guardar con compresión JPEG (calidad 85)
    $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
        [System.Drawing.Imaging.Encoder]::Quality, 85L
    )
    
    $jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | 
                 Where-Object { $_.MimeType -eq 'image/jpeg' }
    
    # Guardar temporalmente
    $tempPath = $image.FullName + ".tmp"
    $newImg.Save($tempPath, $jpegCodec, $encoderParams)
    
    # Limpiar recursos
    $graphics.Dispose()
    $newImg.Dispose()
    $img.Dispose()
    
    # Reemplazar original con comprimida
    Start-Sleep -Milliseconds 100
    Move-Item -Path $tempPath -Destination $image.FullName -Force
    
    # Calcular nuevo tamaño
    $compressedSize = (Get-Item $image.FullName).Length
    $totalCompressed += $compressedSize
    
    $reduction = [math]::Round((($originalSize - $compressedSize) / $originalSize) * 100, 1)
    
    Write-Host "  [OK] $($image.Name)" -ForegroundColor Green
    Write-Host "     Original: $([math]::Round($originalSize/1MB,2)) MB | Comprimida: $([math]::Round($compressedSize/1MB,2)) MB | Reduccion: $reduction%" -ForegroundColor White
}

Write-Host "`n[RESUMEN]" -ForegroundColor Cyan
Write-Host "  Tamano original total: $([math]::Round($totalOriginal/1MB,2)) MB" -ForegroundColor Yellow
Write-Host "  Tamano comprimido total: $([math]::Round($totalCompressed/1MB,2)) MB" -ForegroundColor Green
Write-Host "  Reduccion total: $([math]::Round((($totalOriginal - $totalCompressed) / $totalOriginal) * 100, 1))%" -ForegroundColor Cyan
Write-Host "  Ahorro: $([math]::Round(($totalOriginal - $totalCompressed)/1MB,2)) MB" -ForegroundColor Magenta

Write-Host "`n[OK] Compresion completada!" -ForegroundColor Green
Write-Host "[INFO] Originales guardados en: $backupFolder" -ForegroundColor Gray
