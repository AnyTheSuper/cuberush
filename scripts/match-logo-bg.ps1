Add-Type -AssemblyName System.Drawing

$root = Split-Path $PSScriptRoot -Parent
$path = Join-Path $root 'public\cuberush-logo.png'
$temp = Join-Path $root 'public\cuberush-logo-tmp.png'

# App background --color-bg
$bgR = 9
$bgG = 11
$bgB = 22

$bmp = [System.Drawing.Bitmap]::FromFile($path)
$outBmp = New-Object System.Drawing.Bitmap $bmp.Width, $bmp.Height

for ($y = 0; $y -lt $bmp.Height; $y++) {
  for ($x = 0; $x -lt $bmp.Width; $x++) {
    $c = $bmp.GetPixel($x, $y)
    $isDark = ($c.R -le 35 -and $c.G -le 35 -and $c.B -le 40)
    if ($isDark) {
      $outBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $bgR, $bgG, $bgB))
    } else {
      $outBmp.SetPixel($x, $y, $c)
    }
  }
}

$outBmp.Save($temp, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$outBmp.Dispose()

Move-Item -Force $temp $path

Write-Output "Updated logo background to #090b16"
