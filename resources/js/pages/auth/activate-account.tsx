import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';

type Props = {
    phone: string;
    status?: string;
};

export default function ActivateAccount({ phone, status }: Props) {
    const form = useForm({ otp: '' });
    const resendForm = useForm({});

    return (
        <AuthLayout
            title="Aktivasi akun"
            description="Masukkan OTP yang dikirim ke WhatsApp untuk mengaktifkan akun Anda."
        >
            <Head title="Aktivasi akun" />

            {status === 'otp-sent' ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    OTP baru sudah dikirim ke WhatsApp {phone}.
                </div>
            ) : null}

            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post('/activate-account/verify');
                }}
                className="space-y-6"
            >
                <div className="grid gap-2">
                    <Label htmlFor="otp">Kode OTP WhatsApp</Label>
                    <Input
                        id="otp"
                        name="otp"
                        inputMode="numeric"
                        maxLength={6}
                        autoFocus
                        value={form.data.otp}
                        onChange={(event) => form.setData('otp', event.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                        placeholder="123456"
                    />
                    <InputError message={form.errors.otp} />
                    <p className="text-sm text-muted-foreground">
                        OTP dikirim ke nomor WhatsApp {phone}.
                    </p>
                </div>

                <div className="space-y-3">
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={form.processing}
                    >
                        {form.processing && <Spinner />}
                        Aktivasi akun
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        disabled={resendForm.processing}
                        onClick={() => resendForm.post('/activate-account/send')}
                    >
                        {resendForm.processing && <Spinner />}
                        Kirim ulang OTP
                    </Button>
                    <InputError message={resendForm.errors.otp} />
                </div>
            </form>
        </AuthLayout>
    );
}
