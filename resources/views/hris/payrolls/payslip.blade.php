<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>{{ $documentTitle }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            color: #0f172a;
            margin: 28px;
            font-size: 11pt;
        }

        h1, h2, h3, p {
            margin: 0;
        }

        .shell {
            border: 1px solid #dbe3ea;
            border-radius: 20px;
            overflow: hidden;
        }

        .hero {
            background: #0f172a;
            color: #fff;
            padding: 24px 28px;
        }

        .hero h1 {
            font-size: 22px;
            margin-top: 6px;
        }

        .muted {
            color: #64748b;
        }

        .hero .muted {
            color: rgba(255, 255, 255, 0.72);
        }

        .section {
            padding: 22px 28px;
            border-top: 1px solid #e2e8f0;
        }

        .grid {
            width: 100%;
            border-collapse: collapse;
        }

        .grid td {
            padding: 6px 0;
            vertical-align: top;
        }

        .label {
            width: 180px;
            color: #64748b;
        }

        .money-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
        }

        .money-table th,
        .money-table td {
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
            text-align: left;
        }

        .money-table td:last-child,
        .money-table th:last-child {
            text-align: right;
        }

        .summary {
            margin-top: 18px;
            padding: 16px 18px;
            background: #f8fafc;
            border-radius: 14px;
        }

        .summary strong {
            float: right;
        }
    </style>
</head>
<body>
    <div class="shell">
        <div class="hero">
            <p class="muted">Payroll Portal</p>
            <h1>Payslip {{ $periodLabel }}</h1>
            <p class="muted" style="margin-top: 8px;">{{ $companyName }} · {{ $companyDetails }}</p>
        </div>

        <div class="section">
            <h2 style="font-size: 15px; margin-bottom: 12px;">Informasi Karyawan</h2>
            <table class="grid">
                <tr>
                    <td class="label">Nama</td>
                    <td>{{ $employee->full_name }}</td>
                </tr>
                <tr>
                    <td class="label">ID Karyawan</td>
                    <td>{{ $employee->employee_code ?: '-' }}</td>
                </tr>
                <tr>
                    <td class="label">Email</td>
                    <td>{{ $employee->email ?: '-' }}</td>
                </tr>
                <tr>
                    <td class="label">Divisi</td>
                    <td>{{ $employee->division?->name ?: '-' }}</td>
                </tr>
                <tr>
                    <td class="label">Jabatan</td>
                    <td>{{ $employee->position?->name ?: '-' }}</td>
                </tr>
                <tr>
                    <td class="label">Periode</td>
                    <td>
                        {{ $run->period_start?->locale('id')->translatedFormat('d M Y') ?: '-' }}
                        -
                        {{ $run->period_end?->locale('id')->translatedFormat('d M Y') ?: '-' }}
                    </td>
                </tr>
            </table>
        </div>

        <div class="section">
            <h2 style="font-size: 15px; margin-bottom: 8px;">Rincian Penghasilan</h2>
            <table class="money-table">
                <thead>
                    <tr>
                        <th>Keterangan</th>
                        <th>Nominal</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Gaji Pokok</td>
                        <td>Rp {{ number_format((float) $slip->base_salary, 0, ',', '.') }}</td>
                    </tr>
                    @foreach (($slip->allowance_breakdown ?? []) as $name => $amount)
                        <tr>
                            <td>{{ $name }}</td>
                            <td>Rp {{ number_format((float) $amount, 0, ',', '.') }}</td>
                        </tr>
                    @endforeach
                    <tr>
                        <td>Total Tunjangan</td>
                        <td>Rp {{ number_format((float) $slip->allowances_total, 0, ',', '.') }}</td>
                    </tr>
                    <tr>
                        <td>PPh21 ({{ strtoupper((string) ($slip->pph21_method ?? '-')) }} · {{ number_format((float) ($slip->pph21_rate ?? 0), 2, ',', '.') }}%)</td>
                        <td>(Rp {{ number_format((float) ($slip->pph21_deduction ?? 0), 0, ',', '.') }})</td>
                    </tr>
                    <tr>
                        <td>Tunjangan PPh21</td>
                        <td>Rp {{ number_format((float) ($slip->pph21_allowance ?? 0), 0, ',', '.') }}</td>
                    </tr>
                    <tr>
                        <td>Kasbon</td>
                        <td>(Rp {{ number_format((float) $slip->kasbon_deduction, 0, ',', '.') }})</td>
                    </tr>
                    <tr>
                        <td>Denda</td>
                        <td>(Rp {{ number_format((float) $slip->denda_deduction, 0, ',', '.') }})</td>
                    </tr>
                    <tr>
                        <td>Total Potongan</td>
                        <td>(Rp {{ number_format((float) $slip->deductions_total, 0, ',', '.') }})</td>
                    </tr>
                </tbody>
            </table>

            <div class="summary">
                Take Home Pay
                <strong>Rp {{ number_format((float) $slip->net_salary, 0, ',', '.') }}</strong>
            </div>
        </div>
    </div>
</body>
</html>
