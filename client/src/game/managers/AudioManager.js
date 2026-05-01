export class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.musicStarted = false;
        this.audioCtx = null;
        this.oscillator = null;
        this.gainNode = null;
        this.musicEvent = null;
    }

    startMusic() {
        if (this.musicStarted) return;
        this.musicStarted = true;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
            this.oscillator = this.audioCtx.createOscillator();
            this.gainNode = this.audioCtx.createGain();

            this.oscillator.type = 'sine';
            this.oscillator.frequency.setValueAtTime(440, this.audioCtx.currentTime);
            this.gainNode.gain.setValueAtTime(0.05, this.audioCtx.currentTime);

            this.oscillator.connect(this.gainNode);
            this.gainNode.connect(this.audioCtx.destination);

            this.oscillator.start();

            this.musicEvent = this.scene.time.addEvent({
                delay: 1000,
                callback: () => {
                    const freqs = [440, 493, 523, 587];
                    const next = freqs[Math.floor(Math.random() * freqs.length)];
                    if (this.oscillator) {
                        this.oscillator.frequency.exponentialRampToValueAtTime(next, this.audioCtx.currentTime + 0.5);
                    }
                },
                loop: true
            });
        } catch (e) {
            console.error('AudioContext error:', e);
        }
    }

    stopMusic() {
        if (!this.musicStarted) return;
        this.musicStarted = false;
        if (this.musicEvent) {
            this.musicEvent.remove();
            this.musicEvent = null;
        }
        if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator.disconnect();
            this.oscillator = null;
        }
        if (this.audioCtx) {
            this.audioCtx.close();
            this.audioCtx = null;
        }
    }
}
