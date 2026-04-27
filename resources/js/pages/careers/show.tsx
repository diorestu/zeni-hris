import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Briefcase,
    FileText,
    Link as LinkIcon,
    MapPin,
    Send,
} from 'lucide-react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dashboard, home, login } from '@/routes';

type Vacancy = {
    id: number;
    title: string;
    slug: string;
    employment_type: string | null;
    workplace_type: string | null;
    location: string | null;
    openings: number;
    min_salary: string | null;
    max_salary: string | null;
    description: string | null;
    requirements: string | null;
    benefits: string | null;
    closing_date: string | null;
    division: string | null;
    position: string | null;
    apply_url: string;
    list_url: string;
};

type PageProps = {
    vacancy: Vacancy;
    flash?: {
        success?: string | null;
        error?: string | null;
    };
    auth: {
        user?: unknown;
    };
};

type ApplicationFormData = {
    full_name: string;
    email: string;
    phone: string;
    birth_date: string;
    address: string;
    last_education: string;
    years_experience: string;
    current_company: string;
    expected_salary: string;
    portfolio_url: string;
    linkedin_url: string;
    cover_letter: string;
    resume: File | null;
};

const defaultForm: ApplicationFormData = {
    full_name: '',
    email: '',
    phone: '',
    birth_date: '',
    address: '',
    last_education: '',
    years_experience: '',
    current_company: '',
    expected_salary: '',
    portfolio_url: '',
    linkedin_url: '',
    cover_letter: '',
    resume: null,
};

const employmentTypeLabels: Record<string, string> = {
    permanent: 'Tetap',
    contract: 'Kontrak',
    internship: 'Magang',
    freelance: 'Freelance',
};

const workplaceTypeLabels: Record<string, string> = {
    onsite: 'On-site',
    hybrid: 'Hybrid',
    remote: 'Remote',
};

const formatCurrency = (value: string | null) => {
    if (!value) {
        return '-';
    }

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(Number(value));
};

export default function CareerShowPage() {
    const { vacancy, flash, auth } = usePage<PageProps>().props;
    const form = useForm<ApplicationFormData>(defaultForm);

    const submitForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.post(vacancy.apply_url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
            },
        });
    };

    return (
        <>
            <Head title={vacancy.title} />

            <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
                <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                        <div>
                            <Link
                                href={vacancy.list_url}
                                className="text-lg font-semibold tracking-tight"
                            >
                                ZENI Careers
                            </Link>
                            <p className="text-sm text-slate-500">
                                Detail lowongan dan form pengajuan kandidat.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" asChild>
                                <Link href={vacancy.list_url}>
                                    <ArrowLeft className="size-4" />
                                    Semua lowongan
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href={home()}>Beranda</Link>
                            </Button>
                            <Button asChild>
                                <Link href={auth.user ? dashboard() : login()}>
                                    {auth.user ? 'Dashboard' : 'Masuk HRIS'}
                                </Link>
                            </Button>
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
                    {flash?.success ? (
                        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {flash.success}
                        </div>
                    ) : null}

                    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                        <div className="space-y-6">
                            <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-sky-700 px-6 py-10 text-white shadow-xl shadow-slate-900/10">
                                <div className="mb-4 flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1">
                                        {employmentTypeLabels[
                                            vacancy.employment_type ?? ''
                                        ] ??
                                            vacancy.employment_type ??
                                            'Umum'}
                                    </span>
                                    <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1">
                                        {workplaceTypeLabels[
                                            vacancy.workplace_type ?? ''
                                        ] ??
                                            vacancy.workplace_type ??
                                            'Fleksibel'}
                                    </span>
                                </div>
                                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                                    {vacancy.title}
                                </h1>
                                <div className="mt-4 grid gap-3 text-sm text-sky-50/90 md:grid-cols-2">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="size-4" />
                                        {vacancy.location ??
                                            'Lokasi belum ditentukan'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="size-4" />
                                        {vacancy.position ?? '-'} •{' '}
                                        {vacancy.division ?? '-'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FileText className="size-4" />
                                        Kebutuhan {vacancy.openings} orang
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <LinkIcon className="size-4" />
                                        Closing {vacancy.closing_date ?? '-'}
                                    </div>
                                </div>
                                <div className="mt-5 rounded-2xl bg-white/10 px-4 py-3 text-sm">
                                    Rentang kompensasi:{' '}
                                    <strong>
                                        {formatCurrency(vacancy.min_salary)} -{' '}
                                        {formatCurrency(vacancy.max_salary)}
                                    </strong>
                                </div>
                            </section>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Deskripsi Posisi</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm leading-6 whitespace-pre-line text-slate-600">
                                    {vacancy.description ??
                                        'Belum ada deskripsi.'}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Kualifikasi</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm leading-6 whitespace-pre-line text-slate-600">
                                    {vacancy.requirements ??
                                        'Belum ada detail kualifikasi.'}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Benefit</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm leading-6 whitespace-pre-line text-slate-600">
                                    {vacancy.benefits ??
                                        'Benefit akan dijelaskan pada tahap selanjutnya.'}
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="h-fit">
                            <CardHeader>
                                <CardTitle>Kirim Lamaran</CardTitle>
                                <CardDescription>
                                    Isi data kandidat untuk lowongan ini. Tim HR
                                    akan memproses lamaran Anda dari modul
                                    rekrutmen internal.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form
                                    onSubmit={submitForm}
                                    className="space-y-4"
                                >
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="grid gap-2 md:col-span-2">
                                            <Label htmlFor="full_name">
                                                Nama lengkap
                                            </Label>
                                            <Input
                                                id="full_name"
                                                value={form.data.full_name}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'full_name',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={form.errors.full_name}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={form.data.email}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'email',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={form.errors.email}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="phone">
                                                No. telepon
                                            </Label>
                                            <Input
                                                id="phone"
                                                value={form.data.phone}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'phone',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={form.errors.phone}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="birth_date">
                                                Tanggal lahir
                                            </Label>
                                            <Input
                                                id="birth_date"
                                                type="date"
                                                value={form.data.birth_date}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'birth_date',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={form.errors.birth_date}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="last_education">
                                                Pendidikan terakhir
                                            </Label>
                                            <Input
                                                id="last_education"
                                                value={form.data.last_education}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'last_education',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={
                                                    form.errors.last_education
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="years_experience">
                                                Pengalaman (tahun)
                                            </Label>
                                            <Input
                                                id="years_experience"
                                                type="number"
                                                min="0"
                                                step="0.5"
                                                value={
                                                    form.data.years_experience
                                                }
                                                onChange={(event) =>
                                                    form.setData(
                                                        'years_experience',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={
                                                    form.errors.years_experience
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="current_company">
                                                Perusahaan saat ini
                                            </Label>
                                            <Input
                                                id="current_company"
                                                value={
                                                    form.data.current_company
                                                }
                                                onChange={(event) =>
                                                    form.setData(
                                                        'current_company',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={
                                                    form.errors.current_company
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="expected_salary">
                                                Ekspektasi gaji
                                            </Label>
                                            <Input
                                                id="expected_salary"
                                                value={
                                                    form.data.expected_salary
                                                }
                                                onChange={(event) =>
                                                    form.setData(
                                                        'expected_salary',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={
                                                    form.errors.expected_salary
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2 md:col-span-2">
                                            <Label htmlFor="address">
                                                Alamat
                                            </Label>
                                            <textarea
                                                id="address"
                                                value={form.data.address}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'address',
                                                        event.target.value,
                                                    )
                                                }
                                                rows={3}
                                                className="min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none"
                                            />
                                            <InputError
                                                message={form.errors.address}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="portfolio_url">
                                                Portfolio URL
                                            </Label>
                                            <Input
                                                id="portfolio_url"
                                                value={form.data.portfolio_url}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'portfolio_url',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={
                                                    form.errors.portfolio_url
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="linkedin_url">
                                                LinkedIn URL
                                            </Label>
                                            <Input
                                                id="linkedin_url"
                                                value={form.data.linkedin_url}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'linkedin_url',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={
                                                    form.errors.linkedin_url
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2 md:col-span-2">
                                            <Label htmlFor="cover_letter">
                                                Ringkasan profil / cover letter
                                            </Label>
                                            <textarea
                                                id="cover_letter"
                                                value={form.data.cover_letter}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'cover_letter',
                                                        event.target.value,
                                                    )
                                                }
                                                rows={5}
                                                className="min-h-32 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none"
                                            />
                                            <InputError
                                                message={
                                                    form.errors.cover_letter
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2 md:col-span-2">
                                            <Label htmlFor="resume">
                                                Upload CV (PDF/DOC/DOCX)
                                            </Label>
                                            <Input
                                                id="resume"
                                                type="file"
                                                accept=".pdf,.doc,.docx"
                                                onChange={(event) =>
                                                    form.setData(
                                                        'resume',
                                                        event.target
                                                            .files?.[0] ?? null,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={form.errors.resume}
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={form.processing}
                                    >
                                        <Send className="size-4" />
                                        {form.processing
                                            ? 'Mengirim lamaran...'
                                            : 'Kirim lamaran'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </>
    );
}
