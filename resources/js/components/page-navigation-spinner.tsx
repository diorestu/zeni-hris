import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type PageNavigationSpinnerProps = {
    className?: string;
};

export default function PageNavigationSpinner({
    className,
}: PageNavigationSpinnerProps) {
    const [visible, setVisible] = useState(false);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        const clearPending = () => {
            if (timerRef.current !== null) {
                window.clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };

        const unbindStart = router.on('start', () => {
            clearPending();

            timerRef.current = window.setTimeout(() => {
                setVisible(true);
                timerRef.current = null;
            }, 120);
        });

        const hideLoader = () => {
            clearPending();
            setVisible(false);
        };

        const unbindFinish = router.on('finish', hideLoader);
        const unbindError = router.on('error', hideLoader);
        const unbindInvalid = router.on('invalid', hideLoader);
        const unbindException = router.on('exception', hideLoader);

        return () => {
            clearPending();
            unbindStart();
            unbindFinish();
            unbindError();
            unbindInvalid();
            unbindException();
        };
    }, []);

    return (
        <div
            className={cn(
                'pointer-events-none absolute inset-0 z-[65] flex items-center justify-center bg-background/45 transition-opacity duration-150',
                visible ? 'opacity-100' : 'opacity-0',
                className,
            )}
            aria-hidden={!visible}
        >
            <div className="rounded-full border bg-background/90 p-3 shadow-sm">
                <Spinner className="size-6" />
            </div>
        </div>
    );
}
