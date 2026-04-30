<?php

namespace App\Jobs;

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
    ) {
        $this->onQueue('whatsapp');
    }

    /**
     * @return array<int, object>
     */
    public function middleware(): array
    {
        return [new RateLimited('payslip-whatsapp')];
    }

    public function handle(PayslipPdfService $payslipPdfService, WahaClient $wahaClient): void
    {
        $item = PayrollItem::query()
            ->with([
                'payrollRun',
                'employee:id,employee_code,first_name,last_name,email,phone,division_id,position_id',
                'employee.division:id,name',
                'employee.position:id,name',
            ])
            ->findOrFail($this->payrollItemId);

        $run = $item->payrollRun;
        $employee = $item->employee;

        if (! $run?->is_saved) {
            throw new RuntimeException('Payroll belum disimpan.');
        }

        if (! $employee || ! $employee->phone || ! WhatsAppPhone::isValid($employee->phone)) {
            throw new RuntimeException('Nomor WhatsApp karyawan tidak valid.');
        }

        $filename = $payslipPdfService->documentTitle($employee, $run->period);
        $caption = sprintf(
            "Halo %s,\n\nBerikut slip gaji periode %s dalam format PDF.\n\nTerima kasih.",
            $employee->full_name,
            $run->period_start?->locale('id')->translatedFormat('F Y') ?? $run->period,
        );

        $wahaClient->sendFileToPhone(
            $employee->phone,
            $filename,
            $payslipPdfService->output($run, $item, $this->ownerId),
            $caption,
        );

        Log::info('payroll.payslip_whatsapp.queued_job_sent', [
            'payroll_run_id' => $run->id,
            'payroll_item_id' => $item->id,
            'employee_id' => $employee->id,
        ]);
    }
}
