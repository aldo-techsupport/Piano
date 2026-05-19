import { useEffect, useRef } from 'react';
import * as Tone from 'tone';
import type { MidiData } from '../hooks/useMidi';

interface PianoRollProps {
    midiData: MidiData | null;
    progress: number; // fallback progress (used when Transport not running)
    isPlaying: boolean;
    /** How many seconds of notes are visible in the roll */
    lookahead?: number;
    /** Speed multiplier — needed to convert Transport.seconds back to original time */
    speed?: number;
}

// MIDI note 0 = C-1, 21 = A0 (piano start), 108 = C8 (piano end)
const PIANO_MIN = 21;
const PIANO_MAX = 108;

function isBlackKey(midi: number): boolean {
    const mod = midi % 12;
    return [1, 3, 6, 8, 10].includes(mod);
}

/** Build a lookup table matching SynthesiaPiano's key positioning exactly */
interface KeyPos {
    isBlack: boolean;
    whiteIndex: number; // for black keys: the white key index to the LEFT
}

const KEY_POS_MAP: Map<number, KeyPos> = (() => {
    const map = new Map<number, KeyPos>();
    let whiteIdx = 0;
    for (let m = PIANO_MIN; m <= PIANO_MAX; m++) {
        const black = isBlackKey(m);
        map.set(m, {
            isBlack: black,
            whiteIndex: black ? whiteIdx - 1 : whiteIdx,
        });
        if (!black) whiteIdx++;
    }
    return map;
})();

const TOTAL_WHITE_KEYS = (() => {
    let count = 0;
    for (let m = PIANO_MIN; m <= PIANO_MAX; m++) {
        if (!isBlackKey(m)) count++;
    }
    return count;
})();

// Black key offset within white key width — must match SynthesiaPiano
const BLACK_OFFSET = 0.6;
const BLACK_WIDTH_FACTOR = 0.65;

export default function PianoRoll({
    midiData,
    progress,
    isPlaying,
    lookahead = 4,
    speed = 1,
}: PianoRollProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animFrameRef = useRef<number>(0);
    // Store latest props in refs so the animation loop always reads fresh values
    const midiDataRef = useRef(midiData);
    const progressRef = useRef(progress);
    const isPlayingRef = useRef(isPlaying);
    const speedRef = useRef(speed);
    const lookaheadRef = useRef(lookahead);

    midiDataRef.current = midiData;
    progressRef.current = progress;
    isPlayingRef.current = isPlaying;
    speedRef.current = speed;
    lookaheadRef.current = lookahead;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const draw = () => {
            const W = canvas.width;
            const H = canvas.height;
            const data = midiDataRef.current;
            const currentLookahead = lookaheadRef.current;
            const currentSpeed = speedRef.current;

            // Get current time directly from Tone.Transport for perfect sync
            // Transport.seconds is in "scaled time" (original / speed)
            // Multiply by speed to get position in original note.time space
            let currentTime: number;
            if (Tone.Transport.state === 'started') {
                currentTime = Tone.Transport.seconds * currentSpeed;
            } else {
                // Fallback to prop when paused/stopped
                currentTime = progressRef.current;
            }

            // Background
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, W, H);

            // Draw vertical lane lines (one per white key)
            const whiteW = W / TOTAL_WHITE_KEYS;

            // Draw subtle lane separators
            ctx.strokeStyle = '#2a2a2a';
            ctx.lineWidth = 1;
            for (let i = 0; i <= TOTAL_WHITE_KEYS; i++) {
                ctx.beginPath();
                ctx.moveTo(i * whiteW, 0);
                ctx.lineTo(i * whiteW, H);
                ctx.stroke();
            }

            // Shade black key lanes (matching SynthesiaPiano positioning)
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            for (let m = PIANO_MIN; m <= PIANO_MAX; m++) {
                if (isBlackKey(m)) {
                    const pos = KEY_POS_MAP.get(m)!;
                    const x = (pos.whiteIndex + BLACK_OFFSET) * whiteW;
                    const w = whiteW * BLACK_WIDTH_FACTOR;
                    ctx.fillRect(x, 0, w, H);
                }
            }

            // Red line at bottom (playhead)
            const playheadY = H - 4;
            ctx.fillStyle = '#cc0000';
            ctx.fillRect(0, playheadY, W, 3);

            if (data) {
                const pixelsPerSecond = H / currentLookahead;

                // Draw notes
                for (let i = 0; i < data.notes.length; i++) {
                    const note = data.notes[i];
                    const noteStart = note.time;
                    const noteEnd = note.time + note.duration;

                    // Only draw notes that are visible in the window
                    if (noteEnd < currentTime - 0.1) continue;
                    if (noteStart > currentTime + currentLookahead) continue;

                    const black = isBlackKey(note.midi);
                    const pos = KEY_POS_MAP.get(note.midi);
                    if (!pos) continue;

                    // X position — matching SynthesiaPiano exactly
                    let x: number;
                    let w: number;
                    if (!black) {
                        x = pos.whiteIndex * whiteW + 1;
                        w = whiteW - 2;
                    } else {
                        x = (pos.whiteIndex + BLACK_OFFSET) * whiteW + 1;
                        w = whiteW * BLACK_WIDTH_FACTOR - 2;
                    }

                    // Y position: notes fall from top to bottom
                    // At currentTime, note should be at playheadY
                    // Future notes (noteStart > currentTime) are above playhead
                    const yBottom = playheadY - (noteStart - currentTime) * pixelsPerSecond;
                    const yTop = playheadY - (noteEnd - currentTime) * pixelsPerSecond;
                    const noteH = Math.max(yBottom - yTop, 3);

                    // Color: yellow/gold like Synthesia
                    const isActive = noteStart <= currentTime && noteEnd >= currentTime;
                    if (isActive) {
                        ctx.fillStyle = '#f5e642';
                        ctx.shadowColor = '#f5e642';
                        ctx.shadowBlur = 12;
                    } else {
                        ctx.fillStyle = '#c8bc2a';
                        ctx.shadowBlur = 0;
                    }

                    const radius = Math.min(4, w / 3, noteH / 3);
                    ctx.beginPath();
                    ctx.roundRect(x, yTop, w, noteH, radius);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }

            animFrameRef.current = requestAnimationFrame(draw);
        };

        animFrameRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animFrameRef.current);
    }, []); // Empty deps — loop runs forever, reads from refs

    // Resize canvas to match container
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const observer = new ResizeObserver(() => {
            canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
            canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
        });
        observer.observe(canvas);
        canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
        canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
        return () => observer.disconnect();
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="block w-full"
            style={{ height: '100%', display: 'block' }}
            aria-label="Piano roll visualizer"
        />
    );
}
