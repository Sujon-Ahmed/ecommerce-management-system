<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Slug
{
    /**
     * Build a unique slug for a soft-deletable model.
     *
     * @param  class-string<Model>  $modelClass
     */
    public static function unique(string $value, string $modelClass, ?int $ignoreId = null): string
    {
        $base = Str::slug($value);

        if ($base === '') {
            $base = Str::lower(Str::random(8));
        }

        $query = $modelClass::withTrashed();

        if ($ignoreId !== null) {
            $query->whereKeyNot($ignoreId);
        }

        $slug = $base;
        $suffix = 2;

        while ((clone $query)->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }
}
