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

        h1, h2, p {
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

        .meta,
        .party-table {
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

        .signature {
            width: 100%;
            margin-top: 48px;
        }

        .signature td {
            width: 50%;
            vertical-align: top;
            text-align: center;
            padding-top: 12px;
        }

        .signature-space {
            height: 72px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Surat Perjanjian Kerja</h1>
        <p>Nomor: {{ $contractNumber }}</p>
    </div>

    <p>Pada hari ini {{ $contractDateText }}, para pihak di bawah ini:</p>

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
            <td class="label">Nama Karyawan</td>
            <td>: {{ $employee->full_name }}</td>
        </tr>
        <tr>
            <td class="label">ID Karyawan</td>
            <td>: {{ $employee->employee_code }}</td>
        </tr>
        <tr>
            <td class="label">Email</td>
            <td>: {{ $employee->email ?: '-' }}</td>
        </tr>
        <tr>
            <td class="label">No. Telepon</td>
            <td>: {{ $employee->phone ?: '-' }}</td>
        </tr>
        <tr>
            <td class="label">Alamat</td>
            <td>: {{ $employee->address ?: '-' }}</td>
        </tr>
        <tr>
            <td class="label">Divisi</td>
            <td>: {{ $employee->division?->name ?: '-' }}</td>
        </tr>
        <tr>
            <td class="label">Jabatan</td>
            <td>: {{ $employee->position?->name ?: '-' }}</td>
        </tr>
        <tr>
            <td class="label">Tanggal Masuk</td>
            <td>: {{ $hireDateText }}</td>
        </tr>
        <tr>
            <td class="label">Tipe Hubungan Kerja</td>
            <td>: {{ $employmentTypeLabel }}</td>
        </tr>
        <tr>
            <td class="label">Gaji Pokok</td>
            <td>: {{ $baseSalaryText }}</td>
        </tr>
        <tr>
            <td class="label">Bertindak sebagai</td>
            <td>: Pihak Kedua</td>
        </tr>
    </table>

    <div class="section">
        <p>
            Pihak Pertama setuju untuk mempekerjakan Pihak Kedua sebagai
            <strong>{{ $employee->position?->name ?: 'karyawan' }}</strong>
            pada divisi
            <strong>{{ $employee->division?->name ?: '-' }}</strong>
            sejak tanggal <strong>{{ $hireDateText }}</strong>, dan Pihak Kedua
            setuju untuk menjalankan tugas, tanggung jawab, serta ketentuan kerja
            sesuai kebijakan perusahaan yang berlaku.
        </p>
    </div>

    <div class="section">
        <p>
            Dokumen ini digenerate otomatis dari data master karyawan HRIS dan dapat
            digunakan sebagai draft kontrak kerja internal. Apabila diperlukan
            penambahan pasal, masa kontrak, atau klausul legal lain, dokumen ini
            dapat dilengkapi lebih lanjut oleh perusahaan.
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
                <p><strong>{{ $employee->full_name }}</strong></p>
            </td>
        </tr>
    </table>
</body>
</html>
