import { useCallback, useState } from 'react';
import * as Tone from 'tone';
import type { useSynth } from './useSynth';

/**
 * Piano manual — pakai shared synthRef dari useSynth.
 */
export function usePiano(synthRef: ReturnType<typeof useSynth>['synthRef'], ensureReady: () => Promise<void>) {
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
        synthRef.current?.releaseAll();
        setActiveNotes(new Set());
    }, [synthRef]);

    return { playNote, stopNote, stopAllNotes, activeNotes };
}
