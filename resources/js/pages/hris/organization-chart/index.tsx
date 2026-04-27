import { Head } from '@inertiajs/react';
import { Building2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Employee = {
    id: number;
    employee_code: string;
    full_name: string;
    employment_status: string;
    is_active: boolean;
};

type OrgNode = {
    id: number;
    position_code: string;
    employee_code: string;
    full_name: string;
    employees: Employee[];
    is_vacant: boolean;
    division_name: string | null;
    position_name: string | null;
    position_level: number;
    position_level_label: string;
    employment_status: string;
    is_active: boolean;
    cycle_detected: boolean;
    children: OrgNode[];
};

type PageProps = {
    chart: OrgNode[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Org Chart',
        href: '/hris/organization-chart',
    },
];

const initials = (name: string) =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');

const sortByLevelThenName = (a: OrgNode, b: OrgNode): number => {
    if (a.position_level !== b.position_level) {
        return a.position_level - b.position_level;
    }

    return a.full_name.localeCompare(b.full_name);
};

const collectLevelThreeAndFour = (nodes: OrgNode[]): OrgNode[] => {
    const collected: OrgNode[] = [];

    const walk = (items: OrgNode[]) => {
        items.forEach((item) => {
            if (item.position_level === 3) {
                collected.push({
                    ...item,
                    children: [],
                });
            }

            if (item.position_level === 4) {
                collected.push({
                    ...item,
                    children: [],
                });
                return;
            }

            if (item.children.length > 0) {
                walk(item.children);
            }
        });
    };

    walk(nodes);

    return collected.sort(sortByLevelThenName);
};

const getDisplayChildren = (node: OrgNode): OrgNode[] => {
    if (node.children.length === 0 || node.position_level >= 3) {
        return [];
    }

    if (node.position_level === 0) {
        return node.children;
    }

    if (node.position_level === 2) {
        return collectLevelThreeAndFour(node.children);
    }

    if (node.position_level === 1) {
        const hasManagerLayer = node.children.some((child) => child.position_level === 2);

        if (!hasManagerLayer) {
            const flattened = collectLevelThreeAndFour(node.children);

            if (flattened.length > 0) {
                return flattened;
            }
        }
    }

    return node.children;
};

const shouldUseVerticalFlow = (node: OrgNode, children: OrgNode[]): boolean => {
    if (children.length === 0) {
        return false;
    }

    if (node.position_level === 2) {
        return true;
    }

    if (node.position_level === 1) {
        return children.every((child) => child.position_level >= 3);
    }

    return false;
};

function OrgPersonCard({ node }: { node: OrgNode }) {
    const isExecutiveLevel = node.position_level <= 2;
    const level = node.position_level;
    const isLightCard = level >= 3;
    const employees = node.employees ?? [];
    const employeeCount = employees.length;
    const isVacant = employeeCount === 0;
    const hasMoreEmployees = employeeCount > 1;

    const cardToneClass =
        level === 0
            ? 'border-slate-700/60 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 shadow-slate-900/35'
            : level === 1
              ? 'border-blue-700/40 bg-gradient-to-r from-blue-800 via-blue-700 to-blue-600 shadow-blue-900/30'
              : level === 2
                ? 'border-sky-500/40 bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 shadow-sky-700/25'
                : level === 3
                  ? 'border-slate-300 bg-gradient-to-r from-slate-200 via-slate-100 to-white shadow-slate-300/35'
                  : 'border-slate-300 bg-white shadow-slate-300/35';

    const mainEmployee = employees[0];

    const MainCard = (
        <div
            className={`border shadow-md ${
                isExecutiveLevel
                    ? 'w-[190px] min-w-[190px] max-w-[190px] rounded-[16px] px-2.5 py-2'
                    : 'w-[119px] min-w-[119px] max-w-[119px] rounded-[12px] px-2 py-1.5'
            } ${cardToneClass} ${
                isLightCard ? 'text-slate-900' : 'text-white'
            }`}
        >
            <div className={`flex items-center ${isExecutiveLevel ? 'gap-2' : 'gap-1.5'}`}>
                <Avatar
                    className={`${
                        isLightCard
                            ? 'border-slate-400/70 bg-white'
                            : 'border-white/70 bg-white/20'
                    } border ${
                        isExecutiveLevel ? 'size-7' : 'size-5'
                    }`}
                >
                    <AvatarFallback
                        className={`font-semibold ${
                            isLightCard
                                ? 'bg-white text-slate-700'
                                : 'bg-white/20 text-white'
                        } ${
                            isExecutiveLevel ? 'text-[9px]' : 'text-[7px]'
                        }`}
                    >
                        {isVacant ? 'VC' : initials(mainEmployee?.full_name ?? '')}
                    </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                    <p
                        className={`truncate font-semibold tracking-wide uppercase ${
                            isExecutiveLevel ? 'text-[10px]' : 'text-[9px]'
                        }`}
                    >
                        {isVacant ? 'Vacant' : mainEmployee?.full_name}
                    </p>
                    <p
                        className={`truncate font-medium uppercase ${
                            isLightCard ? 'text-slate-600' : 'text-white/90'
                        } ${
                            isExecutiveLevel ? 'text-[8px]' : 'text-[7px]'
                        }`}
                    >
                        {node.position_name ?? node.position_level_label}
                    </p>
                </div>
            </div>
        </div>
    );

    if (!hasMoreEmployees) {
        return <div className="flex flex-col gap-1">{MainCard}</div>;
    }

    return (
        <div className="relative flex flex-col">
            {MainCard}

            {/* Show additional employees with connecting lines */}
            <div className="relative pt-2">
                <div
                    aria-hidden
                    className="absolute top-0 left-1/2 h-2 w-px bg-slate-400"
                />

                <ul className="relative left-1/2 w-fit flex flex-col gap-0.5">
                    {employees.slice(1).map((emp, index) => {
                        const isLast = index === employees.length - 2;
                        const verticalLineClass = isLast
                            ? 'top-0 bottom-1/2'
                            : 'top-0 bottom-0';

                        return (
                            <li
                                key={emp.id}
                                className={`relative pl-5 ${isLast ? '' : 'pb-2'}`}
                            >
                                <div
                                    aria-hidden
                                    className={`absolute left-0 w-px bg-slate-400 ${verticalLineClass}`}
                                />
                                <div
                                    aria-hidden
                                    className="absolute top-1/2 left-0 h-px w-5 -translate-y-1/2 bg-slate-400"
                                />
                                <div
                                    className={`border shadow-sm rounded-[12px] px-2 py-1 text-[8px] ${cardToneClass} ${
                                        isLightCard
                                            ? 'text-slate-900'
                                            : 'text-white'
                                    }`}
                                >
                                    <p className="truncate font-semibold uppercase">
                                        {emp.full_name}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}

function VerticalTier({ nodes }: { nodes: OrgNode[] }) {
    return (
        <div className="relative pt-4">
            <div
                aria-hidden
                className="absolute top-0 left-1/2 h-4 w-px bg-slate-400"
            />

            <ul className="relative left-1/2 w-fit">
                {nodes.map((child, index) => {
                    const isLast = index === nodes.length - 1;
                    const verticalLineClass = isLast
                        ? 'top-0 bottom-1/2'
                        : 'top-0 bottom-0';

                    return (
                        <li key={child.id} className={`relative pl-5 ${isLast ? '' : 'pb-4'}`}>
                            <div
                                aria-hidden
                                className={`absolute left-0 w-px bg-slate-400 ${verticalLineClass}`}
                            />
                            <div
                                aria-hidden
                                className="absolute top-1/2 left-0 h-px w-5 -translate-y-1/2 bg-slate-400"
                            />
                            <OrgPersonCard node={child} />
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

function EmployeeNode({
    node,
    isRoot = false,
    connection = 'horizontal',
}: {
    node: OrgNode;
    isRoot?: boolean;
    connection?: 'horizontal' | 'vertical';
}) {
    const childrenToRender = getDisplayChildren(node);
    const hasChildren = childrenToRender.length > 0;
    const useVerticalFlow = shouldUseVerticalFlow(node, childrenToRender);
    const isHorizontalConnection = connection === 'horizontal';
    const horizontalSpacing = node.position_level <= 1 ? 'px-8' : 'px-2.5';

    return (
        <li
            className={`relative flex flex-col ${
                isHorizontalConnection
                    ? `items-center ${horizontalSpacing} ${
                isRoot
                    ? 'pt-0'
                    : "pt-6 before:absolute before:top-0 before:left-0 before:h-px before:w-1/2 before:bg-slate-400 before:content-[''] after:absolute after:top-0 after:right-0 after:h-px after:w-1/2 after:bg-slate-400 after:content-[''] first:before:hidden last:after:hidden"
                      }`
                    : 'items-start'
            }`}
        >
            {!isRoot && isHorizontalConnection && (
                <div
                    aria-hidden
                    className="absolute top-0 left-1/2 h-6 w-px -translate-x-1/2 bg-slate-400"
                />
            )}

            <OrgPersonCard node={node} />

            {hasChildren && (
                <>
                    {useVerticalFlow ? (
                        <VerticalTier nodes={childrenToRender} />
                    ) : (
                        <div className="relative mt-6">
                            <div
                                aria-hidden
                                className="absolute -top-6 left-1/2 h-6 w-px -translate-x-1/2 bg-slate-400"
                            />
                            <ul className="flex items-start justify-center">
                                {childrenToRender.map((child) => (
                                    <EmployeeNode
                                        key={child.id}
                                        node={child}
                                        connection="horizontal"
                                    />
                                ))}
                            </ul>
                        </div>
                    )}
                </>
            )}
        </li>
    );
}

export default function OrganizationChartPage({ chart }: PageProps) {
    const [activeTab, setActiveTab] = useState<string>('general');

    const divisionTabs = useMemo(() => {
        const divisions = new Set<string>();

        const walk = (nodes: OrgNode[]) => {
            for (const node of nodes) {
                if (node.division_name && node.division_name !== '') {
                    divisions.add(node.division_name);
                }

                if (node.children.length > 0) {
                    walk(node.children);
                }
            }
        };

        walk(chart);

        return Array.from(divisions).sort((a, b) => a.localeCompare(b));
    }, [chart]);

    const filteredChart = useMemo(() => {
        if (activeTab === 'general') {
            return chart;
        }

        const filterNodes = (nodes: OrgNode[]): OrgNode[] => {
            return nodes
                .map((node) => {
                    const filteredChildren = filterNodes(node.children);
                    const isDivisionMatch = node.division_name === activeTab;

                    if (!isDivisionMatch && filteredChildren.length === 0) {
                        return null;
                    }

                    return {
                        ...node,
                        children: filteredChildren,
                    };
                })
                .filter((node): node is OrgNode => node !== null);
        };

        return filterNodes(chart);
    }, [activeTab, chart]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Organizational Chart" />

            <div className="space-y-4 p-4">
                <Card className="overflow-hidden border-indigo-100/70 bg-gradient-to-b from-indigo-50/60 via-sky-50/50 to-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Building2 className="size-4" />
                            Organizational Chart
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto pb-6">
                        <div className="mb-4 flex flex-wrap gap-2">
                            <Button
                                type="button"
                                size="sm"
                                variant={
                                    activeTab === 'general'
                                        ? 'default'
                                        : 'outline'
                                }
                                onClick={() => setActiveTab('general')}
                            >
                                General
                            </Button>
                            {divisionTabs.map((divisionName) => (
                                <Button
                                    key={divisionName}
                                    type="button"
                                    size="sm"
                                    variant={
                                        activeTab === divisionName
                                            ? 'default'
                                            : 'outline'
                                    }
                                    onClick={() => setActiveTab(divisionName)}
                                >
                                    {divisionName}
                                </Button>
                            ))}
                        </div>

                        {filteredChart.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Belum ada data jabatan untuk membentuk struktur organisasi.
                            </p>
                        ) : (
                            <div className="min-w-max px-4 py-2">
                                <ul className="flex items-start justify-center">
                                    {filteredChart.map((node) => (
                                        <EmployeeNode
                                            key={node.id}
                                            node={node}
                                            isRoot
                                        />
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
