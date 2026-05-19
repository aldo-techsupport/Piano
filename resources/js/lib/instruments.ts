import * as Tone from 'tone';

export interface InstrumentDef {
    id: string;
    label: string;
    emoji: string;
    category: 'keyboard' | 'strings' | 'wind' | 'synth' | 'percussion';
    createSynth: () => Tone.PolySynth;
}

/**
 * Create a PolySynth with high voice count (128) so dense MIDI files
 * like Rush E don't silently drop notes.
 */
function poly(
    SynthClass: typeof Tone.Synth | typeof Tone.FMSynth | typeof Tone.AMSynth,
    options: ConstructorParameters<typeof Tone.Synth>[0],
): Tone.PolySynth {
    const synth = new Tone.PolySynth(SynthClass as typeof Tone.Synth, options);
    synth.maxPolyphony = 128;
    return synth;
}

export const INSTRUMENTS: InstrumentDef[] = [
    // ── Keyboard ──────────────────────────────────────────────────────────
    {
        id: 'piano',
        label: 'Piano',
        emoji: '🎹',
        category: 'keyboard',
        createSynth: () =>
            poly(Tone.Synth, {
                oscillator: { type: 'triangle' },
                // Shorter release so voices free up faster for dense passages
                envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.8 },
            }),
    },
    {
        id: 'electric-piano',
        label: 'Electric Piano',
        emoji: '🎛️',
        category: 'keyboard',
        createSynth: () =>
            poly(Tone.Synth, {
                oscillator: { type: 'sine' },
                envelope: { attack: 0.01, decay: 0.4, sustain: 0.3, release: 0.5 },
            }),
    },
    {
        id: 'organ',
        label: 'Organ',
        emoji: '⛪',
        category: 'keyboard',
        createSynth: () =>
            poly(Tone.Synth, {
                oscillator: { type: 'square' },
                envelope: { attack: 0.01, decay: 0.01, sustain: 1.0, release: 0.05 },
            }),
    },
    {
        id: 'harpsichord',
        label: 'Harpsichord',
        emoji: '🎼',
        category: 'keyboard',
        createSynth: () =>
            poly(Tone.Synth, {
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.001, decay: 0.15, sustain: 0.0, release: 0.05 },
            }),
    },

    // ── Strings ───────────────────────────────────────────────────────────
    {
        id: 'guitar',
        label: 'Guitar',
        emoji: '🎸',
        category: 'strings',
        createSynth: () =>
            poly(Tone.Synth, {
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.001, decay: 0.3, sustain: 0.1, release: 0.3 },
            }),
    },
    {
        id: 'acoustic-guitar',
        label: 'Acoustic Guitar',
        emoji: '🪕',
        category: 'strings',
        createSynth: () =>
            poly(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.001, decay: 0.4, sustain: 0.05, release: 0.4 },
            }),
    },
    {
        id: 'bass-guitar',
        label: 'Bass Guitar',
        emoji: '🎵',
        category: 'strings',
        createSynth: () =>
            poly(Tone.Synth, {
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.02, decay: 0.3, sustain: 0.5, release: 0.3 },
            }),
    },
    {
        id: 'violin',
        label: 'Violin',
        emoji: '🎻',
        category: 'strings',
        createSynth: () =>
            poly(Tone.Synth, {
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.1, decay: 0.1, sustain: 0.9, release: 0.2 },
            }),
    },
    {
        id: 'cello',
        label: 'Cello',
        emoji: '🎻',
        category: 'strings',
        createSynth: () =>
            poly(Tone.Synth, {
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.15, decay: 0.1, sustain: 0.85, release: 0.3 },
            }),
    },
    {
        id: 'harp',
        label: 'Harp',
        emoji: '🪗',
        category: 'strings',
        createSynth: () =>
            poly(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.001, decay: 0.8, sustain: 0.0, release: 0.3 },
            }),
    },

    // ── Wind ──────────────────────────────────────────────────────────────
    {
        id: 'flute',
        label: 'Flute',
        emoji: '🪈',
        category: 'wind',
        createSynth: () =>
            poly(Tone.Synth, {
                oscillator: { type: 'sine' },
                envelope: { attack: 0.08, decay: 0.1, sustain: 0.8, release: 0.15 },
            }),
    },
    {
        id: 'clarinet',
        label: 'Clarinet',
        emoji: '🎷',
        category: 'wind',
        createSynth: () =>
            poly(Tone.Synth, {
                oscillator: { type: 'square' },
                envelope: { attack: 0.04, decay: 0.1, sustain: 0.7, release: 0.1 },
            }),
    },
    {
        id: 'saxophone',
        label: 'Saxophone',
        emoji: '🎷',
        category: 'wind',
        createSynth: () =>
            poly(Tone.Synth, {
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.04, decay: 0.1, sustain: 0.8, release: 0.15 },
            }),
    },
    {
        id: 'trumpet',
        label: 'Trumpet',
        emoji: '🎺',
        category: 'wind',
        createSynth: () =>
            poly(Tone.Synth, {
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.02, decay: 0.05, sustain: 0.9, release: 0.05 },
            }),
    },
    {
        id: 'trombone',
        label: 'Trombone',
        emoji: '🎺',
        category: 'wind',
        createSynth: () =>
            poly(Tone.Synth, {
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.06, decay: 0.05, sustain: 0.85, release: 0.1 },
            }),
    },

    // ── Synth ─────────────────────────────────────────────────────────────
    {
        id: 'synth-lead',
        label: 'Synth Lead',
        emoji: '🔊',
        category: 'synth',
        createSynth: () =>
            poly(Tone.Synth, {
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.01, decay: 0.15, sustain: 0.6, release: 0.3 },
            }),
    },
    {
        id: 'synth-pad',
        label: 'Synth Pad',
        emoji: '🌊',
        category: 'synth',
        createSynth: () =>
            poly(Tone.Synth, {
                oscillator: { type: 'sine' },
                envelope: { attack: 0.3, decay: 0.2, sustain: 0.8, release: 0.5 },
            }),
    },
    {
        id: 'fm-synth',
        label: 'FM Synth',
        emoji: '📡',
        category: 'synth',
        createSynth: () =>
            poly(Tone.FMSynth as unknown as typeof Tone.Synth, {
                harmonicity: 3,
                modulationIndex: 10,
                envelope: { attack: 0.01, decay: 0.15, sustain: 0.5, release: 0.3 },
            } as ConstructorParameters<typeof Tone.Synth>[0]),
    },
    {
        id: 'am-synth',
        label: 'AM Synth',
        emoji: '📻',
        category: 'synth',
        createSynth: () =>
            poly(Tone.AMSynth as unknown as typeof Tone.Synth, {
                harmonicity: 2,
                envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.3 },
            } as ConstructorParameters<typeof Tone.Synth>[0]),
    },
    {
        id: 'rock',
        label: 'Rock',
        emoji: '🤘',
        category: 'synth',
        createSynth: () =>
            poly(Tone.Synth, {
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.005, decay: 0.08, sustain: 0.8, release: 0.15 },
            }),
    },
    {
        id: 'bass-synth',
        label: 'Bass Synth',
        emoji: '🔉',
        category: 'synth',
        createSynth: () =>
            poly(Tone.Synth, {
                oscillator: { type: 'square' },
                envelope: { attack: 0.01, decay: 0.3, sustain: 0.6, release: 0.2 },
            }),
    },

    // ── Percussion ────────────────────────────────────────────────────────
    {
        id: 'marimba',
        label: 'Marimba',
        emoji: '🥁',
        category: 'percussion',
        createSynth: () =>
            poly(Tone.Synth, {
                oscillator: { type: 'sine' },
                envelope: { attack: 0.001, decay: 0.3, sustain: 0.0, release: 0.1 },
            }),
    },
    {
        id: 'xylophone',
        label: 'Xylophone',
        emoji: '🎵',
        category: 'percussion',
        createSynth: () =>
            poly(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.001, decay: 0.2, sustain: 0.0, release: 0.08 },
            }),
    },
    {
        id: 'vibraphone',
        label: 'Vibraphone',
        emoji: '✨',
        category: 'percussion',
        createSynth: () =>
            poly(Tone.Synth, {
                oscillator: { type: 'sine' },
                envelope: { attack: 0.005, decay: 0.6, sustain: 0.1, release: 0.4 },
            }),
    },
    {
        id: 'bells',
        label: 'Bells',
        emoji: '🔔',
        category: 'percussion',
        createSynth: () =>
            poly(Tone.FMSynth as unknown as typeof Tone.Synth, {
                harmonicity: 5.1,
                modulationIndex: 32,
                envelope: { attack: 0.001, decay: 1.0, sustain: 0.0, release: 0.3 },
            } as ConstructorParameters<typeof Tone.Synth>[0]),
    },
];

export const INSTRUMENT_MAP = Object.fromEntries(INSTRUMENTS.map((i) => [i.id, i]));

export const CATEGORIES: { id: InstrumentDef['category']; label: string; emoji: string }[] = [
    { id: 'keyboard', label: 'Keyboard', emoji: '🎹' },
    { id: 'strings', label: 'Strings', emoji: '🎸' },
    { id: 'wind', label: 'Wind', emoji: '🎺' },
    { id: 'synth', label: 'Synth', emoji: '🔊' },
    { id: 'percussion', label: 'Percussion', emoji: '🥁' },
];
