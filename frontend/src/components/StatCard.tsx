export const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => {
    return (
        <div className="glass-card flex-col justify-between" style={{ padding: '1.5rem', flex: 1, minWidth: '200px' }}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-muted font-bold text-sm uppercase tracking-wider">{title}</h3>
                <div style={{
                    padding: '0.5rem',
                    borderRadius: '10px',
                    background: `rgba(${color}, 0.15)`,
                    color: `rgb(${color})`
                }}>
                    <Icon size={20} />
                </div>
            </div>
            <div>
                <div className="text-3xl font-bold mb-1">{value}</div>
                {subtitle && <div className="text-sm text-secondary">{subtitle}</div>}
            </div>
        </div>
    )
}
