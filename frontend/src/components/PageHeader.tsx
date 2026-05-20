import { ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    action?: ReactNode;
    icon?: ReactNode;
}

export const PageHeader = ({ title, description, action, icon }: PageHeaderProps) => {
    return (
        <div className="flex justify-between items-center mb-8">
            <div className="flex-col">
                <h1 className="text-2xl font-bold mb-1 tracking-tight flex items-center gap-3">
                    {icon && <span className="text-secondary scale-125">{icon}</span>}
                    {title}
                </h1>
                {description && <p className="text-secondary text-sm font-medium">{description}</p>}
            </div>
            {action && <div>{action}</div>}
        </div>
    )
}
