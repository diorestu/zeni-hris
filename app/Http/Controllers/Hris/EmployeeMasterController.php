<?php

namespace App\Http\Controllers\Hris;

use App\Http\Controllers\Controller;
use App\Models\Division;
use App\Models\Employee;
use App\Models\Position;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class EmployeeMasterController extends Controller
{
    /**
     * Display divisions and positions master page.
     */
    public function index(Request $request): InertiaResponse
    {
        $filters = $request->validate([
            'division_search' => ['nullable', 'string', 'max:100'],
            'position_search' => ['nullable', 'string', 'max:100'],
        ]);

        $normalizedFilters = [
            'division_search' => $filters['division_search'] ?? '',
            'position_search' => $filters['position_search'] ?? '',
        ];

        $divisions = Division::query()
            ->withCount(['employees', 'positions'])
            ->when($normalizedFilters['division_search'] !== '', function ($query) use ($normalizedFilters): void {
                $query->where(function ($builder) use ($normalizedFilters): void {
                    $builder
                        ->where('code', 'like', '%'.$normalizedFilters['division_search'].'%')
                        ->orWhere('name', 'like', '%'.$normalizedFilters['division_search'].'%');
                });
            })
            ->orderBy('name')
            ->paginate(10, ['*'], 'division_page')
            ->withQueryString()
            ->through(fn (Division $division) => [
                'id' => $division->id,
                'code' => $division->code,
                'name' => $division->name,
                'description' => $division->description,
                'is_active' => $division->is_active,
                'employees_count' => $division->employees_count,
                'positions_count' => $division->positions_count,
            ]);

        $positions = Position::query()
            ->with(['division:id,name', 'parentPosition:id,name'])
            ->withCount('employees')
            ->when($normalizedFilters['position_search'] !== '', function ($query) use ($normalizedFilters): void {
                $query->where(function ($builder) use ($normalizedFilters): void {
                    $builder
                        ->where('code', 'like', '%'.$normalizedFilters['position_search'].'%')
                        ->orWhere('name', 'like', '%'.$normalizedFilters['position_search'].'%')
                        ->orWhere('level', 'like', '%'.$normalizedFilters['position_search'].'%');
                });
            })
            ->orderByRaw('CASE WHEN parent_position_id IS NULL THEN 0 ELSE 1 END')
            ->orderBy('parent_position_id')
            ->orderBy('name')
            ->paginate(10, ['*'], 'position_page')
            ->withQueryString()
            ->through(fn (Position $position) => [
                'id' => $position->id,
                'division_id' => $position->division_id,
                'parent_position_id' => $position->parent_position_id,
                'code' => $position->code,
                'name' => $position->name,
                'level' => $position->level,
                'level_label' => match ((string) $position->level) {
                    '0' => 'Direktur Utama',
                    '1' => 'Direktur Divisi',
                    '2' => 'Manager',
                    '3' => 'Senior Staff / Supervisor',
                    '4' => 'Staff',
                    '5' => 'Operator / Pelaksana',
                    default => $position->level,
                },
                'description' => $position->description,
                'is_active' => $position->is_active,
                'employees_count' => $position->employees_count,
                'division' => $position->division ? [
                    'id' => $position->division->id,
                    'name' => $position->division->name,
                ] : null,
                'parent_position' => $position->parentPosition ? [
                    'id' => $position->parentPosition->id,
                    'name' => $position->parentPosition->name,
                ] : null,
            ]);

        $divisionOptions = Division::query()
            ->withCount('employees')
            ->orderBy('name')
            ->get()
            ->map(fn (Division $division) => [
                'id' => $division->id,
                'code' => $division->code,
                'name' => $division->name,
                'employees_count' => $division->employees_count,
            ])
            ->values();

        $positionOptions = Position::query()
            ->with('division:id,name')
            ->withCount('employees')
            ->orderBy('name')
            ->get()
            ->map(fn (Position $position) => [
                'id' => $position->id,
                'division_id' => $position->division_id,
                'parent_position_id' => $position->parent_position_id,
                'code' => $position->code,
                'name' => $position->name,
                'level' => $position->level,
                'division_name' => $position->division?->name,
                'employees_count' => $position->employees_count,
            ])
            ->values();

        return Inertia::render('hris/employees/master-data', [
            'divisions' => $divisions,
            'positions' => $positions,
            'divisionOptions' => $divisionOptions,
            'positionOptions' => $positionOptions,
            'filters' => $normalizedFilters,
            'stats' => [
                'employees_total' => Employee::query()->count(),
                'divisions_total' => Division::query()->count(),
                'positions_total' => Position::query()->count(),
            ],
            'options' => [
                'position_levels' => [
                    ['value' => '0', 'label' => 'Level 0 - Direktur Utama'],
                    ['value' => '1', 'label' => 'Level 1 - Direktur Divisi'],
                    ['value' => '2', 'label' => 'Level 2 - Manager'],
                    ['value' => '3', 'label' => 'Level 3 - Senior Staff / Supervisor'],
                    ['value' => '4', 'label' => 'Level 4 - Staff'],
                    ['value' => '5', 'label' => 'Level 5 - Operator / Pelaksana'],
                ],
            ],
        ]);
    }
}
