import { useEffect, useRef } from 'react';
import type { MidiData } from '../hooks/useMidi';

interface PianoRollProps {
    midiData: MidiData | null;
    progress: number; // current playback time in seconds
    isPlaying: boolean;
    /** Total MIDI range to display: lowest and highest MIDI note number */
    midiMin?: number;
    midiMax?: number;
    /** How many seconds of notes are visible in the roll */
    lookahead?: number;
}

// MIDI note 0 = C-1, 21 = A0 (piano start), 108 = C8 (piano end)
const PIANO_MIN = 21;
const PIANO_MAX = 108;

function isBlackKey(midi: number): boolean {
    const mod = midi % 12;
    return [1, 3, 6, 8, 10].includes(mod);
}

/** Count white keys from PIANO_MIN up to (not including) midi */
function whiteKeyIndex(midi: number): number {
    let count = 0;
    for (let m = PIANO_MIN; m < midi; m++) {
        if (!isBlackKey(m)) count++;
    }
    return count;
}

const TOTAL_WHITE_KEYS = (() => {
    let count = 0;
    for (let m = PIANO_MIN; m <= PIANO_MAX; m++) {
        if (!isBlackKey(m)) count++;
    }
    return count;
})();

export default function PianoRoll({
    midiData,
    progress,
    isPlaying,
    lookahead = 4,
}: PianoRollProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animFrameRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const draw = () => {
            const W = canvas.width;
            const H = canvas.height;

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

            // Shade black key lanes
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            for (let m = PIANO_MIN; m <= PIANO_MAX; m++) {
                if (isBlackKey(m)) {
                    // Find the white key to the left
                    const leftWhite = whiteKeyIndex(m);
                    const x = leftWhite * whiteW + whiteW * 0.6;
                    const w = whiteW * 0.8;
                    ctx.fillRect(x, 0, w, H);
                }
            }

            // Red line at bottom (playhead)
            const playheadY = H - 4;
            ctx.fillStyle = '#cc0000';
            ctx.fillRect(0, playheadY, W, 2);

            if (!midiData) {
                animFrameRef.current = requestAnimationFrame(draw);
                return;
            }

            const currentTime = progress;
            const pixelsPerSecond = H / lookahead;

            // Draw notes
            midiData.notes.forEach((note) => {
                const noteStart = note.time;
                const noteEnd = note.time + note.duration;

                // Only draw notes that are visible in the window
                // Notes visible: from currentTime to currentTime + lookahead
                if (noteEnd < currentTime - 0.1) return;
                if (noteStart > currentTime + lookahead) return;

                const black = isBlackKey(note.midi);

                // X position
                let x: number;
                let w: number;
                if (!black) {
                    const wi = whiteKeyIndex(note.midi);
                    x = wi * whiteW + 1;
                    w = whiteW - 2;
                } else {
                    const leftWhite = whiteKeyIndex(note.midi);
                    x = leftWhite * whiteW + whiteW * 0.6 + 1;
                    w = whiteW * 0.8 - 2;
                }

                // Y position: notes fall from top to bottom
                // At currentTime, note is at playheadY
                // Future notes (noteStart > currentTime) are above playhead
                const yBottom = playheadY - (noteStart - currentTime) * pixelsPerSecond;
                const yTop = playheadY - (noteEnd - currentTime) * pixelsPerSecond;
                const noteH = Math.max(yBottom - yTop, 3);

                // Color: yellow/gold like Synthesia
                const isActive = noteStart <= currentTime && noteEnd >= currentTime;
                if (isActive) {
                    // Bright yellow when playing
                    ctx.fillStyle = '#f5e642';
                    // Glow effect
                    ctx.shadowColor = '#f5e642';
                    ctx.shadowBlur = 12;
                } else {
                    // Slightly dimmer yellow for upcoming notes
                    ctx.fillStyle = '#c8bc2a';
                    ctx.shadowBlur = 0;
                }

                const radius = Math.min(4, w / 3, noteH / 3);
                ctx.beginPath();
                ctx.roundRect(x, yTop, w, noteH, radius);
                ctx.fill();
                ctx.shadowBlur = 0;
            });

            animFrameRef.current = requestAnimationFrame(draw);
        };

        animFrameRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animFrameRef.current);
    }, [midiData, progress, isPlaying, lookahead]);

    // Resize canvas to match container
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const observer = new ResizeObserver(() => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        });
        observer.observe(canvas);
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
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
