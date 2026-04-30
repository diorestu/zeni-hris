<?php

namespace App\Services;

use App\Models\CompanySetting;
use App\Models\Employee;
use App\Models\PayrollItem;
use App\Models\PayrollRun;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

class PayslipPdfService
{
    public function download(PayrollRun $run, PayrollItem $slip, int $ownerId): Response
    {
        $documentTitle = $this->documentTitle($slip->employee, $run->period);

        return Pdf::loadView('hris.payrolls.payslip', $this->viewData($run, $slip, $ownerId, $documentTitle))
            ->setPaper('a4')
            ->download($documentTitle);
    }

    public function output(PayrollRun $run, PayrollItem $slip, int $ownerId): string
    {
        $documentTitle = $this->documentTitle($slip->employee, $run->period);

        return Pdf::loadView('hris.payrolls.payslip', $this->viewData($run, $slip, $ownerId, $documentTitle))
            ->setPaper('a4')
            ->output();
    }

    public function documentTitle(?Employee $employee, string $period): string
    {
        return sprintf(
            'Payslip_%s_%s.pdf',
            $employee?->employee_code ?: 'employee',
            Str::replace('-', '', $period),
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function viewData(PayrollRun $run, PayrollItem $slip, int $ownerId, string $documentTitle): array
    {
        $companySetting = CompanySetting::query()->firstOrCreate(
            ['user_id' => $ownerId],
            [
                'name' => 'Perusahaan',
                'details' => null,
            ],
        );

        return [
            'documentTitle' => $documentTitle,
            'companyName' => $companySetting->name,
            'companyDetails' => $companySetting->details ?: '-',
            'employee' => $slip->employee?->loadMissing(['division:id,name', 'position:id,name']),
            'run' => $run,
            'slip' => $slip,
            'periodLabel' => $run->period_start?->locale('id')->translatedFormat('F Y') ?? $run->period,
        ];
    }
}
