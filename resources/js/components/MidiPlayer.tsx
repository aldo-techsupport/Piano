import { useCallback, useEffect, useState } from 'react';
import type { MidiFile } from '../types/piano';
import type { MidiStatus } from '../hooks/useMidi';

interface MidiPlayerProps {
    status: MidiStatus;
    progress: number;
    duration: number;
    onPlay: (url: string) => void;
    onStop: () => void;
    onPause: () => void;
    onResume: () => void;
}

interface UploadState {
    uploading: boolean;
    error: string | null;
}

export default function MidiPlayer({
    status,
    progress,
    duration,
    onPlay,
    onStop,
    onPause,
    onResume,
}: MidiPlayerProps) {
    const [files, setFiles] = useState<MidiFile[]>([]);
    const [selectedFile, setSelectedFile] = useState<MidiFile | null>(null);
    const [uploadState, setUploadState] = useState<UploadState>({ uploading: false, error: null });
    const [localFile, setLocalFile] = useState<File | null>(null);

    const fetchFiles = useCallback(async () => {
        try {
            const res = await fetch('/midi');
            if (res.ok) {
                const data = await res.json();
                setFiles(data);
            }
        } catch {
            // Silently fail if no files yet
        }
    }, []);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadState({ uploading: true, error: null });
        const formData = new FormData();
        formData.append('midi_file', file);

        try {
            const res = await fetch('/midi/upload', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN':
                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)
                            ?.content ?? '',
                },
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message ?? 'Upload gagal');
            }

            await fetchFiles();
            setUploadState({ uploading: false, error: null });
        } catch (err) {
            setUploadState({
                uploading: false,
                error: err instanceof Error ? err.message : 'Upload gagal',
            });
        }

        e.target.value = '';
    };

    const handleLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLocalFile(file);
            setSelectedFile(null);
        }
    };

    const handlePlay = () => {
        if (localFile) {
            const url = URL.createObjectURL(localFile);
            onPlay(url);
        } else if (selectedFile) {
            onPlay(selectedFile.url);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
    const isPlaying = status === 'playing';
    const isPaused = status === 'paused';
    const isLoading = status === 'loading';
    const canPlay = (localFile !== null || selectedFile !== null) && !isPlaying && !isPaused;

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">
                🎵 MIDI Player
            </h2>

            {/* Upload ke server */}
            <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-400">
                    Upload MIDI ke Server
                </label>
                <div className="flex items-center gap-2">
                    <label className="cursor-pointer rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500 transition hover:border-amber-400 hover:text-amber-500 dark:border-gray-600 dark:text-gray-400">
                        {uploadState.uploading ? 'Mengupload...' : '+ Pilih file .mid'}
                        <input
                            type="file"
                            accept=".mid,.midi"
                            className="hidden"
                            onChange={handleUpload}
                            disabled={uploadState.uploading}
                        />
                    </label>
                    {uploadState.error && (
                        <span className="text-sm text-red-500">{uploadState.error}</span>
                    )}
                </div>
            </div>

            {/* File dari server */}
            {files.length > 0 && (
                <div className="mb-4">
                    <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-400">
                        File di Server
                    </label>
                    <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                        {files.map((file) => (
                            <button
                                key={file.name}
                                onClick={() => {
                                    setSelectedFile(file);
                                    setLocalFile(null);
                                }}
                                className={[
                                    'flex w-full items-center justify-between px-3 py-2 text-left text-sm transition',
                                    selectedFile?.name === file.name
                                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                        : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700',
                                ].join(' ')}
                            >
                                <span className="truncate">🎹 {file.name}</span>
                                <span className="ml-2 shrink-0 text-xs text-gray-400">
                                    {(file.size / 1024).toFixed(1)} KB
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* File lokal (tanpa upload) */}
            <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-400">
                    Atau Play Langsung (tanpa upload)
                </label>
                <label className="cursor-pointer rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500 transition hover:border-amber-400 hover:text-amber-500 dark:border-gray-600 dark:text-gray-400 block">
                    {localFile ? `📄 ${localFile.name}` : '+ Pilih file .mid lokal'}
                    <input
                        type="file"
                        accept=".mid,.midi"
                        className="hidden"
                        onChange={handleLocalFile}
                    />
                </label>
            </div>

            {/* Progress bar */}
            {(isPlaying || isPaused || status === 'stopped') && duration > 0 && (
                <div className="mb-4">
                    <div className="mb-1 flex justify-between text-xs text-gray-400">
                        <span>{formatTime(progress)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                            className="h-full rounded-full bg-amber-400 transition-all duration-100"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-2">
                {!isPlaying && !isPaused && (
                    <button
                        onClick={handlePlay}
                        disabled={!canPlay || isLoading}
                        className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Loading...
                            </>
                        ) : (
                            <>▶ Play</>
                        )}
                    </button>
                )}

                {isPlaying && (
                    <button
                        onClick={onPause}
                        className="flex items-center gap-2 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-yellow-600"
                    >
                        ⏸ Pause
                    </button>
                )}

                {isPaused && (
                    <button
                        onClick={onResume}
                        className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-600"
                    >
                        ▶ Resume
                    </button>
                )}

                {(isPlaying || isPaused) && (
                    <button
                        onClick={onStop}
                        className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
                    >
                        ⏹ Stop
                    </button>
                )}

                <span className="ml-auto text-xs text-gray-400 capitalize">
                    {status === 'idle' ? 'Siap' : status}
                </span>
            </div>
        </div>
    );
}
