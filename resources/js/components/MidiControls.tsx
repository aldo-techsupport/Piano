import { useCallback, useEffect, useState } from 'react';
import type { MidiStatus } from '../hooks/useMidi';
import type { MidiFile } from '../types/piano';

interface MidiControlsProps {
    status: MidiStatus;
    progress: number;
    duration: number;
    onPlay: (url: string) => void;
    onStop: () => void;
    onPause: () => void;
    onResume: () => void;
    playError?: string | null;
}

export default function MidiControls({
    status,
    progress,
    duration,
    onPlay,
    onStop,
    onPause,
    onResume,
    playError: externalPlayError,
}: MidiControlsProps) {
    const [serverFiles, setServerFiles] = useState<MidiFile[]>([]);
    const [selectedFile, setSelectedFile] = useState<MidiFile | null>(null);
    const [localFile, setLocalFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [showFileList, setShowFileList] = useState(false);
    const [playError, setPlayError] = useState<string | null>(null);

    const fetchFiles = useCallback(async (): Promise<MidiFile[]> => {
        try {
            const res = await fetch('/midi');
            if (res.ok) {
                const data: MidiFile[] = await res.json();
                setServerFiles(data);
                return data;
            }
        } catch { /* ignore */ }
        return [];
    }, []);

    useEffect(() => { fetchFiles(); }, [fetchFiles]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setUploadError(null);
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
            if (!res.ok) throw new Error((await res.json()).message ?? 'Upload gagal');
            const updatedFiles = await fetchFiles();
            // Auto-select dan play file yang baru diupload
            const uploaded = updatedFiles.find((f) => f.name === file.name);
            if (uploaded) {
                setSelectedFile(uploaded);
                setLocalFile(null);
                setShowFileList(false);
                setPlayError(null);
                onPlay(uploaded.url);
            }
        } catch (err) {
            setUploadError(err instanceof Error ? err.message : 'Upload gagal');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLocalFile(file);
        setSelectedFile(null);
        // Langsung play
        setPlayError(null);
        onPlay(URL.createObjectURL(file));
    };

    const handlePlay = () => {
        setPlayError(null);
        if (localFile) {
            onPlay(URL.createObjectURL(localFile));
        } else if (selectedFile) {
            onPlay(selectedFile.url);
        }
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    const progressPct = duration > 0 ? (progress / duration) * 100 : 0;
    const isPlaying = status === 'playing';
    const isPaused = status === 'paused';
    const isLoading = status === 'loading';
    const hasSource = localFile !== null || selectedFile !== null;
    const currentName = localFile?.name ?? selectedFile?.name ?? null;

    return (
        <div className="flex flex-col gap-2 bg-[#111] px-4 py-3">
            {/* Error message */}
            {(externalPlayError || playError) && (
                <div className="flex items-center gap-2 rounded bg-red-900/40 px-3 py-1.5 text-xs text-red-400">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 shrink-0">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    {externalPlayError ?? playError}
                </div>
            )}
            {/* Progress bar */}
            <div className="flex items-center gap-3">
                {/* Play/Pause/Stop */}
                <div className="flex shrink-0 items-center gap-1">
                    {!isPlaying && !isPaused ? (
                        <button
                            onClick={handlePlay}
                            disabled={!hasSource || isLoading}
                            title="Play"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white transition hover:bg-green-500 disabled:opacity-40"
                        >
                            {isLoading ? (
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            )}
                        </button>
                    ) : isPlaying ? (
                        <button
                            onClick={onPause}
                            title="Pause"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500 text-white transition hover:bg-yellow-400"
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                            </svg>
                        </button>
                    ) : (
                        <button
                            onClick={onResume}
                            title="Resume"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white transition hover:bg-green-500"
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </button>
                    )}

                    {(isPlaying || isPaused) && (
                        <button
                            onClick={onStop}
                            title="Stop"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white transition hover:bg-red-500"
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                <path d="M6 6h12v12H6z" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Time */}
                <span className="w-20 shrink-0 text-right font-mono text-xs text-gray-400">
                    {formatTime(progress)} / {formatTime(duration)}
                </span>

                {/* Progress bar */}
                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-gray-700">
                    <div
                        className="h-full rounded-full bg-green-500 transition-none"
                        style={{ width: `${progressPct}%` }}
                    />
                    {/* Red dot at end */}
                    <div
                        className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-red-500 shadow"
                        style={{ left: `calc(${progressPct}% - 6px)` }}
                    />
                </div>

                {/* File selector button */}
                <div className="relative shrink-0">
                    <button
                        onClick={() => setShowFileList((v) => !v)}
                        className="flex items-center gap-1 rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 transition hover:bg-gray-600"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
                            <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
                        </svg>
                        {currentName ? (
                            <span className="max-w-[120px] truncate">{currentName}</span>
                        ) : (
                            'Pilih MIDI'
                        )}
                    </button>

                    {showFileList && (
                        <div className="absolute bottom-full right-0 z-50 mb-1 w-72 rounded-lg border border-gray-700 bg-gray-900 shadow-xl">
                            <div className="border-b border-gray-700 p-3">
                                <p className="mb-2 text-xs font-semibold text-gray-400">
                                    PLAY LANGSUNG
                                </p>
                                <label className="block cursor-pointer rounded border border-dashed border-gray-600 px-3 py-2 text-xs text-gray-400 transition hover:border-amber-500 hover:text-amber-400">
                                    {localFile ? `📄 ${localFile.name}` : '+ Pilih file .mid lokal'}
                                    <input
                                        type="file"
                                        accept=".mid,.midi,audio/midi,audio/x-midi,audio/mid"
                                        className="hidden"
                                        onChange={(e) => {
                                            handleLocalFile(e);
                                            setShowFileList(false);
                                        }}
                                    />
                                </label>
                            </div>

                            <div className="p-3">
                                <div className="mb-2 flex items-center justify-between">
                                    <p className="text-xs font-semibold text-gray-400">
                                        FILE DI SERVER
                                    </p>
                                    <label className="cursor-pointer text-xs text-amber-400 transition hover:text-amber-300">
                                        {uploading ? 'Uploading...' : '+ Upload'}
                                        <input
                                            type="file"
                                            accept=".mid,.midi,audio/midi,audio/x-midi,audio/mid"
                                            className="hidden"
                                            onChange={handleUpload}
                                            disabled={uploading}
                                        />
                                    </label>
                                </div>

                                {uploadError && (
                                    <p className="mb-2 text-xs text-red-400">{uploadError}</p>
                                )}

                                {serverFiles.length === 0 ? (
                                    <p className="text-xs text-gray-600">Belum ada file</p>
                                ) : (
                                    <div className="max-h-40 overflow-y-auto">
                                        {serverFiles.map((f) => (
                                            <button
                                                key={f.name}
                                                onClick={() => {
                                                    setSelectedFile(f);
                                                    setLocalFile(null);
                                                    setShowFileList(false);
                                                    // Langsung stop lagu sebelumnya dan play yang baru
                                                    setPlayError(null);
                                                    onPlay(f.url);
                                                }}
                                                className={[
                                                    'flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs transition',
                                                    selectedFile?.name === f.name
                                                        ? 'bg-amber-900/40 text-amber-300'
                                                        : 'text-gray-300 hover:bg-gray-800',
                                                ].join(' ')}
                                            >
                                                <span className="truncate">🎹 {f.name}</span>
                                                <span className="ml-2 shrink-0 text-gray-500">
                                                    {(f.size / 1024).toFixed(1)}KB
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
