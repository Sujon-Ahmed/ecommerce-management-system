<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ImageStorageService
{
    public function store(UploadedFile $file, string $directory): string
    {
        return $file->store($directory, 'public');
    }

    public function delete(?string $path): void
    {
        if ($path !== null && $path !== '') {
            Storage::disk('public')->delete($path);
        }
    }

    public function replace(?string $oldPath, ?UploadedFile $file, string $directory): ?string
    {
        if ($file === null) {
            return $oldPath;
        }

        $newPath = $this->store($file, $directory);
        $this->delete($oldPath);

        return $newPath;
    }

    public function remove(?string $path): null
    {
        $this->delete($path);

        return null;
    }
}
