import * as Tone from 'tone';

export interface InstrumentDef {
    id: string;
    label: string;
    emoji: string;
    category: 'keyboard' | 'strings' | 'wind' | 'synth' | 'percussion';
    /**
     * Returns a Tone.PolySynth OR Tone.Sampler.
     * Both support triggerAttack, triggerRelease, triggerAttackRelease, dispose, connect.
     * We use `any` here because Sampler and PolySynth share the needed interface
     * but TypeScript doesn't have a common type for them.
     */
    createSynth: () => Tone.PolySynth | Tone.Sampler;
}

// ─── Salamander Grand Piano Samples (hosted on GitHub/CDN) ────────────────────
// Using nbrosowsky's tonejs-instruments samples (CC-by 3.0)
const SAMPLE_BASE = 'https://nbrosowsky.github.io/tonejs-instruments/samples';

/**
 * Create a PolySynth with high voice count (128) so dense MIDI files
 * like Rush E don't silently drop notes.
 */
function poly(
    SynthClass: typeof Tone.Synth | typeof Tone.FMSynth | typeof Tone.AMSynth,
    options: Record<string, unknown>,
): Tone.PolySynth {
    const synth = new Tone.PolySynth(SynthClass as typeof Tone.Synth, options as ConstructorParameters<typeof Tone.Synth>[0]);
    synth.maxPolyphony = 128;
    return synth;
}

/**
 * Create a Sampler-based instrument from a sample map.
 * Samplers naturally handle polyphony and sound much more realistic.
 */
function sampler(
    urls: Record<string, string>,
    baseUrl: string,
    options?: Partial<Tone.SamplerOptions>,
): Tone.Sampler {
    return new Tone.Sampler({
        urls,
        baseUrl,
        release: options?.release ?? 1.2,
        ...options,
    });
}

// ─── Piano sample URLs (Salamander Grand Piano) ───────────────────────────────
// We provide enough samples across the range for Tone.js to interpolate the rest
const PIANO_SAMPLES: Record<string, string> = {
    A0: 'A0.mp3',
    C1: 'C1.mp3',
    'D#1': 'Ds1.mp3',
    'F#1': 'Fs1.mp3',
    A1: 'A1.mp3',
    C2: 'C2.mp3',
    'D#2': 'Ds2.mp3',
    'F#2': 'Fs2.mp3',
    A2: 'A2.mp3',
    C3: 'C3.mp3',
    'D#3': 'Ds3.mp3',
    'F#3': 'Fs3.mp3',
    A3: 'A3.mp3',
    C4: 'C4.mp3',
    'D#4': 'Ds4.mp3',
    'F#4': 'Fs4.mp3',
    A4: 'A4.mp3',
    C5: 'C5.mp3',
    'D#5': 'Ds5.mp3',
    'F#5': 'Fs5.mp3',
    A5: 'A5.mp3',
    C6: 'C6.mp3',
    'D#6': 'Ds6.mp3',
    'F#6': 'Fs6.mp3',
    A6: 'A6.mp3',
    C7: 'C7.mp3',
    'D#7': 'Ds7.mp3',
    'F#7': 'Fs7.mp3',
    A7: 'A7.mp3',
    C8: 'C8.mp3',
};

const PIANO_BASE_URL = `${SAMPLE_BASE}/piano/`;

// ─── Other instrument sample maps ────────────────────────────────────────────

const GUITAR_ACOUSTIC_SAMPLES: Record<string, string> = {
    E2: 'E2.mp3',
    A2: 'A2.mp3',
    D3: 'D3.mp3',
    G3: 'G3.mp3',
    B3: 'B3.mp3',
    E4: 'E4.mp3',
    A4: 'A4.mp3',
    D5: 'D5.mp3',
};

const GUITAR_ELECTRIC_SAMPLES: Record<string, string> = {
    E2: 'E2.mp3',
    A2: 'A2.mp3',
    D3: 'D3.mp3',
    G3: 'G3.mp3',
    B3: 'B3.mp3',
    E4: 'E4.mp3',
    A4: 'A4.mp3',
};

const VIOLIN_SAMPLES: Record<string, string> = {
    G3: 'G3.mp3',
    A3: 'A3.mp3',
    C4: 'C4.mp3',
    E4: 'E4.mp3',
    G4: 'G4.mp3',
    A4: 'A4.mp3',
    C5: 'C5.mp3',
    E5: 'E5.mp3',
    G5: 'G5.mp3',
    A5: 'A5.mp3',
};

const CELLO_SAMPLES: Record<string, string> = {
    C2: 'C2.mp3',
    E2: 'E2.mp3',
    G2: 'G2.mp3',
    C3: 'C3.mp3',
    E3: 'E3.mp3',
    G3: 'G3.mp3',
    C4: 'C4.mp3',
    E4: 'E4.mp3',
};

const HARP_SAMPLES: Record<string, string> = {
    C3: 'C3.mp3',
    D3: 'D3.mp3',
    E3: 'E3.mp3',
    F3: 'F3.mp3',
    G3: 'G3.mp3',
    A3: 'A3.mp3',
    B3: 'B3.mp3',
    C4: 'C4.mp3',
    D4: 'D4.mp3',
    E4: 'E4.mp3',
    F4: 'F4.mp3',
    G4: 'G4.mp3',
    A4: 'A4.mp3',
    B4: 'B4.mp3',
    C5: 'C5.mp3',
};

const TRUMPET_SAMPLES: Record<string, string> = {
    C4: 'C4.mp3',
    D4: 'D4.mp3',
    'D#4': 'Ds4.mp3',
    F4: 'F4.mp3',
    G4: 'G4.mp3',
    A4: 'A4.mp3',
    'A#4': 'As4.mp3',
    C5: 'C5.mp3',
    D5: 'D5.mp3',
    E5: 'E5.mp3',
};

const FLUTE_SAMPLES: Record<string, string> = {
    C4: 'C4.mp3',
    D4: 'D4.mp3',
    E4: 'E4.mp3',
    F4: 'F4.mp3',
    G4: 'G4.mp3',
    A4: 'A4.mp3',
    B4: 'B4.mp3',
    C5: 'C5.mp3',
    D5: 'D5.mp3',
    E5: 'E5.mp3',
    F5: 'F5.mp3',
    G5: 'G5.mp3',
};

const CLARINET_SAMPLES: Record<string, string> = {
    D3: 'D3.mp3',
    F3: 'F3.mp3',
    A3: 'A3.mp3',
    C4: 'C4.mp3',
    E4: 'E4.mp3',
    G4: 'G4.mp3',
    'A#4': 'As4.mp3',
    D5: 'D5.mp3',
    F5: 'F5.mp3',
};

const SAXOPHONE_SAMPLES: Record<string, string> = {
    'D#3': 'Ds3.mp3',
    E3: 'E3.mp3',
    'F#3': 'Fs3.mp3',
    A3: 'A3.mp3',
    C4: 'C4.mp3',
    'D#4': 'Ds4.mp3',
    'F#4': 'Fs4.mp3',
    A4: 'A4.mp3',
    C5: 'C5.mp3',
};

const ORGAN_SAMPLES: Record<string, string> = {
    C2: 'C2.mp3',
    C3: 'C3.mp3',
    C4: 'C4.mp3',
    C5: 'C5.mp3',
    'D#2': 'Ds2.mp3',
    'D#3': 'Ds3.mp3',
    'D#4': 'Ds4.mp3',
    'F#2': 'Fs2.mp3',
    'F#3': 'Fs3.mp3',
    'F#4': 'Fs4.mp3',
    A2: 'A2.mp3',
    A3: 'A3.mp3',
    A4: 'A4.mp3',
};

const XYLOPHONE_SAMPLES: Record<string, string> = {
    C4: 'C4.mp3',
    D4: 'D4.mp3',
    E4: 'E4.mp3',
    F4: 'F4.mp3',
    G4: 'G4.mp3',
    A4: 'A4.mp3',
    B4: 'B4.mp3',
    C5: 'C5.mp3',
    D5: 'D5.mp3',
    E5: 'E5.mp3',
    F5: 'F5.mp3',
    G5: 'G5.mp3',
};

export const INSTRUMENTS: InstrumentDef[] = [
    // ── Keyboard ──────────────────────────────────────────────────────────
    {
        id: 'piano',
        label: 'Piano',
        emoji: '🎹',
        category: 'keyboard',
        createSynth: () => sampler(PIANO_SAMPLES, PIANO_BASE_URL, { release: 1.5 }),
    },
    {
        id: 'electric-piano',
        label: 'Electric Piano',
        emoji: '🎛️',
        category: 'keyboard',
        createSynth: () =>
            // FM synthesis mimics Rhodes/Wurlitzer electric piano well
            poly(Tone.FMSynth as unknown as typeof Tone.Synth, {
                harmonicity: 3.01,
                modulationIndex: 14,
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.001, decay: 0.8, sustain: 0.2, release: 1.2 },
                modulation: { type: 'square' },
                modulationEnvelope: { attack: 0.002, decay: 0.2, sustain: 0, release: 0.2 },
            }),
    },
    {
        id: 'organ',
        label: 'Organ',
        emoji: '⛪',
        category: 'keyboard',
        createSynth: () => sampler(ORGAN_SAMPLES, `${SAMPLE_BASE}/organ/`, { release: 0.3 }),
    },
    {
        id: 'harpsichord',
        label: 'Harpsichord',
        emoji: '🎼',
        category: 'keyboard',
        createSynth: () =>
            // Harpsichord: bright pluck with fast decay, no sustain
            poly(Tone.FMSynth as unknown as typeof Tone.Synth, {
                harmonicity: 2,
                modulationIndex: 15,
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.001, decay: 0.4, sustain: 0.0, release: 0.1 },
                modulation: { type: 'square' },
                modulationEnvelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 },
            }),
    },

    // ── Strings ───────────────────────────────────────────────────────────
    {
        id: 'guitar',
        label: 'Guitar',
        emoji: '🎸',
        category: 'strings',
        createSynth: () => sampler(GUITAR_ELECTRIC_SAMPLES, `${SAMPLE_BASE}/guitar-electric/`, { release: 0.8 }),
    },
    {
        id: 'acoustic-guitar',
        label: 'Acoustic Guitar',
        emoji: '🪕',
        category: 'strings',
        createSynth: () => sampler(GUITAR_ACOUSTIC_SAMPLES, `${SAMPLE_BASE}/guitar-acoustic/`, { release: 1.0 }),
    },
    {
        id: 'bass-guitar',
        label: 'Bass Guitar',
        emoji: '🎵',
        category: 'strings',
        createSynth: () =>
            // Bass: deep FM with sub-bass character
            poly(Tone.FMSynth as unknown as typeof Tone.Synth, {
                harmonicity: 1,
                modulationIndex: 3.5,
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.01, decay: 0.4, sustain: 0.4, release: 0.4 },
                modulation: { type: 'sine' },
                modulationEnvelope: { attack: 0.01, decay: 0.5, sustain: 0.3, release: 0.3 },
            }),
    },
    {
        id: 'violin',
        label: 'Violin',
        emoji: '🎻',
        category: 'strings',
        createSynth: () => sampler(VIOLIN_SAMPLES, `${SAMPLE_BASE}/violin/`, { release: 0.5 }),
    },
    {
        id: 'cello',
        label: 'Cello',
        emoji: '🎻',
        category: 'strings',
        createSynth: () => sampler(CELLO_SAMPLES, `${SAMPLE_BASE}/cello/`, { release: 0.6 }),
    },
    {
        id: 'harp',
        label: 'Harp',
        emoji: '🪗',
        category: 'strings',
        createSynth: () => sampler(HARP_SAMPLES, `${SAMPLE_BASE}/harp/`, { release: 1.5 }),
    },

    // ── Wind ──────────────────────────────────────────────────────────────
    {
        id: 'flute',
        label: 'Flute',
        emoji: '🪈',
        category: 'wind',
        createSynth: () => sampler(FLUTE_SAMPLES, `${SAMPLE_BASE}/flute/`, { release: 0.3 }),
    },
    {
        id: 'clarinet',
        label: 'Clarinet',
        emoji: '🎷',
        category: 'wind',
        createSynth: () => sampler(CLARINET_SAMPLES, `${SAMPLE_BASE}/clarinet/`, { release: 0.3 }),
    },
    {
        id: 'saxophone',
        label: 'Saxophone',
        emoji: '🎷',
        category: 'wind',
        createSynth: () => sampler(SAXOPHONE_SAMPLES, `${SAMPLE_BASE}/saxophone/`, { release: 0.4 }),
    },
    {
        id: 'trumpet',
        label: 'Trumpet',
        emoji: '🎺',
        category: 'wind',
        createSynth: () => sampler(TRUMPET_SAMPLES, `${SAMPLE_BASE}/trumpet/`, { release: 0.3 }),
    },
    {
        id: 'trombone',
        label: 'Trombone',
        emoji: '🎺',
        category: 'wind',
        createSynth: () =>
            // Trombone: brass-like FM with slow attack
            poly(Tone.FMSynth as unknown as typeof Tone.Synth, {
                harmonicity: 1.5,
                modulationIndex: 8,
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.05, decay: 0.1, sustain: 0.85, release: 0.15 },
                modulation: { type: 'sine' },
                modulationEnvelope: { attack: 0.06, decay: 0.2, sustain: 0.5, release: 0.1 },
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
                oscillator: { type: 'fatsawtooth', count: 3, spread: 30 },
                envelope: { attack: 0.01, decay: 0.15, sustain: 0.6, release: 0.3 },
            }),
    },
    {
        id: 'synth-pad',
        label: 'Synth Pad',
        emoji: '🌊',
        category: 'synth',
        createSynth: () =>
            poly(Tone.FMSynth as unknown as typeof Tone.Synth, {
                harmonicity: 2,
                modulationIndex: 5,
                oscillator: { type: 'sine' },
                envelope: { attack: 0.5, decay: 0.3, sustain: 0.8, release: 1.5 },
                modulation: { type: 'triangle' },
                modulationEnvelope: { attack: 0.5, decay: 0.5, sustain: 0.7, release: 1.0 },
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
                oscillator: { type: 'sine' },
                envelope: { attack: 0.01, decay: 0.15, sustain: 0.5, release: 0.3 },
                modulation: { type: 'square' },
                modulationEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.3 },
            }),
    },
    {
        id: 'am-synth',
        label: 'AM Synth',
        emoji: '📻',
        category: 'synth',
        createSynth: () =>
            poly(Tone.AMSynth as unknown as typeof Tone.Synth, {
                harmonicity: 2,
                oscillator: { type: 'sine' },
                envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.3 },
                modulation: { type: 'square' },
                modulationEnvelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.3 },
            }),
    },
    {
        id: 'rock',
        label: 'Rock',
        emoji: '🤘',
        category: 'synth',
        createSynth: () =>
            poly(Tone.Synth, {
                oscillator: { type: 'fatsawtooth', count: 5, spread: 40 },
                envelope: { attack: 0.005, decay: 0.08, sustain: 0.8, release: 0.15 },
            }),
    },
    {
        id: 'bass-synth',
        label: 'Bass Synth',
        emoji: '🔉',
        category: 'synth',
        createSynth: () =>
            poly(Tone.FMSynth as unknown as typeof Tone.Synth, {
                harmonicity: 0.5,
                modulationIndex: 5,
                oscillator: { type: 'square' },
                envelope: { attack: 0.01, decay: 0.3, sustain: 0.6, release: 0.2 },
                modulation: { type: 'sine' },
                modulationEnvelope: { attack: 0.01, decay: 0.4, sustain: 0.4, release: 0.2 },
            }),
    },

    // ── Percussion ────────────────────────────────────────────────────────
    {
        id: 'marimba',
        label: 'Marimba',
        emoji: '🥁',
        category: 'percussion',
        createSynth: () =>
            // Marimba: sine with quick decay + slight FM for the "woody" attack
            poly(Tone.FMSynth as unknown as typeof Tone.Synth, {
                harmonicity: 4,
                modulationIndex: 2,
                oscillator: { type: 'sine' },
                envelope: { attack: 0.001, decay: 0.6, sustain: 0.0, release: 0.3 },
                modulation: { type: 'sine' },
                modulationEnvelope: { attack: 0.001, decay: 0.01, sustain: 0, release: 0.01 },
            }),
    },
    {
        id: 'xylophone',
        label: 'Xylophone',
        emoji: '🎵',
        category: 'percussion',
        createSynth: () => sampler(XYLOPHONE_SAMPLES, `${SAMPLE_BASE}/xylophone/`, { release: 0.3 }),
    },
    {
        id: 'vibraphone',
        label: 'Vibraphone',
        emoji: '✨',
        category: 'percussion',
        createSynth: () =>
            // Vibraphone: FM with slow tremolo-like modulation
            poly(Tone.FMSynth as unknown as typeof Tone.Synth, {
                harmonicity: 4.01,
                modulationIndex: 1.5,
                oscillator: { type: 'sine' },
                envelope: { attack: 0.005, decay: 1.5, sustain: 0.1, release: 1.0 },
                modulation: { type: 'sine' },
                modulationEnvelope: { attack: 0.01, decay: 0.5, sustain: 0.3, release: 0.5 },
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
                oscillator: { type: 'sine' },
                envelope: { attack: 0.001, decay: 2.0, sustain: 0.0, release: 0.8 },
                modulation: { type: 'sine' },
                modulationEnvelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.3 },
            }),
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
