<?php
// Jalankan: php tools/make-preview.php  (butuh ekstensi GD — default Laragon aktif)
$w = 640; $h = 400;
$im = imagecreatetruecolor($w, $h);
$hex = fn($s) => [hexdec(substr($s,0,2)), hexdec(substr($s,2,2)), hexdec(substr($s,4,2))];
$col = function ($s) use ($im, $hex) { [$r,$g,$b] = $hex($s); return imagecolorallocate($im, $r, $g, $b); };
imagefill($im, 0, 0, $col('070b09'));
// glow
imagealphablending($im, true);
for ($i = 9; $i > 0; $i--) {
    $c = imagecolorallocatealpha($im, 0, 229, 122, 118);
    imagefilledellipse($im, 560, 40, $i * 46, $i * 30, $c);
}
// sisik
for ($y = 0; $y < $h; $y += 18) for ($x = ($y / 18 % 2) * 13; $x < $w; $x += 26) {
    imagesetpixel($im, $x, $y, $col('0f1a14'));
}
// sidebar mock
imagefilledrectangle($im, 0, 0, 150, $h, $col('0b120e'));
for ($i = 0; $i < 9; $i++) imagefilledrectangle($im, 16, 90 + $i * 28, 134, 104 + $i * 28, $col($i === 1 ? '00e57a' : '14231b'));
// fang V
$pts = [200,90, 250,90, 285,210, 320,90, 370,90, 305,300, 265,300];
imagefilledpolygon($im, $pts, $col('00e57a'));
// teks
$font = __DIR__ . '/../fonts/Quicksand/Quicksand-Bold.ttf';
if (is_file($font)) {
    imagettftext($im, 44, 0, 400, 190, $col('ffffff'), $font, 'VENOM');
    imagettftext($im, 13, 0, 402, 225, $col('8fa89b'), $font, 'PREMIUM ADMIN · SLiMS 9');
} else {
    imagestring($im, 5, 400, 160, 'VENOM', $col('ffffff'));
    imagestring($im, 3, 400, 190, 'PREMIUM ADMIN - SLiMS 9', $col('8fa89b'));
}
imagerectangle($im, 0, 0, $w - 1, $h - 1, $col('00e57a'));
imagepng($im, __DIR__ . '/../preview.png', 9);
imagedestroy($im);
echo "preview.png dibuat di root template venom.\n";