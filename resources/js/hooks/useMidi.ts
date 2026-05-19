import { Midi } from '@tonejs/midi';
import { useCallback, useRef, useState } from 'react';
import * as Tone from 'tone';
import type { SynthInstance } from './useSynth';
import { releaseAllNotes } from './useSynth';

export type MidiStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'stopped';

export interface MidiNote {
    name: string;
    midi: number;
    /** Waktu dalam detik pada speed 1× (dari file MIDI asli) */
    time: number;
    /** Durasi dalam detik pada speed 1× */
    duration: number;
    velocity: number;
}

export interface MidiData {
    notes: MidiNote[];
    duration: number;
}

/**
 * MIDI playback menggunakan Tone.js.
 *
 * Pendekatan scheduling:
 * - note.time dari @tonejs/midi adalah detik absolut (sudah di-resolve dari ticks+tempo).
 * - Tone.Transport.schedule(cb, time) menerima detik jika kita pakai format "Xs" atau Tone.Time.
 * - Speed control: kita simpan speedRef (multiplier), lalu saat schedule kita pakai
 *   note.time / speed sebagai waktu Transport (detik), dan note.duration / speed sebagai durasi.
 * - Progress yang dikirim ke PianoRoll selalu dalam "detik asli" (note.time space),
 *   yaitu Transport.seconds * speed.
 */
export function useMidi(
    synthRef: React.MutableRefObject<SynthInstance | null>,
    ensureReady: () => Promise<void>,
    onNoteOn?: (note: string) => void,
    onNoteOff?: (note: string) => void,
) {
    const [status, setStatus] = useState<MidiStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [midiData, setMidiData] = useState<MidiData | null>(null);

    // Speed multiplier: 1.0 = normal, 2.0 = 2× lebih cepat
    const speedRef = useRef(1.0);
    const [speed, setSpeedState] = useState(1.0);

    // BPM asli dari file MIDI (informasi saja, untuk display)
    const originalBpmRef = useRef(120);
    const [bpm, setBpmState] = useState(120);

    const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const parsedMidiRef = useRef<Midi | null>(null);
    const totalDurationRef = useRef(0);

    const clearProgress = useCallback(() => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
    }, []);

    const startProgressInterval = useCallback((totalDur: number) => {
        clearProgress();
        progressIntervalRef.current = setInterval(() => {
            // Transport.seconds berjalan dalam "scaled time" (dibagi speed).
            // Kalikan kembali dengan speed untuk mendapat posisi di "note.time space".
            const rawProgress = Tone.Transport.seconds * speedRef.current;
            setProgress(Math.min(rawProgress, totalDur));
        }, 16);
    }, [clearProgress]);

    const stop = useCallback(() => {
        Tone.Transport.stop();
        Tone.Transport.cancel();
        releaseAllNotes(synthRef.current);
        clearProgress();
        setStatus('stopped');
        setProgress(0);
    }, [clearProgress, synthRef]);

    const pause = useCallback(() => {
        Tone.Transport.pause();
        releaseAllNotes(synthRef.current);
        clearProgress();
        setStatus('paused');
    }, [clearProgress, synthRef]);

    const resume = useCallback(() => {
        Tone.Transport.start();
        setStatus('playing');
        startProgressInterval(totalDurationRef.current);
    }, [startProgressInterval]);

    /**
     * Schedule semua note dan mulai playback.
     *
     * Kunci: semua waktu di-schedule dalam detik Transport (note.time / speed),
     * sehingga ketika speed berubah dan kita re-schedule, semua note otomatis
     * berada di posisi yang benar.
     */
    const scheduleAndPlay = useCallback(
        (midi: Midi, totalDuration: number, currentSpeed: number, startFromOriginal = 0) => {
            Tone.Transport.cancel();
            Tone.Transport.stop();

            // Reset Transport ke waktu awal (dalam detik Transport = detik asli / speed)
            Tone.Transport.seconds = startFromOriginal / currentSpeed;

            // Hitung max polyphony untuk scaling volume
            let maxSimultaneous = 1;
            const allNotes: Array<{ time: number; end: number }> = [];
            midi.tracks.forEach((track) => {
                track.notes.forEach((note) => {
                    allNotes.push({ time: note.time, end: note.time + note.duration });
                });
            });
            if (allNotes.length > 0) {
                const sampleTimes = allNotes.slice(0, 200).map((n) => n.time);
                for (const t of sampleTimes) {
                    const count = allNotes.filter((n) => n.time <= t && n.end > t).length;
                    if (count > maxSimultaneous) maxSimultaneous = count;
                }
            }
            const voiceDb = maxSimultaneous > 4 ? -3 * Math.log2(maxSimultaneous / 4) : 0;
            const clampedDb = Math.max(-24, voiceDb);

            midi.tracks.forEach((track) => {
                track.notes.forEach((note) => {
                    // Skip notes yang sudah lewat
                    if (note.time + note.duration < startFromOriginal) return;

                    // Waktu Transport = waktu asli / speed
                    const scheduledTime = note.time / currentSpeed;
                    const scheduledDuration = Math.max(0.05, note.duration / currentSpeed);

                    Tone.Transport.schedule((audioTime) => {
                        const synth = synthRef.current;
                        if (!synth) return;
                        const scaledVelocity = Math.min(
                            1,
                            Math.max(0.3, note.velocity * 3) * Math.pow(10, clampedDb / 20),
                        );
                        synth.triggerAttackRelease(
                            note.name,
                            scheduledDuration,
                            audioTime,
                            scaledVelocity,
                        );
                        onNoteOn?.(note.name);

                        // Note-off visual callback
                        const noteOffTime = (note.time + note.duration) / currentSpeed;
                        Tone.Transport.schedule(() => {
                            onNoteOff?.(note.name);
                        }, noteOffTime);
                    }, scheduledTime);
                });
            });

            // End of song
            Tone.Transport.schedule(() => {
                setStatus('stopped');
                setProgress(0);
                clearProgress();
            }, totalDuration / currentSpeed + 0.5);

            Tone.Transport.start();
            setStatus('playing');
            startProgressInterval(totalDuration);
        },
        [synthRef, clearProgress, startProgressInterval, onNoteOn, onNoteOff],
    );

    const loadAndPlay = useCallback(
        async (url: string) => {
            try {
                setStatus('loading');
                stop();
                await ensureReady();

                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Gagal mengambil file MIDI (${response.status}: ${response.statusText})`);
                }
                const arrayBuffer = await response.arrayBuffer();

                // Validasi header MIDI ("MThd")
                const header = new Uint8Array(arrayBuffer.slice(0, 4));
                const isMidi =
                    header[0] === 0x4d &&
                    header[1] === 0x54 &&
                    header[2] === 0x68 &&
                    header[3] === 0x64;
                if (!isMidi) {
                    throw new Error('File bukan format MIDI yang valid');
                }

                const midi = new Midi(arrayBuffer);
                parsedMidiRef.current = midi;

                const totalDuration = midi.duration;
                if (totalDuration <= 0) {
                    throw new Error('File MIDI tidak memiliki nada (durasi 0)');
                }
                totalDurationRef.current = totalDuration;
                setDuration(totalDuration);

                // BPM asli dari file (untuk display)
                const origBpm = midi.header.tempos.length > 0
                    ? midi.header.tempos[0].bpm
                    : 120;
                originalBpmRef.current = origBpm;
                setBpmState(Math.round(origBpm * speedRef.current));

                const allNotes: MidiNote[] = [];
                midi.tracks.forEach((track) => {
                    track.notes.forEach((note) => {
                        allNotes.push({
                            name: note.name,
                            midi: note.midi,
                            time: note.time,
                            duration: note.duration,
                            velocity: note.velocity,
                        });
                    });
                });
                setMidiData({ notes: allNotes, duration: totalDuration });

                scheduleAndPlay(midi, totalDuration, speedRef.current, 0);
            } catch (err) {
                console.error('Error loading MIDI:', err);
                setStatus('idle');
                throw err;
            }
        },
        [stop, ensureReady, scheduleAndPlay],
    );

    const handleInstrumentChange = useCallback(() => {
        // synthRef sudah diswap oleh useSynth, tidak perlu restart
    }, []);

    /**
     * Seek ke posisi tertentu (dalam detik "note.time space" / detik asli).
     */
    const seek = useCallback((targetOriginalTime: number) => {
        const midi = parsedMidiRef.current;
        if (!midi) return;

        const clampedTime = Math.max(0, Math.min(targetOriginalTime, totalDurationRef.current));
        const wasPlaying = Tone.Transport.state === 'started';

        scheduleAndPlay(midi, totalDurationRef.current, speedRef.current, clampedTime);

        if (!wasPlaying) {
            Tone.Transport.pause();
            setStatus('paused');
            clearProgress();
            setProgress(clampedTime);
        }
    }, [scheduleAndPlay, clearProgress]);

    /**
     * Ubah speed (multiplier).
     * Re-schedule semua note dari posisi saat ini dengan speed baru.
     */
    const setSpeed = useCallback((newSpeed: number) => {
        const clampedSpeed = Math.max(0.1, Math.min(4.0, newSpeed));
        const midi = parsedMidiRef.current;
        if (!midi) {
            // Belum ada MIDI, simpan saja untuk nanti
            speedRef.current = clampedSpeed;
            setSpeedState(clampedSpeed);
            setBpmState(Math.round(originalBpmRef.current * clampedSpeed));
            return;
        }

        // Posisi saat ini dalam "note.time space" (detik asli)
        const currentOriginalTime = Tone.Transport.seconds * speedRef.current;
        const wasPlaying = Tone.Transport.state === 'started';

        speedRef.current = clampedSpeed;
        setSpeedState(clampedSpeed);
        setBpmState(Math.round(originalBpmRef.current * clampedSpeed));

        // Re-schedule dari posisi saat ini dengan speed baru
        scheduleAndPlay(midi, totalDurationRef.current, clampedSpeed, currentOriginalTime);

        if (!wasPlaying) {
            // Jika sedang pause, stop Transport lagi setelah schedule
            Tone.Transport.pause();
            setStatus('paused');
            clearProgress();
        }
    }, [scheduleAndPlay, clearProgress]);

    /**
     * setBpm: user input BPM absolut → konversi ke speed multiplier
     */
    const setBpm = useCallback((targetBpm: number) => {
        const clamped = Math.max(20, Math.min(400, targetBpm));
        const origBpm = originalBpmRef.current;
        const newSpeed = origBpm > 0 ? clamped / origBpm : 1.0;
        setSpeed(newSpeed);
    }, [setSpeed]);

    return {
        loadAndPlay,
        stop,
        pause,
        resume,
        status,
        progress,
        duration,
        midiData,
        handleInstrumentChange,
        bpm,
        speed,
        originalBpm: originalBpmRef.current,
        setBpm,
        setSpeed,
        seek,
    };
}
