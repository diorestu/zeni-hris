<?php

namespace App\Jobs;

use App\Models\CompanySetting;
use App\Models\PayrollItem;
use App\Services\PayslipPdfService;
use App\Services\WahaClient;
use App\Support\WhatsAppPhone;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Middleware\RateLimited;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class SendPayslipToWhatsApp implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(
        public readonly int $payrollItemId,
        public readonly int $ownerId,
    ) {}

    /**
     * @return array<int, object>
     */
    public function middleware(): array
    {
        return [(new RateLimited('payslip-whatsapp'))->releaseAfter(60)];
    }

    public function handle(PayslipPdfService $payslipPdfService, WahaClient $wahaClient): void
    {
        $item = PayrollItem::query()
            ->withoutGlobalScopes()
            ->with([
                'payrollRun',
                'employee:id,employee_code,first_name,last_name,email,phone,division_id,position_id',
                'employee.division:id,name',
                'employee.position:id,name',
            ])
            ->where('user_id', $this->ownerId)
            ->findOrFail($this->payrollItemId);

        $run = $item->payrollRun;
        $employee = $item->employee;

        if (! $run?->is_saved) {
            throw new RuntimeException('Payroll belum disimpan.');
        }

        if (! $employee || ! $employee->phone || ! WhatsAppPhone::isValid($employee->phone)) {
            throw new RuntimeException('Nomor WhatsApp karyawan tidak valid.');
        }

        $company = CompanySetting::query()
            ->withoutGlobalScopes()
            ->where('user_id', $this->ownerId)
            ->first();

        $filename = $payslipPdfService->documentTitle($employee, $run->period);
        $wahaClient->sendFileToPhone(
            $employee->phone,
            $filename,
            $payslipPdfService->output($run, $item, $this->ownerId),
            $this->caption(
                $employee->full_name,
                $run->period_start?->locale('id')->translatedFormat('F Y') ?? $run->period,
                $company?->name ?: config('app.name', 'Perusahaan'),
            ),
        );

        Log::info('payroll.payslip_whatsapp.queued_job_sent', [
            'payroll_run_id' => $run->id,
            'payroll_item_id' => $item->id,
            'employee_id' => $employee->id,
        ]);
    }

    private function caption(string $employeeName, string $periodLabel, string $companyName): string
    {
        return sprintf(
            "Dear %s,\nBerikut adalah slip gaji periode %s dari %s.\nMohon untuk menjaga kerahasiaan dokumen ini. Jika terdapat pertanyaan, silakan hubungi tim HR atau Management.\n\nTerima kasih.",
            $employeeName,
            $periodLabel,
            $companyName,
        );
    }
}
