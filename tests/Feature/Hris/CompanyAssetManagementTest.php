<?php

namespace Tests\Feature\Hris;

use App\Models\CompanyAsset;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CompanyAssetManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_verified_users_can_open_asset_management_page(): void
    {
        $this->withoutVite();

        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $this->actingAs($user)->get(route('hris.assets.index'))->assertOk();
    }

    public function test_admin_can_store_asset_with_assignment_purchase_proof_and_depreciation(): void
    {
        Storage::fake('public');

        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);
        $employee = Employee::factory()->create([
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->post(route('hris.assets.store'), [
            'asset_code' => 'AST-001',
            'name' => 'Laptop Operasional',
            'category' => 'IT',
            'brand' => 'Lenovo',
            'model' => 'ThinkPad',
            'serial_number' => 'SN-001',
            'purchase_date' => now()->subMonths(6)->toDateString(),
            'purchase_price' => 12000000,
            'purchase_proof' => UploadedFile::fake()->create('invoice.pdf', 128, 'application/pdf'),
            'condition' => 'good',
            'status' => 'available',
            'useful_life_months' => 24,
            'salvage_value' => 2000000,
            'notes' => 'Unit utama',
            'employee_id' => $employee->id,
            'issued_at' => now()->subDays(5)->toDateString(),
            'condition_out' => 'good',
            'assignment_notes' => 'Diserahkan ke user',
        ]);

        $response->assertRedirect(route('hris.assets.index'));

        $asset = CompanyAsset::query()->where('asset_code', 'AST-001')->firstOrFail();

        $this->assertSame('assigned', $asset->status);
        $this->assertNotNull($asset->purchase_proof_path);
        Storage::disk('public')->assertExists($asset->purchase_proof_path);

        $this->assertDatabaseHas('company_asset_assignments', [
            'company_asset_id' => $asset->id,
            'employee_id' => $employee->id,
            'returned_at' => null,
            'condition_out' => 'good',
        ]);

        $depreciation = $asset->depreciationSummary();
        $this->assertSame(416666.67, $depreciation['monthly_depreciation']);
        $this->assertSame(9500000.0, $depreciation['book_value']);
    }

    public function test_admin_can_return_assigned_asset(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);
        $employee = Employee::factory()->create([
            'user_id' => $user->id,
        ]);
        $asset = CompanyAsset::query()->create([
            'user_id' => $user->id,
            'asset_code' => 'AST-002',
            'name' => 'Handphone Sales',
            'purchase_price' => 5000000,
            'purchase_date' => '2026-01-01',
            'condition' => 'good',
            'status' => 'assigned',
            'useful_life_months' => 24,
            'salvage_value' => 500000,
        ]);
        $asset->assignments()->create([
            'user_id' => $user->id,
            'employee_id' => $employee->id,
            'issued_at' => '2026-02-01',
            'condition_out' => 'good',
        ]);

        $this->actingAs($user)->put(route('hris.assets.update', $asset), [
            'asset_code' => 'AST-002',
            'name' => 'Handphone Sales',
            'category' => 'IT',
            'brand' => null,
            'model' => null,
            'serial_number' => null,
            'purchase_date' => '2026-01-01',
            'purchase_price' => 5000000,
            'condition' => 'fair',
            'status' => 'available',
            'useful_life_months' => 24,
            'salvage_value' => 500000,
            'notes' => null,
            'employee_id' => null,
            'issued_at' => '2026-02-01',
            'returned_at' => '2026-03-10',
            'condition_out' => 'good',
            'condition_in' => 'fair',
            'assignment_notes' => null,
        ])->assertRedirect(route('hris.assets.index'));

        $this->assertDatabaseHas('company_asset_assignments', [
            'company_asset_id' => $asset->id,
            'employee_id' => $employee->id,
            'issued_at' => '2026-02-01 00:00:00',
            'returned_at' => '2026-03-10 00:00:00',
            'condition_in' => 'fair',
        ]);
    }
}
