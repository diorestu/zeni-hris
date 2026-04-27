import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import Lenis from 'lenis';
import {
    ArrowRight,
    BadgeCheck,
    Building2,
    CalendarClock,
    ChartColumn,
    CircleDollarSign,
    Fingerprint,
    Layers3,
    NotebookPen,
    Shield,
    Sparkles,
    UserCheck,
    Users,
} from 'lucide-react';
import { dashboard, login, register } from '@/routes';

const modules = [
    {
        icon: NotebookPen,
        title: 'Rekrutmen & Database Kandidat',
        description:
            'Kelola lowongan, tahapan seleksi, dan status kandidat secara terpadu tanpa spreadsheet terpisah.',
    },
    {
        icon: Users,
        title: 'Data Karyawan Terpusat',
        description:
            'Semua data personal, jabatan, dokumen, dan riwayat kerja dalam satu dashboard yang mudah dicari.',
    },
    {
        icon: CalendarClock,
        title: 'Absensi & Jadwal Real-time',
        description:
            'Pantau kehadiran, keterlambatan, lembur, dan cuti secara real-time dari web maupun mobile.',
    },
    {
        icon: CircleDollarSign,
        title: 'Payroll & Kasbon Otomatis',
        description:
            'Generate payroll dengan potongan kasbon, denda, tunjangan, dan komponen gaji yang fleksibel.',
    },
    {
        icon: ChartColumn,
        title: 'Analitik SDM Real-time',
        description:
            'Lihat tren produktivitas, turnover, dan efektivitas tenaga kerja untuk keputusan yang lebih cepat.',
    },
    {
        icon: Layers3,
        title: 'Workflow Approval Berlapis',
        description:
            'Atur alur approval lintas jabatan dengan SLA dan notifikasi otomatis agar proses tidak tersendat.',
    },
    {
        icon: Fingerprint,
        title: 'Approval Berlapis',
        description:
            'Alur persetujuan cuti, lembur, dan perubahan data dengan role dan level otorisasi yang jelas.',
    },
    {
        icon: Shield,
        title: 'Keamanan & Kepatuhan Data',
        description:
            'Akses berbasis role, audit log, dan standar keamanan untuk menjaga data karyawan tetap aman.',
    },
];

const highlights = [
    'Implementasi cepat, tim HR bisa langsung go-live.',
    'Cocok untuk multi divisi dan struktur organisasi bertingkat.',
    'Mengurangi proses manual dan risiko human error payroll.',
];

const stats = [
    { label: 'Efisiensi proses HR', value: '70%' },
    { label: 'Waktu proses payroll', value: '< 10 menit' },
    { label: 'Akurasi data', value: '99.9%' },
    { label: 'Pengurangan approval bottleneck', value: '45%' },
];

const timeline = [
    {
        title: 'Atur struktur organisasi',
        detail:
            'Buat divisi, jabatan, level, dan sub-jabatan sesuai struktur perusahaan Anda.',
    },
    {
        title: 'Input data karyawan via wizard',
        detail:
            'Onboarding data personal, pekerjaan, dan dokumen jadi lebih cepat dan minim error.',
    },
    {
        title: 'Jalankan HR harian otomatis',
        detail:
            'Absensi, approval, kasbon, dan payroll berjalan dalam alur terpadu.',
    },
];

const testimonials = [
    {
        quote: 'Tim HR kami akhirnya tidak lagi lembur saat closing payroll bulanan.',
        author: 'Nadia Putri',
        role: 'HR Manager, Retail Group',
    },
    {
        quote: 'Struktur jabatan dan org chart jadi rapi, termasuk posisi yang masih vacant.',
        author: 'Rian Mahesa',
        role: 'People Ops Lead, Distribution Company',
    },
];

const clientLogos = [
    { name: 'Nusantara Retail', logo: '/images/clients/nusantara-retail.svg' },
    { name: 'Sentra Distribusi', logo: '/images/clients/sentra-distribusi.svg' },
    { name: 'Prima Manufacture', logo: '/images/clients/prima-manufacture.svg' },
    { name: 'Arunika F&B', logo: '/images/clients/arunika-fnb.svg' },
    { name: 'Kawan Konsultan', logo: '/images/clients/kawan-konsultan.svg' },
    { name: 'Bumi Logistic', logo: '/images/clients/bumi-logistic.svg' },
    { name: 'Rasa Nusantara', logo: '/images/clients/rasa-nusantara.svg' },
    { name: 'Andalan Tekstil', logo: '/images/clients/andalan-tekstil.svg' },
];

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage().props;

    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            smoothTouch: false,
            touchMultiplier: 2,
        });

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
        };
    }, []);

    return (
        <>
            <Head title="ZENI HRIS">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div
                className="relative min-h-screen overflow-x-hidden bg-[#ffffff] text-slate-900"
                style={{
                    fontFamily:
                        'Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif',
                }}
            >
                <div className="welcome-grid-bg pointer-events-none absolute inset-0 -z-10">
                    <div className="absolute top-[-260px] left-[-140px] h-[480px] w-[480px] rounded-full bg-[#2578ff]/22 blur-3xl" />
                    <div className="absolute right-[-140px] top-[120px] h-[430px] w-[430px] rounded-full bg-[#00b2ff]/20 blur-3xl" />
                    <div className="absolute right-[15%] bottom-[-140px] h-[360px] w-[360px] rounded-full bg-[#ffb15a]/20 blur-3xl" />
                </div>

                <header className="fixed top-0 left-0 right-0 z-40 border-b border-slate-200/70 bg-white/95 backdrop-blur">
                    <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-4 pb-3 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#1363df] to-[#14a5ff] text-white shadow-lg shadow-blue-400/30">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                                <p
                                    className="text-base font-semibold tracking-tight"
                                    style={{
                                        fontFamily:
                                            'Inter, Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif',
                                    }}
                                >
                                    ZENI HRIS
                                </p>
                                <p className="text-xs text-slate-600">
                                    Sistem Informasi Sumber Daya Manusia
                                </p>
                            </div>
                        </div>

                        <nav className="flex items-center gap-2 sm:gap-3">
                            <a
                                href="#fitur"
                                className="hidden rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white/80 hover:text-slate-900 md:inline-flex"
                            >
                                Fitur
                            </a>
                            <a
                                href="#keunggulan"
                                className="hidden rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white/80 hover:text-slate-900 md:inline-flex"
                            >
                                Solusi
                            </a>
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="inline-flex items-center gap-2 rounded-full bg-[#0f56d7] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                                >
                                    Buka Dashboard
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="inline-flex items-center rounded-full border border-slate-300 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 backdrop-blur transition hover:border-slate-400"
                                    >
                                        Masuk
                                    </Link>
                                    {canRegister && (
                                        <Link
                                            href={register()}
                                            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0f56d7] to-[#1aa8ff] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-cyan-400/25 transition hover:brightness-110"
                                        >
                                            Coba Gratis
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    )}
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-[72px] sm:px-6 lg:px-8">
                    <section className="flex flex-col items-center justify-center gap-8 pb-14 pt-6 md:gap-10 lg:pt-10">
                        <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto flex max-w-3xl flex-col items-center text-center duration-700">
                            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#bfdbff] bg-white/85 px-3 py-1 text-xs font-semibold text-[#0f56d7] backdrop-blur">
                                <Sparkles className="h-3.5 w-3.5" />
                                Human Capital Platform untuk bisnis Indonesia
                            </div>

                            <h1
                                className="max-w-2xl text-4xl leading-tight font-bold tracking-tight text-slate-900 md:text-5xl"
                                style={{
                                    fontFamily:
                                        'Inter, Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif',
                                }}
                            >
                                Satu platform untuk kelola SDM, payroll, dan
                                produktivitas tim dari hulu ke hilir.
                            </h1>

                            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg">
                                ZENI HRIS dirancang dengan struktur operasional
                                HR modern seperti landing enterprise SaaS:
                                informatif, terukur, dan fokus pada dampak
                                bisnis. Semua alur dari rekrutmen, kehadiran,
                                approval, hingga payroll berjalan lebih cepat
                                dalam satu workflow.
                            </p>

                            <div className="mt-7 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                                <Link
                                    href={auth.user ? dashboard() : login()}
                                    className="inline-flex items-center gap-2 rounded-full bg-[#0f56d7] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                                >
                                    {auth.user
                                        ? 'Masuk ke Dashboard'
                                        : 'Lihat Produk'}
                                    <ArrowRight className="h-4 w-4" />
                                </Link>

                                <a
                                    href="#fitur"
                                    className="inline-flex items-center rounded-full border border-[#b5cfff] bg-white px-5 py-2.5 text-sm font-semibold text-[#0f56d7] transition hover:border-[#8eb7ff]"
                                >
                                    Jelajahi Solusi
                                </a>
                            </div>

                            <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                {stats.map((stat) => (
                                    <div
                                        key={stat.label}
                                        className="rounded-2xl border border-[#dbe8ff] bg-white/90 px-4 py-3 shadow-sm"
                                    >
                                        <p className="text-xl font-bold text-[#0f56d7]">
                                            {stat.value}
                                        </p>
                                        <p className="text-xs text-slate-600">
                                            {stat.label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                            <div className="rounded-3xl border border-[#dbe8ff] bg-white p-5 shadow-xl shadow-blue-900/10 md:p-6">
                                <div className="mb-4 flex items-center justify-between">
                                    <p className="text-sm font-semibold text-slate-700">
                                        HR Executive Dashboard
                                    </p>
                                    <span className="rounded-full bg-[#e5f5ff] px-2.5 py-1 text-[11px] font-semibold text-[#0f56d7]">
                                        Live
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {[
                                        'Headcount, attendance, dan overtime dalam satu tampilan',
                                        'Approval cuti berjenjang berdasarkan struktur organisasi',
                                        'Payroll kalkulasi otomatis dengan komponen fleksibel',
                                        'Monitoring biaya SDM per divisi secara real-time',
                                    ].map((item) => (
                                        <div
                                            key={item}
                                            className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                                        >
                                            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0f56d7]" />
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-5 rounded-2xl bg-gradient-to-r from-[#0f56d7] via-[#1a73e8] to-[#1aa8ff] p-4 text-white">
                                    <p className="text-xs uppercase tracking-[0.14em] text-blue-100/95">
                                        Human Capital Index
                                    </p>
                                    <div className="mt-2 flex items-end justify-between gap-2">
                                        <p className="text-2xl font-bold">92.6/100</p>
                                        <p className="text-xs text-cyan-100">
                                            Produktivitas tim naik 12.4% QoQ
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="animate-in fade-in slide-in-from-bottom-4 rounded-3xl border border-[#dbe8ff] bg-white/90 px-4 py-5 shadow-sm backdrop-blur duration-700 delay-300 sm:px-6">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-700">
                                Dipercaya perusahaan yang terus bertumbuh
                            </p>
                            <p className="text-xs text-slate-500">
                                Dari retail, distribusi, manufaktur, hingga jasa profesional
                            </p>
                        </div>

                        <div className="logo-marquee">
                            <div className="logo-marquee-track">
                                {[...clientLogos, ...clientLogos].map((client, index) => (
                                    <div
                                        key={`${client.name}-${index}`}
                                        className="group flex min-w-[230px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                                    >
                                        <div className="w-full">
                                            <img
                                                src={client.logo}
                                                alt={`Logo ${client.name}`}
                                                className="h-10 w-full object-contain grayscale transition duration-300 group-hover:grayscale-0"
                                                loading="lazy"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section id="fitur" className="pt-18 pb-8">
                        <div className="mb-8">
                            <p className="text-xs font-semibold tracking-[0.12em] text-[#0f56d7] uppercase">
                                Modul Utama
                            </p>
                            <h2
                                className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl"
                                style={{
                                    fontFamily:
                                        'Inter, Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif',
                                }}
                            >
                                Struktur produk HR yang siap dipakai lintas skala bisnis
                            </h2>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {modules.map((module, index) => (
                                <article
                                    key={module.title}
                                    className="animate-in fade-in slide-in-from-bottom-4 rounded-2xl border border-[#dbe8ff] bg-white p-5 shadow-sm duration-700"
                                    style={{ animationDelay: `${index * 70 + 80}ms` }}
                                >
                                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0f56d7] to-[#1aa8ff] text-white">
                                        <module.icon className="h-5 w-5" />
                                    </div>
                                    <h3
                                        className="text-lg font-semibold text-slate-900"
                                        style={{
                                            fontFamily:
                                                'Inter, Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif',
                                        }}
                                    >
                                        {module.title}
                                    </h3>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                        {module.description}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section
                        id="keunggulan"
                        className="grid gap-6 pt-10 pb-8 lg:grid-cols-[1.05fr_0.95fr]"
                    >
                        <div className="rounded-3xl border border-[#cce0ff] bg-gradient-to-br from-[#e8f1ff] via-[#edf4ff] to-[#fff4e6] p-6 md:p-8">
                            <p className="text-xs font-semibold tracking-[0.12em] text-[#0f56d7] uppercase">
                                Kenapa ZENI HRIS
                            </p>
                            <h3
                                className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl"
                                style={{
                                    fontFamily:
                                        'Inter, Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif',
                                }}
                            >
                                Dibangun dengan pola konten yang jelas:
                                tantangan, solusi, hasil.
                            </h3>

                            <div className="mt-6 space-y-3">
                                {highlights.map((item) => (
                                    <div
                                        key={item}
                                        className="flex items-start gap-3 rounded-xl border border-white/70 bg-white/85 px-4 py-3 text-sm text-slate-700"
                                    >
                                        <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0f56d7]" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
                            <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">
                                Implementasi Terukur
                            </p>
                            <h3
                                className="mt-2 text-2xl font-bold tracking-tight text-slate-900"
                                style={{
                                    fontFamily:
                                        'Inter, Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif',
                                }}
                            >
                                Onboarding dalam 3 tahap
                            </h3>

                            <div className="mt-6 space-y-4">
                                {timeline.map((item, index) => (
                                    <div
                                        key={item.title}
                                        className="relative rounded-xl border border-slate-200 bg-slate-50 p-4"
                                    >
                                        <span className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0f56d7] text-xs font-semibold text-white">
                                            {index + 1}
                                        </span>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {item.title}
                                        </p>
                                        <p className="mt-1 text-sm leading-relaxed text-slate-600">
                                            {item.detail}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="grid gap-4 pt-8 pb-12 md:grid-cols-2">
                        {testimonials.map((item) => (
                            <article
                                key={item.author}
                                className="rounded-2xl border border-[#dbe8ff] bg-white p-6 shadow-sm"
                            >
                                <p className="text-base leading-relaxed text-slate-700">
                                    &ldquo;{item.quote}&rdquo;
                                </p>
                                <div className="mt-4 border-t border-slate-200 pt-4">
                                    <p className="text-sm font-semibold text-slate-900">
                                        {item.author}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {item.role}
                                    </p>
                                </div>
                            </article>
                        ))}
                    </section>

                    <section className="rounded-3xl bg-gradient-to-r from-[#0f56d7] via-[#1568e5] to-[#ff9f43] px-6 py-8 text-white shadow-2xl shadow-blue-900/25 md:px-10 md:py-10">
                        <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
                            <div>
                                <p className="text-xs font-semibold tracking-[0.12em] text-blue-100 uppercase">
                                    Siap naik level?
                                </p>
                                <h3
                                    className="mt-2 text-2xl font-bold tracking-tight md:text-3xl"
                                    style={{
                                        fontFamily:
                                            'Inter, Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif',
                                    }}
                                >
                                    Bangun operasi HR yang scalable,
                                    terukur, dan siap tumbuh bersama bisnis.
                                </h3>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href={auth.user ? dashboard() : login()}
                                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#0f56d7] transition hover:bg-blue-50"
                                >
                                    {auth.user
                                        ? 'Lanjut ke Dashboard'
                                        : 'Jadwalkan Demo'}
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                {canRegister && !auth.user && (
                                    <Link
                                        href={register()}
                                        className="inline-flex items-center rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/60"
                                    >
                                        Mulai Gratis
                                    </Link>
                                )}
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}
