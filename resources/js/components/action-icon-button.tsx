import type { LucideIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type ActionIconButtonProps = Omit<
    ComponentProps<typeof Button>,
    'children' | 'size'
> & {
    label: string;
    icon: LucideIcon;
    compact?: boolean;
};

export default function ActionIconButton({
    label,
    icon: Icon,
    type = 'button',
    compact = true,
    className,
    ...props
}: ActionIconButtonProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    type={type}
                    size="icon"
                    aria-label={label}
                    title={label}
                    className={cn(compact ? 'size-7' : '', className)}
                    {...props}
                >
                    <Icon className={compact ? 'size-3.5' : 'size-4'} />
                    <span className="sr-only">{label}</span>
                </Button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
        </Tooltip>
    );
}
