import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/profile';
import type { BreadcrumbItem } from '@/types';

type SubUser = {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pengaturan pengguna',
        href: edit(),
    },
];

export default function SettingsUsersPage({ subUsers }: { subUsers: SubUser[] }) {
    const [editingUser, setEditingUser] = useState<SubUser | null>(null);

    const createForm = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const updateForm = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submitCreate = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        createForm.post('/settings/users', {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
            },
        });
    };

    const submitUpdate = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!editingUser) {
            return;
        }

        updateForm.put(`/settings/users/${editingUser.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingUser(null);
                updateForm.reset();
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pengaturan pengguna" />

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Pengguna"
                        description="Kelola sub-user di bawah akun admin Anda"
                    />

                    <form onSubmit={submitCreate} className="space-y-4 rounded-lg border p-4">
                        <p className="text-sm font-medium">Tambah Sub-user</p>
                        <div className="grid gap-2">
                            <Label htmlFor="new_user_name">Nama</Label>
                            <Input
                                id="new_user_name"
                                value={createForm.data.name}
                                onChange={(event) =>
                                    createForm.setData('name', event.target.value)
                                }
                                required
                            />
                            <InputError message={createForm.errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="new_user_email">Email</Label>
                            <Input
                                id="new_user_email"
                                type="email"
                                value={createForm.data.email}
                                onChange={(event) =>
                                    createForm.setData('email', event.target.value)
                                }
                                required
                            />
                            <InputError message={createForm.errors.email} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="new_user_password">Kata sandi</Label>
                            <Input
                                id="new_user_password"
                                type="password"
                                value={createForm.data.password}
                                onChange={(event) =>
                                    createForm.setData('password', event.target.value)
                                }
                                required
                            />
                            <InputError message={createForm.errors.password} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="new_user_password_confirmation">
                                Konfirmasi Password
                            </Label>
                            <Input
                                id="new_user_password_confirmation"
                                type="password"
                                value={createForm.data.password_confirmation}
                                onChange={(event) =>
                                    createForm.setData(
                                        'password_confirmation',
                                        event.target.value,
                                    )
                                }
                                required
                            />
                        </div>
                        <Button disabled={createForm.processing}>Tambah</Button>
                    </form>

                    <div className="space-y-3 rounded-lg border p-4">
                        <p className="text-sm font-medium">Daftar Sub-user</p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="py-2">Nama</th>
                                        <th className="py-2">Email</th>
                                        <th className="py-2">Role</th>
                                        <th className="py-2">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subUsers.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="py-5 text-center text-muted-foreground"
                                            >
                                                Belum ada sub-user.
                                            </td>
                                        </tr>
                                    )}
                                    {subUsers.map((subUser) => (
                                        <tr key={subUser.id} className="border-b">
                                            <td className="py-2">{subUser.name}</td>
                                            <td className="py-2">{subUser.email}</td>
                                            <td className="py-2">{subUser.role}</td>
                                            <td className="py-2">
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setEditingUser(subUser);
                                                            updateForm.setData({
                                                                name: subUser.name,
                                                                email: subUser.email,
                                                                password: '',
                                                                password_confirmation:
                                                                    '',
                                                            });
                                                            updateForm.clearErrors();
                                                        }}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => {
                                                            if (
                                                                !window.confirm(
                                                                    `Hapus sub-user ${subUser.name}?`,
                                                                )
                                                            ) {
                                                                return;
                                                            }

                                                            router.delete(
                                                                `/settings/users/${subUser.id}`,
                                                                {
                                                                    preserveScroll:
                                                                        true,
                                                                },
                                                            );
                                                        }}
                                                    >
                                                        Hapus
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {editingUser && (
                        <form
                            onSubmit={submitUpdate}
                            className="space-y-4 rounded-lg border p-4"
                        >
                            <p className="text-sm font-medium">
                                Edit Sub-user: {editingUser.name}
                            </p>
                            <div className="grid gap-2">
                                <Label htmlFor="edit_user_name">Nama</Label>
                                <Input
                                    id="edit_user_name"
                                    value={updateForm.data.name}
                                    onChange={(event) =>
                                        updateForm.setData(
                                            'name',
                                            event.target.value,
                                        )
                                    }
                                    required
                                />
                                <InputError message={updateForm.errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit_user_email">Email</Label>
                                <Input
                                    id="edit_user_email"
                                    type="email"
                                    value={updateForm.data.email}
                                    onChange={(event) =>
                                        updateForm.setData(
                                            'email',
                                            event.target.value,
                                        )
                                    }
                                    required
                                />
                                <InputError message={updateForm.errors.email} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit_user_password">
                                    Password Baru (opsional)
                                </Label>
                                <Input
                                    id="edit_user_password"
                                    type="password"
                                    value={updateForm.data.password}
                                    onChange={(event) =>
                                        updateForm.setData(
                                            'password',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={updateForm.errors.password}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit_user_password_confirmation">
                                    Konfirmasi Password Baru
                                </Label>
                                <Input
                                    id="edit_user_password_confirmation"
                                    type="password"
                                    value={updateForm.data.password_confirmation}
                                    onChange={(event) =>
                                        updateForm.setData(
                                            'password_confirmation',
                                            event.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button disabled={updateForm.processing}>
                                    Simpan
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditingUser(null)}
                                >
                                    Batal
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
