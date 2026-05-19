import { useCallback, useState } from 'react';
import * as Tone from 'tone';
import type { SynthInstance } from './useSynth';
import { releaseAllNotes } from './useSynth';

/**
 * Piano manual — pakai shared synthRef dari useSynth.
 */
export function usePiano(
    synthRef: React.MutableRefObject<SynthInstance | null>,
    ensureReady: () => Promise<void>,
) {
    const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());

    const playNote = useCallback(
        async (note: string, velocity = 0.7) => {
            await ensureReady();
            synthRef.current?.triggerAttack(note, Tone.now(), velocity);
            setActiveNotes((prev) => new Set(prev).add(note));
        },
        [ensureReady, synthRef],
    );

    const stopNote = useCallback(
        (note: string) => {
            synthRef.current?.triggerRelease(note, Tone.now());
            setActiveNotes((prev) => {
                const next = new Set(prev);
                next.delete(note);
                return next;
            });
        },
        [synthRef],
    );

    const stopAllNotes = useCallback(() => {
        releaseAllNotes(synthRef.current);
        setActiveNotes(new Set());
    }, [synthRef]);

    return { playNote, stopNote, stopAllNotes, activeNotes };
}
