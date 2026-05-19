import { useCallback, useEffect, useRef } from 'react';
import type { KeyboardMap } from './KeyboardLayoutEditor';
import { DEFAULT_KEYBOARD_MAP } from './KeyboardLayoutEditor';

interface SynthesiaPianoProps {
    activeNotes: Set<string>;
    onNoteOn: (note: string) => void;
    onNoteOff: (note: string) => void;
    keyboardMap?: KeyboardMap;
}

// MIDI note 21 = A0, 108 = C8 (full 88-key piano)
const PIANO_MIN = 21;
const PIANO_MAX = 108;

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function midiToName(midi: number): string {
    const octave = Math.floor(midi / 12) - 1;
    const name = NOTE_NAMES[midi % 12];
    return `${name}${octave}`;
}

function isBlackKey(midi: number): boolean {
    const mod = midi % 12;
    return [1, 3, 6, 8, 10].includes(mod);
}

interface KeyInfo {
    midi: number;
    name: string;
    isBlack: boolean;
    whiteIndex: number; // index among white keys only
}

function buildKeyInfos(): KeyInfo[] {
    const keys: KeyInfo[] = [];
    let whiteIndex = 0;
    for (let m = PIANO_MIN; m <= PIANO_MAX; m++) {
        const black = isBlackKey(m);
        keys.push({
            midi: m,
            name: midiToName(m),
            isBlack: black,
            whiteIndex: black ? whiteIndex - 1 : whiteIndex,
        });
        if (!black) whiteIndex++;
    }
    return keys;
}

const KEY_INFOS = buildKeyInfos();
const TOTAL_WHITE = KEY_INFOS.filter((k) => !k.isBlack).length;

export default function SynthesiaPiano({ activeNotes, onNoteOn, onNoteOff, keyboardMap = DEFAULT_KEYBOARD_MAP }: SynthesiaPianoProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.repeat) return;
            const note = keyboardMap[e.key.toLowerCase()];
            if (note) onNoteOn(note);
        },
        [onNoteOn, keyboardMap],
    );

    const handleKeyUp = useCallback(
        (e: KeyboardEvent) => {
            const note = keyboardMap[e.key.toLowerCase()];
            if (note) onNoteOff(note);
        },
        [onNoteOff, keyboardMap],
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleKeyDown, handleKeyUp]);

    // Reverse map: note name → keyboard key label
    const reverseKeyMap: Record<string, string> = {};
    for (const [k, v] of Object.entries(keyboardMap)) {
        reverseKeyMap[v] = k.toUpperCase();
    }

    const whiteKeys = KEY_INFOS.filter((k) => !k.isBlack);
    const blackKeys = KEY_INFOS.filter((k) => k.isBlack);

    // Use percentage widths so it fills the container
    const whiteWidthPct = 100 / TOTAL_WHITE;

    // Black key offset map within an octave (fraction of white key width from left edge of preceding white key)
    // C# is between C and D: offset = 0.6 of white key from C's left
    // D# between D and E: offset = 0.6 from D's left
    // F# between F and G: offset = 0.6 from F's left
    // G# between G and A: offset = 0.6 from G's left
    // A# between A and B: offset = 0.6 from A's left
    const BLACK_OFFSET_IN_OCTAVE: Record<number, number> = {
        1: 0.6,  // C#
        3: 0.6,  // D#
        6: 0.6,  // F#
        8: 0.6,  // G#
        10: 0.6, // A#
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full select-none overflow-hidden"
            style={{ height: 120 }}
        >
            {/* White keys */}
            {whiteKeys.map((key, i) => {
                const isActive = activeNotes.has(key.name);
                const label = reverseKeyMap[key.name];
                return (
                    <button
                        key={key.midi}
                        aria-label={`Piano key ${key.name}`}
                        onMouseDown={() => onNoteOn(key.name)}
                        onMouseUp={() => onNoteOff(key.name)}
                        onMouseLeave={() => onNoteOff(key.name)}
                        onTouchStart={(e) => { e.preventDefault(); onNoteOn(key.name); }}
                        onTouchEnd={(e) => { e.preventDefault(); onNoteOff(key.name); }}
                        style={{
                            position: 'absolute',
                            left: `${i * whiteWidthPct}%`,
                            width: `${whiteWidthPct}%`,
                            top: 0,
                            height: '100%',
                            zIndex: 1,
                        }}
                        className={[
                            'border-x border-b border-gray-400 rounded-b-sm transition-colors duration-75',
                            isActive
                                ? 'bg-[#f5e642]'
                                : 'bg-white hover:bg-yellow-50',
                        ].join(' ')}
                    >
                        {label && (
                            <span
                                className="absolute bottom-1 left-0 right-0 text-center text-[8px] font-bold text-gray-400 leading-none"
                                style={{ fontSize: 'clamp(6px, 0.6vw, 9px)' }}
                            >
                                {label}
                            </span>
                        )}
                    </button>
                );
            })}

            {/* Black keys */}
            {blackKeys.map((key) => {
                const isActive = activeNotes.has(key.name);
                const mod = key.midi % 12;
                const offset = BLACK_OFFSET_IN_OCTAVE[mod] ?? 0.6;
                // Position: left edge of the preceding white key + offset
                const leftPct = (key.whiteIndex + offset) * whiteWidthPct;
                const widthPct = whiteWidthPct * 0.65;

                return (
                    <button
                        key={key.midi}
                        aria-label={`Piano key ${key.name}`}
                        onMouseDown={(e) => { e.stopPropagation(); onNoteOn(key.name); }}
                        onMouseUp={(e) => { e.stopPropagation(); onNoteOff(key.name); }}
                        onMouseLeave={() => onNoteOff(key.name)}
                        onTouchStart={(e) => { e.preventDefault(); onNoteOn(key.name); }}
                        onTouchEnd={(e) => { e.preventDefault(); onNoteOff(key.name); }}
                        style={{
                            position: 'absolute',
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                            top: 0,
                            height: '62%',
                            zIndex: 2,
                        }}
                        className={[
                            'rounded-b-sm transition-colors duration-75',
                            isActive
                                ? 'bg-[#c8a800]'
                                : 'bg-gray-900 hover:bg-gray-700',
                        ].join(' ')}
                    />
                );
            })}

            {/* Red line at top (matches piano roll playhead) */}
            <div
                className="pointer-events-none absolute top-0 left-0 right-0 z-10"
                style={{ height: 3, background: '#cc0000' }}
            />
        </div>
    );
}
