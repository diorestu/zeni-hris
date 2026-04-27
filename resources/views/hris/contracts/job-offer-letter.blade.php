<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>{{ $documentTitle }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #111827;
            margin: 36px;
        }

        h1, p {
            margin: 0;
        }

        .header {
            margin-bottom: 24px;
            text-align: center;
        }

        .header h1 {
            font-size: 16pt;
            margin-bottom: 8px;
            text-transform: uppercase;
        }

        .meta-table,
        .signature {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
        }

        .meta-table td {
            padding: 4px 0;
            vertical-align: top;
        }

        .label {
            width: 190px;
            white-space: nowrap;
        }

        .section {
            margin-top: 20px;
            text-align: justify;
        }

        .signature td {
            width: 50%;
            text-align: center;
            padding-top: 12px;
            vertical-align: top;
        }

        .signature-space {
            height: 72px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Surat Penawaran Kerja</h1>
        <p>Nomor: {{ $offerNumber }}</p>
    </div>

    <p>{{ $offerDateText }}</p>

    <div class="section">
        <p>Kepada Yth. <strong>{{ $application->full_name }}</strong>,</p>
    </div>

    <div class="section">
        <p>
            Berdasarkan proses seleksi yang telah dijalankan, {{ $companyName }}
            dengan ini menyampaikan penawaran kerja untuk posisi
            <strong>{{ $vacancy?->position?->name ?: $vacancy?->title ?: 'kandidat terpilih' }}</strong>
            pada divisi <strong>{{ $vacancy?->division?->name ?: '-' }}</strong>.
        </p>
    </div>

    <table class="meta-table">
        <tr>
            <td class="label">Nama Kandidat</td>
            <td>: {{ $application->full_name }}</td>
        </tr>
        <tr>
            <td class="label">Email</td>
            <td>: {{ $application->email }}</td>
        </tr>
        <tr>
            <td class="label">No. Telepon</td>
            <td>: {{ $application->phone }}</td>
        </tr>
        <tr>
            <td class="label">Posisi</td>
            <td>: {{ $vacancy?->position?->name ?: $vacancy?->title ?: '-' }}</td>
        </tr>
        <tr>
            <td class="label">Tipe Hubungan Kerja</td>
            <td>: {{ $employmentTypeLabel }}</td>
        </tr>
        <tr>
            <td class="label">Lokasi Kerja</td>
            <td>: {{ $vacancy?->location ?: '-' }}</td>
        </tr>
        <tr>
            <td class="label">Tanggal Mulai</td>
            <td>: {{ $startDateText }}</td>
        </tr>
        <tr>
            <td class="label">Kompensasi</td>
            <td>: {{ $salaryText }}</td>
        </tr>
    </table>

    <div class="section">
        <p>
            Dokumen ini merupakan draft offering letter internal yang digenerate dari modul
            rekrutmen HRIS. Detail benefit, masa percobaan, serta klausul tambahan dapat
            disesuaikan lebih lanjut sesuai kebijakan {{ $companyName }}.
        </p>
    </div>

    <div class="section">
        <p>
            Apabila kandidat bersedia melanjutkan proses, dokumen ini dapat dijadikan dasar
            untuk penyusunan kontrak kerja awal.
        </p>
    </div>

    <table class="signature">
        <tr>
            <td>
                <p>Hormat kami,</p>
                <div class="signature-space"></div>
                <p><strong>{{ $companyName }}</strong></p>
                <p>{{ $companyDetails }}</p>
            </td>
            <td>
                <p>Penerima Penawaran,</p>
                <div class="signature-space"></div>
                <p><strong>{{ $application->full_name }}</strong></p>
            </td>
        </tr>
    </table>
</body>
</html>
