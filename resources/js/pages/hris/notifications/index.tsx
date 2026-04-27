import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { BellRing, Filter, Pencil, Plus, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
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
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Paginator<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    from: number | null;
    to: number | null;
    total: number;
};

type NotificationRow = {
    id: number;
    title: string;
    message: string;
    audience: string;
    channel: string;
    status: string;
    publish_at: string | null;
    expires_at: string | null;
};

type NotificationForm = {
    title: string;
    message: string;
    audience: string;
    channel: string;
    status: string;
    publish_at: string;
    expires_at: string;
};

type PageProps = {
    notifications: Paginator<NotificationRow>;
    filters: { status: string; audience: string };
    statusOptions: string[];
    audienceOptions: string[];
    channelOptions: string[];
    stats: { published: number; draft: number };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Notifikasi', href: '/hris/notifications' },
];

const defaultForm: NotificationForm = {
    title: '',
    message: '',
    audience: 'all',
    channel: 'portal',
    status: 'draft',
    publish_at: '',
    expires_at: '',
};

export default function NotificationIndex() {
    const {
        notifications,
        filters,
        statusOptions,
        audienceOptions,
        channelOptions,
        stats,
    } = usePage<PageProps>().props;
    const [editing, setEditing] = useState<NotificationRow | null>(null);
    const [filterState, setFilterState] = useState(filters);
    const form = useForm<NotificationForm>(defaultForm);

    const submit = (event: FormEvent) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setEditing(null);
            },
        };

        if (editing) {
            form.put(`/hris/notifications/${editing.id}`, options);
            return;
        }

        form.post('/hris/notifications', options);
    };

    const startEdit = (row: NotificationRow) => {
        setEditing(row);
        form.setData({
            title: row.title,
            message: row.message,
            audience: row.audience,
            channel: row.channel,
            status: row.status,
            publish_at: row.publish_at ?? '',
            expires_at: row.expires_at ?? '',
        });
    };

    const applyFilters = () => {
        router.get('/hris/notifications', filterState, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notifikasi" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">
                            HRIS
                        </p>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Notifikasi
                        </h1>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-lg border px-4 py-2">
                            <p className="text-muted-foreground">Published</p>
                            <p className="text-xl font-semibold">
                                {stats.published}
                            </p>
                        </div>
                        <div className="rounded-lg border px-4 py-2">
                            <p className="text-muted-foreground">Draft</p>
                            <p className="text-xl font-semibold">
                                {stats.draft}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Plus className="size-4" />
                                {editing
                                    ? 'Edit notifikasi'
                                    : 'Buat notifikasi'}
                            </CardTitle>
                            <CardDescription>
                                Siapkan pengumuman untuk portal, WhatsApp, atau
                                email.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form className="grid gap-4" onSubmit={submit}>
                                <div className="grid gap-2">
                                    <Label htmlFor="title">Judul</Label>
                                    <Input
                                        id="title"
                                        value={form.data.title}
                                        onChange={(event) =>
                                            form.setData(
                                                'title',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError message={form.errors.title} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="message">Pesan</Label>
                                    <textarea
                                        id="message"
                                        className="min-h-28 rounded-md border bg-background px-3 py-2 text-sm"
                                        value={form.data.message}
                                        onChange={(event) =>
                                            form.setData(
                                                'message',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError message={form.errors.message} />
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <FieldSelect
                                        label="Audience"
                                        value={form.data.audience}
                                        options={audienceOptions}
                                        onChange={(value) =>
                                            form.setData('audience', value)
                                        }
                                    />
                                    <FieldSelect
                                        label="Channel"
                                        value={form.data.channel}
                                        options={channelOptions}
                                        onChange={(value) =>
                                            form.setData('channel', value)
                                        }
                                    />
                                    <FieldSelect
                                        label="Status"
                                        value={form.data.status}
                                        options={statusOptions}
                                        onChange={(value) =>
                                            form.setData('status', value)
                                        }
                                    />
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="publish_at">
                                            Publish
                                        </Label>
                                        <Input
                                            id="publish_at"
                                            type="datetime-local"
                                            value={form.data.publish_at}
                                            onChange={(event) =>
                                                form.setData(
                                                    'publish_at',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={form.errors.publish_at}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="expires_at">
                                            Berakhir
                                        </Label>
                                        <Input
                                            id="expires_at"
                                            type="datetime-local"
                                            value={form.data.expires_at}
                                            onChange={(event) =>
                                                form.setData(
                                                    'expires_at',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={form.errors.expires_at}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button disabled={form.processing}>
                                        {editing ? 'Simpan' : 'Tambah'}
                                    </Button>
                                    {editing ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setEditing(null);
                                                form.reset();
                                            }}
                                        >
                                            Batal
                                        </Button>
                                    ) : null}
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BellRing className="size-4" />
                                Daftar notifikasi
                            </CardTitle>
                            <CardDescription>
                                {notifications.from ?? 0}-
                                {notifications.to ?? 0} dari{' '}
                                {notifications.total} notifikasi.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="flex flex-col gap-2 md:flex-row">
                                <FieldSelect
                                    label="Status"
                                    value={filterState.status}
                                    options={['', ...statusOptions]}
                                    onChange={(value) =>
                                        setFilterState((current) => ({
                                            ...current,
                                            status: value,
                                        }))
                                    }
                                />
                                <FieldSelect
                                    label="Audience"
                                    value={filterState.audience}
                                    options={['', ...audienceOptions]}
                                    onChange={(value) =>
                                        setFilterState((current) => ({
                                            ...current,
                                            audience: value,
                                        }))
                                    }
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={applyFilters}
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
                                            <th className="px-3 py-2">Judul</th>
                                            <th className="px-3 py-2">
                                                Audience
                                            </th>
                                            <th className="px-3 py-2">
                                                Status
                                            </th>
                                            <th className="px-3 py-2 text-right">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {notifications.data.map((row) => (
                                            <tr
                                                key={row.id}
                                                className="border-t"
                                            >
                                                <td className="px-3 py-3">
                                                    <p className="font-medium">
                                                        {row.title}
                                                    </p>
                                                    <p className="line-clamp-2 text-muted-foreground">
                                                        {row.message}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-3">
                                                    {row.audience}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <Badge
                                                        variant={
                                                            row.status ===
                                                            'published'
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {row.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-3 py-3 text-right">
                                                    <div className="inline-flex gap-1">
                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                startEdit(row)
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
                                                                    `/hris/notifications/${row.id}`,
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

                            <Pagination links={notifications.links} />
                        </CardContent>
                    </Card>
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

function Pagination({ links }: { links: Paginator<NotificationRow>['links'] }) {
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
