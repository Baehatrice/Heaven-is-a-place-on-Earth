/* ==========================================================================
   Heaven is a place on Earth - 90s/2000s Web 1.0 Retro Interactions
   ========================================================================== */

// --- Visitor Counter Setup ---
function setupVisitorCounter() {
    let count = localStorage.getItem('visitorCount');
    if (!count) {
        count = 742913; // Authentic random high starting number
    } else {
        count = parseInt(count) + 1;
    }
    localStorage.setItem('visitorCount', count);
    
    // Format count to 7 digits
    const formatted = count.toString().padStart(7, '0');
    const container = document.getElementById('visitor-counter');
    if (container) {
        container.innerHTML = '';
        for (let i = 0; i < formatted.length; i++) {
            const span = document.createElement('span');
            span.className = 'counter-digit';
            span.innerText = formatted[i];
            container.appendChild(span);
        }
    }
}

// --- Draggable Windows System ---
let maxZIndex = 100;

function makeWindowDraggable(win) {
    const handle = win.querySelector('.handle');
    if (!handle) return;

    // Click to focus window
    win.addEventListener('mousedown', () => {
        focusWindow(win);
    });

    handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        focusWindow(win);

        let initialX = win.offsetLeft;
        let initialY = win.offsetTop;
        let startCursorX = e.clientX;
        let startCursorY = e.clientY;

        function onMouseMove(moveEvent) {
            let dx = moveEvent.clientX - startCursorX;
            let dy = moveEvent.clientY - startCursorY;
            win.style.left = `${initialX + dx}px`;
            win.style.top = `${initialY + dy}px`;
        }

        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

function focusWindow(win) {
    if (win.style.zIndex !== String(maxZIndex)) {
        maxZIndex++;
        win.style.zIndex = maxZIndex;
        
        // Remove 'focused' visual style from others
        document.querySelectorAll('.win98-window').forEach(w => w.classList.remove('focused'));
        win.classList.add('focused');
    }
}

function setupDraggableWindows() {
    document.querySelectorAll('.window-draggable').forEach(win => {
        makeWindowDraggable(win);
    });
}

// --- Cursor Trail ---
let lastTrailTime = 0;
const cursorColors = ['#ff0000', '#00ff00', '#00ffff', '#ff00ff', '#ffff00', '#ffffff'];
const cursorSymbols = ['†', '✨', '✙', '✞', '✠'];

document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastTrailTime < 50) return; // Throttle to prevent lag
    lastTrailTime = now;

    const trail = document.createElement('span');
    trail.className = 'cursor-trail';
    trail.style.left = `${e.pageX - 4}px`;
    trail.style.top = `${e.pageY - 12}px`;
    
    // Choose random color & symbol
    trail.style.color = cursorColors[Math.floor(Math.random() * cursorColors.length)];
    trail.innerText = cursorSymbols[Math.floor(Math.random() * cursorSymbols.length)];
    
    document.body.appendChild(trail);

    // Remove trail after animation completes
    setTimeout(() => {
        trail.remove();
    }, 600);
});

// --- Web Audio Synthesizer (cheesy MIDI-like hymn) ---
let audioCtx = null;
let isMuted = false;
let isPlaying = false;
let playbackTimeout = null;
let currentNoteIndex = 0;
let synthVolumeNode = null;

// Hymn melody notes (frequencies and durations in beats)
// Melody: "Nearer, My God, to Thee" / "내 주를 가까이 하게 함은"
const noteFrequencies = {
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00,
    'A4': 440.00, 'Bb4': 466.16, 'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46,
    'rest': 0
};

const hymnMelody = [
    { note: 'F4', dur: 1 }, { note: 'A4', dur: 1 }, { note: 'G4', dur: 2 },
    { note: 'F4', dur: 1 }, { note: 'D4', dur: 1 }, { note: 'C4', dur: 2 },
    { note: 'F4', dur: 1 }, { note: 'A4', dur: 1 }, { note: 'G4', dur: 1 }, { note: 'C5', dur: 1 }, { note: 'A4', dur: 2 }, { note: 'G4', dur: 2 },
    
    { note: 'F4', dur: 1 }, { note: 'A4', dur: 1 }, { note: 'G4', dur: 2 },
    { note: 'F4', dur: 1 }, { note: 'D4', dur: 1 }, { note: 'C4', dur: 2 },
    { note: 'F4', dur: 1 }, { note: 'A4', dur: 1 }, { note: 'G4', dur: 1 }, { note: 'A4', dur: 1 }, { note: 'F4', dur: 3 }, { note: 'rest', dur: 1 },

    { note: 'C5', dur: 2 }, { note: 'D5', dur: 1 }, { note: 'C5', dur: 1 }, { note: 'A4', dur: 2 }, { note: 'C5', dur: 2 },
    { note: 'D5', dur: 2 }, { note: 'F5', dur: 1 }, { note: 'D5', dur: 1 }, { note: 'C5', dur: 3 }, { note: 'rest', dur: 1 },

    { note: 'F4', dur: 1 }, { note: 'A4', dur: 1 }, { note: 'G4', dur: 2 },
    { note: 'F4', dur: 1 }, { note: 'D4', dur: 1 }, { note: 'C4', dur: 2 },
    { note: 'F4', dur: 1 }, { note: 'A4', dur: 1 }, { note: 'G4', dur: 1 }, { note: 'A4', dur: 1 }, { note: 'F4', dur: 3 }, { note: 'rest', dur: 1 }
];

const tempoBPM = 110;
const beatDuration = 60 / tempoBPM; // Seconds per beat

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    synthVolumeNode = audioCtx.createGain();
    
    // Set initial volume from slider
    const slider = document.getElementById('volume-slider');
    if (slider) {
        synthVolumeNode.gain.setValueAtTime(slider.value / 100 * 0.15, audioCtx.currentTime); // cap max gain to 0.15 for comfort
    } else {
        synthVolumeNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
    }
    synthVolumeNode.connect(audioCtx.destination);
}

function playHymnSequence() {
    if (!isPlaying || isMuted) return;

    const note = hymnMelody[currentNoteIndex];
    const freq = noteFrequencies[note.note];
    const duration = note.dur * beatDuration;

    if (freq > 0) {
        // Create retro 8-bit oscillator (Square Wave)
        const oscMelody = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscMelody.type = 'square';
        oscMelody.frequency.setValueAtTime(freq, audioCtx.currentTime);

        // Simple ADSR envelope (Retro clicky sound)
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration - 0.05);

        oscMelody.connect(gainNode);
        gainNode.connect(synthVolumeNode);

        oscMelody.start();
        oscMelody.stop(audioCtx.currentTime + duration);

        // Create simple cheesy sub-octave bass note for retro accompaniment
        if (note.note !== 'rest' && currentNoteIndex % 2 === 0) {
            const oscBass = audioCtx.createOscillator();
            const bassGainNode = audioCtx.createGain();

            oscBass.type = 'triangle';
            oscBass.frequency.setValueAtTime(freq / 2, audioCtx.currentTime); // One octave down

            bassGainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            bassGainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
            bassGainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration - 0.05);

            oscBass.connect(bassGainNode);
            bassGainNode.connect(synthVolumeNode);

            oscBass.start();
            oscBass.stop(audioCtx.currentTime + duration);
        }
    }

    // Update Winamp display time
    updateWinampTime();

    // Visualizer kick
    animateVisualizerKick();

    // Schedule next note
    currentNoteIndex = (currentNoteIndex + 1) % hymnMelody.length;
    playbackTimeout = setTimeout(playHymnSequence, duration * 1000);
}

function startMusic() {
    initAudio();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    if (!isPlaying) {
        isPlaying = true;
        currentNoteIndex = 0;
        playHymnSequence();
    }
}

function stopMusic() {
    isPlaying = false;
    clearTimeout(playbackTimeout);
    currentNoteIndex = 0;
    updateWinampTime(true);
}

function pauseMusic() {
    isPlaying = false;
    clearTimeout(playbackTimeout);
}

// --- Winamp Time & Visualizer ---
let winampSeconds = 0;
let winampInterval = null;

function updateWinampTime(reset = false) {
    const timeDisplay = document.getElementById('winamp-time');
    if (!timeDisplay) return;

    if (reset) {
        winampSeconds = 0;
        clearInterval(winampInterval);
        winampInterval = null;
        timeDisplay.innerText = "00:00";
        return;
    }

    if (isPlaying && !winampInterval) {
        winampInterval = setInterval(() => {
            if (isPlaying) {
                winampSeconds++;
                const mins = Math.floor(winampSeconds / 60).toString().padStart(2, '0');
                const secs = (winampSeconds % 60).toString().padStart(2, '0');
                timeDisplay.innerText = `${mins}:${secs}`;
            }
        }, 1000);
    }
}

// Winamp Canvas Visualizer (renders retro green vertical spectrum bars)
let canvas, ctx;
let visualizerAnimation = null;
let visualizerHeights = Array(20).fill(2);
let targetHeights = Array(20).fill(2);

function setupVisualizer() {
    canvas = document.getElementById('visualizer-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    
    // Set fixed logical size for retro pixel scaling
    canvas.width = 240;
    canvas.height = 30;

    renderVisualizer();
}

function animateVisualizerKick() {
    // Generate random peak heights when a note hits to simulate music frequencies
    for (let i = 0; i < targetHeights.length; i++) {
        targetHeights[i] = Math.floor(Math.random() * 22) + 4;
    }
}

function renderVisualizer() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = 8;
    const barGap = 3;
    const startX = 10;

    for (let i = 0; i < 20; i++) {
        // Interpolate current heights to target heights for smooth falloff
        if (isPlaying) {
            visualizerHeights[i] += (targetHeights[i] - visualizerHeights[i]) * 0.15;
            targetHeights[i] = Math.max(2, targetHeights[i] - 0.5); // Falloff
        } else {
            visualizerHeights[i] += (2 - visualizerHeights[i]) * 0.1; // Smooth rest to flat line
        }

        const h = Math.round(visualizerHeights[i]);

        // Draw segmented green/yellow bars (Winamp style)
        for (let y = 0; y < h; y += 3) {
            let color = '#00ff00'; // Green
            if (y > 15) color = '#ff0000'; // Red top peaks
            else if (y > 10) color = '#ffff00'; // Yellow mid peaks

            ctx.fillStyle = color;
            ctx.fillRect(startX + i * (barWidth + barGap), canvas.height - y - 2, barWidth, 2);
        }
    }

    visualizerAnimation = requestAnimationFrame(renderVisualizer);
}

// --- Guestbook Soul Registration Form Logic ---
function setupSoulForm() {
    const form = document.getElementById('soul-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nameInput = document.getElementById('reg-name');
        const faithSelect = document.getElementById('reg-faith');
        
        if (!nameInput.value.trim()) return;

        const name = nameInput.value.trim();
        const faith = faithSelect.options[faithSelect.selectedIndex].text;
        const dateStr = new Date().toISOString().slice(0, 10);

        // Add to guestbook list DOM
        const guestbook = document.getElementById('guestbook-list');
        const entry = document.createElement('div');
        entry.className = 'guestbook-entry';
        entry.innerText = `${name} - [${faith}] 서약 완료 (${dateStr})`;
        
        // Prepend to list
        if (guestbook.firstChild) {
            guestbook.insertBefore(entry, guestbook.firstChild);
        } else {
            guestbook.appendChild(entry);
        }

        // Show retro System notification dialog alert
        alert(`✍️ [하늘 생명책 시스템 알림] ✍️\n\n축하합니다! ${name} 성도의 영혼 서약서가 생명책 데이터베이스에 완전히 등재되었습니다.\n\n지상의 모든 위선과 칭찬(국민훈장, 장관상 등)을 완벽히 비우십시오.\n오직 하늘의 작은 3층집을 다듬기 위한 헌신과 회개만이 상으로 기록됩니다.\n\n당신은 오늘 지옥 오는 대열에서 벗어났습니다.`);

        // Increment visitor counter by +1 to symbolize soul saved count
        let count = localStorage.getItem('visitorCount');
        if (count) {
            localStorage.setItem('visitorCount', parseInt(count) + 1);
            setupVisitorCounter();
        }

        // Clear form
        nameInput.value = '';
        form.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    });
}

// --- Initialize Page Setup ---
window.addEventListener('DOMContentLoaded', () => {
    setupVisitorCounter();
    setupDraggableWindows();
    setupVisualizer();
    setupSoulForm();

    // Splash Buttons click handlers
    document.getElementById('btn-enter').addEventListener('click', () => {
        document.getElementById('splash-overlay').style.display = 'none';
        startMusic();
    });

    document.getElementById('btn-enter-mute').addEventListener('click', () => {
        document.getElementById('splash-overlay').style.display = 'none';
        isMuted = true;
        // Don't play music
    });

    // Winamp Control buttons
    document.getElementById('play-btn').addEventListener('click', () => {
        isMuted = false;
        startMusic();
    });

    document.getElementById('pause-btn').addEventListener('click', () => {
        pauseMusic();
    });

    document.getElementById('stop-btn').addEventListener('click', () => {
        stopMusic();
    });

    // Volume Slider handler
    const volSlider = document.getElementById('volume-slider');
    volSlider.addEventListener('input', (e) => {
        if (synthVolumeNode && audioCtx) {
            synthVolumeNode.gain.setValueAtTime(e.target.value / 100 * 0.15, audioCtx.currentTime);
        }
    });
});
