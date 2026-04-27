import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Briefcase,
    CalendarClock,
    Download,
    ExternalLink,
    Eye,
    FileText,
    Pencil,
    Plus,
    RotateCcw,
    Search,
    Trash2,
    UsersRound,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import ActionIconButton from '@/components/action-icon-button';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SearchableSelect from '@/components/ui/searchable-select';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type PaginatorLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Paginator<T> = {
    data: T[];
    links: PaginatorLink[];
    from: number | null;
    to: number | null;
    total: number;
    current_page: number;
    last_page: number;
};

type SimpleOption = {
    id: number;
    name: string;
};

type PositionOption = {
    id: number;
    division_id: number | null;
    name: string;
};

type VacancyOption = {
    id: number;
    title: string;
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
    status: string;
    published_at: string | null;
    closing_date: string | null;
    applications_count: number;
    public_url: string;
    division: {
        id: number;
        name: string;
    } | null;
    position: {
        id: number;
        name: string;
    } | null;
};

type Application = {
    id: number;
    job_vacancy_id: number;
    full_name: string;
    email: string;
    phone: string;
    birth_date: string | null;
    address: string | null;
    last_education: string | null;
    years_experience: string | null;
    current_company: string | null;
    expected_salary: string | null;
    portfolio_url: string | null;
    linkedin_url: string | null;
    cover_letter: string | null;
    resume_url: string | null;
    resume_original_name: string | null;
    stage: string;
    interview_scheduled_at: string | null;
    interviewed_at: string | null;
    interview_notes: string | null;
    recruiter_notes: string | null;
    offered_salary: string | null;
    proposed_start_date: string | null;
    employment_type: string | null;
    created_at: string | null;
    offer_letter_url: string;
    initial_contract_url: string;
    job_vacancy: {
        id: number;
        title: string;
        slug: string;
        employment_type: string | null;
        division: {
            id: number;
            name: string;
        } | null;
        position: {
            id: number;
            name: string;
        } | null;
    } | null;
};

type Filters = {
    global_search?: string;
    vacancy_search: string;
    vacancy_status: string;
    application_search: string;
    application_stage: string;
    vacancy_id: string;
    interviewed: string;
};

type VacancyFormData = {
    title: string;
    division_id: string;
    position_id: string;
    employment_type: string;
    workplace_type: string;
    location: string;
    openings: string;
    min_salary: string;
    max_salary: string;
    description: string;
    requirements: string;
    benefits: string;
    status: string;
    closing_date: string;
};

type ApplicationFormData = {
    stage: string;
    interview_scheduled_at: string;
    interviewed_at: string;
    interview_notes: string;
    recruiter_notes: string;
    expected_salary: string;
    offered_salary: string;
    proposed_start_date: string;
    employment_type: string;
};

type PageProps = {
    vacancies: Paginator<Vacancy>;
    applications: Paginator<Application>;
    divisionOptions: SimpleOption[];
    positionOptions: PositionOption[];
    vacancyOptions: VacancyOption[];
    filters: Filters;
    stats: {
        vacancies_total: number;
        vacancies_published: number;
        applications_total: number;
        interviewed_total: number;
        offered_total: number;
    };
    options: {
        vacancy_statuses: string[];
        application_stages: string[];
        employment_types: string[];
        workplace_types: string[];
        interview_filters: Array<{
            value: string;
            label: string;
        }>;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Rekrutmen',
        href: '/hris/recruitment',
    },
];

const defaultVacancyForm: VacancyFormData = {
    title: '',
    division_id: '',
    position_id: '',
    employment_type: '',
    workplace_type: '',
    location: '',
    openings: '1',
    min_salary: '',
    max_salary: '',
    description: '',
    requirements: '',
    benefits: '',
    status: 'draft',
    closing_date: '',
};

const defaultApplicationForm: ApplicationFormData = {
    stage: 'applied',
    interview_scheduled_at: '',
    interviewed_at: '',
    interview_notes: '',
    recruiter_notes: '',
    expected_salary: '',
    offered_salary: '',
    proposed_start_date: '',
    employment_type: '',
};

const vacancyStatusLabels: Record<string, string> = {
    draft: 'Draft',
    published: 'Published',
    closed: 'Closed',
};

const stageLabels: Record<string, string> = {
    applied: 'Applied',
    screening: 'Screening',
    interview_scheduled: 'Interview Dijadwalkan',
    interviewed: 'Sudah Interview',
    offered: 'Offering',
    hired: 'Diterima',
    rejected: 'Ditolak',
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

const statusBadgeClass = (value: string) => {
    switch (value) {
        case 'published':
        case 'hired':
            return 'bg-emerald-100 text-emerald-700';
        case 'offered':
        case 'interviewed':
            return 'bg-blue-100 text-blue-700';
        case 'interview_scheduled':
        case 'screening':
            return 'bg-amber-100 text-amber-700';
        case 'closed':
        case 'rejected':
            return 'bg-rose-100 text-rose-700';
        default:
            return 'bg-slate-100 text-slate-700';
    }
};

const formatCurrency = (value: string | null) => {
    if (!value) {
        return '-';
    }

    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
        return value;
    }

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(numericValue);
};

const formatDateTime = (value: string | null) => {
    if (!value) {
        return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
};

const formatDate = (value: string | null) => {
    if (!value) {
        return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
    }).format(date);
};

const toDateTimeLocal = (value: string | null) => {
    if (!value) {
        return '';
    }

    return value.slice(0, 16);
};

export default function RecruitmentPage() {
    const {
        vacancies,
        applications,
        divisionOptions,
        positionOptions,
        vacancyOptions,
        filters,
        stats,
        options,
    } = usePage<PageProps>().props;

    const [filterState, setFilterState] = useState<Filters>(filters);
    const [vacancyDialogOpen, setVacancyDialogOpen] = useState(false);
    const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
    const [editingVacancy, setEditingVacancy] = useState<Vacancy | null>(null);
    const [editingApplication, setEditingApplication] =
        useState<Application | null>(null);
    const [detailApplication, setDetailApplication] =
        useState<Application | null>(null);

    const vacancyForm = useForm<VacancyFormData>(defaultVacancyForm);
    const applicationForm = useForm<ApplicationFormData>(
        defaultApplicationForm,
    );

    useEffect(() => {
        setFilterState(filters);
    }, [filters]);

    const visiblePositions = useMemo(() => {
        if (vacancyForm.data.division_id === '') {
            return positionOptions;
        }

        return positionOptions.filter(
            (position) =>
                String(position.division_id ?? '') ===
                vacancyForm.data.division_id,
        );
    }, [positionOptions, vacancyForm.data.division_id]);

    const openCreateVacancy = () => {
        setEditingVacancy(null);
        vacancyForm.clearErrors();
        vacancyForm.setData(defaultVacancyForm);
        setVacancyDialogOpen(true);
    };

    const openEditVacancy = (vacancy: Vacancy) => {
        setEditingVacancy(vacancy);
        vacancyForm.clearErrors();
        vacancyForm.setData({
            title: vacancy.title,
            division_id: vacancy.division ? String(vacancy.division.id) : '',
            position_id: vacancy.position ? String(vacancy.position.id) : '',
            employment_type: vacancy.employment_type ?? '',
            workplace_type: vacancy.workplace_type ?? '',
            location: vacancy.location ?? '',
            openings: String(vacancy.openings),
            min_salary: vacancy.min_salary ?? '',
            max_salary: vacancy.max_salary ?? '',
            description: vacancy.description ?? '',
            requirements: vacancy.requirements ?? '',
            benefits: vacancy.benefits ?? '',
            status: vacancy.status,
            closing_date: vacancy.closing_date ?? '',
        });
        setVacancyDialogOpen(true);
    };

    const openEditApplication = (application: Application) => {
        setEditingApplication(application);
        applicationForm.clearErrors();
        applicationForm.setData({
            stage: application.stage,
            interview_scheduled_at: toDateTimeLocal(
                application.interview_scheduled_at,
            ),
            interviewed_at: toDateTimeLocal(application.interviewed_at),
            interview_notes: application.interview_notes ?? '',
            recruiter_notes: application.recruiter_notes ?? '',
            expected_salary: application.expected_salary ?? '',
            offered_salary: application.offered_salary ?? '',
            proposed_start_date: application.proposed_start_date ?? '',
            employment_type: application.employment_type ?? '',
        });
        setApplicationDialogOpen(true);
    };

    const submitVacancyForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingVacancy) {
            vacancyForm.put(
                `/hris/recruitment/vacancies/${editingVacancy.id}`,
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setVacancyDialogOpen(false);
                        setEditingVacancy(null);
                        vacancyForm.reset();
                    },
                },
            );
            return;
        }

        vacancyForm.post('/hris/recruitment/vacancies', {
            preserveScroll: true,
            onSuccess: () => {
                setVacancyDialogOpen(false);
                vacancyForm.reset();
            },
        });
    };

    const submitApplicationForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!editingApplication) {
            return;
        }

        applicationForm.put(
            `/hris/recruitment/applications/${editingApplication.id}`,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setApplicationDialogOpen(false);
                    setEditingApplication(null);
                    applicationForm.reset();
                },
            },
        );
    };

    const applyFilter = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const globalSearch = filterState.global_search?.trim() ?? '';

        const nextFilters = {
            ...filterState,
            vacancy_search: globalSearch,
            application_search: globalSearch,
            global_search: globalSearch,
        };

        router.get('/hris/recruitment', nextFilters, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const resetFilter = () => {
        const nextFilters: Filters = {
            global_search: '',
            vacancy_search: '',
            vacancy_status: '',
            application_search: '',
            application_stage: '',
            vacancy_id: '',
            interviewed: '',
        };

        setFilterState(nextFilters);
        router.get('/hris/recruitment', nextFilters, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const deleteVacancy = (vacancy: Vacancy) => {
        if (
            !window.confirm(
                `Hapus lowongan "${vacancy.title}" beserta semua lamaran kandidat?`,
            )
        ) {
            return;
        }

        router.delete(`/hris/recruitment/vacancies/${vacancy.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout
            breadcrumbs={breadcrumbs}
            headerActions={
                <Button size="sm" onClick={openCreateVacancy}>
                    <Plus className="size-4" />
                    Tambah Lowongan
                </Button>
            }
        >
            <Head title="Rekrutmen" />

            <div className="space-y-4 p-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <Card className="gap-2 py-3">
                        <CardHeader className="px-4 pb-0">
                            <CardDescription>Total Lowongan</CardDescription>
                            <CardTitle className="text-2xl">
                                {stats.vacancies_total}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="gap-2 py-3">
                        <CardHeader className="px-4 pb-0">
                            <CardDescription>Lowongan Aktif</CardDescription>
                            <CardTitle className="text-2xl">
                                {stats.vacancies_published}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="gap-2 py-3">
                        <CardHeader className="px-4 pb-0">
                            <CardDescription>Total Kandidat</CardDescription>
                            <CardTitle className="text-2xl">
                                {stats.applications_total}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="gap-2 py-3">
                        <CardHeader className="px-4 pb-0">
                            <CardDescription>Sudah Interview</CardDescription>
                            <CardTitle className="text-2xl">
                                {stats.interviewed_total}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="gap-2 py-3">
                        <CardHeader className="px-4 pb-0">
                            <CardDescription>Masuk Offering</CardDescription>
                            <CardTitle className="text-2xl">
                                {stats.offered_total}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Filter Rekrutmen</CardTitle>
                        <CardDescription>
                            Cari lowongan, fokus kandidat per stage, dan pantau
                            status interview.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={applyFilter}
                            className="space-y-4"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="global_search">
                                    Pencarian global
                                </Label>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        id="global_search"
                                        value={
                                            filterState.global_search ??
                                            filterState.vacancy_search ??
                                            ''
                                        }
                                        onChange={(event) =>
                                            setFilterState((current) => ({
                                                ...current,
                                                global_search: event.target.value,
                                                vacancy_search: event.target.value,
                                                application_search:
                                                    event.target.value,
                                            }))
                                        }
                                        className="pl-9"
                                        placeholder="Cari lowongan, kandidat, email, telepon, atau lokasi"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-3 border-t pt-4 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="grid gap-2">
                                <Label htmlFor="vacancy_status">
                                    Kategori: Status lowongan
                                </Label>
                                <Select
                                    value={
                                        filterState.vacancy_status === ''
                                            ? '__all'
                                            : filterState.vacancy_status
                                    }
                                    onValueChange={(value) =>
                                        setFilterState((current) => ({
                                            ...current,
                                            vacancy_status:
                                                value === '__all' ? '' : value,
                                        }))
                                    }
                                >
                                    <SelectTrigger id="vacancy_status">
                                        <SelectValue placeholder="Semua status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all">
                                            Semua status
                                        </SelectItem>
                                        {options.vacancy_statuses.map(
                                            (status) => (
                                                <SelectItem
                                                    key={status}
                                                    value={status}
                                                >
                                                    {vacancyStatusLabels[
                                                        status
                                                    ] ?? status}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                                </div>

                                <div className="grid gap-2">
                                <Label htmlFor="application_stage">
                                    Kategori: Stage kandidat
                                </Label>
                                <Select
                                    value={
                                        filterState.application_stage === ''
                                            ? '__all'
                                            : filterState.application_stage
                                    }
                                    onValueChange={(value) =>
                                        setFilterState((current) => ({
                                            ...current,
                                            application_stage:
                                                value === '__all' ? '' : value,
                                        }))
                                    }
                                >
                                    <SelectTrigger id="application_stage">
                                        <SelectValue placeholder="Semua stage" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all">
                                            Semua stage
                                        </SelectItem>
                                        {options.application_stages.map(
                                            (stage) => (
                                                <SelectItem
                                                    key={stage}
                                                    value={stage}
                                                >
                                                    {stageLabels[stage] ??
                                                        stage}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                                </div>

                                <div className="grid gap-2">
                                <Label>Filter: Lowongan kandidat</Label>
                                <SearchableSelect
                                    value={
                                        filterState.vacancy_id === ''
                                            ? '__all'
                                            : filterState.vacancy_id
                                    }
                                    onValueChange={(value) =>
                                        setFilterState((current) => ({
                                            ...current,
                                            vacancy_id:
                                                value === '__all' ? '' : value,
                                        }))
                                    }
                                    options={[
                                        {
                                            value: '__all',
                                            label: 'Semua lowongan',
                                        },
                                        ...vacancyOptions.map((vacancy) => ({
                                            value: String(vacancy.id),
                                            label: vacancy.title,
                                        })),
                                    ]}
                                    className="w-full"
                                />
                                </div>

                                <div className="grid gap-2">
                                <Label htmlFor="interviewed">
                                    Kategori: Status interview
                                </Label>
                                <Select
                                    value={
                                        filterState.interviewed === ''
                                            ? '__all'
                                            : filterState.interviewed
                                    }
                                    onValueChange={(value) =>
                                        setFilterState((current) => ({
                                            ...current,
                                            interviewed:
                                                value === '__all' ? '' : value,
                                        }))
                                    }
                                >
                                    <SelectTrigger id="interviewed">
                                        <SelectValue placeholder="Semua" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all">
                                            Semua kandidat
                                        </SelectItem>
                                        {options.interview_filters.map(
                                            (item) => (
                                                <SelectItem
                                                    key={item.value}
                                                    value={item.value}
                                                >
                                                    {item.label}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
                                <Button type="submit">Terapkan</Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={resetFilter}
                                >
                                    <RotateCcw className="size-4" />
                                    Reset
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-start justify-between gap-4">
                        <div>
                            <CardTitle>Lowongan</CardTitle>
                            <CardDescription>
                                Kelola lowongan yang dipasang dan bagikan
                                halaman publiknya ke kandidat.
                            </CardDescription>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                            <Briefcase className="size-3.5" />
                            {vacancies.total} lowongan
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1080px] text-sm">
                                <thead className="bg-slate-50 text-left text-slate-500">
                                    <tr>
                                        <th className="px-3 py-3 font-medium">
                                            Lowongan
                                        </th>
                                        <th className="px-3 py-3 font-medium">
                                            Status
                                        </th>
                                        <th className="px-3 py-3 font-medium">
                                            Organisasi
                                        </th>
                                        <th className="px-3 py-3 font-medium">
                                            Paket
                                        </th>
                                        <th className="px-3 py-3 font-medium">
                                            Pelamar
                                        </th>
                                        <th className="px-3 py-3 font-medium">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vacancies.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-3 py-8 text-center text-slate-500"
                                            >
                                                Belum ada lowongan yang cocok
                                                dengan filter.
                                            </td>
                                        </tr>
                                    ) : (
                                        vacancies.data.map((vacancy) => (
                                            <tr
                                                key={vacancy.id}
                                                className="border-t align-top"
                                            >
                                                <td className="px-3 py-3">
                                                    <div className="space-y-1">
                                                        <p className="font-medium text-slate-900">
                                                            {vacancy.title}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            Publik:{' '}
                                                            {vacancy.public_url}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            Closing:{' '}
                                                            {formatDate(
                                                                vacancy.closing_date,
                                                            )}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <Badge
                                                        className={statusBadgeClass(
                                                            vacancy.status,
                                                        )}
                                                    >
                                                        {vacancyStatusLabels[
                                                            vacancy.status
                                                        ] ?? vacancy.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-3 py-3 text-slate-600">
                                                    <p>
                                                        {vacancy.position
                                                            ?.name ?? '-'}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {vacancy.division
                                                            ?.name ?? '-'}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {vacancy.location ??
                                                            '-'}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-3 text-slate-600">
                                                    <p>
                                                        {employmentTypeLabels[
                                                            vacancy.employment_type ??
                                                                ''
                                                        ] ??
                                                            vacancy.employment_type ??
                                                            '-'}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {workplaceTypeLabels[
                                                            vacancy.workplace_type ??
                                                                ''
                                                        ] ??
                                                            vacancy.workplace_type ??
                                                            '-'}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {formatCurrency(
                                                            vacancy.min_salary,
                                                        )}{' '}
                                                        -{' '}
                                                        {formatCurrency(
                                                            vacancy.max_salary,
                                                        )}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                                        <UsersRound className="size-3.5" />
                                                        {
                                                            vacancy.applications_count
                                                        }{' '}
                                                        kandidat
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="flex gap-1.5">
                                                        <Button
                                                            size="icon"
                                                            variant="outline"
                                                            asChild
                                                            className="size-7"
                                                        >
                                                            <a
                                                                href={
                                                                    vacancy.public_url
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                aria-label="Buka halaman publik"
                                                                title="Buka halaman publik"
                                                            >
                                                                <ExternalLink className="size-3.5" />
                                                                <span className="sr-only">
                                                                    Buka halaman
                                                                    publik
                                                                </span>
                                                            </a>
                                                        </Button>
                                                        <ActionIconButton
                                                            label="Edit lowongan"
                                                            icon={Pencil}
                                                            variant="outline"
                                                            onClick={() =>
                                                                openEditVacancy(
                                                                    vacancy,
                                                                )
                                                            }
                                                        />
                                                        <ActionIconButton
                                                            label="Hapus lowongan"
                                                            icon={Trash2}
                                                            variant="outline"
                                                            onClick={() =>
                                                                deleteVacancy(
                                                                    vacancy,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            {vacancies.links.map((link, index) => (
                                <Button
                                    key={`${link.label}-${index}`}
                                    asChild={link.url !== null}
                                    size="sm"
                                    variant={
                                        link.active ? 'default' : 'outline'
                                    }
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
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-start justify-between gap-4">
                        <div>
                            <CardTitle>Tracker Kandidat</CardTitle>
                            <CardDescription>
                                Tandai kandidat sudah interview atau belum, lalu
                                generate offering letter dan kontrak awal.
                            </CardDescription>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                            <CalendarClock className="size-3.5" />
                            {applications.total} kandidat
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1260px] text-sm">
                                <thead className="bg-slate-50 text-left text-slate-500">
                                    <tr>
                                        <th className="px-3 py-3 font-medium">
                                            Kandidat
                                        </th>
                                        <th className="px-3 py-3 font-medium">
                                            Lowongan
                                        </th>
                                        <th className="px-3 py-3 font-medium">
                                            Stage
                                        </th>
                                        <th className="px-3 py-3 font-medium">
                                            Interview
                                        </th>
                                        <th className="px-3 py-3 font-medium">
                                            Dokumen
                                        </th>
                                        <th className="px-3 py-3 font-medium">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {applications.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-3 py-8 text-center text-slate-500"
                                            >
                                                Belum ada kandidat yang cocok
                                                dengan filter.
                                            </td>
                                        </tr>
                                    ) : (
                                        applications.data.map((application) => (
                                            <tr
                                                key={application.id}
                                                className="border-t align-top"
                                            >
                                                <td className="px-3 py-3">
                                                    <div className="space-y-1">
                                                        <p className="font-medium text-slate-900">
                                                            {
                                                                application.full_name
                                                            }
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {application.email}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {application.phone}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 text-slate-600">
                                                    <p>
                                                        {application.job_vacancy
                                                            ?.title ?? '-'}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {application.job_vacancy
                                                            ?.position?.name ??
                                                            '-'}
                                                        {' • '}
                                                        {application.job_vacancy
                                                            ?.division?.name ??
                                                            '-'}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <Badge
                                                        className={statusBadgeClass(
                                                            application.stage,
                                                        )}
                                                    >
                                                        {stageLabels[
                                                            application.stage
                                                        ] ?? application.stage}
                                                    </Badge>
                                                </td>
                                                <td className="px-3 py-3 text-slate-600">
                                                    <p>
                                                        Jadwal:{' '}
                                                        {formatDateTime(
                                                            application.interview_scheduled_at,
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        Status:{' '}
                                                        {application.interviewed_at
                                                            ? `Sudah pada ${formatDateTime(
                                                                  application.interviewed_at,
                                                              )}`
                                                            : 'Belum interview'}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="flex flex-wrap gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            asChild
                                                        >
                                                            <a
                                                                href={
                                                                    application.offer_letter_url
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                            >
                                                                <Download className="size-4" />
                                                                Offer
                                                            </a>
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            asChild
                                                        >
                                                            <a
                                                                href={
                                                                    application.initial_contract_url
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                            >
                                                                <FileText className="size-4" />
                                                                Kontrak
                                                            </a>
                                                        </Button>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="flex gap-1.5">
                                                        <ActionIconButton
                                                            label="Detail kandidat"
                                                            icon={Eye}
                                                            variant="outline"
                                                            onClick={() =>
                                                                setDetailApplication(
                                                                    application,
                                                                )
                                                            }
                                                        />
                                                        <ActionIconButton
                                                            label="Edit tracker kandidat"
                                                            icon={Pencil}
                                                            variant="outline"
                                                            onClick={() =>
                                                                openEditApplication(
                                                                    application,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            {applications.links.map((link, index) => (
                                <Button
                                    key={`${link.label}-${index}`}
                                    asChild={link.url !== null}
                                    size="sm"
                                    variant={
                                        link.active ? 'default' : 'outline'
                                    }
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
                    </CardContent>
                </Card>
            </div>

            <Dialog
                open={vacancyDialogOpen}
                onOpenChange={setVacancyDialogOpen}
            >
                <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingVacancy
                                ? 'Edit Lowongan'
                                : 'Tambah Lowongan'}
                        </DialogTitle>
                        <DialogDescription>
                            Atur lowongan yang dipasang agar kandidat bisa isi
                            data dari halaman publik.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitVacancyForm} className="space-y-5">
                        <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                            <p className="text-sm font-semibold text-slate-900">
                                Informasi lowongan
                            </p>
                            <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="vacancy_title">Judul</Label>
                                <Input
                                    id="vacancy_title"
                                    value={vacancyForm.data.title}
                                    onChange={(event) =>
                                        vacancyForm.setData(
                                            'title',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Contoh: Staff Recruitment"
                                />
                                <InputError
                                    message={vacancyForm.errors.title}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Divisi</Label>
                                <SearchableSelect
                                    value={
                                        vacancyForm.data.division_id === ''
                                            ? '__none'
                                            : vacancyForm.data.division_id
                                    }
                                    onValueChange={(value) => {
                                        const nextDivisionId =
                                            value === '__none' ? '' : value;
                                        const activePosition =
                                            positionOptions.find(
                                                (position) =>
                                                    String(position.id) ===
                                                    vacancyForm.data
                                                        .position_id,
                                            );

                                        vacancyForm.setData({
                                            ...vacancyForm.data,
                                            division_id: nextDivisionId,
                                            position_id:
                                                activePosition &&
                                                String(
                                                    activePosition.division_id ??
                                                        '',
                                                ) !== nextDivisionId
                                                    ? ''
                                                    : vacancyForm.data
                                                          .position_id,
                                        });
                                    }}
                                    options={[
                                        {
                                            value: '__none',
                                            label: 'Tanpa divisi',
                                        },
                                        ...divisionOptions.map((division) => ({
                                            value: String(division.id),
                                            label: division.name,
                                        })),
                                    ]}
                                />
                                <InputError
                                    message={vacancyForm.errors.division_id}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Jabatan</Label>
                                <SearchableSelect
                                    value={
                                        vacancyForm.data.position_id === ''
                                            ? '__none'
                                            : vacancyForm.data.position_id
                                    }
                                    onValueChange={(value) =>
                                        vacancyForm.setData(
                                            'position_id',
                                            value === '__none' ? '' : value,
                                        )
                                    }
                                    options={[
                                        {
                                            value: '__none',
                                            label: 'Tanpa jabatan',
                                        },
                                        ...visiblePositions.map((position) => ({
                                            value: String(position.id),
                                            label: position.name,
                                        })),
                                    ]}
                                />
                                <InputError
                                    message={vacancyForm.errors.position_id}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="employment_type">
                                    Tipe kerja
                                </Label>
                                <Select
                                    value={
                                        vacancyForm.data.employment_type === ''
                                            ? '__none'
                                            : vacancyForm.data.employment_type
                                    }
                                    onValueChange={(value) =>
                                        vacancyForm.setData(
                                            'employment_type',
                                            value === '__none' ? '' : value,
                                        )
                                    }
                                >
                                    <SelectTrigger id="employment_type">
                                        <SelectValue placeholder="Pilih tipe" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none">
                                            Tidak ditentukan
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
                                <InputError
                                    message={vacancyForm.errors.employment_type}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="workplace_type">
                                    Skema kerja
                                </Label>
                                <Select
                                    value={
                                        vacancyForm.data.workplace_type === ''
                                            ? '__none'
                                            : vacancyForm.data.workplace_type
                                    }
                                    onValueChange={(value) =>
                                        vacancyForm.setData(
                                            'workplace_type',
                                            value === '__none' ? '' : value,
                                        )
                                    }
                                >
                                    <SelectTrigger id="workplace_type">
                                        <SelectValue placeholder="Pilih skema" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none">
                                            Tidak ditentukan
                                        </SelectItem>
                                        {options.workplace_types.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {workplaceTypeLabels[type] ??
                                                    type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={vacancyForm.errors.workplace_type}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="location">Lokasi</Label>
                                <Input
                                    id="location"
                                    value={vacancyForm.data.location}
                                    onChange={(event) =>
                                        vacancyForm.setData(
                                            'location',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Makassar / Remote"
                                />
                                <InputError
                                    message={vacancyForm.errors.location}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="openings">Kebutuhan</Label>
                                <Input
                                    id="openings"
                                    type="number"
                                    min={1}
                                    value={vacancyForm.data.openings}
                                    onChange={(event) =>
                                        vacancyForm.setData(
                                            'openings',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={vacancyForm.errors.openings}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="min_salary">Gaji minimum</Label>
                                <Input
                                    id="min_salary"
                                    value={vacancyForm.data.min_salary}
                                    onChange={(event) =>
                                        vacancyForm.setData(
                                            'min_salary',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="5000000"
                                />
                                <InputError
                                    message={vacancyForm.errors.min_salary}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="max_salary">
                                    Gaji maksimum
                                </Label>
                                <Input
                                    id="max_salary"
                                    value={vacancyForm.data.max_salary}
                                    onChange={(event) =>
                                        vacancyForm.setData(
                                            'max_salary',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="7000000"
                                />
                                <InputError
                                    message={vacancyForm.errors.max_salary}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={vacancyForm.data.status}
                                    onValueChange={(value) =>
                                        vacancyForm.setData('status', value)
                                    }
                                >
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="Pilih status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {options.vacancy_statuses.map(
                                            (status) => (
                                                <SelectItem
                                                    key={status}
                                                    value={status}
                                                >
                                                    {vacancyStatusLabels[
                                                        status
                                                    ] ?? status}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={vacancyForm.errors.status}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="closing_date">
                                    Tanggal penutupan
                                </Label>
                                <Input
                                    id="closing_date"
                                    type="date"
                                    value={vacancyForm.data.closing_date}
                                    onChange={(event) =>
                                        vacancyForm.setData(
                                            'closing_date',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={vacancyForm.errors.closing_date}
                                />
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="description">Deskripsi</Label>
                                <textarea
                                    id="description"
                                    value={vacancyForm.data.description}
                                    onChange={(event) =>
                                        vacancyForm.setData(
                                            'description',
                                            event.target.value,
                                        )
                                    }
                                    rows={5}
                                    className="min-h-28 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none"
                                    placeholder="Ringkasan pekerjaan"
                                />
                                <InputError
                                    message={vacancyForm.errors.description}
                                />
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="requirements">
                                    Kualifikasi
                                </Label>
                                <textarea
                                    id="requirements"
                                    value={vacancyForm.data.requirements}
                                    onChange={(event) =>
                                        vacancyForm.setData(
                                            'requirements',
                                            event.target.value,
                                        )
                                    }
                                    rows={6}
                                    className="min-h-32 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none"
                                    placeholder="Tuliskan requirement kandidat"
                                />
                                <InputError
                                    message={vacancyForm.errors.requirements}
                                />
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="benefits">Benefit</Label>
                                <textarea
                                    id="benefits"
                                    value={vacancyForm.data.benefits}
                                    onChange={(event) =>
                                        vacancyForm.setData(
                                            'benefits',
                                            event.target.value,
                                        )
                                    }
                                    rows={6}
                                    className="min-h-32 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none"
                                    placeholder="Benefit dan fasilitas"
                                />
                                <InputError
                                    message={vacancyForm.errors.benefits}
                                />
                            </div>
                        </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setVacancyDialogOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={vacancyForm.processing}
                            >
                                {vacancyForm.processing
                                    ? 'Menyimpan...'
                                    : editingVacancy
                                      ? 'Simpan perubahan'
                                      : 'Simpan lowongan'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={applicationDialogOpen}
                onOpenChange={setApplicationDialogOpen}
            >
                <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Update Tracker Kandidat</DialogTitle>
                        <DialogDescription>
                            Tandai status interview, simpan nilai offering, dan
                            siapkan tanggal mulai kerja.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={submitApplicationForm}
                        className="space-y-5"
                    >
                        <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                            <p className="text-sm font-semibold text-slate-900">
                                Tracker kandidat
                            </p>
                            <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="stage">Stage</Label>
                                <Select
                                    value={applicationForm.data.stage}
                                    onValueChange={(value) =>
                                        applicationForm.setData('stage', value)
                                    }
                                >
                                    <SelectTrigger id="stage">
                                        <SelectValue placeholder="Pilih stage" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {options.application_stages.map(
                                            (stage) => (
                                                <SelectItem
                                                    key={stage}
                                                    value={stage}
                                                >
                                                    {stageLabels[stage] ??
                                                        stage}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={applicationForm.errors.stage}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="candidate_employment_type">
                                    Tipe kerja final
                                </Label>
                                <Select
                                    value={
                                        applicationForm.data.employment_type ===
                                        ''
                                            ? '__none'
                                            : applicationForm.data
                                                  .employment_type
                                    }
                                    onValueChange={(value) =>
                                        applicationForm.setData(
                                            'employment_type',
                                            value === '__none' ? '' : value,
                                        )
                                    }
                                >
                                    <SelectTrigger id="candidate_employment_type">
                                        <SelectValue placeholder="Pilih tipe" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none">
                                            Ikuti lowongan
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
                                <InputError
                                    message={
                                        applicationForm.errors.employment_type
                                    }
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="interview_scheduled_at">
                                    Jadwal interview
                                </Label>
                                <Input
                                    id="interview_scheduled_at"
                                    type="datetime-local"
                                    value={
                                        applicationForm.data
                                            .interview_scheduled_at
                                    }
                                    onChange={(event) =>
                                        applicationForm.setData(
                                            'interview_scheduled_at',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={
                                        applicationForm.errors
                                            .interview_scheduled_at
                                    }
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="interviewed_at">
                                    Sudah interview pada
                                </Label>
                                <Input
                                    id="interviewed_at"
                                    type="datetime-local"
                                    value={applicationForm.data.interviewed_at}
                                    onChange={(event) =>
                                        applicationForm.setData(
                                            'interviewed_at',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={
                                        applicationForm.errors.interviewed_at
                                    }
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="expected_salary">
                                    Ekspektasi gaji
                                </Label>
                                <Input
                                    id="expected_salary"
                                    value={applicationForm.data.expected_salary}
                                    onChange={(event) =>
                                        applicationForm.setData(
                                            'expected_salary',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Opsional"
                                />
                                <InputError
                                    message={
                                        applicationForm.errors.expected_salary
                                    }
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="offered_salary">
                                    Gaji offering
                                </Label>
                                <Input
                                    id="offered_salary"
                                    value={applicationForm.data.offered_salary}
                                    onChange={(event) =>
                                        applicationForm.setData(
                                            'offered_salary',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Opsional"
                                />
                                <InputError
                                    message={
                                        applicationForm.errors.offered_salary
                                    }
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="proposed_start_date">
                                    Tanggal mulai
                                </Label>
                                <Input
                                    id="proposed_start_date"
                                    type="date"
                                    value={
                                        applicationForm.data.proposed_start_date
                                    }
                                    onChange={(event) =>
                                        applicationForm.setData(
                                            'proposed_start_date',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={
                                        applicationForm.errors
                                            .proposed_start_date
                                    }
                                />
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="interview_notes">
                                    Catatan interview
                                </Label>
                                <textarea
                                    id="interview_notes"
                                    value={applicationForm.data.interview_notes}
                                    onChange={(event) =>
                                        applicationForm.setData(
                                            'interview_notes',
                                            event.target.value,
                                        )
                                    }
                                    rows={5}
                                    className="min-h-28 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none"
                                />
                                <InputError
                                    message={
                                        applicationForm.errors.interview_notes
                                    }
                                />
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="recruiter_notes">
                                    Catatan recruiter
                                </Label>
                                <textarea
                                    id="recruiter_notes"
                                    value={applicationForm.data.recruiter_notes}
                                    onChange={(event) =>
                                        applicationForm.setData(
                                            'recruiter_notes',
                                            event.target.value,
                                        )
                                    }
                                    rows={5}
                                    className="min-h-28 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none"
                                />
                                <InputError
                                    message={
                                        applicationForm.errors.recruiter_notes
                                    }
                                />
                            </div>
                        </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setApplicationDialogOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={applicationForm.processing}
                            >
                                {applicationForm.processing
                                    ? 'Menyimpan...'
                                    : 'Simpan tracker'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={detailApplication !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDetailApplication(null);
                    }
                }}
            >
                <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Detail Kandidat</DialogTitle>
                        <DialogDescription>
                            Ringkasan data kandidat, hasil tracking, dan dokumen
                            pendukung.
                        </DialogDescription>
                    </DialogHeader>

                    {detailApplication ? (
                        <div className="space-y-4 text-sm">
                            <div className="grid gap-4 md:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">
                                            Profil Kandidat
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-slate-600">
                                        <p>
                                            <span className="font-medium text-slate-900">
                                                Nama:
                                            </span>{' '}
                                            {detailApplication.full_name}
                                        </p>
                                        <p>
                                            <span className="font-medium text-slate-900">
                                                Email:
                                            </span>{' '}
                                            {detailApplication.email}
                                        </p>
                                        <p>
                                            <span className="font-medium text-slate-900">
                                                Telepon:
                                            </span>{' '}
                                            {detailApplication.phone}
                                        </p>
                                        <p>
                                            <span className="font-medium text-slate-900">
                                                Pendidikan:
                                            </span>{' '}
                                            {detailApplication.last_education ??
                                                '-'}
                                        </p>
                                        <p>
                                            <span className="font-medium text-slate-900">
                                                Pengalaman:
                                            </span>{' '}
                                            {detailApplication.years_experience
                                                ? `${detailApplication.years_experience} tahun`
                                                : '-'}
                                        </p>
                                        <p>
                                            <span className="font-medium text-slate-900">
                                                Perusahaan saat ini:
                                            </span>{' '}
                                            {detailApplication.current_company ??
                                                '-'}
                                        </p>
                                        <p>
                                            <span className="font-medium text-slate-900">
                                                Alamat:
                                            </span>{' '}
                                            {detailApplication.address ?? '-'}
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">
                                            Tracking
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-slate-600">
                                        <p>
                                            <span className="font-medium text-slate-900">
                                                Lowongan:
                                            </span>{' '}
                                            {detailApplication.job_vacancy
                                                ?.title ?? '-'}
                                        </p>
                                        <p>
                                            <span className="font-medium text-slate-900">
                                                Stage:
                                            </span>{' '}
                                            {stageLabels[
                                                detailApplication.stage
                                            ] ?? detailApplication.stage}
                                        </p>
                                        <p>
                                            <span className="font-medium text-slate-900">
                                                Jadwal interview:
                                            </span>{' '}
                                            {formatDateTime(
                                                detailApplication.interview_scheduled_at,
                                            )}
                                        </p>
                                        <p>
                                            <span className="font-medium text-slate-900">
                                                Sudah interview:
                                            </span>{' '}
                                            {detailApplication.interviewed_at
                                                ? formatDateTime(
                                                      detailApplication.interviewed_at,
                                                  )
                                                : 'Belum'}
                                        </p>
                                        <p>
                                            <span className="font-medium text-slate-900">
                                                Gaji offering:
                                            </span>{' '}
                                            {formatCurrency(
                                                detailApplication.offered_salary,
                                            )}
                                        </p>
                                        <p>
                                            <span className="font-medium text-slate-900">
                                                Tanggal mulai:
                                            </span>{' '}
                                            {formatDate(
                                                detailApplication.proposed_start_date,
                                            )}
                                        </p>
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                asChild
                                            >
                                                <a
                                                    href={
                                                        detailApplication.offer_letter_url
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <Download className="size-4" />
                                                    Offering Letter
                                                </a>
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                asChild
                                            >
                                                <a
                                                    href={
                                                        detailApplication.initial_contract_url
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <FileText className="size-4" />
                                                    Kontrak Awal
                                                </a>
                                            </Button>
                                            {detailApplication.resume_url ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    asChild
                                                >
                                                    <a
                                                        href={
                                                            detailApplication.resume_url
                                                        }
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        <ExternalLink className="size-4" />
                                                        CV
                                                    </a>
                                                </Button>
                                            ) : null}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">
                                        Catatan Kandidat
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-slate-600">
                                    <div>
                                        <p className="mb-1 font-medium text-slate-900">
                                            Cover letter
                                        </p>
                                        <p className="whitespace-pre-line">
                                            {detailApplication.cover_letter ??
                                                '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="mb-1 font-medium text-slate-900">
                                            Catatan interview
                                        </p>
                                        <p className="whitespace-pre-line">
                                            {detailApplication.interview_notes ??
                                                '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="mb-1 font-medium text-slate-900">
                                            Catatan recruiter
                                        </p>
                                        <p className="whitespace-pre-line">
                                            {detailApplication.recruiter_notes ??
                                                '-'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
