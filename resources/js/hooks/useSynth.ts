/**
 * Shared synth instance — satu synth dipakai oleh piano manual DAN MIDI playback.
 * Ganti instrumen langsung swap synth tanpa perlu restart playback.
 *
 * Mendukung Tone.PolySynth DAN Tone.Sampler (untuk instrumen sample-based).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { INSTRUMENT_MAP, INSTRUMENTS } from '../lib/instruments';

/**
 * Union type for our synth instances.
 * Both PolySynth and Sampler share: triggerAttack, triggerRelease, triggerAttackRelease, dispose, connect
 */
export type SynthInstance = Tone.PolySynth | Tone.Sampler;

// Compressor + limiter chain — shared, tidak di-dispose saat ganti instrumen
let masterCompressor: Tone.Compressor | null = null;
let masterLimiter: Tone.Limiter | null = null;

function getMasterChain(): { compressor: Tone.Compressor; limiter: Tone.Limiter } {
    if (!masterCompressor || !masterLimiter) {
        masterCompressor = new Tone.Compressor({
            threshold: -18,
            ratio: 6,
            attack: 0.003,
            release: 0.1,
            knee: 6,
        });
        masterLimiter = new Tone.Limiter(-3);
        masterCompressor.connect(masterLimiter);
        masterLimiter.toDestination();
    }
    return { compressor: masterCompressor, limiter: masterLimiter };
}

/**
 * Release all notes on a synth instance (works for both PolySynth and Sampler).
 */
export function releaseAllNotes(synth: SynthInstance | null): void {
    if (!synth) return;
    if (synth instanceof Tone.PolySynth) {
        synth.releaseAll();
    } else if (synth instanceof Tone.Sampler) {
        synth.releaseAll();
    }
}

export function useSynth() {
    const synthRef = useRef<SynthInstance | null>(null);
    const [instrumentId, setInstrumentIdState] = useState('piano');
    // Expose ref so useMidi can always read the latest synth
    const instrumentIdRef = useRef('piano');

    const buildSynth = useCallback((id: string): SynthInstance => {
        // Release all notes on old synth before disposing
        releaseAllNotes(synthRef.current);
        synthRef.current?.dispose();

        const def = INSTRUMENT_MAP[id] ?? INSTRUMENTS[0];
        const synth = def.createSynth();

        // Set high voice count for PolySynth so dense MIDI doesn't drop notes
        if (synth instanceof Tone.PolySynth) {
            synth.maxPolyphony = 128;
        }

        // Route through compressor → limiter → destination
        const { compressor } = getMasterChain();
        synth.connect(compressor);

        synthRef.current = synth;
        return synth;
    }, []);

    const setInstrument = useCallback(
        async (id: string) => {
            await Tone.start();
            instrumentIdRef.current = id;
            setInstrumentIdState(id);
            buildSynth(id);
        },
        [buildSynth],
    );

    const ensureReady = useCallback(async () => {
        await Tone.start();
        if (!synthRef.current) buildSynth(instrumentIdRef.current);
    }, [buildSynth]);

    useEffect(() => {
        return () => {
            synthRef.current?.dispose();
        };
    }, []);

    return { synthRef, instrumentId, instrumentIdRef, setInstrument, ensureReady, buildSynth };
}
