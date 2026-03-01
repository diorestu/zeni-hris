import { router, usePage } from '@inertiajs/react';
import { CircleAlert, CircleCheck } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error';

type ToastItem = {
    id: number;
    type: ToastType;
    message: string;
    leaving: boolean;
};

type FlashProps = {
    flash?: {
        success?: string | null;
        error?: string | null;
    };
};

const TOAST_TIMEOUT = 3600;

export default function GlobalToast() {
    const { flash } = usePage<FlashProps>().props;
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const seenRef = useRef<Record<string, number>>({});
    const lastVisitMethodRef = useRef('get');

    const pushToast = useCallback((type: ToastType, message: string) => {
        const normalizedMessage = message.trim();

        if (normalizedMessage === '') {
            return;
        }

        const key = `${type}:${normalizedMessage}`;
        const now = Date.now();
        const lastAt = seenRef.current[key];

        if (lastAt && now - lastAt < 1200) {
            return;
        }

        seenRef.current[key] = now;

        const id = now + Math.floor(Math.random() * 1000);
        setToasts((current) => [
            ...current,
            { id, type, message: normalizedMessage, leaving: false },
        ]);

        window.setTimeout(() => {
            setToasts((current) =>
                current.map((toast) =>
                    toast.id === id ? { ...toast, leaving: true } : toast,
                ),
            );

            window.setTimeout(() => {
                setToasts((current) =>
                    current.filter((toast) => toast.id !== id),
                );
            }, 220);
        }, TOAST_TIMEOUT);
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            if (flash?.success) {
                pushToast('success', flash.success);
            }

            if (flash?.error) {
                pushToast('error', flash.error);
            }
        }, 0);

        return () => {
            window.clearTimeout(timer);
        };
    }, [flash?.error, flash?.success, pushToast]);

    useEffect(() => {
        const unbindStart = router.on('start', (event) => {
            lastVisitMethodRef.current = event.detail.visit.method.toLowerCase();
        });
        const unbindSuccess = router.on('success', (event) => {
            const method = lastVisitMethodRef.current;
            const pageProps = event.detail.page.props as FlashProps;

            if (pageProps.flash?.success || pageProps.flash?.error) {
                return;
            }

            if (method !== 'get') {
                pushToast('success', 'Aksi berhasil diproses.');
            }
        });

        const unbindError = router.on('error', () => {
            pushToast('error', 'Terjadi kesalahan. Silakan periksa input data.');
        });

        const unbindException = router.on('exception', () => {
            pushToast('error', 'Terjadi error pada sistem. Silakan coba lagi.');
        });

        const unbindInvalid = router.on('invalid', () => {
            pushToast('error', 'Data tidak valid. Silakan cek kembali.');
        });

        return () => {
            unbindStart();
            unbindSuccess();
            unbindError();
            unbindException();
            unbindInvalid();
        };
    }, [pushToast]);

    if (toasts.length === 0) {
        return null;
    }

    return (
        <div className="pointer-events-none fixed top-6 left-1/2 z-[70] flex w-full max-w-md -translate-x-1/2 flex-col gap-2 px-4">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={cn(
                        'pointer-events-auto flex items-start gap-2 rounded-md border bg-white px-3 py-2 text-sm shadow-md transition-all duration-200',
                        toast.leaving
                            ? 'translate-y-1 opacity-0'
                            : 'translate-y-0 opacity-100',
                        toast.type === 'error'
                            ? 'border-red-300 text-red-600'
                            : 'border-slate-200 text-slate-900',
                    )}
                >
                    {toast.type === 'error' ? (
                        <CircleAlert className="mt-0.5 size-4 shrink-0" />
                    ) : (
                        <CircleCheck className="mt-0.5 size-4 shrink-0" />
                    )}
                    <p>{toast.message}</p>
                </div>
            ))}
        </div>
    );
}
