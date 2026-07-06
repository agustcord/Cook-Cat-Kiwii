Add-Type -AssemblyName System.Drawing
$filePath = Join-Path (Get-Location) "public/assets/stations/shape_star.png"
if (-not (Test-Path $filePath)) {
    Write-Output "File not found: $filePath"
    exit
}

$bmp = New-Object System.Drawing.Bitmap($filePath)
Write-Output "Image loaded: $($bmp.Width)x$($bmp.Height)"

# We will sample the middle row of pixels (Y = height / 2)
$y = [int]($bmp.Height / 2)
$linePixels = @()
for ($x = 0; $x -lt $bmp.Width; $x++) {
    $pixel = $bmp.GetPixel($x, $y)
    # Convert color to hex
    $hex = "#{0:X2}{1:X2}{2:X2}{3:X2}" -f $pixel.A, $pixel.R, $pixel.G, $pixel.B
    $linePixels += $hex
}

# Find run-length encoding of colors to see how large the blocks are
$runs = @()
$currentVal = $linePixels[0]
$currentLen = 1

for ($i = 1; $i -lt $linePixels.Length; $i++) {
    if ($linePixels[$i] -eq $currentVal) {
        $currentLen++
    } else {
        $runs += [PSCustomObject]@{ Color = $currentVal; Length = $currentLen }
        $currentVal = $linePixels[$i]
        $currentLen = 1
    }
}
$runs += [PSCustomObject]@{ Color = $currentVal; Length = $currentLen }

Write-Output "Total distinct color runs across the middle line: $($runs.Length)"
Write-Output "First 20 runs:"
$runs[0..19] | Format-Table -AutoSize
