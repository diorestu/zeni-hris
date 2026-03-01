<?php

namespace App\Http\Controllers\Hris;

use App\Http\Controllers\Controller;
use App\Http\Requests\Hris\StorePositionRequest;
use App\Http\Requests\Hris\UpdatePositionRequest;
use App\Models\Position;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;

class PositionController extends Controller
{
    /**
     * Store a newly created position in storage.
     */
    public function store(StorePositionRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $validated = $this->ensureValidParentPosition($validated, null);

        Position::create([
            ...$validated,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return back();
    }

    /**
     * Update the specified position in storage.
     */
    public function update(UpdatePositionRequest $request, Position $position): RedirectResponse
    {
        $validated = $request->validated();

        $validated = $this->ensureValidParentPosition($validated, $position);

        $position->update([
            ...$validated,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return back();
    }

    /**
     * Remove the specified position from storage.
     */
    public function destroy(Position $position): RedirectResponse
    {
        if ($position->employees()->exists()) {
            throw ValidationException::withMessages([
                'position_delete' => 'Jabatan tidak bisa dihapus karena masih dipakai oleh karyawan.',
            ]);
        }

        if ($position->childPositions()->exists()) {
            throw ValidationException::withMessages([
                'position_delete' => 'Jabatan tidak bisa dihapus karena masih memiliki sub-jabatan.',
            ]);
        }

        $position->delete();

        return back();
    }

    /**
     * Validate parent-position hierarchy.
     *
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function ensureValidParentPosition(array $validated, ?Position $position): array
    {
        $parentId = $validated['parent_position_id'] ?? null;

        if ($parentId === null || $parentId === '') {
            return $validated;
        }

        $parent = Position::query()->find($parentId);

        if (! $parent) {
            throw ValidationException::withMessages([
                'parent_position_id' => 'Jabatan induk tidak ditemukan.',
            ]);
        }

        $divisionId = $validated['division_id'] ?? null;

        if ($divisionId !== null && $parent->division_id !== null && (int) $parent->division_id !== (int) $divisionId) {
            throw ValidationException::withMessages([
                'parent_position_id' => 'Sub-jabatan harus berada dalam divisi yang sama dengan jabatan induk.',
            ]);
        }

        if (($divisionId === null || $divisionId === '') && $parent->division_id !== null) {
            $validated['division_id'] = $parent->division_id;
        }

        if ($position !== null && $this->isDescendantOf($parent, $position->id)) {
            throw ValidationException::withMessages([
                'parent_position_id' => 'Relasi sub-jabatan tidak valid karena menyebabkan siklus hierarki.',
            ]);
        }

        $parentLevel = is_numeric((string) $parent->level) ? (int) $parent->level : null;
        $currentLevel = isset($validated['level']) && is_numeric((string) $validated['level'])
            ? (int) $validated['level']
            : null;

        if (
            $parentLevel !== null &&
            $currentLevel !== null &&
            $currentLevel <= $parentLevel
        ) {
            throw ValidationException::withMessages([
                'level' => 'Level sub-jabatan harus lebih besar dari level jabatan induk.',
            ]);
        }

        return $validated;
    }

    /**
     * Check whether parent candidate is a descendant of current position.
     */
    private function isDescendantOf(Position $candidateParent, int $currentPositionId): bool
    {
        $visited = [];
        $cursor = $candidateParent;

        while ($cursor !== null) {
            if (in_array($cursor->id, $visited, true)) {
                return true;
            }

            if ($cursor->id === $currentPositionId) {
                return true;
            }

            $visited[] = $cursor->id;

            if ($cursor->parent_position_id === null) {
                return false;
            }

            $cursor = Position::query()->find($cursor->parent_position_id);
        }

        return false;
    }
}
