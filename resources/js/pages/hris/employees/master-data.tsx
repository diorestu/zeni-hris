import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Pencil, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import ActionIconButton from '@/components/action-icon-button';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import divisionRoutes from '@/routes/hris/divisions';
import employeeRoutes from '@/routes/hris/employees';
import positionRoutes from '@/routes/hris/positions';
import type { BreadcrumbItem } from '@/types';

type PaginatorLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Paginator<T> = {
    data: T[];
    links: PaginatorLink[];
};

type Division = {
    id: number;
    code: string;
    name: string;
    description: string | null;
    is_active: boolean;
    employees_count: number;
    positions_count: number;
};

type Position = {
    id: number;
    division_id: number | null;
    parent_position_id: number | null;
    code: string;
    name: string;
    level: string | null;
    level_label: string | null;
    description: string | null;
    is_active: boolean;
    employees_count: number;
    division: {
        id: number;
        name: string;
    } | null;
    parent_position: {
        id: number;
        name: string;
    } | null;
};

type DivisionOption = {
    id: number;
    code: string;
    name: string;
    employees_count: number;
};

type PositionOption = {
    id: number;
    division_id: number | null;
    parent_position_id: number | null;
    code: string;
    name: string;
    level: string | null;
    division_name: string | null;
    employees_count: number;
};

type DivisionFormData = {
    code: string;
    name: string;
    description: string;
    is_active: boolean;
};

type PositionFormData = {
    division_id: string;
    parent_position_id: string;
    code: string;
    name: string;
    level: string;
    description: string;
    is_active: boolean;
};

type Filters = {
    division_search: string;
    position_search: string;
};

type PageProps = {
    divisions: Paginator<Division>;
    positions: Paginator<Position>;
    divisionOptions: DivisionOption[];
    positionOptions: PositionOption[];
    filters: Filters;
    stats: {
        employees_total: number;
        divisions_total: number;
        positions_total: number;
    };
    options: {
        position_levels: Array<{
            value: string;
            label: string;
        }>;
    };
    errors: Record<string, string | undefined>;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Karyawan',
        href: employeeRoutes.index(),
    },
    {
        title: 'Divisi & Jabatan',
        href: '/hris/employees/master-data',
    },
];

const DIVISION_DEFAULT: DivisionFormData = {
    code: '',
    name: '',
    description: '',
    is_active: true,
};

const POSITION_DEFAULT: PositionFormData = {
    division_id: '',
    parent_position_id: '',
    code: '',
    name: '',
    level: '4',
    description: '',
    is_active: true,
};

export default function EmployeeMasterDataPage() {
    const {
        divisions,
        positions,
        divisionOptions,
        positionOptions,
        filters,
        stats,
        options,
        errors,
    } = usePage<PageProps>().props;

    const [filterState, setFilterState] = useState<Filters>(filters);
    const [divisionDialogOpen, setDivisionDialogOpen] = useState(false);
    const [editingDivision, setEditingDivision] = useState<Division | null>(null);
    const [positionDialogOpen, setPositionDialogOpen] = useState(false);
    const [editingPosition, setEditingPosition] = useState<Position | null>(null);

    const divisionForm = useForm<DivisionFormData>(DIVISION_DEFAULT);
    const positionForm = useForm<PositionFormData>(POSITION_DEFAULT);

    const availableParentPositions = useMemo(() => {
        const selectedDivisionId = positionForm.data.division_id;

        return positionOptions.filter((position) => {
            if (editingPosition && position.id === editingPosition.id) {
                return false;
            }

            if (selectedDivisionId === '') {
                return true;
            }

            return position.division_id === Number(selectedDivisionId);
        });
    }, [editingPosition, positionForm.data.division_id, positionOptions]);

    const openCreateDivisionDialog = () => {
        setEditingDivision(null);
        divisionForm.clearErrors();
        divisionForm.setData(DIVISION_DEFAULT);
        setDivisionDialogOpen(true);
    };

    const openEditDivisionDialog = (division: Division) => {
        setEditingDivision(division);
        divisionForm.clearErrors();
        divisionForm.setData({
            code: division.code,
            name: division.name,
            description: division.description ?? '',
            is_active: division.is_active,
        });
        setDivisionDialogOpen(true);
    };

    const submitDivisionForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingDivision) {
            divisionForm.put(divisionRoutes.update.url(editingDivision.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setDivisionDialogOpen(false);
                    setEditingDivision(null);
                    divisionForm.reset();
                },
            });

            return;
        }

        divisionForm.post(divisionRoutes.store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                setDivisionDialogOpen(false);
                divisionForm.reset();
            },
        });
    };

    const openCreatePositionDialog = () => {
        setEditingPosition(null);
        positionForm.clearErrors();
        positionForm.setData(POSITION_DEFAULT);
        setPositionDialogOpen(true);
    };

    const openCreateSubPositionDialog = (parentPosition: Position) => {
        setEditingPosition(null);
        positionForm.clearErrors();
        positionForm.setData({
            ...POSITION_DEFAULT,
            division_id: parentPosition.division_id
                ? String(parentPosition.division_id)
                : '',
            parent_position_id: String(parentPosition.id),
        });
        setPositionDialogOpen(true);
    };

    const openEditPositionDialog = (position: Position) => {
        setEditingPosition(position);
        positionForm.clearErrors();
        positionForm.setData({
            division_id: position.division_id ? String(position.division_id) : '',
            parent_position_id: position.parent_position_id
                ? String(position.parent_position_id)
                : '',
            code: position.code,
            name: position.name,
            level:
                position.level !== null &&
                ['0', '1', '2', '3', '4', '5'].includes(position.level)
                    ? position.level
                    : '4',
            description: position.description ?? '',
            is_active: position.is_active,
        });
        setPositionDialogOpen(true);
    };

    const submitPositionForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingPosition) {
            positionForm.put(positionRoutes.update.url(editingPosition.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setPositionDialogOpen(false);
                    setEditingPosition(null);
                    positionForm.reset();
                },
            });

            return;
        }

        positionForm.post(positionRoutes.store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                setPositionDialogOpen(false);
                positionForm.reset();
            },
        });
    };

    const goToMasterData = (pageKey: 'division_page' | 'position_page', value: string) => {
        router.get(
            '/hris/employees/master-data',
            {
                ...filterState,
                [pageKey]: value,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    return (
        <AppLayout
            breadcrumbs={breadcrumbs}
            headerActions={
                <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-800"
                >
                    <Link href={employeeRoutes.index()}>Kembali ke Karyawan</Link>
                </Button>
            }
        >
            <Head title="Divisi & Jabatan" />

            <div className="space-y-6 p-4">
                {(errors.division_delete || errors.position_delete) && (
                    <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {errors.division_delete ?? errors.position_delete}
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Card className="gap-2 py-3">
                        <CardHeader className="px-4 pb-0">
                            <CardDescription>Total Karyawan</CardDescription>
                            <CardTitle className="text-2xl">
                                {stats.employees_total}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="gap-2 py-3">
                        <CardHeader className="px-4 pb-0">
                            <CardDescription>Total Divisi</CardDescription>
                            <CardTitle className="text-2xl">
                                {stats.divisions_total}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="gap-2 py-3">
                        <CardHeader className="px-4 pb-0">
                            <CardDescription>Total Jabatan</CardDescription>
                            <CardTitle className="text-2xl">
                                {stats.positions_total}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-row items-start justify-between gap-4">
                            <div>
                                <CardTitle>Divisi</CardTitle>
                                <CardDescription>
                                    Kelola struktur divisi organisasi.
                                </CardDescription>
                            </div>
                            <Button size="sm" onClick={openCreateDivisionDialog}>
                                <Plus className="size-4" />
                                Tambah Divisi
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    goToMasterData('division_page', '1');
                                }}
                                className="mb-3"
                            >
                                <div className="relative">
                                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={filterState.division_search}
                                        onChange={(event) =>
                                            setFilterState((current) => ({
                                                ...current,
                                                division_search: event.target.value,
                                            }))
                                        }
                                        className="pl-9"
                                        placeholder="Cari kode / nama divisi"
                                    />
                                </div>
                            </form>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[520px] text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="px-3 py-2">Kode</th>
                                            <th className="px-3 py-2">Nama</th>
                                            <th className="px-3 py-2">Karyawan</th>
                                            <th className="px-3 py-2">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {divisions.data.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="px-3 py-6 text-center text-muted-foreground"
                                                >
                                                    Belum ada data divisi.
                                                </td>
                                            </tr>
                                        )}
                                        {divisions.data.map((division) => (
                                            <tr key={division.id} className="border-b">
                                                <td className="px-3 py-3">{division.code}</td>
                                                <td className="px-3 py-3">
                                                    <p className="font-medium">{division.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {division.description ?? '-'}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-3">
                                                    {division.employees_count}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="flex gap-1.5">
                                                        <ActionIconButton
                                                            label="Edit divisi"
                                                            icon={Pencil}
                                                            variant="outline"
                                                            onClick={() =>
                                                                openEditDivisionDialog(
                                                                    division,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                                {divisions.links.map((link, index) => (
                                    <Button
                                        key={`${link.label}-${index}`}
                                        asChild={link.url !== null}
                                        size="sm"
                                        variant={link.active ? 'default' : 'outline'}
                                        disabled={link.url === null}
                                    >
                                        {link.url ? (
                                            <Link href={link.url} preserveScroll preserveState>
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
                                <CardTitle>Jabatan</CardTitle>
                                <CardDescription>
                                    Kelola master jabatan tiap divisi.
                                </CardDescription>
                            </div>
                            <Button size="sm" onClick={openCreatePositionDialog}>
                                <Plus className="size-4" />
                                Tambah Jabatan
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    goToMasterData('position_page', '1');
                                }}
                                className="mb-3"
                            >
                                <div className="relative">
                                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={filterState.position_search}
                                        onChange={(event) =>
                                            setFilterState((current) => ({
                                                ...current,
                                                position_search: event.target.value,
                                            }))
                                        }
                                        className="pl-9"
                                        placeholder="Cari kode / nama jabatan"
                                    />
                                </div>
                            </form>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[620px] text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="px-3 py-2">Kode</th>
                                            <th className="px-3 py-2">Nama</th>
                                            <th className="px-3 py-2">Parent</th>
                                            <th className="px-3 py-2">Divisi</th>
                                            <th className="px-3 py-2">Dipakai</th>
                                            <th className="px-3 py-2">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {positions.data.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="px-3 py-6 text-center text-muted-foreground"
                                                >
                                                    Belum ada data jabatan.
                                                </td>
                                            </tr>
                                        )}
                                        {positions.data.map((position) => (
                                            <tr key={position.id} className="border-b">
                                                <td className="px-3 py-3">{position.code}</td>
                                                <td className="px-3 py-3">
                                                    <p className="font-medium">{position.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {position.level_label ??
                                                            position.level ??
                                                            '-'}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-3">
                                                    {position.parent_position?.name ?? '-'}
                                                </td>
                                                <td className="px-3 py-3">
                                                    {position.division?.name ?? '-'}
                                                </td>
                                                <td className="px-3 py-3">
                                                    {position.employees_count}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="flex gap-1.5">
                                                        <ActionIconButton
                                                            label="Tambah sub-jabatan"
                                                            icon={Plus}
                                                            variant="outline"
                                                            onClick={() =>
                                                                openCreateSubPositionDialog(
                                                                    position,
                                                                )
                                                            }
                                                        />
                                                        <ActionIconButton
                                                            label="Edit jabatan"
                                                            icon={Pencil}
                                                            variant="outline"
                                                            onClick={() =>
                                                                openEditPositionDialog(
                                                                    position,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                                {positions.links.map((link, index) => (
                                    <Button
                                        key={`${link.label}-${index}`}
                                        asChild={link.url !== null}
                                        size="sm"
                                        variant={link.active ? 'default' : 'outline'}
                                        disabled={link.url === null}
                                    >
                                        {link.url ? (
                                            <Link href={link.url} preserveScroll preserveState>
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
            </div>

            <Dialog
                open={divisionDialogOpen}
                onOpenChange={(open) => {
                    setDivisionDialogOpen(open);
                    if (!open) {
                        setEditingDivision(null);
                        divisionForm.reset();
                        divisionForm.clearErrors();
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingDivision ? 'Edit Divisi' : 'Tambah Divisi'}
                        </DialogTitle>
                        <DialogDescription>
                            Atur master data divisi organisasi.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitDivisionForm} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="division_code">Kode</Label>
                            <Input
                                id="division_code"
                                value={divisionForm.data.code}
                                onChange={(event) =>
                                    divisionForm.setData(
                                        'code',
                                        event.target.value
                                            .toUpperCase()
                                            .replace(/[^A-Z0-9]/g, '')
                                            .slice(0, 3),
                                    )
                                }
                                placeholder="HR"
                                minLength={2}
                                maxLength={3}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                2-3 karakter huruf/angka.
                            </p>
                            <InputError message={divisionForm.errors.code} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="division_name">Nama</Label>
                            <Input
                                id="division_name"
                                value={divisionForm.data.name}
                                onChange={(event) =>
                                    divisionForm.setData('name', event.target.value)
                                }
                                placeholder="Human Resources"
                                required
                            />
                            <InputError message={divisionForm.errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="division_description">Deskripsi</Label>
                            <Input
                                id="division_description"
                                value={divisionForm.data.description}
                                onChange={(event) =>
                                    divisionForm.setData(
                                        'description',
                                        event.target.value,
                                    )
                                }
                            />
                            <InputError message={divisionForm.errors.description} />
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="division_is_active"
                                checked={divisionForm.data.is_active}
                                onCheckedChange={(checked) =>
                                    divisionForm.setData(
                                        'is_active',
                                        checked === true,
                                    )
                                }
                            />
                            <Label htmlFor="division_is_active">Aktif</Label>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDivisionDialogOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={divisionForm.processing}>
                                {editingDivision ? 'Simpan' : 'Tambah'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={positionDialogOpen}
                onOpenChange={(open) => {
                    setPositionDialogOpen(open);
                    if (!open) {
                        setEditingPosition(null);
                        positionForm.reset();
                        positionForm.clearErrors();
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingPosition ? 'Edit Jabatan' : 'Tambah Jabatan'}
                        </DialogTitle>
                        <DialogDescription>
                            Atur jabatan, divisi, dan struktur sub-jabatan.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitPositionForm} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="position_division">Divisi</Label>
                            <SearchableSelect
                                id="position_division"
                                value={
                                    positionForm.data.division_id === ''
                                        ? '__none'
                                        : positionForm.data.division_id
                                }
                                onValueChange={(value) => {
                                    const divisionId = value === '__none' ? '' : value;

                                    positionForm.setData('division_id', divisionId);

                                    if (
                                        divisionId !== '' &&
                                        positionForm.data.parent_position_id !== ''
                                    ) {
                                        const selectedParent = positionOptions.find(
                                            (position) =>
                                                String(position.id) ===
                                                positionForm.data.parent_position_id,
                                        );

                                        if (
                                            selectedParent &&
                                            selectedParent.division_id !== Number(divisionId)
                                        ) {
                                            positionForm.setData(
                                                'parent_position_id',
                                                '',
                                            );
                                        }
                                    }
                                }}
                                placeholder="Pilih divisi"
                                searchPlaceholder="Cari divisi..."
                                options={[
                                    { value: '__none', label: '-' },
                                    ...divisionOptions.map((division) => ({
                                        value: String(division.id),
                                        label: `${division.code} - ${division.name}`,
                                    })),
                                ]}
                                className="w-full"
                            />
                            <InputError message={positionForm.errors.division_id} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="position_parent">Jabatan Induk</Label>
                            <SearchableSelect
                                id="position_parent"
                                value={
                                    positionForm.data.parent_position_id === ''
                                        ? '__none'
                                        : positionForm.data.parent_position_id
                                }
                                onValueChange={(value) =>
                                    positionForm.setData(
                                        'parent_position_id',
                                        value === '__none' ? '' : value,
                                    )
                                }
                                placeholder="Pilih jabatan induk"
                                searchPlaceholder="Cari jabatan..."
                                options={[
                                    { value: '__none', label: '-' },
                                    ...availableParentPositions.map((position) => ({
                                        value: String(position.id),
                                        label: `${position.name}${
                                            position.division_name
                                                ? ` (${position.division_name})`
                                                : ''
                                        }`,
                                    })),
                                ]}
                                className="w-full"
                            />
                            <InputError
                                message={positionForm.errors.parent_position_id}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="position_code">Kode</Label>
                            <Input
                                id="position_code"
                                value={positionForm.data.code}
                                onChange={(event) =>
                                    positionForm.setData(
                                        'code',
                                        event.target.value
                                            .toUpperCase()
                                            .replace(/[^A-Z0-9]/g, '')
                                            .slice(0, 3),
                                    )
                                }
                                placeholder="CL"
                                minLength={2}
                                maxLength={3}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                2-3 karakter huruf/angka.
                            </p>
                            <InputError message={positionForm.errors.code} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="position_name">Nama</Label>
                            <Input
                                id="position_name"
                                value={positionForm.data.name}
                                onChange={(event) =>
                                    positionForm.setData('name', event.target.value)
                                }
                                placeholder="Cleaner"
                                required
                            />
                            <InputError message={positionForm.errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="position_level">Level Jabatan</Label>
                            <Select
                                value={positionForm.data.level}
                                onValueChange={(value) =>
                                    positionForm.setData('level', value)
                                }
                            >
                                <SelectTrigger id="position_level" className="w-full">
                                    <SelectValue placeholder="Pilih level jabatan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {options.position_levels.map((level) => (
                                        <SelectItem
                                            key={level.value}
                                            value={level.value}
                                        >
                                            {level.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={positionForm.errors.level} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="position_description">Deskripsi</Label>
                            <Input
                                id="position_description"
                                value={positionForm.data.description}
                                onChange={(event) =>
                                    positionForm.setData(
                                        'description',
                                        event.target.value,
                                    )
                                }
                            />
                            <InputError
                                message={positionForm.errors.description}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="position_is_active"
                                checked={positionForm.data.is_active}
                                onCheckedChange={(checked) =>
                                    positionForm.setData(
                                        'is_active',
                                        checked === true,
                                    )
                                }
                            />
                            <Label htmlFor="position_is_active">Aktif</Label>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setPositionDialogOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={positionForm.processing}>
                                {editingPosition ? 'Simpan' : 'Tambah'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
