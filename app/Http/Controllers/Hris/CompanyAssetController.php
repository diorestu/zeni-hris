<?php

namespace App\Http\Controllers\Hris;

use App\Http\Controllers\Controller;
use App\Http\Requests\Hris\StoreCompanyAssetRequest;
use App\Http\Requests\Hris\UpdateCompanyAssetRequest;
use App\Models\CompanyAsset;
use App\Models\CompanyAssetAssignment;
use App\Models\Employee;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CompanyAssetController extends Controller
{
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'max:30'],
            'category' => ['nullable', 'string', 'max:80'],
        ]);

        $assets = CompanyAsset::query()
            ->with([
                'activeAssignment.employee:id,employee_code,first_name,last_name',
                'assignments' => fn ($query) => $query
                    ->with('employee:id,employee_code,first_name,last_name')
                    ->latest('issued_at')
                    ->latest('id')
                    ->limit(5),
            ])
            ->when($validated['search'] ?? null, function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query
                        ->where('asset_code', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('brand', 'like', "%{$search}%")
                        ->orWhere('model', 'like', "%{$search}%")
                        ->orWhere('serial_number', 'like', "%{$search}%");
                });
            })
            ->when($validated['status'] ?? null, fn ($query, string $status) => $query->where('status', $status))
            ->when($validated['category'] ?? null, fn ($query, string $category) => $query->where('category', $category))
            ->orderBy('asset_code')
            ->get();

        $employeeOptions = Employee::query()
            ->select(['id', 'employee_code', 'first_name', 'last_name'])
            ->where('is_active', true)
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get()
            ->map(fn (Employee $employee) => [
                'id' => $employee->id,
                'label' => $employee->employee_code.' - '.$employee->full_name,
            ])
            ->values();

        $categories = CompanyAsset::query()
            ->whereNotNull('category')
            ->where('category', '!=', '')
            ->distinct()
            ->orderBy('category')
            ->pluck('category')
            ->values();

        return Inertia::render('hris/assets/index', [
            'filters' => [
                'search' => $validated['search'] ?? '',
                'status' => $validated['status'] ?? '',
                'category' => $validated['category'] ?? '',
            ],
            'assets' => $assets->map(fn (CompanyAsset $asset) => $this->assetPayload($asset))->values(),
            'employeeOptions' => $employeeOptions,
            'categories' => $categories,
        ]);
    }

    public function store(StoreCompanyAssetRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $asset = CompanyAsset::query()->create($this->assetAttributes($validated));

        if ($request->hasFile('purchase_proof')) {
            $this->storePurchaseProof($asset, $request->file('purchase_proof'));
        }

        $this->syncAssignment($asset, $validated);

        return to_route('hris.assets.index');
    }

    public function update(UpdateCompanyAssetRequest $request, CompanyAsset $companyAsset): RedirectResponse
    {
        $validated = $request->validated();

        $companyAsset->update($this->assetAttributes($validated));

        if ($request->hasFile('purchase_proof')) {
            $this->storePurchaseProof($companyAsset, $request->file('purchase_proof'));
        }

        $this->syncAssignment($companyAsset, $validated);

        return to_route('hris.assets.index');
    }

    public function destroy(CompanyAsset $companyAsset): RedirectResponse
    {
        if ($companyAsset->purchase_proof_path) {
            Storage::disk('public')->delete($companyAsset->purchase_proof_path);
        }

        $companyAsset->delete();

        return to_route('hris.assets.index');
    }

    private function assetPayload(CompanyAsset $asset): array
    {
        $depreciation = $asset->depreciationSummary();
        $activeAssignment = $asset->activeAssignment;

        return [
            'id' => $asset->id,
            'asset_code' => $asset->asset_code,
            'name' => $asset->name,
            'category' => $asset->category,
            'brand' => $asset->brand,
            'model' => $asset->model,
            'serial_number' => $asset->serial_number,
            'purchase_date' => $asset->purchase_date?->format('Y-m-d'),
            'purchase_price' => $asset->purchase_price,
            'purchase_proof_url' => $asset->purchase_proof_path ? Storage::disk('public')->url($asset->purchase_proof_path) : null,
            'purchase_proof_original_name' => $asset->purchase_proof_original_name,
            'condition' => $asset->condition,
            'status' => $asset->status,
            'useful_life_months' => $asset->useful_life_months,
            'salvage_value' => $asset->salvage_value,
            'notes' => $asset->notes,
            'active_assignment' => $activeAssignment ? [
                'id' => $activeAssignment->id,
                'employee_id' => $activeAssignment->employee_id,
                'employee_label' => $activeAssignment->employee
                    ? $activeAssignment->employee->employee_code.' - '.$activeAssignment->employee->full_name
                    : '-',
                'issued_at' => $activeAssignment->issued_at?->format('Y-m-d'),
                'condition_out' => $activeAssignment->condition_out,
                'notes' => $activeAssignment->notes,
            ] : null,
            'assignments' => $asset->assignments->map(fn (CompanyAssetAssignment $assignment) => [
                'id' => $assignment->id,
                'employee_label' => $assignment->employee
                    ? $assignment->employee->employee_code.' - '.$assignment->employee->full_name
                    : '-',
                'issued_at' => $assignment->issued_at?->format('Y-m-d'),
                'returned_at' => $assignment->returned_at?->format('Y-m-d'),
                'condition_out' => $assignment->condition_out,
                'condition_in' => $assignment->condition_in,
                'notes' => $assignment->notes,
            ])->values(),
            'depreciation' => $depreciation,
        ];
    }

    private function assetAttributes(array $validated): array
    {
        return [
            'asset_code' => $validated['asset_code'],
            'name' => $validated['name'],
            'category' => $validated['category'] ?? null,
            'brand' => $validated['brand'] ?? null,
            'model' => $validated['model'] ?? null,
            'serial_number' => $validated['serial_number'] ?? null,
            'purchase_date' => $validated['purchase_date'] ?? null,
            'purchase_price' => $validated['purchase_price'],
            'condition' => $validated['condition'],
            'status' => $validated['status'],
            'useful_life_months' => $validated['useful_life_months'],
            'salvage_value' => $validated['salvage_value'] ?? 0,
            'notes' => $validated['notes'] ?? null,
        ];
    }

    private function storePurchaseProof(CompanyAsset $asset, UploadedFile $file): void
    {
        $oldPath = $asset->purchase_proof_path;
        $path = $file->store('assets/purchase-proofs', 'public');

        $asset->forceFill([
            'purchase_proof_path' => $path,
            'purchase_proof_original_name' => $file->getClientOriginalName(),
        ])->save();

        if ($oldPath) {
            Storage::disk('public')->delete($oldPath);
        }
    }

    private function syncAssignment(CompanyAsset $asset, array $validated): void
    {
        $asset->load('activeAssignment');
        $activeAssignment = $asset->activeAssignment;
        $employeeId = $validated['employee_id'] ?? null;
        $returnedAt = $validated['returned_at'] ?? null;

        if (! $employeeId) {
            if ($activeAssignment) {
                $activeAssignment->update([
                    'returned_at' => $returnedAt ?: now()->toDateString(),
                    'condition_in' => $validated['condition_in'] ?? $asset->condition,
                ]);

                if ($asset->status === 'assigned') {
                    $asset->update(['status' => 'available']);
                }
            }

            return;
        }

        if ($activeAssignment && (int) $activeAssignment->employee_id === (int) $employeeId) {
            $activeAssignment->update([
                'issued_at' => $validated['issued_at'],
                'returned_at' => $returnedAt,
                'condition_out' => $validated['condition_out'] ?? $asset->condition,
                'condition_in' => $validated['condition_in'] ?? null,
                'notes' => $validated['assignment_notes'] ?? null,
            ]);

            if ($returnedAt && $asset->status === 'assigned') {
                $asset->update(['status' => 'available']);
            }

            return;
        }

        if ($activeAssignment) {
            $activeAssignment->update([
                'returned_at' => $returnedAt ?: now()->toDateString(),
                'condition_in' => $validated['condition_in'] ?? $asset->condition,
            ]);
        }

        if (! $returnedAt) {
            $asset->assignments()->create([
                'employee_id' => $employeeId,
                'issued_at' => $validated['issued_at'],
                'condition_out' => $validated['condition_out'] ?? $asset->condition,
                'notes' => $validated['assignment_notes'] ?? null,
            ]);

            if ($asset->status !== 'assigned') {
                $asset->update(['status' => 'assigned']);
            }
        }
    }
}
