<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\CompanySettingUpdateRequest;
use App\Models\CompanySetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CompanySettingController extends Controller
{
    /**
     * Update company setting values.
     */
    public function update(CompanySettingUpdateRequest $request): RedirectResponse
    {
        $ownerId = $request->user()->accountOwnerId();

        $setting = CompanySetting::query()->firstOrCreate(
            ['user_id' => $ownerId],
            [
                'name' => 'Perusahaan',
                'details' => null,
                'employee_code_prefix' => 'EMP',
                'employee_code_digits' => 4,
                'employee_code_next_number' => 1,
            ],
        );

        $validated = $request->validated();
        unset($validated['logo']);

        if ($request->hasFile('logo')) {
            $validated['logo_path'] = $this->storeCompressedWebp(
                $request->file('logo'),
                $setting->logo_path,
            );
        }

        $setting->update($validated);

        return to_route('profile.edit')->with('success', 'Data perusahaan berhasil diperbarui.');
    }

    private function storeCompressedWebp(UploadedFile $file, ?string $oldPath): string
    {
        if (! function_exists('imagewebp')) {
            throw ValidationException::withMessages([
                'logo' => 'Server belum mendukung konversi gambar WEBP.',
            ]);
        }

        $image = @imagecreatefromstring((string) file_get_contents($file->getRealPath()));

        if ($image === false) {
            throw ValidationException::withMessages([
                'logo' => 'File logo tidak valid atau tidak bisa diproses.',
            ]);
        }

        $maxBytes = 150 * 1024;
        $encoded = null;
        $workingImage = $image;

        try {
            $targetWidth = imagesx($workingImage);
            $targetHeight = imagesy($workingImage);

            for ($attempt = 0; $attempt < 9; $attempt++) {
                foreach ([82, 76, 70, 64, 58, 52, 46, 40] as $quality) {
                    ob_start();
                    imagewebp($workingImage, null, $quality);
                    $binary = (string) ob_get_clean();

                    if (strlen($binary) <= $maxBytes) {
                        $encoded = $binary;
                        break 2;
                    }
                }

                if ($targetWidth <= 120 || $targetHeight <= 120) {
                    break;
                }

                $targetWidth = (int) floor($targetWidth * 0.88);
                $targetHeight = (int) floor($targetHeight * 0.88);

                $resized = imagecreatetruecolor($targetWidth, $targetHeight);
                imagealphablending($resized, true);
                imagesavealpha($resized, true);

                imagecopyresampled(
                    $resized,
                    $workingImage,
                    0,
                    0,
                    0,
                    0,
                    $targetWidth,
                    $targetHeight,
                    imagesx($workingImage),
                    imagesy($workingImage),
                );

                if ($workingImage !== $image) {
                    imagedestroy($workingImage);
                }

                $workingImage = $resized;
            }

            if ($encoded === null) {
                throw ValidationException::withMessages([
                    'logo' => 'Logo tidak bisa dikompres hingga maksimum 150KB. Gunakan gambar yang lebih sederhana.',
                ]);
            }

            $newPath = 'company-logos/'.Str::uuid()->toString().'.webp';
            Storage::disk('public')->put($newPath, $encoded);

            if ($oldPath) {
                Storage::disk('public')->delete($oldPath);
            }

            return $newPath;
        } finally {
            if ($workingImage !== $image) {
                imagedestroy($workingImage);
            }

            imagedestroy($image);
        }
    }
}
