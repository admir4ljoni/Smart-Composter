import type { ReactNode } from 'react';

export function PageHeader({
    title,
    description,
    action,
}: {
    title: string;
    description: string;
    action?: ReactNode;
}) {
    return (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                    {title}
                </h1>
                <p className="mt-2 text-muted-foreground">{description}</p>
            </div>
            {action}
        </header>
    );
}
