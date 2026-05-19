import { useEffect, useRef, useState } from 'react';
import { CATEGORIES, INSTRUMENTS, type InstrumentDef } from '../lib/instruments';

interface InstrumentPickerProps {
    currentId: string;
    onChange: (id: string) => void;
}

export default function InstrumentPicker({ currentId, onChange }: InstrumentPickerProps) {
    const [open, setOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<InstrumentDef['category']>('keyboard');
    const panelRef = useRef<HTMLDivElement>(null);

    const current = INSTRUMENTS.find((i) => i.id === currentId) ?? INSTRUMENTS[0];

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const filtered = INSTRUMENTS.filter((i) => i.category === activeCategory);

    return (
        <div ref={panelRef} className="relative z-30">
            {/* Trigger button */}
            <button
                onClick={() => setOpen((v) => !v)}
                className={[
                    'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition',
                    open
                        ? 'border-yellow-500 bg-yellow-500/10 text-yellow-300'
                        : 'border-white/15 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10',
                ].join(' ')}
                title="Pilih instrumen"
            >
                <span className="text-base leading-none">{current.emoji}</span>
                <span className="max-w-[110px] truncate">{current.label}</span>
                {/* chevron */}
                <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={[
                        'h-3.5 w-3.5 shrink-0 text-white/40 transition-transform duration-200',
                        open ? 'rotate-180' : '',
                    ].join(' ')}
                >
                    <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute top-full left-0 mt-2 w-72 overflow-hidden rounded-xl border border-white/10 bg-[#1e1e1e] shadow-2xl">
                    {/* Category tabs */}
                    <div className="flex border-b border-white/10">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                title={cat.label}
                                className={[
                                    'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition',
                                    activeCategory === cat.id
                                        ? 'bg-yellow-500/15 text-yellow-300'
                                        : 'text-white/40 hover:bg-white/5 hover:text-white/70',
                                ].join(' ')}
                            >
                                <span className="text-base leading-none">{cat.emoji}</span>
                                <span>{cat.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Instrument grid */}
                    <div className="grid grid-cols-2 gap-1 p-2">
                        {filtered.map((inst) => {
                            const isActive = inst.id === currentId;
                            return (
                                <button
                                    key={inst.id}
                                    onClick={() => {
                                        onChange(inst.id);
                                        setOpen(false);
                                    }}
                                    className={[
                                        'flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition',
                                        isActive
                                            ? 'bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/50'
                                            : 'text-white/70 hover:bg-white/8 hover:text-white',
                                    ].join(' ')}
                                >
                                    <span className="text-lg leading-none">{inst.emoji}</span>
                                    <span className="truncate text-xs font-medium">
                                        {inst.label}
                                    </span>
                                    {isActive && (
                                        <svg
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            className="ml-auto h-3.5 w-3.5 shrink-0 text-yellow-400"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
