<?php

namespace App\Http\Controllers\Hris;

use App\Http\Controllers\Controller;
use App\Http\Requests\Hris\StoreDivisionRequest;
use App\Http\Requests\Hris\UpdateDivisionRequest;
use App\Models\Division;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;

class DivisionController extends Controller
{
    /**
     * Store a newly created division in storage.
     */
    public function store(StoreDivisionRequest $request): RedirectResponse
    {
        Division::create([
            ...$request->validated(),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return back();
    }

    /**
     * Update the specified division in storage.
     */
    public function update(UpdateDivisionRequest $request, Division $division): RedirectResponse
    {
        $division->update([
            ...$request->validated(),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return back();
    }

    /**
     * Remove the specified division from storage.
     */
    public function destroy(Division $division): RedirectResponse
    {
        if ($division->employees()->exists() || $division->positions()->exists()) {
            throw ValidationException::withMessages([
                'division_delete' => 'Divisi tidak bisa dihapus karena masih memiliki karyawan atau jabatan aktif.',
            ]);
        }

        $division->delete();

        return back();
    }
}
