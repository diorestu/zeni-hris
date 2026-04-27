import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ClipboardList,
    Filter,
    Pencil,
    Plus,
    Send,
    Trash2,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SearchableSelect from '@/components/ui/searchable-select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Paginator<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    from: number | null;
    to: number | null;
    total: number;
};

type SurveyQuestion = {
    id: string;
    question: string;
    type: string;
};

type SurveyRow = {
    id: number;
    title: string;
    description: string | null;
    questions: SurveyQuestion[];
    questions_text: string;
    status: string;
    is_anonymous: boolean;
    starts_at: string | null;
    ends_at: string | null;
    responses_count: number;
};

type EmployeeOption = {
    id: number;
    label: string;
};

type SurveyForm = {
    title: string;
    description: string;
    questions_text: string;
    status: string;
    is_anonymous: boolean;
    starts_at: string;
    ends_at: string;
};

type ResponseForm = {
    employee_id: string;
    answers: string[];
};

type PageProps = {
    surveys: Paginator<SurveyRow>;
    employees: EmployeeOption[];
    filters: { status: string };
    statusOptions: string[];
    stats: { active: number; responses: number };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Survey', href: '/hris/surveys' },
];

const defaultSurveyForm: SurveyForm = {
    title: '',
    description: '',
    questions_text: '',
    status: 'draft',
    is_anonymous: false,
    starts_at: '',
    ends_at: '',
};

export default function SurveyIndex() {
    const { surveys, employees, filters, statusOptions, stats } =
        usePage<PageProps>().props;
    const [editing, setEditing] = useState<SurveyRow | null>(null);
    const [respondingTo, setRespondingTo] = useState<SurveyRow | null>(null);
    const [filterState, setFilterState] = useState(filters);
    const surveyForm = useForm<SurveyForm>(defaultSurveyForm);
    const responseForm = useForm<ResponseForm>({
        employee_id: '',
        answers: [],
    });

    const employeeOptions = useMemo(
        () =>
            employees.map((employee) => ({
                value: String(employee.id),
                label: employee.label,
            })),
        [employees],
    );

    const submitSurvey = (event: FormEvent) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                surveyForm.reset();
                setEditing(null);
            },
        };

        if (editing) {
            surveyForm.put(`/hris/surveys/${editing.id}`, options);
            return;
        }

        surveyForm.post('/hris/surveys', options);
    };

    const startEdit = (row: SurveyRow) => {
        setEditing(row);
        surveyForm.setData({
            title: row.title,
            description: row.description ?? '',
            questions_text: row.questions_text,
            status: row.status,
            is_anonymous: row.is_anonymous,
            starts_at: row.starts_at ?? '',
            ends_at: row.ends_at ?? '',
        });
    };

    const startResponse = (row: SurveyRow) => {
        setRespondingTo(row);
        responseForm.setData({
            employee_id: '',
            answers: row.questions.map(() => ''),
        });
    };

    const submitResponse = (event: FormEvent) => {
        event.preventDefault();

        if (!respondingTo) {
            return;
        }

        responseForm.post(`/hris/surveys/${respondingTo.id}/responses`, {
            preserveScroll: true,
            onSuccess: () => {
                responseForm.reset();
                setRespondingTo(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Survey" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">
                            HRIS
                        </p>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Survey Karyawan
                        </h1>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-lg border px-4 py-2">
                            <p className="text-muted-foreground">Aktif</p>
                            <p className="text-xl font-semibold">
                                {stats.active}
                            </p>
                        </div>
                        <div className="rounded-lg border px-4 py-2">
                            <p className="text-muted-foreground">Respons</p>
                            <p className="text-xl font-semibold">
                                {stats.responses}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Plus className="size-4" />
                                {editing ? 'Edit survey' : 'Buat survey'}
                            </CardTitle>
                            <CardDescription>
                                Tulis satu pertanyaan per baris. Jawaban
                                disimpan sebagai teks.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form
                                className="grid gap-4"
                                onSubmit={submitSurvey}
                            >
                                <div className="grid gap-2">
                                    <Label htmlFor="title">Judul</Label>
                                    <Input
                                        id="title"
                                        value={surveyForm.data.title}
                                        onChange={(event) =>
                                            surveyForm.setData(
                                                'title',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={surveyForm.errors.title}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">
                                        Deskripsi
                                    </Label>
                                    <textarea
                                        id="description"
                                        className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm"
                                        value={surveyForm.data.description}
                                        onChange={(event) =>
                                            surveyForm.setData(
                                                'description',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={surveyForm.errors.description}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="questions">
                                        Pertanyaan
                                    </Label>
                                    <textarea
                                        id="questions"
                                        className="min-h-32 rounded-md border bg-background px-3 py-2 text-sm"
                                        value={surveyForm.data.questions_text}
                                        onChange={(event) =>
                                            surveyForm.setData(
                                                'questions_text',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={
                                            surveyForm.errors.questions_text
                                        }
                                    />
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <FieldSelect
                                        label="Status"
                                        value={surveyForm.data.status}
                                        options={statusOptions}
                                        onChange={(value) =>
                                            surveyForm.setData('status', value)
                                        }
                                    />
                                    <label className="flex items-center gap-2 self-end rounded-md border px-3 py-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={
                                                surveyForm.data.is_anonymous
                                            }
                                            onChange={(event) =>
                                                surveyForm.setData(
                                                    'is_anonymous',
                                                    event.target.checked,
                                                )
                                            }
                                        />
                                        Anonim
                                    </label>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="starts_at">Mulai</Label>
                                        <Input
                                            id="starts_at"
                                            type="datetime-local"
                                            value={surveyForm.data.starts_at}
                                            onChange={(event) =>
                                                surveyForm.setData(
                                                    'starts_at',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                surveyForm.errors.starts_at
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="ends_at">Selesai</Label>
                                        <Input
                                            id="ends_at"
                                            type="datetime-local"
                                            value={surveyForm.data.ends_at}
                                            onChange={(event) =>
                                                surveyForm.setData(
                                                    'ends_at',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={surveyForm.errors.ends_at}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button disabled={surveyForm.processing}>
                                        {editing ? 'Simpan' : 'Tambah'}
                                    </Button>
                                    {editing ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setEditing(null);
                                                surveyForm.reset();
                                            }}
                                        >
                                            Batal
                                        </Button>
                                    ) : null}
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ClipboardList className="size-4" />
                                    Daftar survey
                                </CardTitle>
                                <CardDescription>
                                    {surveys.from ?? 0}-{surveys.to ?? 0} dari{' '}
                                    {surveys.total} survey.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <div className="flex flex-col gap-2 md:flex-row">
                                    <FieldSelect
                                        label="Status"
                                        value={filterState.status}
                                        options={['', ...statusOptions]}
                                        onChange={(value) =>
                                            setFilterState({ status: value })
                                        }
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            router.get(
                                                '/hris/surveys',
                                                filterState,
                                                {
                                                    preserveState: true,
                                                    preserveScroll: true,
                                                },
                                            )
                                        }
                                        className="md:self-end"
                                    >
                                        <Filter className="size-4" />
                                        Filter
                                    </Button>
                                </div>
                                <div className="overflow-hidden rounded-lg border">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
                                            <tr>
                                                <th className="px-3 py-2">
                                                    Survey
                                                </th>
                                                <th className="px-3 py-2">
                                                    Status
                                                </th>
                                                <th className="px-3 py-2">
                                                    Respons
                                                </th>
                                                <th className="px-3 py-2 text-right">
                                                    Aksi
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {surveys.data.map((row) => (
                                                <tr
                                                    key={row.id}
                                                    className="border-t"
                                                >
                                                    <td className="px-3 py-3">
                                                        <p className="font-medium">
                                                            {row.title}
                                                        </p>
                                                        <p className="text-muted-foreground">
                                                            {
                                                                row.questions
                                                                    .length
                                                            }{' '}
                                                            pertanyaan
                                                        </p>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <Badge
                                                            variant={
                                                                row.status ===
                                                                'active'
                                                                    ? 'default'
                                                                    : 'secondary'
                                                            }
                                                        >
                                                            {row.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        {row.responses_count}
                                                    </td>
                                                    <td className="px-3 py-3 text-right">
                                                        <div className="inline-flex gap-1">
                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={() =>
                                                                    startResponse(
                                                                        row,
                                                                    )
                                                                }
                                                            >
                                                                <Send className="size-4" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={() =>
                                                                    startEdit(
                                                                        row,
                                                                    )
                                                                }
                                                            >
                                                                <Pencil className="size-4" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={() =>
                                                                    router.delete(
                                                                        `/hris/surveys/${row.id}`,
                                                                        {
                                                                            preserveScroll: true,
                                                                        },
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <Pagination links={surveys.links} />
                            </CardContent>
                        </Card>

                        {respondingTo ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        Input respons: {respondingTo.title}
                                    </CardTitle>
                                    <CardDescription>
                                        Respons karyawan yang sama akan
                                        diperbarui, bukan digandakan.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form
                                        className="grid gap-4"
                                        onSubmit={submitResponse}
                                    >
                                        <div className="grid gap-2">
                                            <Label>Karyawan</Label>
                                            <SearchableSelect
                                                value={
                                                    responseForm.data
                                                        .employee_id
                                                }
                                                onValueChange={(value) =>
                                                    responseForm.setData(
                                                        'employee_id',
                                                        value,
                                                    )
                                                }
                                                options={employeeOptions}
                                                placeholder={
                                                    respondingTo.is_anonymous
                                                        ? 'Opsional untuk survey anonim'
                                                        : 'Pilih karyawan'
                                                }
                                                searchPlaceholder="Cari karyawan..."
                                            />
                                            <InputError
                                                message={
                                                    responseForm.errors
                                                        .employee_id
                                                }
                                            />
                                        </div>
                                        {respondingTo.questions.map(
                                            (question, index) => (
                                                <div
                                                    className="grid gap-2"
                                                    key={question.id}
                                                >
                                                    <Label>
                                                        {question.question}
                                                    </Label>
                                                    <textarea
                                                        className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm"
                                                        value={
                                                            responseForm.data
                                                                .answers[
                                                                index
                                                            ] ?? ''
                                                        }
                                                        onChange={(event) => {
                                                            const next = [
                                                                ...responseForm
                                                                    .data
                                                                    .answers,
                                                            ];
                                                            next[index] =
                                                                event.target.value;
                                                            responseForm.setData(
                                                                'answers',
                                                                next,
                                                            );
                                                        }}
                                                    />
                                                </div>
                                            ),
                                        )}
                                        <div className="flex gap-2">
                                            <Button
                                                disabled={
                                                    responseForm.processing
                                                }
                                            >
                                                Simpan respons
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    setRespondingTo(null)
                                                }
                                            >
                                                Tutup
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        ) : null}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function FieldSelect({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
}) {
    return (
        <label className="grid gap-2 text-sm">
            <span className="font-medium">{label}</span>
            <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            >
                {options.map((option) => (
                    <option key={option || 'all'} value={option}>
                        {option || 'Semua'}
                    </option>
                ))}
            </select>
        </label>
    );
}

function Pagination({ links }: { links: Paginator<SurveyRow>['links'] }) {
    return (
        <div className="flex flex-wrap gap-2">
            {links.map((link) => (
                <Button
                    key={`${link.label}-${link.url}`}
                    variant={link.active ? 'default' : 'outline'}
                    size="sm"
                    disabled={!link.url}
                    asChild={Boolean(link.url)}
                >
                    {link.url ? (
                        <Link
                            href={link.url}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ) : (
                        <span
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    )}
                </Button>
            ))}
        </div>
    );
}
