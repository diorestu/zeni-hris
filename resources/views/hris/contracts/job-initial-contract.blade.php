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

        .party-table,
        .signature {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
        }

        .party-table td {
            padding: 4px 0;
            vertical-align: top;
        }

        .label {
            width: 180px;
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
        <h1>Draft Kontrak Kerja Awal</h1>
        <p>Nomor: {{ $contractNumber }}</p>
    </div>

    <p>Pada hari ini {{ $contractDateText }}, para pihak menerangkan hal-hal sebagai berikut:</p>

    <table class="party-table">
        <tr>
            <td class="label">Nama Perusahaan</td>
            <td>: {{ $companyName }}</td>
        </tr>
        <tr>
            <td class="label">Keterangan Perusahaan</td>
            <td>: {{ $companyDetails }}</td>
        </tr>
        <tr>
            <td class="label">Bertindak sebagai</td>
            <td>: Pihak Pertama</td>
        </tr>
    </table>

    <table class="party-table">
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
            <td class="label">Alamat</td>
            <td>: {{ $application->address ?: '-' }}</td>
        </tr>
        <tr>
            <td class="label">Divisi</td>
            <td>: {{ $vacancy?->division?->name ?: '-' }}</td>
        </tr>
        <tr>
            <td class="label">Posisi</td>
            <td>: {{ $vacancy?->position?->name ?: $vacancy?->title ?: '-' }}</td>
        </tr>
        <tr>
            <td class="label">Tanggal Mulai</td>
            <td>: {{ $startDateText }}</td>
        </tr>
        <tr>
            <td class="label">Tipe Hubungan Kerja</td>
            <td>: {{ $employmentTypeLabel }}</td>
        </tr>
        <tr>
            <td class="label">Kompensasi</td>
            <td>: {{ $salaryText }}</td>
        </tr>
        <tr>
            <td class="label">Bertindak sebagai</td>
            <td>: Pihak Kedua</td>
        </tr>
    </table>

    <div class="section">
        <p>
            Pihak Pertama bermaksud mengikat hubungan kerja awal dengan Pihak Kedua untuk
            menjalankan tanggung jawab pada posisi
            <strong>{{ $vacancy?->position?->name ?: $vacancy?->title ?: 'kandidat terpilih' }}</strong>.
            Pelaksanaan kerja, target, masa kontrak, dan ketentuan operasional lain akan
            mengikuti kebijakan perusahaan yang berlaku.
        </p>
    </div>

    <div class="section">
        <p>
            Draft ini dihasilkan otomatis dari modul rekrutmen HRIS dan dapat digunakan
            sebagai dasar penyusunan kontrak final. Penambahan pasal hukum, detail benefit,
            masa percobaan, dan klausul kerahasiaan dapat dilengkapi oleh perusahaan.
        </p>
    </div>

    <table class="signature">
        <tr>
            <td>
                <p>Pihak Pertama</p>
                <div class="signature-space"></div>
                <p><strong>{{ $companyName }}</strong></p>
            </td>
            <td>
                <p>Pihak Kedua</p>
                <div class="signature-space"></div>
                <p><strong>{{ $application->full_name }}</strong></p>
            </td>
        </tr>
    </table>
</body>
</html>
