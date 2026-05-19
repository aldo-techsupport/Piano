import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import * as Tone from 'tone';
import InstrumentPicker from '../components/InstrumentPicker';
import KeyboardLayoutEditor, { DEFAULT_KEYBOARD_MAP, type KeyboardMap } from '../components/KeyboardLayoutEditor';
import MidiControls from '../components/MidiControls';
import PianoRoll from '../components/PianoRoll';
import SpeedControl from '../components/SpeedControl';
import SynthesiaPiano from '../components/SynthesiaPiano';
import { useMidi } from '../hooks/useMidi';
import { usePiano } from '../hooks/usePiano';
import { useSynth } from '../hooks/useSynth';
import { INSTRUMENTS } from '../lib/instruments';

export default function Piano() {
    // ── Resume AudioContext on first user gesture ─────────────────────────
    // Browser memblokir AudioContext sampai ada interaksi user.
    // Kita resume sekali saat klik/touch pertama agar upload → auto-play bekerja.
    useEffect(() => {
        const resume = () => {
            Tone.start().catch(() => {});
            document.removeEventListener('click', resume);
            document.removeEventListener('keydown', resume);
            document.removeEventListener('touchstart', resume);
        };
        document.addEventListener('click', resume);
        document.addEventListener('keydown', resume);
        document.addEventListener('touchstart', resume);
        return () => {
            document.removeEventListener('click', resume);
            document.removeEventListener('keydown', resume);
            document.removeEventListener('touchstart', resume);
        };
    }, []);

    // ── Shared synth ──────────────────────────────────────────────────────
    const { synthRef, instrumentId, setInstrument, ensureReady } = useSynth();

    // ── Piano manual ──────────────────────────────────────────────────────
    const { playNote, stopNote, activeNotes } = usePiano(synthRef, ensureReady);

    // ── MIDI active notes (for piano roll highlight) ───────────────────────
    const [midiActiveNotes, setMidiActiveNotes] = useState<Set<string>>(new Set());

    const handleMidiNoteOn = useCallback((note: string) => {
        setMidiActiveNotes((prev) => new Set(prev).add(note));
    }, []);

    const handleMidiNoteOff = useCallback((note: string) => {
        setMidiActiveNotes((prev) => {
            const next = new Set(prev);
            next.delete(note);
            return next;
        });
    }, []);

    // ── MIDI playback ─────────────────────────────────────────────────────
    const { loadAndPlay, stop, pause, resume, status, progress, duration, midiData, bpm, setBpm, speed, setSpeed, originalBpm } = useMidi(
        synthRef,
        ensureReady,
        handleMidiNoteOn,
        handleMidiNoteOff,
    );

    const [playError, setPlayError] = useState<string | null>(null);

    const handlePlay = useCallback(
        async (url: string) => {
            setPlayError(null);
            try {
                await loadAndPlay(url);
            } catch (err) {
                setPlayError(err instanceof Error ? err.message : 'Gagal memutar MIDI');
            }
        },
        [loadAndPlay],
    );

    // ── Instrument change ─────────────────────────────────────────────────
    // setInstrument swaps synthRef.current in-place.
    // useMidi scheduled callbacks always read synthRef.current (a ref, not a value),
    // so the sound changes immediately on the next note — no restart needed.
    const handleInstrumentChange = useCallback(
        async (id: string) => {
            await setInstrument(id);
        },
        [setInstrument],
    );

    const allActiveNotes = new Set([...activeNotes, ...midiActiveNotes]);
    const isPlaying = status === 'playing';
    const isPaused = status === 'paused';
    const currentInstrument = INSTRUMENTS.find((i) => i.id === instrumentId);

    // ── Keyboard layout ───────────────────────────────────────────────────
    const [keyboardMap, setKeyboardMap] = useState<KeyboardMap>(DEFAULT_KEYBOARD_MAP);
    const [showLayoutEditor, setShowLayoutEditor] = useState(false);

    return (
        <>
            <Head title="🎹 Piano" />

            <div
                className="flex flex-col bg-[#1a1a1a]"
                style={{ height: '100dvh', overflow: 'hidden' }}
            >
                {/* ── Piano Roll ── */}
                <div className="relative min-h-0 flex-1">
                    <PianoRoll
                        midiData={midiData}
                        progress={progress}
                        isPlaying={isPlaying || isPaused}
                        lookahead={4}
                    />

                    {/* Instrument Picker — top left */}
                    <div className="absolute top-3 left-3 z-30">
                        <InstrumentPicker
                            currentId={instrumentId}
                            onChange={handleInstrumentChange}
                        />
                    </div>

                    {/* Speed Control — top right */}
                    <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
                        <SpeedControl bpm={bpm} onChange={setBpm} onSpeedChange={setSpeed} speed={speed} originalBpm={originalBpm} />

                        {/* Keyboard layout button */}
                        <button
                            className="flex h-7 items-center gap-1.5 rounded-full border border-white/20 px-2.5 text-xs text-white/50 transition hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-300"
                            title="Custom keyboard layout"
                            onClick={() => setShowLayoutEditor(true)}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                                <rect x="2" y="6" width="20" height="13" rx="2" />
                                <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" strokeLinecap="round" />
                            </svg>
                            <span>Layout</span>
                        </button>

                        {/* Info button */}
                        <button
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-xs text-white/40 transition hover:border-white/40 hover:text-white/70"
                            title="Keyboard shortcuts"
                            onClick={() => setShowLayoutEditor(true)}
                        >
                            ⓘ
                        </button>
                    </div>

                    {/* Idle overlay */}
                    {status === 'idle' && (
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3">
                            <p className="text-3xl font-bold tracking-tight text-white/80">
                                🎹 Laravel Piano
                            </p>
                            <p className="text-sm text-white/40">
                                Pilih instrumen di kiri atas, lalu mainkan atau upload file MIDI
                            </p>
                        </div>
                    )}

                    {/* Loading spinner */}
                    {status === 'loading' && (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <div className="h-10 w-10 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent" />
                                <p className="text-sm text-yellow-400">Memuat MIDI...</p>
                            </div>
                        </div>
                    )}

                    {/* Current instrument badge — bottom left */}
                    {currentInstrument && (
                        <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-white/50 backdrop-blur-sm">
                            <span>{currentInstrument.emoji}</span>
                            <span>{currentInstrument.label}</span>
                        </div>
                    )}
                </div>

                {/* ── Piano Keyboard ── */}
                <div className="shrink-0 border-t-2 border-red-700">
                    <SynthesiaPiano
                        activeNotes={allActiveNotes}
                        onNoteOn={playNote}
                        onNoteOff={stopNote}
                        keyboardMap={keyboardMap}
                    />
                </div>

                {/* ── Controls ── */}
                <div className="shrink-0 border-t border-gray-800">
                    <MidiControls
                        status={status}
                        progress={progress}
                        duration={duration}
                        onPlay={handlePlay}
                        onStop={stop}
                        onPause={pause}
                        onResume={resume}
                        playError={playError}
                    />
                </div>
            </div>

            {/* ── Keyboard Layout Editor Modal ── */}
            {showLayoutEditor && (
                <KeyboardLayoutEditor
                    keyboardMap={keyboardMap}
                    onChange={setKeyboardMap}
                    onClose={() => setShowLayoutEditor(false)}
                />
            )}
        </>
    );
}
