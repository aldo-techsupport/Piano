<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MidiController extends Controller
{
    /**
     * Upload file MIDI ke storage.
     */
    public function upload(Request $request)
    {
        $request->validate([
            'midi_file' => 'required|file|max:10240',
        ]);

        $file = $request->file('midi_file');
        $originalName = $file->getClientOriginalName();
        $path = $file->storeAs('midi', $originalName, 'local');

        return response()->json([
            'message' => 'File berhasil diupload',
            'name'    => $originalName,
            'path'    => $path,
        ]);
    }

    /**
     * List semua file MIDI yang tersimpan.
     */
    public function index()
    {
        $files = Storage::disk('local')->files('midi');

        $result = array_map(function ($file) {
            return [
                'name' => basename($file),
                'size' => Storage::disk('local')->size($file),
                'url'  => route('midi.show', ['filename' => basename($file)]),
            ];
        }, $files);

        return response()->json(array_values($result));
    }

    /**
     * Serve file MIDI untuk diplay di frontend.
     */
    public function show(string $filename)
    {
        // rawurldecode: decode %XX saja, tidak mengubah '+' menjadi spasi
        $filename = basename(rawurldecode($filename));
        $path = Storage::disk('local')->path('midi/' . $filename);

        if (! file_exists($path)) {
            return response()->json(['error' => 'File tidak ditemukan'], 404);
        }

        return response()->file($path, [
            'Content-Type'        => 'audio/midi',
            'Content-Disposition' => 'inline; filename="' . rawurlencode($filename) . '"',
            'Access-Control-Allow-Origin' => '*',
        ]);
    }

    /**
     * Hapus file MIDI.
     */
    public function destroy(string $filename)
    {
        $filename = basename(rawurldecode($filename));

        if (! Storage::disk('local')->exists('midi/' . $filename)) {
            return response()->json(['error' => 'File tidak ditemukan'], 404);
        }

        Storage::disk('local')->delete('midi/' . $filename);

        return response()->json(['message' => 'File berhasil dihapus']);
    }
}
