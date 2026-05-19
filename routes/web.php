<?php

use App\Http\Controllers\MidiController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'piano')->name('home');

// MIDI API routes
Route::post('/midi/upload', [MidiController::class, 'upload'])->name('midi.upload');
Route::get('/midi', [MidiController::class, 'index'])->name('midi.index');
Route::get('/midi/{filename}', [MidiController::class, 'show'])->name('midi.show')->where('filename', '.*');
Route::delete('/midi/{filename}', [MidiController::class, 'destroy'])->name('midi.destroy')->where('filename', '.*');
