interface ProgressBarProps {
    percentage: number;
    color: 'purple' | 'cyan';
}

export default function ProgressBar({ percentage, color }: ProgressBarProps) {
    const bgColor = color === 'purple' ? 'bg-purple-500' : 'bg-cyan-500';
    
    return (
        <div className="flex-1 bg-slate-700 rounded-full h-6 overflow-hidden relative">
            <div
                className={`${bgColor} h-full rounded-full transition-all absolute top-0 left-0`}
                style={{ width: `${percentage}%` }}
            />
        </div>
    );
}
