<?php

namespace Database\Seeders\Concerns;

use Illuminate\Support\Facades\Storage;

trait GeneratesPlaceholderImages
{
    /**
     * Generate a small branded PNG so a fresh install has real thumbnails.
     *
     * @param  array{0: int, 1: int, 2: int}  $rgb
     */
    protected function makePlaceholderPng(string $label, string $path, array $rgb = [79, 70, 229]): bool
    {
        if (Storage::disk('public')->exists($path)) {
            return true;
        }

        if (! function_exists('imagecreatetruecolor')) {
            return false;
        }

        $width = 600;
        $height = 400;

        $image = imagecreatetruecolor($width, $height);
        $background = imagecolorallocate($image, $rgb[0], $rgb[1], $rgb[2]);
        $band = imagecolorallocate(
            $image,
            min(255, $rgb[0] + 40),
            min(255, $rgb[1] + 40),
            min(255, $rgb[2] + 40)
        );
        $white = imagecolorallocate($image, 255, 255, 255);

        imagefilledrectangle($image, 0, 0, $width, $height, $background);
        imagefilledrectangle($image, 0, 310, $width, $height, $band);

        $text = substr($label, 0, 38);
        $font = 5;
        $textWidth = imagefontwidth($font) * strlen($text);
        imagestring($image, $font, (int) (($width - $textWidth) / 2), 165, $text, $white);

        $subtitle = 'ShopSphere';
        $subtitleWidth = imagefontwidth(3) * strlen($subtitle);
        imagestring($image, 3, (int) (($width - $subtitleWidth) / 2), 225, $subtitle, $white);

        ob_start();
        imagepng($image);
        $png = ob_get_clean();
        imagedestroy($image);

        if (! is_string($png) || $png === '') {
            return false;
        }

        Storage::disk('public')->put($path, $png);

        return true;
    }
}
