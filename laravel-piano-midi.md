# 🎹 Project Piano + MIDI Reader di Laravel 12

> Dokumentasi lengkap membangun aplikasi piano interaktif dengan fitur baca file MIDI menggunakan Laravel 12.

---

## Arsitektur yang Direkomendasikan

Laravel 12 berperan sebagai **backend** (storage, API, manajemen file), sedangkan fitur piano dan MIDI ditangani di **frontend** menggunakan JavaScript library yang powerful.

```
Browser (Frontend)          Laravel 12 (Backend)
─────────────────           ──────────────────────
Tone.js         ←──API──→   MidiController.php
@tonejs/midi                storage/app/midi/
Soundfont-player            MySQL / SQLite
Piano UI (HTML/CSS/JS)      routes/web.php
```

---

## 📦 Library yang Dibutuhkan

### Frontend (JavaScript) — Inti Project

| Library | Fungsi | Install |
|---|---|---|
| **Tone.js** | Synthesizer audio, memainkan nada piano | `npm install tone` |
| **@tonejs/midi** | Parse file MIDI (.mid) | `npm install @tonejs/midi` |
| **MIDI.js** *(alternatif)* | Player MIDI lengkap | `npm install midi.js` |
| **Soundfont-player** | Load sound piano realistis (SoundFont) | `npm install soundfont-player` |

### Backend (PHP/Laravel) — Opsional

| Library | Fungsi | Install |
|---|---|---|
| **mivir/midi** | Parse MIDI di sisi server PHP | `composer require mivir/midi` |
| **Laravel Livewire** | Reaktif tanpa Vue/React | `composer require livewire/livewire` |

### Frontend Framework (pilih salah satu)

| Pilihan | Kapan Dipakai |
|---|---|
| **Vanilla JS + Vite** | Simpel, sudah built-in Laravel 12 |
| **Vue 3 + Vite** | Cocok untuk UI piano interaktif |
| **React + Inertia.js** | Jika mau SPA penuh |

---

## 🗂️ Struktur Project

```
laravel-piano/
├── app/
│   ├── Http/Controllers/
│   │   └── MidiController.php     ← upload & list file MIDI
│   └── Models/
│       └── MidiFile.php
├── resources/
│   ├── js/
│   │   ├── piano.js               ← logic keyboard piano
│   │   ├── midi-reader.js         ← parse & play MIDI
│   │   └── app.js
│   └── views/
│       └── piano.blade.php
├── storage/app/midi/              ← simpan file .mid
└── routes/web.php
```

---

## ⚡ Alur Kerja

```
User upload .mid file
    ↓
Laravel menyimpan ke storage/app/midi/
    ↓
Frontend fetch file via API route
    ↓
@tonejs/midi parse file MIDI
    ↓
Tone.js / Soundfont-player memainkan nada
    ↓
Tampilkan animasi tuts piano bergerak
```

---

## 🚀 Quick Start

### 1. Install Laravel Dependencies

```bash
composer require livewire/livewire
```

### 2. Install JS Dependencies

```bash
npm install tone @tonejs/midi soundfont-player
```

### 3. Build Assets

```bash
npm run dev
```

---

## 🧩 Contoh Kode

### MidiController.php

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MidiController extends Controller
{
    // Upload file MIDI
    public function upload(Request $request)
    {
        $request->validate([
            'midi_file' => 'required|file|mimes:mid,midi|max:10240',
        ]);

        $path = $request->file('midi_file')->store('midi', 'local');

        return response()->json([
            'message' => 'File berhasil diupload',
            'path'    => $path,
        ]);
    }

    // List semua file MIDI
    public function index()
    {
        $files = Storage::disk('local')->files('midi');

        return response()->json($files);
    }

    // Ambil file MIDI untuk diplay
    public function show($filename)
    {
        $path = storage_path('app/midi/' . $filename);

        if (!file_exists($path)) {
            return response()->json(['error' => 'File tidak ditemukan'], 404);
        }

        return response()->file($path, [
            'Content-Type' => 'audio/midi',
        ]);
    }
}
```

### routes/web.php

```php
use App\Http\Controllers\MidiController;

Route::get('/piano', fn() => view('piano'));
Route::post('/midi/upload', [MidiController::class, 'upload']);
Route::get('/midi', [MidiController::class, 'index']);
Route::get('/midi/{filename}', [MidiController::class, 'show']);
```

### midi-reader.js (Frontend)

```javascript
import { Midi } from '@tonejs/midi';
import * as Tone from 'tone';

async function loadAndPlayMidi(url) {
    // Ambil file MIDI dari Laravel
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();

    // Parse MIDI
    const midi = new Midi(arrayBuffer);

    // Setup synthesizer
    const synth = new Tone.PolySynth(Tone.Synth).toDestination();

    // Jadwalkan semua nada
    const now = Tone.now() + 0.5;

    midi.tracks.forEach(track => {
        track.notes.forEach(note => {
            synth.triggerAttackRelease(
                note.name,
                note.duration,
                note.time + now,
                note.velocity
            );
        });
    });

    // Mulai transport
    Tone.Transport.start();
}

export { loadAndPlayMidi };
```

### piano.blade.php (View Dasar)

```html
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laravel Piano</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body>
    <div id="piano-container">
        <h1>🎹 Laravel Piano</h1>

        <!-- Upload MIDI -->
        <input type="file" id="midi-upload" accept=".mid,.midi">
        <button id="play-btn">▶ Play MIDI</button>

        <!-- Tuts Piano -->
        <div id="piano-keys">
            <!-- Di-generate oleh piano.js -->
        </div>
    </div>

    <script type="module">
        import { loadAndPlayMidi } from './midi-reader.js';

        document.getElementById('play-btn').addEventListener('click', async () => {
            const file = document.getElementById('midi-upload').files[0];
            if (!file) return alert('Pilih file MIDI terlebih dahulu!');

            const url = URL.createObjectURL(file);
            await loadAndPlayMidi(url);
        });
    </script>
</body>
</html>
```

---

## 💡 Tips Penting

- **WebAudio API**: Tone.js menggunakan WebAudio API bawaan browser — tidak perlu plugin server audio
- **SoundFont**: Download piano soundfont dari [musescore.org](https://musescore.org) untuk suara piano lebih realistis
- **MIDI Info**: `@tonejs/midi` bisa baca tempo, instrument, velocity, dan semua track sekaligus
- **Keyboard Mapping**: Gunakan event `keydown` untuk memetakan tombol keyboard komputer ke tuts piano
- **CORS**: Pastikan konfigurasi CORS Laravel mengizinkan request dari frontend jika dipisah

---

## 📚 Referensi

| Sumber | Link |
|---|---|
| Tone.js Docs | https://tonejs.github.io |
| @tonejs/midi | https://github.com/Tonejs/Midi |
| Soundfont-player | https://github.com/danigb/soundfont-player |
| Laravel 12 Docs | https://laravel.com/docs/12.x |
| Laravel File Storage | https://laravel.com/docs/12.x/filesystem |

---

*Dokumentasi dibuat untuk Laravel 12 — Piano & MIDI Reader Project*
