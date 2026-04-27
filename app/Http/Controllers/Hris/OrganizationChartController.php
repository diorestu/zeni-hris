<?php

namespace App\Http\Controllers\Hris;

use App\Http\Controllers\Controller;
use App\Models\Position;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrganizationChartController extends Controller
{
    /**
     * Display organizational chart page.
     */
    public function index(Request $request): Response
    {
        $ownerId = $request->user()->accountOwnerId();

        $positions = Position::query()
            ->where('user_id', $ownerId)
            ->with([
                'division:id,name',
                'employees' => fn ($query) => $query
                    ->where('user_id', $ownerId)
                    ->orderBy('first_name')
                    ->orderBy('last_name'),
            ])
            ->orderByRaw('CAST(COALESCE(level, 5) AS UNSIGNED)')
            ->orderBy('name')
            ->get([
                'id',
                'division_id',
                'parent_position_id',
                'code',
                'name',
                'level',
                'is_active',
            ]);

        $positionMap = $positions->keyBy('id');

        $childrenByParent = $positions->groupBy(
            fn (Position $position) => $position->parent_position_id === null
                ? 'root'
                : (string) $position->parent_position_id
        );

        $rootPositions = $positions
            ->filter(fn (Position $position) => $position->parent_position_id === null || ! $positionMap->has($position->parent_position_id))
            ->sortBy(fn (Position $position) => $this->buildSortKey($position))
            ->values();

        $tree = $rootPositions->map(
            fn (Position $position) => $this->buildNode($position, $childrenByParent, [])
        )->values();

        $maxDepth = $this->calculateMaxDepth($tree->all());

        return Inertia::render('hris/organization-chart/index', [
            'chart' => $tree,
            'stats' => [
                'total_nodes' => $positions->count(),
                'root_count' => $rootPositions->count(),
                'max_depth' => $maxDepth,
            ],
        ]);
    }

    /**
     * Build recursive organization node.
     *
     * @param  array<int, int>  $visited
     * @return array<string, mixed>
     */
    private function buildNode(Position $position, $childrenByParent, array $visited): array
    {
        if (in_array($position->id, $visited, true)) {
            return [
                'id' => $position->id,
                'position_code' => $position->code,
                'employees' => [],
                'employee_code' => 'VACANT',
                'full_name' => 'Vacant',
                'is_vacant' => true,
                'division_name' => $position->division?->name,
                'position_name' => $position->name,
                'position_level' => $this->normalizePositionLevel($position->level),
                'position_level_label' => $this->positionLevelLabel($position->level),
                'employment_status' => 'vacant',
                'is_active' => false,
                'children' => [],
                'cycle_detected' => true,
            ];
        }

        $nextVisited = [...$visited, $position->id];

        $children = collect($childrenByParent->get((string) $position->id, []))
            ->sortBy(fn (Position $child) => $this->buildSortKey($child))
            ->values()
            ->map(fn (Position $child) => $this->buildNode($child, $childrenByParent, $nextVisited))
            ->all();

        $employees = $position->employees
            ->sortBy(fn ($entry) => strtolower($entry->full_name))
            ->values();

        $isVacant = $employees->isEmpty();

        $employeesData = $employees->map(fn ($emp) => [
            'id' => $emp->id,
            'employee_code' => $emp->employee_code,
            'full_name' => $emp->full_name,
            'employment_status' => $emp->employment_status,
            'is_active' => $emp->is_active,
        ])->all();

        return [
            'id' => $position->id,
            'position_code' => $position->code,
            'employees' => $isVacant ? [] : $employeesData,
            'employee_code' => $employees->first()?->employee_code ?? 'VACANT',
            'full_name' => $employees->first()?->full_name ?? 'Vacant',
            'is_vacant' => $isVacant,
            'division_name' => $position->division?->name,
            'position_name' => $position->name,
            'position_level' => $this->normalizePositionLevel($position->level),
            'position_level_label' => $this->positionLevelLabel($position->level),
            'employment_status' => $employees->first()?->employment_status ?? 'vacant',
            'is_active' => $employees->first()?->is_active ?? false,
            'children' => $children,
            'cycle_detected' => false,
        ];
    }

    /**
     * Calculate maximum depth from recursive nodes.
     *
     * @param  array<int, array<string, mixed>>  $nodes
     */
    private function calculateMaxDepth(array $nodes): int
    {
        if ($nodes === []) {
            return 0;
        }

        $depths = array_map(function (array $node): int {
            /** @var array<int, array<string, mixed>> $children */
            $children = $node['children'] ?? [];

            if ($children === []) {
                return 1;
            }

            return 1 + $this->calculateMaxDepth($children);
        }, $nodes);

        return max($depths);
    }

    /**
     * Build consistent sort key using org level + division + name.
     */
    private function buildSortKey(Position $position): string
    {
        $level = str_pad((string) $this->normalizePositionLevel($position->level), 2, '0', STR_PAD_LEFT);
        $division = strtolower($position->division?->name ?? 'zzz');
        $positionName = strtolower($position->name);
        $code = strtolower($position->code);

        return $level.'|'.$division.'|'.$positionName.'|'.$code;
    }

    /**
     * Normalize position level into numeric hierarchy.
     */
    private function normalizePositionLevel(mixed $level): int
    {
        if (is_numeric((string) $level)) {
            $value = (int) $level;

            if ($value >= 0 && $value <= 5) {
                return $value;
            }
        }

        return 5;
    }

    /**
     * Human-readable label for position level.
     */
    private function positionLevelLabel(mixed $level): string
    {
        return match ($this->normalizePositionLevel($level)) {
            0 => 'Level 0 - Direktur Utama',
            1 => 'Level 1 - Direktur Divisi',
            2 => 'Level 2 - Manager',
            3 => 'Level 3 - Senior Staff / Supervisor',
            4 => 'Level 4 - Staff',
            default => 'Level 5 - Operator / Pelaksana',
        };
    }
}
