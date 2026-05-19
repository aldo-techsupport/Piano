import { useCallback, useEffect } from 'react';

interface PianoKeyboardProps {
    activeNotes: Set<string>;
    onNoteOn: (note: string) => void;
    onNoteOff: (note: string) => void;
    startOctave?: number;
    octaves?: number;
}

// Mapping keyboard keys ke note (mulai dari C4)
const KEYBOARD_MAP: Record<string, string> = {
    a: 'C4',
    w: 'C#4',
    s: 'D4',
    e: 'D#4',
    d: 'E4',
    f: 'F4',
    t: 'F#4',
    g: 'G4',
    y: 'G#4',
    h: 'A4',
    u: 'A#4',
    j: 'B4',
    k: 'C5',
    o: 'C#5',
    l: 'D5',
    p: 'D#5',
    ';': 'E5',
};

interface KeyDef {
    note: string;
    isBlack: boolean;
    keyboardKey?: string;
}

function buildKeys(startOctave: number, octaves: number): KeyDef[] {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const keys: KeyDef[] = [];

    const reverseMap: Record<string, string> = {};
    for (const [k, v] of Object.entries(KEYBOARD_MAP)) {
        reverseMap[v] = k;
    }

    for (let oct = startOctave; oct < startOctave + octaves; oct++) {
        for (const name of noteNames) {
            const note = `${name}${oct}`;
            keys.push({
                note,
                isBlack: name.includes('#'),
                keyboardKey: reverseMap[note],
            });
        }
    }

    return keys;
}

export default function PianoKeyboard({
    activeNotes,
    onNoteOn,
    onNoteOff,
    startOctave = 3,
    octaves = 3,
}: PianoKeyboardProps) {
    const keys = buildKeys(startOctave, octaves);

    // Keyboard event listeners
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.repeat) return;
            const note = KEYBOARD_MAP[e.key.toLowerCase()];
            if (note) onNoteOn(note);
        },
        [onNoteOn],
    );

    const handleKeyUp = useCallback(
        (e: KeyboardEvent) => {
            const note = KEYBOARD_MAP[e.key.toLowerCase()];
            if (note) onNoteOff(note);
        },
        [onNoteOff],
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleKeyDown, handleKeyUp]);

    // Render white keys as base, black keys overlaid
    const whiteKeys = keys.filter((k) => !k.isBlack);
    const blackKeys = keys.filter((k) => k.isBlack);

    // Calculate black key positions relative to white keys
    function getBlackKeyPosition(note: string): number {
        // Find the white key index before this black key
        const noteBase = note.replace('#', '').replace(/\d/, '');
        const octave = parseInt(note.replace(/\D/g, ''));
        const noteOrder = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        const blackToWhiteOffset: Record<string, number> = {
            'C#': 0,
            'D#': 1,
            'F#': 3,
            'G#': 4,
            'A#': 5,
        };

        const octaveOffset = (octave - startOctave) * 7;
        const offset = blackToWhiteOffset[noteBase + '#'] ?? 0;
        return octaveOffset + offset;
    }

    const whiteKeyWidth = 48; // px
    const blackKeyWidth = 30; // px

    return (
        <div className="relative select-none overflow-x-auto pb-4">
            <div
                className="relative mx-auto"
                style={{ width: whiteKeys.length * whiteKeyWidth, height: 180 }}
            >
                {/* White keys */}
                {whiteKeys.map((key, i) => {
                    const isActive = activeNotes.has(key.note);
                    return (
                        <button
                            key={key.note}
                            aria-label={`Piano key ${key.note}`}
                            onMouseDown={() => onNoteOn(key.note)}
                            onMouseUp={() => onNoteOff(key.note)}
                            onMouseLeave={() => onNoteOff(key.note)}
                            onTouchStart={(e) => {
                                e.preventDefault();
                                onNoteOn(key.note);
                            }}
                            onTouchEnd={(e) => {
                                e.preventDefault();
                                onNoteOff(key.note);
                            }}
                            className={[
                                'absolute top-0 rounded-b-md border border-gray-300 transition-colors duration-75',
                                isActive
                                    ? 'bg-amber-300 shadow-inner'
                                    : 'bg-white hover:bg-amber-50 active:bg-amber-200',
                            ].join(' ')}
                            style={{
                                left: i * whiteKeyWidth,
                                width: whiteKeyWidth - 2,
                                height: 180,
                                zIndex: 1,
                            }}
                        >
                            <span className="absolute bottom-2 left-0 right-0 text-center text-[9px] font-medium text-gray-400">
                                {key.keyboardKey ? (
                                    <span className="rounded bg-gray-100 px-1 py-0.5 text-gray-500">
                                        {key.keyboardKey.toUpperCase()}
                                    </span>
                                ) : (
                                    <span className="text-gray-300">{key.note}</span>
                                )}
                            </span>
                        </button>
                    );
                })}

                {/* Black keys */}
                {blackKeys.map((key) => {
                    const isActive = activeNotes.has(key.note);
                    const pos = getBlackKeyPosition(key.note);
                    return (
                        <button
                            key={key.note}
                            aria-label={`Piano key ${key.note}`}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                onNoteOn(key.note);
                            }}
                            onMouseUp={(e) => {
                                e.stopPropagation();
                                onNoteOff(key.note);
                            }}
                            onMouseLeave={() => onNoteOff(key.note)}
                            onTouchStart={(e) => {
                                e.preventDefault();
                                onNoteOn(key.note);
                            }}
                            onTouchEnd={(e) => {
                                e.preventDefault();
                                onNoteOff(key.note);
                            }}
                            className={[
                                'absolute top-0 rounded-b-md transition-colors duration-75',
                                isActive
                                    ? 'bg-amber-500 shadow-inner'
                                    : 'bg-gray-900 hover:bg-gray-700 active:bg-amber-700',
                            ].join(' ')}
                            style={{
                                left: pos * whiteKeyWidth + whiteKeyWidth - blackKeyWidth / 2,
                                width: blackKeyWidth,
                                height: 110,
                                zIndex: 2,
                            }}
                        >
                            {key.keyboardKey && (
                                <span className="absolute bottom-2 left-0 right-0 text-center text-[8px] font-medium text-gray-400">
                                    {key.keyboardKey.toUpperCase()}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
