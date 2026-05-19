import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeedControlProps {
    /** BPM saat ini (originalBpm × speed), untuk display */
    bpm: number;
    /** BPM asli dari file MIDI */
    originalBpm: number;
    /** Speed multiplier saat ini (1.0 = normal) */
    speed: number;
    /** Dipanggil saat user mengubah BPM secara absolut */
    onChange: (bpm: number) => void;
    /** Dipanggil saat user mengubah speed multiplier */
    onSpeedChange: (speed: number) => void;
}

const MIN_BPM = 20;
const MAX_BPM = 400;

// Preset speed multipliers
const PRESETS: { label: string; speed: number }[] = [
    { label: '0.25×', speed: 0.25 },
    { label: '0.5×',  speed: 0.5  },
    { label: '0.75×', speed: 0.75 },
    { label: '1×',    speed: 1.0  },
    { label: '1.5×',  speed: 1.5  },
    { label: '2×',    speed: 2.0  },
];

export default function SpeedControl({
    bpm,
    originalBpm,
    speed,
    onChange,
    onSpeedChange,
}: SpeedControlProps) {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState(String(Math.round(bpm)));
    const [inputFocused, setInputFocused] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Sync input ketika bpm berubah dari luar (tapi tidak saat user sedang mengetik)
    useEffect(() => {
        if (!inputFocused) setInputValue(String(Math.round(bpm)));
    }, [bpm, inputFocused]);

    // Tutup panel saat klik di luar
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

    const clampBpm = (v: number) => Math.max(MIN_BPM, Math.min(MAX_BPM, v));

    const commitInput = useCallback(() => {
        const parsed = parseInt(inputValue, 10);
        if (!isNaN(parsed)) {
            const clamped = clampBpm(parsed);
            onChange(clamped);
            setInputValue(String(clamped));
        } else {
            setInputValue(String(Math.round(bpm)));
        }
    }, [inputValue, bpm, onChange]);

    const handleInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            commitInput();
            (e.target as HTMLInputElement).blur();
        }
        if (e.key === 'Escape') {
            setInputValue(String(Math.round(bpm)));
            (e.target as HTMLInputElement).blur();
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            onChange(clampBpm(Math.round(bpm) + 1));
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            onChange(clampBpm(Math.round(bpm) - 1));
        }
    };

    const nudgeBpm = (delta: number) => onChange(clampBpm(Math.round(bpm) + delta));

    // Warna berdasarkan speed multiplier
    const speedColor =
        speed <= 0.6  ? '#4ade80' :
        speed <= 1.1  ? '#facc15' :
        speed <= 1.6  ? '#fb923c' : '#f87171';

    const isNormal = Math.abs(speed - 1.0) < 0.01;

    // Slider: range 20–400 BPM absolut
    const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(Number(e.target.value));
    };

    return (
        <div ref={panelRef} className="relative z-30">
            {/* Trigger button */}
            <button
                onClick={() => setOpen((v) => !v)}
                className={[
                    'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition',
                    open
                        ? 'border-yellow-500/60 bg-yellow-500/10 text-yellow-300'
                        : 'border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10',
                ].join(' ')}
                title="Speed / BPM"
            >
                {/* Metronome icon */}
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 shrink-0 opacity-70">
                    <path d="M10 2a1 1 0 00-1 1v.5L5.293 7.207A1 1 0 005 8v6a1 1 0 001 1h8a1 1 0 001-1V8a1 1 0 00-.293-.707L11 3.5V3a1 1 0 00-1-1zm0 2.414L13.586 8H6.414L10 4.414zM6 9h8v4H6V9z" />
                </svg>
                <span style={{ color: speedColor }} className="font-mono font-bold tabular-nums">
                    {Math.round(bpm)}
                </span>
                <span className="text-white/40">BPM</span>
                <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={[
                        'h-3 w-3 shrink-0 text-white/30 transition-transform duration-200',
                        open ? 'rotate-180' : '',
                    ].join(' ')}
                >
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute top-full right-0 mt-2 w-64 overflow-hidden rounded-xl border border-white/10 bg-[#1e1e1e] shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
                        <span className="text-xs font-semibold text-white/60">SPEED / BPM</span>
                        {!isNormal && (
                            <button
                                onClick={() => onSpeedChange(1.0)}
                                className="text-[10px] text-yellow-500/70 transition hover:text-yellow-400"
                            >
                                Reset ke 1×
                            </button>
                        )}
                    </div>

                    <div className="space-y-4 p-4">
                        {/* BPM display + nudge buttons */}
                        <div className="flex items-center justify-center gap-2">
                            <button
                                onClick={() => nudgeBpm(-10)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-sm text-white/60 transition hover:bg-white/10 hover:text-white active:scale-95"
                                title="-10 BPM"
                            >
                                ‹‹
                            </button>
                            <button
                                onClick={() => nudgeBpm(-1)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-sm text-white/60 transition hover:bg-white/10 hover:text-white active:scale-95"
                                title="-1 BPM"
                            >
                                ‹
                            </button>

                            {/* Input BPM */}
                            <input
                                type="number"
                                min={MIN_BPM}
                                max={MAX_BPM}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onFocus={() => setInputFocused(true)}
                                onBlur={() => {
                                    setInputFocused(false);
                                    commitInput();
                                }}
                                onKeyDown={handleInputKey}
                                className="w-20 rounded-lg border border-white/15 bg-black/40 py-1 text-center font-mono text-2xl font-bold text-white outline-none transition focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                style={{ color: speedColor }}
                            />

                            <button
                                onClick={() => nudgeBpm(1)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-sm text-white/60 transition hover:bg-white/10 hover:text-white active:scale-95"
                                title="+1 BPM"
                            >
                                ›
                            </button>
                            <button
                                onClick={() => nudgeBpm(10)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-sm text-white/60 transition hover:bg-white/10 hover:text-white active:scale-95"
                                title="+10 BPM"
                            >
                                ››
                            </button>
                        </div>

                        {/* Slider BPM absolut */}
                        <div className="space-y-1">
                            <input
                                type="range"
                                min={MIN_BPM}
                                max={MAX_BPM}
                                step={1}
                                value={Math.round(bpm)}
                                onChange={handleSlider}
                                className="w-full cursor-pointer"
                                style={{ accentColor: speedColor }}
                            />
                            <div className="flex justify-between text-[10px] text-white/25">
                                <span>{MIN_BPM}</span>
                                <span>{Math.round(originalBpm)} (asli)</span>
                                <span>{MAX_BPM}</span>
                            </div>
                        </div>

                        {/* Preset speed multiplier buttons */}
                        <div className="grid grid-cols-3 gap-1.5">
                            {PRESETS.map((p) => {
                                const isActive = Math.abs(speed - p.speed) < 0.01;
                                const presetBpm = Math.round(originalBpm * p.speed);
                                return (
                                    <button
                                        key={p.label}
                                        onClick={() => onSpeedChange(p.speed)}
                                        title={`${presetBpm} BPM`}
                                        className={[
                                            'rounded-lg py-1.5 text-xs font-medium transition active:scale-95',
                                            isActive
                                                ? 'bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/40'
                                                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80',
                                        ].join(' ')}
                                    >
                                        {p.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
