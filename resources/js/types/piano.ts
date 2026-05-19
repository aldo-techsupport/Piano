export interface MidiFile {
    name: string;
    size: number;
    url: string;
}

export interface PianoKey {
    note: string;
    octave: number;
    isBlack: boolean;
    keyboardKey?: string;
    label: string;
}

export interface ActiveNote {
    note: string;
    velocity: number;
}
