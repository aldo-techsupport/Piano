import { useCallback, useEffect, useRef, useState } from 'react';

export type KeyboardMap = Record<string, string>;

// Default layout
export const DEFAULT_KEYBOARD_MAP: KeyboardMap = {
    a: 'C4', w: 'C#4', s: 'D4', e: 'D#4', d: 'E4',
    f: 'F4', t: 'F#4', g: 'G4', y: 'G#4', h: 'A4',
    u: 'A#4', j: 'B4', k: 'C5', o: 'C#5', l: 'D5',
    p: 'D#5', ';': 'E5',
};

// Preset layouts
export const LAYOUT_PRESETS: Record<string, { label: string; map: KeyboardMap }> = {
    default: {
        label: 'Default (ASDF)',
        map: DEFAULT_KEYBOARD_MAP,
    },
    qwerty_c3: {
        label: 'QWERTY C3',
        map: {
            a: 'C3', w: 'C#3', s: 'D3', e: 'D#3', d: 'E3',
            f: 'F3', t: 'F#3', g: 'G3', y: 'G#3', h: 'A3',
            u: 'A#3', j: 'B3', k: 'C4', o: 'C#4', l: 'D4',
            p: 'D#4', ';': 'E4',
        },
    },
    two_octave: {
        label: '2 Oktaf (Z+A)',
        map: {
            z: 'C3', s: 'C#3', x: 'D3', d: 'D#3', c: 'E3',
            v: 'F3', g: 'F#3', b: 'G3', h: 'G#3', n: 'A3',
            j: 'A#3', m: 'B3',
            a: 'C4', w: 'C#4', q: 'D4', e: 'D#4', r: 'E4',
            t: 'F4', y: 'F#4', u: 'G4', i: 'G#4', o: 'A4',
            p: 'A#4',
        },
    },
    glimpse_of_us: {
        label: '🎵 Glimpse of Us',
        map: {
            // Baris bawah (Z-M): Oktaf 3 — note yang dipakai di lagu
            z: 'C3', x: 'C#3', c: 'D#3', v: 'F3', b: 'G3', n: 'G#3', m: 'A#2',
            // Baris tengah (A-;): Oktaf 4 — note utama melodi
            a: 'C4', s: 'C#4', d: 'D#4', f: 'F4', g: 'G4', h: 'G#4', j: 'A#4', k: 'C5',
            // Baris atas (Q-P): Oktaf 5 — note tinggi
            q: 'C5', w: 'C#5', e: 'D#5', r: 'F5', t: 'G5', y: 'G#5', u: 'A#5', i: 'C6', o: 'C#6',
            // Angka untuk note rendah tambahan
            '1': 'D#2', '2': 'A#2',
        },
    },
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const OCTAVES = [2, 3, 4, 5, 6];

function allNotes(): string[] {
    const notes: string[] = [];
    for (const oct of OCTAVES) {
        for (const n of NOTE_NAMES) {
            notes.push(`${n}${oct}`);
        }
    }
    return notes;
}

const ALL_NOTES = allNotes();

interface Props {
    keyboardMap: KeyboardMap;
    onChange: (map: KeyboardMap) => void;
    onClose: () => void;
}

export default function KeyboardLayoutEditor({ keyboardMap, onChange, onClose }: Props) {
    const [editMap, setEditMap] = useState<KeyboardMap>({ ...keyboardMap });
    const [listeningFor, setListeningFor] = useState<string | null>(null); // note waiting for key press
    const [search, setSearch] = useState('');
    const overlayRef = useRef<HTMLDivElement>(null);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (listeningFor) {
                    setListeningFor(null);
                } else {
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [listeningFor, onClose]);

    // Capture key press when listening
    useEffect(() => {
        if (!listeningFor) return;
        const handler = (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            const key = e.key.toLowerCase();
            // Remove this key from any existing mapping
            const newMap = { ...editMap };
            for (const k of Object.keys(newMap)) {
                if (k === key) delete newMap[k];
            }
            newMap[key] = listeningFor;
            setEditMap(newMap);
            setListeningFor(null);
        };
        window.addEventListener('keydown', handler, { capture: true });
        return () => window.removeEventListener('keydown', handler, { capture: true });
    }, [listeningFor, editMap]);

    const removeMapping = useCallback((note: string) => {
        const newMap = { ...editMap };
        for (const k of Object.keys(newMap)) {
            if (newMap[k] === note) delete newMap[k];
        }
        setEditMap(newMap);
    }, [editMap]);

    const applyPreset = useCallback((presetKey: string) => {
        const preset = LAYOUT_PRESETS[presetKey];
        if (preset) setEditMap({ ...preset.map });
    }, []);

    const handleSave = () => {
        onChange(editMap);
        onClose();
    };

    const handleReset = () => {
        setEditMap({ ...DEFAULT_KEYBOARD_MAP });
    };

    // Reverse map: note → key
    const reverseMap: Record<string, string> = {};
    for (const [k, v] of Object.entries(editMap)) {
        reverseMap[v] = k;
    }

    const filteredNotes = search
        ? ALL_NOTES.filter((n) => n.toLowerCase().includes(search.toLowerCase()))
        : ALL_NOTES;

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
            <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-white/10 bg-[#1e1e1e] shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-white">⌨️ Custom Keyboard Layout</h2>
                        <p className="mt-0.5 text-xs text-gray-400">
                            Klik tombol note lalu tekan tombol keyboard yang ingin dipetakan
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-white/10 hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                {/* Presets */}
                <div className="flex flex-wrap gap-2 border-b border-white/10 px-5 py-3">
                    <span className="self-center text-xs text-gray-500">Preset:</span>
                    {Object.entries(LAYOUT_PRESETS).map(([key, preset]) => (
                        <button
                            key={key}
                            onClick={() => applyPreset(key)}
                            className="rounded border border-white/10 px-2.5 py-1 text-xs text-gray-300 transition hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-300"
                        >
                            {preset.label}
                        </button>
                    ))}
                    <button
                        onClick={handleReset}
                        className="ml-auto rounded border border-red-500/30 px-2.5 py-1 text-xs text-red-400 transition hover:bg-red-500/10"
                    >
                        Reset Default
                    </button>
                </div>

                {/* Search */}
                <div className="border-b border-white/10 px-5 py-2">
                    <input
                        type="text"
                        placeholder="Cari note (misal: C4, A#3...)"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded bg-white/5 px-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 outline-none ring-1 ring-white/10 focus:ring-amber-500/50"
                    />
                </div>

                {/* Note grid */}
                <div className="flex-1 overflow-y-auto px-5 py-3">
                    {/* Group by octave */}
                    {OCTAVES.map((oct) => {
                        const octNotes = filteredNotes.filter((n) => n.endsWith(String(oct)));
                        if (octNotes.length === 0) return null;
                        return (
                            <div key={oct} className="mb-4">
                                <p className="mb-2 text-xs font-semibold text-gray-500">Oktaf {oct}</p>
                                <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 md:grid-cols-12">
                                    {octNotes.map((note) => {
                                        const isBlack = note.includes('#');
                                        const mappedKey = reverseMap[note];
                                        const isListening = listeningFor === note;
                                        return (
                                            <div key={note} className="flex flex-col items-center gap-1">
                                                {/* Note button */}
                                                <button
                                                    onClick={() => setListeningFor(isListening ? null : note)}
                                                    className={[
                                                        'w-full rounded px-1 py-2 text-center text-[10px] font-medium transition',
                                                        isListening
                                                            ? 'animate-pulse bg-amber-500 text-black ring-2 ring-amber-300'
                                                            : isBlack
                                                                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                                                : 'bg-white/10 text-white hover:bg-white/20',
                                                    ].join(' ')}
                                                >
                                                    {note}
                                                </button>
                                                {/* Key badge */}
                                                <div className="flex h-5 items-center justify-center">
                                                    {mappedKey ? (
                                                        <span className="flex items-center gap-0.5">
                                                            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-300">
                                                                {mappedKey === ' ' ? 'SPC' : mappedKey.toUpperCase()}
                                                            </span>
                                                            <button
                                                                onClick={() => removeMapping(note)}
                                                                className="text-[9px] text-gray-600 transition hover:text-red-400"
                                                                title="Hapus mapping"
                                                            >
                                                                ✕
                                                            </button>
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] text-gray-700">—</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Listening indicator */}
                {listeningFor && (
                    <div className="border-t border-amber-500/30 bg-amber-500/10 px-5 py-2.5 text-center text-xs text-amber-300">
                        Tekan tombol keyboard untuk memetakan ke <strong>{listeningFor}</strong>
                        <span className="ml-2 text-gray-500">(Esc untuk batal)</span>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-white/10 px-5 py-3">
                    <p className="text-xs text-gray-500">
                        {Object.keys(editMap).length} tombol dipetakan
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="rounded border border-white/10 px-4 py-1.5 text-xs text-gray-400 transition hover:bg-white/5"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSave}
                            className="rounded bg-amber-500 px-4 py-1.5 text-xs font-semibold text-black transition hover:bg-amber-400"
                        >
                            Simpan Layout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
