import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Download,
    Eye,
    Filter,
    Landmark,
    Pencil,
    Plus,
    RotateCcw,
    Search,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import ActionIconButton from '@/components/action-icon-button';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
import allowanceRoutes from '@/routes/hris/employees/allowances';
import bankAccountRoutes from '@/routes/hris/employees/bank-accounts';
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
    from: number | null;
    to: number | null;
    total: number;
    current_page: number;
    last_page: number;
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

type PositionOption = {
    id: number;
    division_id: number | null;
    name: string;
    division_name: string | null;
    employees_count: number;
};

type BankAccount = {
    id: number;
    bank_name: string;
    account_number: string;
    account_holder_name: string;
    branch: string | null;
    currency: string;
    is_primary: boolean;
};

type EmployeeAllowance = {
    id: number;
    name: string;
    amount: string;
    is_active: boolean;
    effective_start_date: string | null;
    effective_end_date: string | null;
    notes: string | null;
};

type Employee = {
    id: number;
    employee_code: string;
    first_name: string;
    last_name: string | null;
    full_name: string;
    email: string | null;
    phone: string | null;
    gender: string | null;
    birth_date: string | null;
    last_education: string | null;
    marital_status: string | null;
    children_count: number | null;
    hire_date: string;
    employment_status: string;
    employment_type: string;
    division_id: number | null;
    position_id: number | null;
    manager_id: number | null;
    base_salary: string | null;
    address: string | null;
    family_card_number: string | null;
    bpjs_kesehatan_number: string | null;
    bpjs_ketenagakerjaan_number: string | null;
    sim_a_number: string | null;
    sim_b_number: string | null;
    sim_c_number: string | null;
    biological_mother_name: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    notes: string | null;
    is_active: boolean;
    division: {
        id: number;
        name: string;
    } | null;
    position: {
        id: number;
        name: string;
    } | null;
    manager: {
        id: number;
        full_name: string;
        employee_code: string;
    } | null;
    bank_accounts: BankAccount[];
    allowances: EmployeeAllowance[];
};

type ManagerOption = {
    id: number;
    label: string;
};

type EmployeeFormData = {
    employee_code: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    gender: string;
    birth_date: string;
    last_education: string;
    marital_status: string;
    children_count: string;
    hire_date: string;
    employment_status: string;
    employment_type: string;
    division_id: string;
    position_id: string;
    manager_id: string;
    base_salary: string;
    address: string;
    family_card_number: string;
    bpjs_kesehatan_number: string;
    bpjs_ketenagakerjaan_number: string;
    sim_a_number: string;
    sim_b_number: string;
    sim_c_number: string;
    biological_mother_name: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    notes: string;
    is_active: boolean;
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

type BankAccountFormData = {
    bank_name: string;
    account_number: string;
    account_holder_name: string;
    branch: string;
    currency: string;
    is_primary: boolean;
};

type AllowanceFormData = {
    name: string;
    amount: string;
    is_active: boolean;
    effective_start_date: string;
    effective_end_date: string;
    notes: string;
};

type Filters = {
    search: string;
    division_id: string;
    status: string;
    division_search: string;
    position_search: string;
};

type PageProps = {
    employees: Paginator<Employee>;
    divisions: Paginator<Division>;
    positions: Paginator<Position>;
    positionOptions: PositionOption[];
    managerOptions: ManagerOption[];
    nextEmployeeCode: string;
    filters: Filters;
    stats: {
        employees_total: number;
        employees_active: number;
        divisions_total: number;
        positions_total: number;
    };
    options: {
        employment_statuses: string[];
        employment_types: string[];
        genders: string[];
        marital_statuses: string[];
        last_education_levels: string[];
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
];

const todayDate = () => new Date().toISOString().slice(0, 10);

const buildEmployeeDefault = (nextEmployeeCode = ''): EmployeeFormData => ({
    employee_code: nextEmployeeCode,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    gender: '',
    birth_date: '',
    last_education: '',
    marital_status: '',
    children_count: '0',
    hire_date: todayDate(),
    employment_status: 'active',
    employment_type: 'permanent',
    division_id: '',
    position_id: '',
    manager_id: '',
    base_salary: '',
    address: '',
    family_card_number: '',
    bpjs_kesehatan_number: '',
    bpjs_ketenagakerjaan_number: '',
    sim_a_number: '',
    sim_b_number: '',
    sim_c_number: '',
    biological_mother_name: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    notes: '',
    is_active: true,
});

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

const BANK_ACCOUNT_DEFAULT: BankAccountFormData = {
    bank_name: '',
    account_number: '',
    account_holder_name: '',
    branch: '',
    currency: 'IDR',
    is_primary: false,
};

const ALLOWANCE_DEFAULT: AllowanceFormData = {
    name: '',
    amount: '0',
    is_active: true,
    effective_start_date: '',
    effective_end_date: '',
    notes: '',
};

const statusLabels: Record<string, string> = {
    active: 'Aktif',
    probation: 'Probation',
    on_leave: 'Cuti',
    resigned: 'Resign',
};

const typeLabels: Record<string, string> = {
    permanent: 'Permanent',
    contract: 'Contract',
    internship: 'Internship',
    freelance: 'Freelance',
};

const genderLabels: Record<string, string> = {
    male: 'Laki-laki',
    female: 'Perempuan',
    other: 'Lainnya',
};

const maritalStatusLabels: Record<string, string> = {
    single: 'Belum Menikah',
    married: 'Menikah',
    divorced: 'Cerai',
    widowed: 'Janda/Duda',
};

const getInitials = (name: string) => {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
};

export default function EmployeesIndex() {
    const {
        employees,
        divisions,
        positions,
        positionOptions,
        managerOptions,
        nextEmployeeCode,
        filters,
        stats,
        options,
        errors,
    } = usePage<PageProps>().props;

    const [filterState, setFilterState] = useState<Filters>(filters);

    const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
    const [employeeFormStep, setEmployeeFormStep] = useState(1);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(
        null,
    );
    const [detailEmployee, setDetailEmployee] = useState<Employee | null>(null);

    const [divisionDialogOpen, setDivisionDialogOpen] = useState(false);
    const [editingDivision, setEditingDivision] = useState<Division | null>(
        null,
    );

    const [positionDialogOpen, setPositionDialogOpen] = useState(false);
    const [editingPosition, setEditingPosition] = useState<Position | null>(
        null,
    );

    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
        null,
    );
    const [editingBankAccount, setEditingBankAccount] =
        useState<BankAccount | null>(null);
    const [editingAllowance, setEditingAllowance] =
        useState<EmployeeAllowance | null>(null);

    const employeeForm = useForm<EmployeeFormData>(
        buildEmployeeDefault(nextEmployeeCode),
    );
    const divisionForm = useForm<DivisionFormData>(DIVISION_DEFAULT);
    const positionForm = useForm<PositionFormData>(POSITION_DEFAULT);
    const bankAccountForm = useForm<BankAccountFormData>(BANK_ACCOUNT_DEFAULT);
    const allowanceForm = useForm<AllowanceFormData>(ALLOWANCE_DEFAULT);

    const employeeStepFields = useMemo<
        Record<number, (keyof EmployeeFormData)[]>
    >(
        () => ({
            1: [
                'employee_code',
                'first_name',
                'last_name',
                'email',
                'phone',
                'gender',
                'birth_date',
                'last_education',
                'marital_status',
                'children_count',
                'biological_mother_name',
                'address',
            ],
            2: [
                'hire_date',
                'employment_status',
                'employment_type',
                'division_id',
                'position_id',
                'manager_id',
                'base_salary',
                'is_active',
            ],
            3: [
                'family_card_number',
                'bpjs_kesehatan_number',
                'bpjs_ketenagakerjaan_number',
                'sim_a_number',
                'sim_b_number',
                'sim_c_number',
                'notes',
            ],
        }),
        [],
    );

    const selectedEmployee = useMemo(
        () =>
            selectedEmployeeId === null
                ? null
                : (employees.data.find(
                      (employee) => employee.id === selectedEmployeeId,
                  ) ?? null),
        [employees.data, selectedEmployeeId],
    );

    const availablePositions = useMemo(() => {
        return positionOptions.filter((position) => {
            const sameDivision =
                employeeForm.data.division_id === '' ||
                position.division_id === Number(employeeForm.data.division_id);

            if (!sameDivision) {
                return false;
            }

            const isCurrentEmployeePosition =
                editingEmployee !== null &&
                editingEmployee.position_id === position.id;

            return position.employees_count === 0 || isCurrentEmployeePosition;
        });
    }, [editingEmployee, employeeForm.data.division_id, positionOptions]);

    const availableParentPositions = useMemo(() => {
        const selectedDivisionId = positionForm.data.division_id;

        return positions.data.filter((position) => {
            if (editingPosition && position.id === editingPosition.id) {
                return false;
            }

            if (selectedDivisionId === '') {
                return true;
            }

            return position.division_id === Number(selectedDivisionId);
        });
    }, [editingPosition, positionForm.data.division_id, positions.data]);

    useEffect(() => {
        setFilterState(filters);
    }, [filters]);

    useEffect(() => {
        if (selectedEmployeeId !== null && selectedEmployee === null) {
            setSelectedEmployeeId(null);
        }
    }, [selectedEmployee, selectedEmployeeId]);

    useEffect(() => {
        const fieldNames = Object.keys(employeeForm.errors) as Array<
            keyof EmployeeFormData
        >;

        if (fieldNames.length === 0) {
            return;
        }

        for (const step of [1, 2, 3]) {
            const hasStepError = employeeStepFields[step].some((field) =>
                fieldNames.includes(field),
            );

            if (hasStepError) {
                setEmployeeFormStep(step);
                return;
            }
        }
    }, [employeeForm.errors, employeeStepFields]);

    const openCreateEmployeeDialog = () => {
        setEditingEmployee(null);
        setEmployeeFormStep(1);
        employeeForm.clearErrors();
        employeeForm.setData(buildEmployeeDefault(nextEmployeeCode));
        setEmployeeDialogOpen(true);
    };

    const openEditEmployeeDialog = (employee: Employee) => {
        setEditingEmployee(employee);
        setEmployeeFormStep(1);
        employeeForm.clearErrors();
        employeeForm.setData({
            employee_code: employee.employee_code,
            first_name: employee.first_name,
            last_name: employee.last_name ?? '',
            email: employee.email ?? '',
            phone: employee.phone ?? '',
            gender: employee.gender ?? '',
            birth_date: employee.birth_date ?? '',
            last_education: employee.last_education ?? '',
            marital_status: employee.marital_status ?? '',
            children_count:
                employee.children_count !== null
                    ? String(employee.children_count)
                    : '0',
            hire_date: employee.hire_date,
            employment_status: employee.employment_status,
            employment_type: employee.employment_type,
            division_id: employee.division_id
                ? String(employee.division_id)
                : '',
            position_id: employee.position_id
                ? String(employee.position_id)
                : '',
            manager_id: employee.manager_id ? String(employee.manager_id) : '',
            base_salary: employee.base_salary ?? '',
            address: employee.address ?? '',
            family_card_number: employee.family_card_number ?? '',
            bpjs_kesehatan_number: employee.bpjs_kesehatan_number ?? '',
            bpjs_ketenagakerjaan_number:
                employee.bpjs_ketenagakerjaan_number ?? '',
            sim_a_number: employee.sim_a_number ?? '',
            sim_b_number: employee.sim_b_number ?? '',
            sim_c_number: employee.sim_c_number ?? '',
            biological_mother_name: employee.biological_mother_name ?? '',
            emergency_contact_name: employee.emergency_contact_name ?? '',
            emergency_contact_phone: employee.emergency_contact_phone ?? '',
            notes: employee.notes ?? '',
            is_active: employee.is_active,
        });
        setEmployeeDialogOpen(true);
    };

    const validateEmployeeStep = (step: number) => {
        let isValid = true;

        employeeForm.clearErrors('first_name', 'hire_date');

        if (step === 1) {
            if (employeeForm.data.first_name.trim() === '') {
                employeeForm.setError('first_name', 'Nama depan wajib diisi.');
                isValid = false;
            }
        }

        if (step === 2 && employeeForm.data.hire_date.trim() === '') {
            employeeForm.setError('hire_date', 'Tanggal masuk wajib diisi.');
            isValid = false;
        }

        return isValid;
    };

    const goToNextEmployeeStep = () => {
        if (!validateEmployeeStep(employeeFormStep)) {
            return;
        }

        setEmployeeFormStep((current) => Math.min(3, current + 1));
    };

    const goToPreviousEmployeeStep = () => {
        setEmployeeFormStep((current) => Math.max(1, current - 1));
    };

    const openDetailEmployeeDialog = (employee: Employee) => {
        setDetailEmployee(employee);
    };

    const submitEmployeeForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingEmployee) {
            employeeForm.put(employeeRoutes.update.url(editingEmployee.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setEmployeeDialogOpen(false);
                    setEditingEmployee(null);
                    setEmployeeFormStep(1);
                    employeeForm.reset();
                },
            });

            return;
        }

        employeeForm.post(employeeRoutes.store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                setEmployeeDialogOpen(false);
                setEmployeeFormStep(1);
                employeeForm.reset();
            },
        });
    };

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
            division_id: position.division_id
                ? String(position.division_id)
                : '',
            parent_position_id: position.parent_position_id
                ? String(position.parent_position_id)
                : '',
            code: position.code,
            name: position.name,
            level:
                position.level !== null &&
                ['0', '1', '2', '3', '4'].includes(position.level)
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

    const openBankAccountCreate = () => {
        bankAccountForm.clearErrors();
        bankAccountForm.setData(BANK_ACCOUNT_DEFAULT);
        setEditingBankAccount(null);
    };

    const openBankAccountEdit = (bankAccount: BankAccount) => {
        bankAccountForm.clearErrors();
        bankAccountForm.setData({
            bank_name: bankAccount.bank_name,
            account_number: bankAccount.account_number,
            account_holder_name: bankAccount.account_holder_name,
            branch: bankAccount.branch ?? '',
            currency: bankAccount.currency,
            is_primary: bankAccount.is_primary,
        });
        setEditingBankAccount(bankAccount);
    };

    const openAllowanceCreate = () => {
        allowanceForm.clearErrors();
        allowanceForm.setData(ALLOWANCE_DEFAULT);
        setEditingAllowance(null);
    };

    const openAllowanceEdit = (allowance: EmployeeAllowance) => {
        allowanceForm.clearErrors();
        allowanceForm.setData({
            name: allowance.name,
            amount: allowance.amount,
            is_active: allowance.is_active,
            effective_start_date: allowance.effective_start_date ?? '',
            effective_end_date: allowance.effective_end_date ?? '',
            notes: allowance.notes ?? '',
        });
        setEditingAllowance(allowance);
    };

    const submitBankAccountForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedEmployee) {
            return;
        }

        if (editingBankAccount) {
            bankAccountForm.put(
                bankAccountRoutes.update.url([
                    selectedEmployee.id,
                    editingBankAccount.id,
                ]),
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        bankAccountForm.reset();
                        setEditingBankAccount(null);
                    },
                },
            );

            return;
        }

        bankAccountForm.post(bankAccountRoutes.store.url(selectedEmployee.id), {
            preserveScroll: true,
            onSuccess: () => {
                bankAccountForm.reset();
                setEditingBankAccount(null);
            },
        });
    };

    const submitAllowanceForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedEmployee) {
            return;
        }

        if (editingAllowance) {
            allowanceForm.put(
                allowanceRoutes.update.url([
                    selectedEmployee.id,
                    editingAllowance.id,
                ]),
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        allowanceForm.reset();
                        setEditingAllowance(null);
                    },
                },
            );

            return;
        }

        allowanceForm.post(allowanceRoutes.store.url(selectedEmployee.id), {
            preserveScroll: true,
            onSuccess: () => {
                allowanceForm.reset();
                setEditingAllowance(null);
            },
        });
    };

    const submitFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(employeeRoutes.index.url(), filterState, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        const initialFilters = {
            search: '',
            division_id: '',
            status: '',
            division_search: '',
            position_search: '',
        };

        setFilterState(initialFilters);

        router.get(employeeRoutes.index.url(), initialFilters, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const activeFilterSummary = [
        filterState.search !== '' ? `Cari: "${filterState.search}"` : null,
        filterState.division_id !== ''
            ? `Divisi: ${
                  divisions.data.find(
                      (division) =>
                          String(division.id) === filterState.division_id,
                  )?.name ?? filterState.division_id
              }`
            : null,
        filterState.status !== ''
            ? `Status: ${statusLabels[filterState.status] ?? filterState.status}`
            : null,
    ]
        .filter(Boolean)
        .join(' • ');

    const employeeExportQuery = new URLSearchParams(
        Object.entries({
            search: filterState.search,
            division_id: filterState.division_id,
            status: filterState.status,
        }).filter(([, value]) => value !== ''),
    ).toString();

    const employeeExportUrl =
        employeeExportQuery === ''
            ? '/hris/employees/export'
            : `/hris/employees/export?${employeeExportQuery}`;

    return (
        <AppLayout
            breadcrumbs={breadcrumbs}
            headerActions={
                <Button size="sm" onClick={openCreateEmployeeDialog}>
                    <Plus className="size-4" />
                    Tambah Karyawan
                </Button>
            }
        >
            <Head title="HRIS Karyawan" />

            <div className="space-y-6 p-4">
                {(errors.division_delete || errors.position_delete) && (
                    <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {errors.division_delete ?? errors.position_delete}
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                            <CardDescription>Karyawan Aktif</CardDescription>
                            <CardTitle className="text-2xl">
                                {stats.employees_active}
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

                <Card>
                    <CardHeader>
                        <CardTitle>Filter Karyawan</CardTitle>
                        <CardDescription>
                            Cari berdasarkan nama, kode, email, divisi, atau
                            status.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={submitFilters}
                            className="grid gap-3 md:grid-cols-[1fr_220px_220px_auto_auto]"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="search">Pencarian</Label>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="search"
                                        value={filterState.search}
                                        onChange={(event) =>
                                            setFilterState((current) => ({
                                                ...current,
                                                search: event.target.value,
                                            }))
                                        }
                                        className="pl-9"
                                        placeholder="Nama, email, atau kode karyawan"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="division-filter">Divisi</Label>
                                <SearchableSelect
                                    id="division-filter"
                                    value={
                                        filterState.division_id === ''
                                            ? '__all'
                                            : filterState.division_id
                                    }
                                    onValueChange={(value) =>
                                        setFilterState((current) => ({
                                            ...current,
                                            division_id:
                                                value === '__all' ? '' : value,
                                        }))
                                    }
                                    placeholder="Semua divisi"
                                    searchPlaceholder="Cari divisi..."
                                    options={[
                                        {
                                            value: '__all',
                                            label: 'Semua divisi',
                                        },
                                        ...divisions.data.map((division) => ({
                                            value: String(division.id),
                                            label: division.name,
                                        })),
                                    ]}
                                    className="w-full"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="status-filter">Status</Label>
                                <Select
                                    value={
                                        filterState.status === ''
                                            ? '__all'
                                            : filterState.status
                                    }
                                    onValueChange={(value) =>
                                        setFilterState((current) => ({
                                            ...current,
                                            status:
                                                value === '__all' ? '' : value,
                                        }))
                                    }
                                >
                                    <SelectTrigger
                                        id="status-filter"
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="Semua status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all">
                                            Semua status
                                        </SelectItem>
                                        {options.employment_statuses.map(
                                            (status) => (
                                                <SelectItem
                                                    key={status}
                                                    value={status}
                                                >
                                                    {statusLabels[status] ??
                                                        status}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-end">
                                <Button type="submit" className="w-full">
                                    <Filter className="size-4" />
                                    Terapkan
                                </Button>
                            </div>

                            <div className="flex items-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={resetFilters}
                                >
                                    <RotateCcw className="size-4" />
                                    Reset
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-start justify-between gap-3">
                        <div>
                            <CardTitle>Daftar Karyawan</CardTitle>
                            <CardDescription>
                                {activeFilterSummary === ''
                                    ? 'Filter aktif: Semua karyawan'
                                    : `Filter aktif: ${activeFilterSummary}`}
                            </CardDescription>
                        </div>
                        <Button asChild size="sm" variant="outline">
                            <a href={employeeExportUrl}>
                                <Download className="size-4" />
                                Export .xls
                            </a>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[960px] text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="px-3 py-2 font-medium">
                                            Nama
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                            Divisi
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                            Jabatan
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                            Status
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-3 py-8 text-center text-muted-foreground"
                                            >
                                                Belum ada data karyawan.
                                            </td>
                                        </tr>
                                    )}
                                    {employees.data.map((employee) => (
                                        <tr
                                            key={employee.id}
                                            className="border-b align-top"
                                        >
                                            <td className="px-3 py-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="size-8">
                                                        <AvatarFallback>
                                                            {getInitials(
                                                                employee.full_name,
                                                            )}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">
                                                            {employee.full_name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {
                                                                employee.employee_code
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                {employee.division?.name ?? '-'}
                                            </td>
                                            <td className="px-3 py-3">
                                                {employee.position?.name ?? '-'}
                                            </td>
                                            <td className="px-3 py-3">
                                                <Badge
                                                    variant={
                                                        employee.employment_status ===
                                                        'active'
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {statusLabels[
                                                        employee
                                                            .employment_status
                                                    ] ??
                                                        employee.employment_status}
                                                </Badge>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex flex-wrap gap-1.5">
                                                    <ActionIconButton
                                                        label="Detail karyawan"
                                                        icon={Eye}
                                                        variant="outline"
                                                        onClick={() =>
                                                            openDetailEmployeeDialog(
                                                                employee,
                                                            )
                                                        }
                                                    />
                                                    <ActionIconButton
                                                        label="Edit karyawan"
                                                        icon={Pencil}
                                                        variant="outline"
                                                        onClick={() =>
                                                            openEditEmployeeDialog(
                                                                employee,
                                                            )
                                                        }
                                                    />
                                                    <ActionIconButton
                                                        label="Kelola rekening"
                                                        icon={Landmark}
                                                        variant="outline"
                                                        onClick={() =>
                                                            setSelectedEmployeeId(
                                                                employee.id,
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

                        <div className="mt-4 flex flex-wrap gap-2">
                            {employees.links.map((link, index) => (
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
                                            preserveScroll
                                            preserveState
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

                <div className="grid gap-4 xl:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-row items-start justify-between gap-4">
                            <div>
                                <CardTitle>Divisi</CardTitle>
                                <CardDescription>
                                    Kelola struktur divisi organisasi.
                                </CardDescription>
                            </div>
                            <Button
                                size="sm"
                                onClick={openCreateDivisionDialog}
                            >
                                <Plus className="size-4" />
                                Tambah Divisi
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    router.get(
                                        employeeRoutes.index.url(),
                                        {
                                            ...filterState,
                                            division_page: 1,
                                        },
                                        {
                                            preserveState: true,
                                            preserveScroll: true,
                                            replace: true,
                                        },
                                    );
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
                                                division_search:
                                                    event.target.value,
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
                                            <th className="px-3 py-2">
                                                Karyawan
                                            </th>
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
                                            <tr
                                                key={division.id}
                                                className="border-b"
                                            >
                                                <td className="px-3 py-3">
                                                    {division.code}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <p className="font-medium">
                                                        {division.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {division.description ??
                                                            '-'}
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
                                        variant={
                                            link.active ? 'default' : 'outline'
                                        }
                                        disabled={link.url === null}
                                    >
                                        {link.url ? (
                                            <Link
                                                href={link.url}
                                                preserveScroll
                                                preserveState
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
                                <CardTitle>Jabatan</CardTitle>
                                <CardDescription>
                                    Kelola master jabatan tiap divisi.
                                </CardDescription>
                            </div>
                            <Button
                                size="sm"
                                onClick={openCreatePositionDialog}
                            >
                                <Plus className="size-4" />
                                Tambah Jabatan
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    router.get(
                                        employeeRoutes.index.url(),
                                        {
                                            ...filterState,
                                            position_page: 1,
                                        },
                                        {
                                            preserveState: true,
                                            preserveScroll: true,
                                            replace: true,
                                        },
                                    );
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
                                                position_search:
                                                    event.target.value,
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
                                            <th className="px-3 py-2">
                                                Parent
                                            </th>
                                            <th className="px-3 py-2">
                                                Divisi
                                            </th>
                                            <th className="px-3 py-2">
                                                Dipakai
                                            </th>
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
                                            <tr
                                                key={position.id}
                                                className="border-b"
                                            >
                                                <td className="px-3 py-3">
                                                    {position.code}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <p className="font-medium">
                                                        {position.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {position.level_label ??
                                                            position.level ??
                                                            '-'}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-3">
                                                    {position.parent_position
                                                        ?.name ?? '-'}
                                                </td>
                                                <td className="px-3 py-3">
                                                    {position.division?.name ??
                                                        '-'}
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
                                        variant={
                                            link.active ? 'default' : 'outline'
                                        }
                                        disabled={link.url === null}
                                    >
                                        {link.url ? (
                                            <Link
                                                href={link.url}
                                                preserveScroll
                                                preserveState
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
            </div>

            <Dialog
                open={detailEmployee !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDetailEmployee(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Detail Karyawan</DialogTitle>
                        <DialogDescription>
                            Informasi ringkas data karyawan.
                        </DialogDescription>
                    </DialogHeader>
                    {detailEmployee && (
                        <div className="grid gap-3 text-sm">
                            <div className="flex items-center gap-3 rounded-md border p-3">
                                <Avatar className="size-10">
                                    <AvatarFallback>
                                        {getInitials(detailEmployee.full_name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">
                                        {detailEmployee.full_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {detailEmployee.employee_code}
                                    </p>
                                </div>
                            </div>
                            <div className="grid gap-2 rounded-md border p-3">
                                <p>Email: {detailEmployee.email ?? '-'}</p>
                                <p>Telepon: {detailEmployee.phone ?? '-'}</p>
                                <p>
                                    Pendidikan Terakhir:{' '}
                                    {detailEmployee.last_education ?? '-'}
                                </p>
                                <p>
                                    Status Perkawinan:{' '}
                                    {detailEmployee.marital_status
                                        ? (maritalStatusLabels[
                                              detailEmployee.marital_status
                                          ] ?? detailEmployee.marital_status)
                                        : '-'}
                                </p>
                                <p>
                                    Jumlah Anak:{' '}
                                    {detailEmployee.children_count ?? '-'}
                                </p>
                                <p>
                                    No. KK:{' '}
                                    {detailEmployee.family_card_number ?? '-'}
                                </p>
                                <p>
                                    Nama Ibu Kandung:{' '}
                                    {detailEmployee.biological_mother_name ??
                                        '-'}
                                </p>
                                <p>
                                    Divisi:{' '}
                                    {detailEmployee.division?.name ?? '-'}
                                </p>
                                <p>
                                    Jabatan:{' '}
                                    {detailEmployee.position?.name ?? '-'}
                                </p>
                                <p>
                                    Status:{' '}
                                    {statusLabels[
                                        detailEmployee.employment_status
                                    ] ?? detailEmployee.employment_status}
                                </p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={employeeDialogOpen}
                onOpenChange={(open) => {
                    setEmployeeDialogOpen(open);
                    if (!open) {
                        setEditingEmployee(null);
                        setEmployeeFormStep(1);
                        employeeForm.reset();
                        employeeForm.clearErrors();
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingEmployee
                                ? 'Edit Data Karyawan'
                                : 'Tambah Karyawan Baru'}
                        </DialogTitle>
                        <DialogDescription>
                            Lengkapi data personal, organisasi, dan payroll.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitEmployeeForm} className="space-y-4">
                        <div className="grid gap-2 sm:grid-cols-3">
                            {[
                                {
                                    step: 1,
                                    title: 'Data Personal',
                                },
                                {
                                    step: 2,
                                    title: 'Data Pekerjaan',
                                },
                                {
                                    step: 3,
                                    title: 'Data Tambahan',
                                },
                            ].map((item) => (
                                <button
                                    key={item.step}
                                    type="button"
                                    className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                                        employeeFormStep === item.step
                                            ? 'border-primary bg-primary/10'
                                            : 'border-border bg-muted/30'
                                    }`}
                                    onClick={() => setEmployeeFormStep(item.step)}
                                >
                                    <p className="text-xs text-muted-foreground">
                                        Langkah {item.step}
                                    </p>
                                    <p className="font-medium">{item.title}</p>
                                </button>
                            ))}
                        </div>

                        {employeeFormStep === 1 && (
                            <div className="space-y-3">
                                <div className="grid items-center gap-2 md:grid-cols-[180px_1fr]">
                                    <Label htmlFor="employee_code">
                                        Kode Karyawan
                                    </Label>
                                    <div className="space-y-1">
                                        <Input
                                            id="employee_code"
                                            value={employeeForm.data.employee_code}
                                            readOnly
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Otomatis mengikuti format di
                                            Settings.
                                        </p>
                                        <InputError
                                            message={
                                                employeeForm.errors
                                                    .employee_code
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid items-center gap-2 md:grid-cols-[180px_1fr]">
                                    <Label htmlFor="first_name">
                                        Nama Depan
                                    </Label>
                                    <div className="space-y-1">
                                        <Input
                                            id="first_name"
                                            value={employeeForm.data.first_name}
                                            onChange={(event) =>
                                                employeeForm.setData(
                                                    'first_name',
                                                    event.target.value,
                                                )
                                            }
                                            required
                                        />
                                        <InputError
                                            message={
                                                employeeForm.errors.first_name
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid items-center gap-2 md:grid-cols-[180px_1fr]">
                                    <Label htmlFor="last_name">
                                        Nama Belakang
                                    </Label>
                                    <div className="space-y-1">
                                        <Input
                                            id="last_name"
                                            value={employeeForm.data.last_name}
                                            onChange={(event) =>
                                                employeeForm.setData(
                                                    'last_name',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                employeeForm.errors.last_name
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid items-center gap-2 md:grid-cols-[180px_1fr]">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="space-y-1">
                                        <Input
                                            id="email"
                                            type="email"
                                            value={employeeForm.data.email}
                                            onChange={(event) =>
                                                employeeForm.setData(
                                                    'email',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={employeeForm.errors.email}
                                        />
                                    </div>
                                </div>

                                <div className="grid items-center gap-2 md:grid-cols-[180px_1fr]">
                                    <Label htmlFor="phone">Nomor HP</Label>
                                    <div className="space-y-1">
                                        <Input
                                            id="phone"
                                            value={employeeForm.data.phone}
                                            onChange={(event) =>
                                                employeeForm.setData(
                                                    'phone',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={employeeForm.errors.phone}
                                        />
                                    </div>
                                </div>

                                <div className="grid items-center gap-2 md:grid-cols-[180px_1fr]">
                                    <Label htmlFor="gender">Gender</Label>
                                    <div className="space-y-1">
                                        <Select
                                            value={
                                                employeeForm.data.gender === ''
                                                    ? '__none'
                                                    : employeeForm.data.gender
                                            }
                                            onValueChange={(value) =>
                                                employeeForm.setData(
                                                    'gender',
                                                    value === '__none'
                                                        ? ''
                                                        : value,
                                                )
                                            }
                                        >
                                            <SelectTrigger
                                                id="gender"
                                                className="w-full"
                                            >
                                                <SelectValue placeholder="Pilih gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__none">
                                                    -
                                                </SelectItem>
                                                {options.genders.map(
                                                    (gender) => (
                                                        <SelectItem
                                                            key={gender}
                                                            value={gender}
                                                        >
                                                            {genderLabels[
                                                                gender
                                                            ] ?? gender}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={
                                                employeeForm.errors.gender
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid items-center gap-2 md:grid-cols-[180px_1fr]">
                                    <Label htmlFor="birth_date">
                                        Tanggal Lahir
                                    </Label>
                                    <div className="space-y-1">
                                        <Input
                                            id="birth_date"
                                            type="date"
                                            value={employeeForm.data.birth_date}
                                            onChange={(event) =>
                                                employeeForm.setData(
                                                    'birth_date',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                employeeForm.errors.birth_date
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid items-center gap-2 md:grid-cols-[180px_1fr]">
                                    <Label htmlFor="last_education">
                                        Pendidikan Terakhir
                                    </Label>
                                    <div className="space-y-1">
                                        <SearchableSelect
                                            id="last_education"
                                            value={
                                                employeeForm.data
                                                    .last_education === ''
                                                    ? '__none'
                                                    : employeeForm.data
                                                          .last_education
                                            }
                                            onValueChange={(value) =>
                                                employeeForm.setData(
                                                    'last_education',
                                                    value === '__none'
                                                        ? ''
                                                        : value,
                                                )
                                            }
                                            placeholder="Pilih pendidikan"
                                            searchPlaceholder="Cari pendidikan..."
                                            options={[
                                                {
                                                    value: '__none',
                                                    label: '-',
                                                },
                                                ...options.last_education_levels.map(
                                                    (level) => ({
                                                        value: level,
                                                        label: level,
                                                    }),
                                                ),
                                            ]}
                                            className="w-full"
                                        />
                                        <InputError
                                            message={
                                                employeeForm.errors
                                                    .last_education
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid items-start gap-2 md:grid-cols-[180px_1fr]">
                                    <Label htmlFor="marital_status">
                                        Status Keluarga
                                    </Label>
                                    <div className="space-y-2">
                                        <div
                                            className={`grid gap-2 ${
                                                employeeForm.data
                                                    .marital_status !== '' &&
                                                employeeForm.data
                                                    .marital_status !== 'single'
                                                    ? 'md:grid-cols-2'
                                                    : 'md:grid-cols-1'
                                            }`}
                                        >
                                            <div className="space-y-1">
                                                <Select
                                                    value={
                                                        employeeForm.data
                                                            .marital_status ===
                                                        ''
                                                            ? '__none'
                                                            : employeeForm
                                                                  .data
                                                                  .marital_status
                                                    }
                                                    onValueChange={(value) => {
                                                        const maritalStatus =
                                                            value === '__none'
                                                                ? ''
                                                                : value;

                                                        employeeForm.setData(
                                                            'marital_status',
                                                            maritalStatus,
                                                        );

                                                        if (
                                                            maritalStatus ===
                                                                '' ||
                                                            maritalStatus ===
                                                                'single'
                                                        ) {
                                                            employeeForm.setData(
                                                                'children_count',
                                                                '0',
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger
                                                        id="marital_status"
                                                        className="w-full"
                                                    >
                                                        <SelectValue placeholder="Pilih status perkawinan" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="__none">
                                                            -
                                                        </SelectItem>
                                                        {options.marital_statuses.map(
                                                            (status) => (
                                                                <SelectItem
                                                                    key={status}
                                                                    value={status}
                                                                >
                                                                    {maritalStatusLabels[
                                                                        status
                                                                    ] ??
                                                                        status}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <InputError
                                                    message={
                                                        employeeForm.errors
                                                            .marital_status
                                                    }
                                                />
                                            </div>

                                            {employeeForm.data
                                                .marital_status !== '' &&
                                                employeeForm.data
                                                    .marital_status !==
                                                    'single' && (
                                                    <div className="space-y-1">
                                                        <Input
                                                            id="children_count"
                                                            type="number"
                                                            min="0"
                                                            value={
                                                                employeeForm
                                                                    .data
                                                                    .children_count
                                                            }
                                                            onChange={(
                                                                event,
                                                            ) =>
                                                                employeeForm.setData(
                                                                    'children_count',
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="Jumlah anak"
                                                        />
                                                        <InputError
                                                            message={
                                                                employeeForm
                                                                    .errors
                                                                    .children_count
                                                            }
                                                        />
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid items-center gap-2 md:grid-cols-[180px_1fr]">
                                    <Label htmlFor="biological_mother_name">
                                        Nama Ibu Kandung
                                    </Label>
                                    <div className="space-y-1">
                                        <Input
                                            id="biological_mother_name"
                                            value={
                                                employeeForm.data
                                                    .biological_mother_name
                                            }
                                            onChange={(event) =>
                                                employeeForm.setData(
                                                    'biological_mother_name',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                employeeForm.errors
                                                    .biological_mother_name
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid items-start gap-2 md:grid-cols-[180px_1fr]">
                                    <Label htmlFor="address">Alamat</Label>
                                    <div className="space-y-1">
                                        <Input
                                            id="address"
                                            value={employeeForm.data.address}
                                            onChange={(event) =>
                                                employeeForm.setData(
                                                    'address',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                employeeForm.errors.address
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {employeeFormStep === 2 && (
                            <div className="space-y-3">
                                <div className="grid items-center gap-2 md:grid-cols-[180px_1fr]">
                                    <Label htmlFor="hire_date">
                                        Tanggal Masuk
                                    </Label>
                                    <div className="space-y-1">
                                        <Input
                                            id="hire_date"
                                            type="date"
                                            value={employeeForm.data.hire_date}
                                            onChange={(event) =>
                                                employeeForm.setData(
                                                    'hire_date',
                                                    event.target.value,
                                                )
                                            }
                                            required
                                        />
                                        <InputError
                                            message={
                                                employeeForm.errors.hire_date
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid items-center gap-2 md:grid-cols-[180px_1fr]">
                                    <Label htmlFor="employment_status">
                                        Status
                                    </Label>
                                    <div className="space-y-1">
                                        <Select
                                            value={
                                                employeeForm.data
                                                    .employment_status
                                            }
                                            onValueChange={(value) =>
                                                employeeForm.setData(
                                                    'employment_status',
                                                    value,
                                                )
                                            }
                                        >
                                            <SelectTrigger
                                                id="employment_status"
                                                className="w-full"
                                            >
                                                <SelectValue placeholder="Pilih status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {options.employment_statuses.map(
                                                    (status) => (
                                                        <SelectItem
                                                            key={status}
                                                            value={status}
                                                        >
                                                            {statusLabels[
                                                                status
                                                            ] ?? status}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={
                                                employeeForm.errors
                                                    .employment_status
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid items-center gap-2 md:grid-cols-[180px_1fr]">
                                    <Label htmlFor="employment_type">
                                        Tipe
                                    </Label>
                                    <div className="space-y-1">
                                        <Select
                                            value={
                                                employeeForm.data
                                                    .employment_type
                                            }
                                            onValueChange={(value) =>
                                                employeeForm.setData(
                                                    'employment_type',
                                                    value,
                                                )
                                            }
                                        >
                                            <SelectTrigger
                                                id="employment_type"
                                                className="w-full"
                                            >
                                                <SelectValue placeholder="Pilih tipe" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {options.employment_types.map(
                                                    (type) => (
                                                        <SelectItem
                                                            key={type}
                                                            value={type}
                                                        >
                                                            {typeLabels[type] ??
                                                                type}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={
                                                employeeForm.errors
                                                    .employment_type
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid items-center gap-2 md:grid-cols-[180px_1fr]">
                                    <Label htmlFor="division_id">Divisi</Label>
                                    <div className="space-y-1">
                                        <SearchableSelect
                                            id="division_id"
                                            value={
                                                employeeForm.data
                                                    .division_id === ''
                                                    ? '__none'
                                                    : employeeForm.data
                                                          .division_id
                                            }
                                            onValueChange={(value) => {
                                                const divisionId =
                                                    value === '__none'
                                                        ? ''
                                                        : value;

                                                employeeForm.setData(
                                                    'division_id',
                                                    divisionId,
                                                );

                                                if (
                                                    divisionId !== '' &&
                                                    employeeForm.data
                                                        .position_id !== ''
                                                ) {
                                                    const selectedPosition =
                                                        positionOptions.find(
                                                            (position) =>
                                                                String(
                                                                    position.id,
                                                                ) ===
                                                                employeeForm
                                                                    .data
                                                                    .position_id,
                                                        );

                                                    if (
                                                        selectedPosition &&
                                                        selectedPosition.division_id !==
                                                            Number(
                                                                divisionId,
                                                            )
                                                    ) {
                                                        employeeForm.setData(
                                                            'position_id',
                                                            '',
                                                        );
                                                    }
                                                }
                                            }}
                                            placeholder="Pilih divisi"
                                            searchPlaceholder="Cari divisi..."
                                            options={[
                                                {
                                                    value: '__none',
                                                    label: '-',
                                                },
                                                ...divisions.data.map(
                                                    (division) => ({
                                                        value: String(
                                                            division.id,
                                                        ),
                                                        label: division.name,
                                                    }),
                                                ),
                                            ]}
                                            className="w-full"
                                        />
                                        <InputError
                                            message={
                                                employeeForm.errors.division_id
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid items-center gap-2 md:grid-cols-[180px_1fr]">
                                    <Label htmlFor="position_id">Jabatan</Label>
                                    <div className="space-y-1">
                                        <SearchableSelect
                                            id="position_id"
                                            value={
                                                employeeForm.data
                                                    .position_id === ''
                                                    ? '__none'
                                                    : employeeForm.data
                                                          .position_id
                                            }
                                            onValueChange={(value) =>
                                                employeeForm.setData(
                                                    'position_id',
                                                    value === '__none'
                                                        ? ''
                                                        : value,
                                                )
                                            }
                                            placeholder="Pilih jabatan"
                                            searchPlaceholder="Cari jabatan..."
                                            options={[
                                                {
                                                    value: '__none',
                                                    label: '-',
                                                },
                                                ...availablePositions.map(
                                                    (position) => ({
                                                        value: String(
                                                            position.id,
                                                        ),
                                                        label: `${position.name}${
                                                            position.division_name
                                                                ? ` (${position.division_name})`
                                                                : ''
                                                        }`,
                                                    }),
                                                ),
                                            ]}
                                            className="w-full"
                                        />
                                        <InputError
                                            message={
                                                employeeForm.errors.position_id
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid items-center gap-2 md:grid-cols-[180px_1fr]">
                                    <Label htmlFor="manager_id">Atasan</Label>
                                    <div className="space-y-1">
                                        <SearchableSelect
                                            id="manager_id"
                                            value={
                                                employeeForm.data.manager_id ===
                                                ''
                                                    ? '__none'
                                                    : employeeForm.data
                                                          .manager_id
                                            }
                                            onValueChange={(value) =>
                                                employeeForm.setData(
                                                    'manager_id',
                                                    value === '__none'
                                                        ? ''
                                                        : value,
                                                )
                                            }
                                            placeholder="Pilih atasan"
                                            searchPlaceholder="Cari atasan..."
                                            options={[
                                                {
                                                    value: '__none',
                                                    label: '-',
                                                },
                                                ...managerOptions
                                                    .filter(
                                                        (option) =>
                                                            editingEmployee?.id !==
                                                            option.id,
                                                    )
                                                    .map((option) => ({
                                                        value: String(
                                                            option.id,
                                                        ),
                                                        label: option.label,
                                                    })),
                                            ]}
                                            className="w-full"
                                        />
                                        <InputError
                                            message={
                                                employeeForm.errors.manager_id
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid items-center gap-2 md:grid-cols-[180px_1fr]">
                                    <Label htmlFor="base_salary">
                                        Gaji Pokok
                                    </Label>
                                    <div className="space-y-1">
                                        <Input
                                            id="base_salary"
                                            type="number"
                                            min="0"
                                            step="1000"
                                            value={employeeForm.data.base_salary}
                                            onChange={(event) =>
                                                employeeForm.setData(
                                                    'base_salary',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="5000000"
                                        />
                                        <InputError
                                            message={
                                                employeeForm.errors.base_salary
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid items-center gap-2 md:grid-cols-[180px_1fr]">
                                    <Label htmlFor="employee_is_active">
                                        Status Aktif
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="employee_is_active"
                                            checked={employeeForm.data.is_active}
                                            onCheckedChange={(checked) =>
                                                employeeForm.setData(
                                                    'is_active',
                                                    checked === true,
                                                )
                                            }
                                        />
                                        <Label htmlFor="employee_is_active">
                                            Karyawan aktif
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {employeeFormStep === 3 && (
                            <div className="space-y-4">
                                <div className="grid gap-2 rounded-md border p-3 text-sm">
                                    <p>
                                        <span className="font-medium">
                                            Nama:
                                        </span>{' '}
                                        {`${employeeForm.data.first_name} ${employeeForm.data.last_name}`.trim()}
                                    </p>
                                    <p>
                                        <span className="font-medium">
                                            Kode:
                                        </span>{' '}
                                        {employeeForm.data.employee_code || '-'}
                                    </p>
                                    <p>
                                        <span className="font-medium">
                                            Status:
                                        </span>{' '}
                                        {statusLabels[
                                            employeeForm.data.employment_status
                                        ] ??
                                            employeeForm.data
                                                .employment_status}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div className="grid items-center gap-2 md:grid-cols-[180px_1fr]">
                                        <Label htmlFor="family_card_number">
                                            No. KK
                                        </Label>
                                        <div className="space-y-1">
                                            <Input
                                                id="family_card_number"
                                                value={
                                                    employeeForm.data
                                                        .family_card_number
                                                }
                                                onChange={(event) =>
                                                    employeeForm.setData(
                                                        'family_card_number',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Opsional"
                                            />
                                            <InputError
                                                message={
                                                    employeeForm.errors
                                                        .family_card_number
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="grid items-center gap-2 md:grid-cols-[180px_1fr]">
                                        <Label htmlFor="bpjs_kesehatan_number">
                                            BPJS Kesehatan
                                        </Label>
                                        <div className="space-y-1">
                                            <Input
                                                id="bpjs_kesehatan_number"
                                                value={
                                                    employeeForm.data
                                                        .bpjs_kesehatan_number
                                                }
                                                onChange={(event) =>
                                                    employeeForm.setData(
                                                        'bpjs_kesehatan_number',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Opsional"
                                            />
                                            <InputError
                                                message={
                                                    employeeForm.errors
                                                        .bpjs_kesehatan_number
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="grid items-center gap-2 md:grid-cols-[180px_1fr]">
                                        <Label htmlFor="bpjs_ketenagakerjaan_number">
                                            BPJS Tenaga Kerja
                                        </Label>
                                        <div className="space-y-1">
                                            <Input
                                                id="bpjs_ketenagakerjaan_number"
                                                value={
                                                    employeeForm.data
                                                        .bpjs_ketenagakerjaan_number
                                                }
                                                onChange={(event) =>
                                                    employeeForm.setData(
                                                        'bpjs_ketenagakerjaan_number',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Opsional"
                                            />
                                            <InputError
                                                message={
                                                    employeeForm.errors
                                                        .bpjs_ketenagakerjaan_number
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="grid items-center gap-2 md:grid-cols-[180px_1fr]">
                                        <Label htmlFor="sim_a_number">
                                            SIM A
                                        </Label>
                                        <div className="space-y-1">
                                            <Input
                                                id="sim_a_number"
                                                value={
                                                    employeeForm.data
                                                        .sim_a_number
                                                }
                                                onChange={(event) =>
                                                    employeeForm.setData(
                                                        'sim_a_number',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Opsional"
                                            />
                                            <InputError
                                                message={
                                                    employeeForm.errors
                                                        .sim_a_number
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="grid items-center gap-2 md:grid-cols-[180px_1fr]">
                                        <Label htmlFor="sim_b_number">
                                            SIM B
                                        </Label>
                                        <div className="space-y-1">
                                            <Input
                                                id="sim_b_number"
                                                value={
                                                    employeeForm.data
                                                        .sim_b_number
                                                }
                                                onChange={(event) =>
                                                    employeeForm.setData(
                                                        'sim_b_number',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Opsional"
                                            />
                                            <InputError
                                                message={
                                                    employeeForm.errors
                                                        .sim_b_number
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="grid items-center gap-2 md:grid-cols-[180px_1fr]">
                                        <Label htmlFor="sim_c_number">
                                            SIM C
                                        </Label>
                                        <div className="space-y-1">
                                            <Input
                                                id="sim_c_number"
                                                value={
                                                    employeeForm.data
                                                        .sim_c_number
                                                }
                                                onChange={(event) =>
                                                    employeeForm.setData(
                                                        'sim_c_number',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Opsional"
                                            />
                                            <InputError
                                                message={
                                                    employeeForm.errors
                                                        .sim_c_number
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="grid items-start gap-2 md:grid-cols-[180px_1fr]">
                                        <Label htmlFor="notes">Catatan</Label>
                                        <div className="space-y-1">
                                            <textarea
                                                id="notes"
                                                value={employeeForm.data.notes}
                                                onChange={(event) =>
                                                    employeeForm.setData(
                                                        'notes',
                                                        event.target.value,
                                                    )
                                                }
                                                rows={4}
                                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                            />
                                            <InputError
                                                message={
                                                    employeeForm.errors.notes
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap justify-between gap-2 border-t pt-4">
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEmployeeDialogOpen(false)}
                                >
                                    Batal
                                </Button>
                                {employeeFormStep > 1 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={goToPreviousEmployeeStep}
                                    >
                                        Kembali
                                    </Button>
                                )}
                            </div>

                            <div className="flex gap-2">
                                {employeeFormStep < 3 ? (
                                    <Button
                                        type="button"
                                        onClick={goToNextEmployeeStep}
                                    >
                                        Lanjut
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        disabled={employeeForm.processing}
                                    >
                                        {editingEmployee
                                            ? 'Simpan Perubahan'
                                            : 'Simpan'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

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
                                        event.target.value,
                                    )
                                }
                                placeholder="HRD"
                                required
                            />
                            <InputError message={divisionForm.errors.code} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="division_name">Nama</Label>
                            <Input
                                id="division_name"
                                value={divisionForm.data.name}
                                onChange={(event) =>
                                    divisionForm.setData(
                                        'name',
                                        event.target.value,
                                    )
                                }
                                placeholder="Human Resources"
                                required
                            />
                            <InputError message={divisionForm.errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="division_description">
                                Deskripsi
                            </Label>
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
                            <InputError
                                message={divisionForm.errors.description}
                            />
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
                            <Button
                                type="submit"
                                disabled={divisionForm.processing}
                            >
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
                            {editingPosition
                                ? 'Edit Jabatan'
                                : 'Tambah Jabatan'}
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
                                    const divisionId =
                                        value === '__none' ? '' : value;

                                    positionForm.setData(
                                        'division_id',
                                        divisionId,
                                    );

                                    if (
                                        divisionId !== '' &&
                                        positionForm.data.parent_position_id !==
                                            ''
                                    ) {
                                        const selectedParent =
                                            positions.data.find(
                                                (position) =>
                                                    String(position.id) ===
                                                    positionForm.data
                                                        .parent_position_id,
                                            );

                                        if (
                                            selectedParent &&
                                            selectedParent.division_id !==
                                                Number(divisionId)
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
                                    ...divisions.data.map((division) => ({
                                        value: String(division.id),
                                        label: division.name,
                                    })),
                                ]}
                                className="w-full"
                            />
                            <InputError
                                message={positionForm.errors.division_id}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="position_parent">
                                Jabatan Induk
                            </Label>
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
                                    ...availableParentPositions.map(
                                        (position) => ({
                                            value: String(position.id),
                                            label: `${position.name}${
                                                position.division
                                                    ? ` (${position.division.name})`
                                                    : ''
                                            }`,
                                        }),
                                    ),
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
                                        event.target.value,
                                    )
                                }
                                placeholder="SWE"
                                required
                            />
                            <InputError message={positionForm.errors.code} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="position_name">Nama</Label>
                            <Input
                                id="position_name"
                                value={positionForm.data.name}
                                onChange={(event) =>
                                    positionForm.setData(
                                        'name',
                                        event.target.value,
                                    )
                                }
                                placeholder="Software Engineer"
                                required
                            />
                            <InputError message={positionForm.errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="position_level">Level</Label>
                            <Select
                                value={positionForm.data.level}
                                onValueChange={(value) =>
                                    positionForm.setData('level', value)
                                }
                            >
                                <SelectTrigger
                                    id="position_level"
                                    className="w-full"
                                >
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
                            <Label htmlFor="position_description">
                                Deskripsi
                            </Label>
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
                            <Button
                                type="submit"
                                disabled={positionForm.processing}
                            >
                                {editingPosition ? 'Simpan' : 'Tambah'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={selectedEmployeeId !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedEmployeeId(null);
                        setEditingBankAccount(null);
                        setEditingAllowance(null);
                        bankAccountForm.reset();
                        bankAccountForm.clearErrors();
                        allowanceForm.reset();
                        allowanceForm.clearErrors();
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Kelola Rekening & Tunjangan</DialogTitle>
                        <DialogDescription>
                            {selectedEmployee
                                ? `${selectedEmployee.employee_code} - ${selectedEmployee.full_name}`
                                : 'Pilih karyawan dari tabel untuk mengelola rekening dan tunjangan.'}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedEmployee && (
                        <>
                            <div className="rounded-lg border p-3 text-sm">
                                <p>
                                    <span className="font-medium">
                                        Jabatan:
                                    </span>{' '}
                                    {selectedEmployee.position?.name ?? '-'}
                                </p>
                                <p>
                                    <span className="font-medium">
                                        Gaji Pokok:
                                    </span>{' '}
                                    {selectedEmployee.base_salary
                                        ? new Intl.NumberFormat('id-ID', {
                                              style: 'currency',
                                              currency: 'IDR',
                                              maximumFractionDigits: 0,
                                          }).format(
                                              Number(
                                                  selectedEmployee.base_salary,
                                              ),
                                          )
                                        : '-'}
                                </p>
                            </div>

                            <div className="space-y-3 rounded-lg border p-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium">
                                        Daftar Rekening
                                    </p>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={openBankAccountCreate}
                                    >
                                        Tambah Rekening
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    {selectedEmployee.bank_accounts.length ===
                                        0 && (
                                        <p className="text-sm text-muted-foreground">
                                            Belum ada data rekening.
                                        </p>
                                    )}

                                    {selectedEmployee.bank_accounts.map(
                                        (bankAccount) => (
                                            <div
                                                key={bankAccount.id}
                                                className="flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium">
                                                            {
                                                                bankAccount.bank_name
                                                            }
                                                        </p>
                                                        {bankAccount.is_primary && (
                                                            <Badge>Utama</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {
                                                            bankAccount.account_number
                                                        }{' '}
                                                        -{' '}
                                                        {
                                                            bankAccount.account_holder_name
                                                        }
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <ActionIconButton
                                                        label="Edit rekening"
                                                        icon={Pencil}
                                                        variant="outline"
                                                        onClick={() =>
                                                            openBankAccountEdit(
                                                                bankAccount,
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>

                            <form
                                onSubmit={submitBankAccountForm}
                                className="grid gap-3 rounded-lg border p-3 md:grid-cols-2"
                            >
                                <p className="text-sm font-medium md:col-span-2">
                                    {editingBankAccount
                                        ? 'Edit rekening'
                                        : 'Tambah rekening baru'}
                                </p>
                                <div className="grid gap-2">
                                    <Label htmlFor="bank_name">Nama Bank</Label>
                                    <Input
                                        id="bank_name"
                                        value={bankAccountForm.data.bank_name}
                                        onChange={(event) =>
                                            bankAccountForm.setData(
                                                'bank_name',
                                                event.target.value,
                                            )
                                        }
                                        required
                                    />
                                    <InputError
                                        message={
                                            bankAccountForm.errors.bank_name
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="account_number">
                                        Nomor Rekening
                                    </Label>
                                    <Input
                                        id="account_number"
                                        value={
                                            bankAccountForm.data.account_number
                                        }
                                        onChange={(event) =>
                                            bankAccountForm.setData(
                                                'account_number',
                                                event.target.value,
                                            )
                                        }
                                        required
                                    />
                                    <InputError
                                        message={
                                            bankAccountForm.errors
                                                .account_number
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="account_holder_name">
                                        Nama Pemilik
                                    </Label>
                                    <Input
                                        id="account_holder_name"
                                        value={
                                            bankAccountForm.data
                                                .account_holder_name
                                        }
                                        onChange={(event) =>
                                            bankAccountForm.setData(
                                                'account_holder_name',
                                                event.target.value,
                                            )
                                        }
                                        required
                                    />
                                    <InputError
                                        message={
                                            bankAccountForm.errors
                                                .account_holder_name
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="branch">Cabang</Label>
                                    <Input
                                        id="branch"
                                        value={bankAccountForm.data.branch}
                                        onChange={(event) =>
                                            bankAccountForm.setData(
                                                'branch',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={bankAccountForm.errors.branch}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="currency">Mata Uang</Label>
                                    <Input
                                        id="currency"
                                        value={bankAccountForm.data.currency}
                                        onChange={(event) =>
                                            bankAccountForm.setData(
                                                'currency',
                                                event.target.value,
                                            )
                                        }
                                        maxLength={3}
                                        required
                                    />
                                    <InputError
                                        message={
                                            bankAccountForm.errors.currency
                                        }
                                    />
                                </div>
                                <div className="flex items-center gap-2 md:items-end">
                                    <Checkbox
                                        id="is_primary"
                                        checked={
                                            bankAccountForm.data.is_primary
                                        }
                                        onCheckedChange={(checked) =>
                                            bankAccountForm.setData(
                                                'is_primary',
                                                checked === true,
                                            )
                                        }
                                    />
                                    <Label htmlFor="is_primary">
                                        Jadikan rekening utama
                                    </Label>
                                </div>
                                <div className="flex justify-end gap-2 md:col-span-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={openBankAccountCreate}
                                    >
                                        Reset Form
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={bankAccountForm.processing}
                                    >
                                        {editingBankAccount
                                            ? 'Simpan'
                                            : 'Tambah Rekening'}
                                    </Button>
                                </div>
                            </form>

                            <div className="space-y-3 rounded-lg border p-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium">
                                        Daftar Tunjangan
                                    </p>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={openAllowanceCreate}
                                    >
                                        Tambah Tunjangan
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    {selectedEmployee.allowances.length ===
                                        0 && (
                                        <p className="text-sm text-muted-foreground">
                                            Belum ada data tunjangan.
                                        </p>
                                    )}

                                    {selectedEmployee.allowances.map(
                                        (allowance) => (
                                            <div
                                                key={allowance.id}
                                                className="flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium">
                                                            {allowance.name}
                                                        </p>
                                                        <Badge
                                                            variant={
                                                                allowance.is_active
                                                                    ? 'default'
                                                                    : 'outline'
                                                            }
                                                        >
                                                            {allowance.is_active
                                                                ? 'Aktif'
                                                                : 'Nonaktif'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {new Intl.NumberFormat(
                                                            'id-ID',
                                                            {
                                                                style: 'currency',
                                                                currency: 'IDR',
                                                                maximumFractionDigits: 0,
                                                            },
                                                        ).format(
                                                            Number(
                                                                allowance.amount,
                                                            ),
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <ActionIconButton
                                                        label="Edit tunjangan"
                                                        icon={Pencil}
                                                        variant="outline"
                                                        onClick={() =>
                                                            openAllowanceEdit(
                                                                allowance,
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>

                            <form
                                onSubmit={submitAllowanceForm}
                                className="grid gap-3 rounded-lg border p-3 md:grid-cols-2"
                            >
                                <p className="text-sm font-medium md:col-span-2">
                                    {editingAllowance
                                        ? 'Edit tunjangan'
                                        : 'Tambah tunjangan baru'}
                                </p>
                                <div className="grid gap-2">
                                    <Label htmlFor="allowance_name">Nama</Label>
                                    <Input
                                        id="allowance_name"
                                        value={allowanceForm.data.name}
                                        onChange={(event) =>
                                            allowanceForm.setData(
                                                'name',
                                                event.target.value,
                                            )
                                        }
                                        required
                                    />
                                    <InputError
                                        message={allowanceForm.errors.name}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="allowance_amount">
                                        Nominal
                                    </Label>
                                    <Input
                                        id="allowance_amount"
                                        type="number"
                                        min={0}
                                        step="1000"
                                        value={allowanceForm.data.amount}
                                        onChange={(event) =>
                                            allowanceForm.setData(
                                                'amount',
                                                event.target.value,
                                            )
                                        }
                                        required
                                    />
                                    <InputError
                                        message={allowanceForm.errors.amount}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="allowance_start">
                                        Berlaku Mulai
                                    </Label>
                                    <Input
                                        id="allowance_start"
                                        type="date"
                                        value={
                                            allowanceForm.data
                                                .effective_start_date
                                        }
                                        onChange={(event) =>
                                            allowanceForm.setData(
                                                'effective_start_date',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={
                                            allowanceForm.errors
                                                .effective_start_date
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="allowance_end">
                                        Berlaku Sampai
                                    </Label>
                                    <Input
                                        id="allowance_end"
                                        type="date"
                                        value={
                                            allowanceForm.data
                                                .effective_end_date
                                        }
                                        onChange={(event) =>
                                            allowanceForm.setData(
                                                'effective_end_date',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={
                                            allowanceForm.errors
                                                .effective_end_date
                                        }
                                    />
                                </div>
                                <div className="grid gap-2 md:col-span-2">
                                    <Label htmlFor="allowance_notes">
                                        Catatan
                                    </Label>
                                    <Input
                                        id="allowance_notes"
                                        value={allowanceForm.data.notes}
                                        onChange={(event) =>
                                            allowanceForm.setData(
                                                'notes',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={allowanceForm.errors.notes}
                                    />
                                </div>
                                <div className="flex items-center gap-2 md:items-end">
                                    <Checkbox
                                        id="allowance_active"
                                        checked={allowanceForm.data.is_active}
                                        onCheckedChange={(checked) =>
                                            allowanceForm.setData(
                                                'is_active',
                                                checked === true,
                                            )
                                        }
                                    />
                                    <Label htmlFor="allowance_active">
                                        Aktif
                                    </Label>
                                </div>
                                <div className="flex justify-end gap-2 md:col-span-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={openAllowanceCreate}
                                    >
                                        Reset Form
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={allowanceForm.processing}
                                    >
                                        {editingAllowance
                                            ? 'Simpan'
                                            : 'Tambah Tunjangan'}
                                    </Button>
                                </div>
                            </form>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
