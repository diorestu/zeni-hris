import {
    Combobox,
    ComboboxButton,
    ComboboxInput,
    ComboboxOption,
    ComboboxOptions,
} from '@headlessui/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

export type SearchableSelectOption = {
    value: string;
    label: string;
    keywords?: string;
};

type SearchableSelectProps = {
    id?: string;
    value: string;
    options: SearchableSelectOption[];
    onValueChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    className?: string;
    disabled?: boolean;
};

export default function SearchableSelect({
    id,
    value,
    options,
    onValueChange,
    placeholder = 'Pilih opsi',
    searchPlaceholder,
    emptyText = 'Data tidak ditemukan',
    className,
    disabled = false,
}: SearchableSelectProps) {
    const [query, setQuery] = useState('');

    const optionMap = useMemo(
        () => new Map(options.map((option) => [option.value, option])),
        [options],
    );

    const filteredOptions = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        if (normalizedQuery === '') {
            return options;
        }

        return options.filter((option) => {
            const target = `${option.label} ${option.keywords ?? ''}`.toLowerCase();
            return target.includes(normalizedQuery);
        });
    }, [options, query]);

    return (
        <Combobox
            value={value}
            onChange={(nextValue: string | null) =>
                onValueChange(nextValue ?? '')
            }
            onClose={() => setQuery('')}
            disabled={disabled}
        >
            <div className={cn('relative', className)}>
                <ComboboxInput
                    id={id}
                    autoComplete="off"
                    className={cn(
                        'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 pr-10 text-sm focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                    )}
                    displayValue={(selectedValue: string) =>
                        optionMap.get(selectedValue)?.label ?? ''
                    }
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={searchPlaceholder ?? placeholder}
                />
                <ComboboxButton className="text-muted-foreground absolute inset-y-0 right-0 flex items-center px-3">
                    <ChevronsUpDown className="size-4" />
                </ComboboxButton>

                <ComboboxOptions
                    anchor="bottom"
                    transition
                    className="bg-popover text-popover-foreground data-[closed]:scale-95 data-[closed]:opacity-0 z-50 mt-1 max-h-60 w-[var(--input-width)] overflow-auto rounded-md border p-1 shadow-md transition"
                >
                    {filteredOptions.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            {emptyText}
                        </div>
                    ) : (
                        filteredOptions.map((option) => (
                            <ComboboxOption
                                key={option.value}
                                value={option.value}
                                className="data-[focus]:bg-accent data-[focus]:text-accent-foreground relative flex cursor-default items-center rounded-sm py-1.5 pr-2 pl-8 text-sm"
                            >
                                {({ selected }) => (
                                    <>
                                        <Check
                                            className={cn(
                                                'absolute left-2 size-4',
                                                selected
                                                    ? 'opacity-100'
                                                    : 'opacity-0',
                                            )}
                                        />
                                        {option.label}
                                    </>
                                )}
                            </ComboboxOption>
                        ))
                    )}
                </ComboboxOptions>
            </div>
        </Combobox>
    );
}
