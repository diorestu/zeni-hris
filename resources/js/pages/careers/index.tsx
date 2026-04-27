import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Briefcase, MapPin, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { dashboard, home, login } from '@/routes';

type PaginatorLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Paginator<T> = {
    data: T[];
    links: PaginatorLink[];
    total: number;
};

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
    public_url: string;
};

type Filters = {
    search: string;
    employment_type: string;
};

type PageProps = {
    vacancies: Paginator<Vacancy>;
    filters: Filters;
    options: {
        employment_types: string[];
    };
    auth: {
        user?: unknown;
    };
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

const shortText = (value: string | null, maxLength = 180) => {
    if (!value) {
        return 'Detail lowongan akan dijelaskan lengkap di halaman posisi.';
    }

    if (value.length <= maxLength) {
        return value;
    }

    return `${value.slice(0, maxLength).trim()}...`;
};

export default function CareersIndexPage() {
    const { vacancies, filters, options, auth } = usePage<PageProps>().props;
    const [filterState, setFilterState] = useState(filters);

    useEffect(() => {
        setFilterState(filters);
    }, [filters]);

    const applyFilter = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get('/careers', filterState, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <>
            <Head title="Karier" />

            <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
                <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                        <div>
                            <Link
                                href={home()}
                                className="text-lg font-semibold tracking-tight"
                            >
                                ZENI Careers
                            </Link>
                            <p className="text-sm text-slate-500">
                                Temukan lowongan aktif dan kirim lamaran secara
                                langsung.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" asChild>
                                <Link href={home()}>
                                    <ArrowLeft className="size-4" />
                                    Beranda
                                </Link>
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
                    <section className="mb-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-sky-700 px-6 py-10 text-white shadow-xl shadow-slate-900/10">
                        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs tracking-[0.24em] text-sky-100 uppercase">
                            <Briefcase className="size-3.5" />
                            Lowongan Aktif
                        </p>
                        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">
                            Bergabung dengan tim yang sedang membangun operasi
                            HR modern.
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-sky-50/90 md:text-base">
                            Semua lowongan di halaman ini terhubung langsung ke
                            modul rekrutmen, jadi kandidat bisa isi data dan tim
                            HR bisa lanjutkan proses interview sampai offering.
                        </p>
                    </section>

                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Filter Lowongan</CardTitle>
                            <CardDescription>
                                Cari posisi berdasarkan kata kunci atau tipe
                                kerja.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={applyFilter}
                                className="grid gap-3 md:grid-cols-[1fr_220px_auto]"
                            >
                                <div className="relative">
                                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        value={filterState.search}
                                        onChange={(event) =>
                                            setFilterState((current) => ({
                                                ...current,
                                                search: event.target.value,
                                            }))
                                        }
                                        className="pl-9"
                                        placeholder="Cari posisi, lokasi, atau kata kunci"
                                    />
                                </div>

                                <Select
                                    value={
                                        filterState.employment_type === ''
                                            ? '__all'
                                            : filterState.employment_type
                                    }
                                    onValueChange={(value) =>
                                        setFilterState((current) => ({
                                            ...current,
                                            employment_type:
                                                value === '__all' ? '' : value,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua tipe kerja" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all">
                                            Semua tipe kerja
                                        </SelectItem>
                                        {options.employment_types.map(
                                            (type) => (
                                                <SelectItem
                                                    key={type}
                                                    value={type}
                                                >
                                                    {employmentTypeLabels[
                                                        type
                                                    ] ?? type}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>

                                <Button type="submit">Terapkan</Button>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {vacancies.data.length === 0 ? (
                            <Card className="md:col-span-2 xl:col-span-3">
                                <CardContent className="py-14 text-center text-slate-500">
                                    Belum ada lowongan yang sesuai dengan filter
                                    saat ini.
                                </CardContent>
                            </Card>
                        ) : (
                            vacancies.data.map((vacancy) => (
                                <Card
                                    key={vacancy.id}
                                    className="flex h-full flex-col"
                                >
                                    <CardHeader>
                                        <div className="flex flex-wrap gap-2 text-xs">
                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                                                {employmentTypeLabels[
                                                    vacancy.employment_type ??
                                                        ''
                                                ] ??
                                                    vacancy.employment_type ??
                                                    'Umum'}
                                            </span>
                                            <span className="rounded-full bg-sky-100 px-2.5 py-1 text-sky-700">
                                                {workplaceTypeLabels[
                                                    vacancy.workplace_type ?? ''
                                                ] ??
                                                    vacancy.workplace_type ??
                                                    'Skema fleksibel'}
                                            </span>
                                        </div>
                                        <CardTitle className="text-xl leading-snug">
                                            {vacancy.title}
                                        </CardTitle>
                                        <CardDescription className="space-y-1">
                                            <span className="flex items-center gap-1">
                                                <MapPin className="size-3.5" />
                                                {vacancy.location ??
                                                    'Lokasi belum ditentukan'}
                                            </span>
                                            <span>
                                                {vacancy.position ?? '-'} •{' '}
                                                {vacancy.division ?? '-'}
                                            </span>
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex flex-1 flex-col justify-between gap-4">
                                        <div className="space-y-3 text-sm text-slate-600">
                                            <p>
                                                {shortText(vacancy.description)}
                                            </p>
                                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                                <p className="text-xs tracking-wide text-slate-500 uppercase">
                                                    Rentang kompensasi
                                                </p>
                                                <p className="font-medium text-slate-900">
                                                    {formatCurrency(
                                                        vacancy.min_salary,
                                                    )}{' '}
                                                    -{' '}
                                                    {formatCurrency(
                                                        vacancy.max_salary,
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <Button asChild className="w-full">
                                            <Link href={vacancy.public_url}>
                                                Lihat detail & apply
                                                <ArrowRight className="size-4" />
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                        {vacancies.links.map((link, index) => (
                            <Button
                                key={`${link.label}-${index}`}
                                asChild={link.url !== null}
                                size="sm"
                                variant={link.active ? 'default' : 'outline'}
                                disabled={link.url === null}
                            >
                                {link.url ? (
                                    <Link
                                        href={link.url}
                                        preserveState
                                        preserveScroll
                                    >
                                        <span
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    </Link>
                                ) : (
                                    <span
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                )}
                            </Button>
                        ))}
                    </div>
                </main>
            </div>
        </>
    );
}
