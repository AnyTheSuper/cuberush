Add-Type -AssemblyName System.Drawing

$root = Split-Path $PSScriptRoot -Parent
$path = Join-Path $root 'public\cuberush-logo.png'
$bmp = [System.Drawing.Bitmap]::FromFile($path)

function IsContentPixel($c) {
  return ($c.A -gt 10 -and ($c.R -gt 30 -or $c.G -gt 30 -or $c.B -gt 30))
}

$rowCounts = New-Object int[] $bmp.Height
$colCounts = New-Object int[] $bmp.Width

for ($y = 0; $y -lt $bmp.Height; $y++) {
  for ($x = 0; $x -lt $bmp.Width; $x++) {
    if (IsContentPixel($bmp.GetPixel($x, $y))) {
      $rowCounts[$y]++
      $colCounts[$x]++
    }
  }
}

$rowThreshold = [Math]::Max(8, [int]($bmp.Width * 0.01))
$colThreshold = [Math]::Max(8, [int]($bmp.Height * 0.01))

$minY = 0
for ($y = 0; $y -lt $bmp.Height; $y++) {
  if ($rowCounts[$y] -ge $rowThreshold) { $minY = $y; break }
}

$maxY = $bmp.Height - 1
for ($y = $bmp.Height - 1; $y -ge 0; $y--) {
  if ($rowCounts[$y] -ge $rowThreshold) { $maxY = $y; break }
}

$minX = 0
for ($x = 0; $x -lt $bmp.Width; $x++) {
  if ($colCounts[$x] -ge $colThreshold) { $minX = $x; break }
}

$maxX = $bmp.Width - 1
for ($x = $bmp.Width - 1; $x -ge 0; $x--) {
  if ($colCounts[$x] -ge $colThreshold) { $maxX = $x; break }
}

# Remove embedded tagline band at bottom (~22% of content height)
$contentH = $maxY - $minY + 1
$taglineTrim = [int]($contentH * 0.24)
$maxY = $maxY - $taglineTrim

$pad = 4
$minX = [Math]::Max(0, $minX - $pad)
$minY = [Math]::Max(0, $minY - $pad)
$maxX = [Math]::Min($bmp.Width - 1, $maxX + $pad)
$maxY = [Math]::Min($bmp.Height - 1, $maxY + $pad)

$w = $maxX - $minX + 1
$h = $maxY - $minY + 1

Write-Output "crop: $minX,$minY -> $maxX,$maxY (${w}x${h})"

$crop = New-Object System.Drawing.Bitmap $w, $h
$g = [System.Drawing.Graphics]::FromImage($crop)
$src = New-Object System.Drawing.Rectangle $minX, $minY, $w, $h
$dst = New-Object System.Drawing.Rectangle 0, 0, $w, $h
$g.DrawImage($bmp, $dst, $src, [System.Drawing.GraphicsUnit]::Pixel)

$outFull = Join-Path $root 'public\cuberush-logo-cropped.png'
$crop.Save($outFull, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$crop.Dispose()
$bmp.Dispose()

Write-Output "saved $outFull"
