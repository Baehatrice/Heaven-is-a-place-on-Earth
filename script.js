/* ==========================================================================
   Heaven is a place on Earth - 90s/2000s Web 1.0 Retro Interactions
   ========================================================================== */

// --- Global state variables ---
let isHellMode = false;
let isShamanismMode = false;
let isHellLaborMode = false;
let maxZIndex = 100;

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

document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastTrailTime < 50) return; // Throttle to prevent lag
    lastTrailTime = now;

    const trail = document.createElement('span');
    trail.className = 'cursor-trail';
    trail.style.left = `${e.pageX - 4}px`;
    trail.style.top = `${e.pageY - 12}px`;
    
    // Choose random color
    trail.style.color = cursorColors[Math.floor(Math.random() * cursorColors.length)];
    
    // Dynamic symbols based on current mode
    let symbols = ['†', '✨', '✙', '✞', '✠']; // default
    if (isHellMode) {
        symbols = ['🔥', '🔱', '💀', '🔥', '🔱'];
    } else if (isShamanismMode) {
        symbols = ['🍀', '🧧', '⛩️', '🏵️', '🔮']; // Shamanic fortune signs
    } else if (isHellLaborMode) {
        symbols = ['⚒️', '⭐', '🚩', '🔥', '☭']; // Socialist/Communist symbols
    }
    
    trail.innerText = symbols[Math.floor(Math.random() * symbols.length)];
    
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

// Frequencies mapping
const noteFrequencies = {
    // Normal Hymn Octave 4/5
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00,
    'A4': 440.00, 'Bb4': 466.16, 'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46,
    
    // Creepy Hell Octave 2/3/4 (diminished / dark notes)
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'Eb3': 155.56, 'E3': 164.81, 'F3': 174.61, 
    'F#3': 185.00, 'G3': 196.00, 'Ab3': 207.65, 'A3': 220.00, 'Bb3': 233.08, 'B3': 246.94,
    'C#4': 277.18, 'D#4': 311.13,
    
    // Shamanic High Bells / Popstar Riffs
    'A5': 880.00, 'B5': 987.77, 'C6': 1046.50, 'C#6': 1109.73, 'D6': 1174.66, 'D#6': 1244.51, 'E6': 1318.51, 'F#6': 1479.98, 'G6': 1567.98,
    
    // Low Bass
    'E2': 82.41, 'G2': 98.00, 'A2': 110.00,
    
    'rest': 0
};

// Heavenly Hymn: "Nearer, My God, to Thee" / "내 주를 가까이 하게 함은"
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

// Spooky Nu-Metal / Diminished Synth Melody for Hell Mode
const hellMelody = [
    { note: 'E3', dur: 0.5 }, { note: 'G3', dur: 0.5 }, { note: 'Bb3', dur: 0.5 }, { note: 'C#4', dur: 0.5 },
    { note: 'E3', dur: 0.5 }, { note: 'G3', dur: 0.5 }, { note: 'Bb3', dur: 0.5 }, { note: 'C#4', dur: 0.5 },
    { note: 'Eb3', dur: 0.5 }, { note: 'F#3', dur: 0.5 }, { note: 'A3', dur: 0.5 }, { note: 'C4', dur: 0.5 },
    { note: 'Eb3', dur: 0.5 }, { note: 'F#3', dur: 0.5 }, { note: 'A3', dur: 0.5 }, { note: 'C4', dur: 0.5 },
    
    { note: 'D3', dur: 0.5 }, { note: 'F3', dur: 0.5 }, { note: 'Ab3', dur: 0.5 }, { note: 'B3', dur: 0.5 },
    { note: 'D3', dur: 0.5 }, { note: 'F3', dur: 0.5 }, { note: 'Ab3', dur: 0.5 }, { note: 'B3', dur: 0.5 },
    { note: 'C#3', dur: 1 }, { note: 'E3', dur: 1 }, { note: 'G3', dur: 1 }, { note: 'Bb3', dur: 1 }
];

// Shamanic Altar ritual: Pentatonic high bell chimes
const shamanMelody = [
    { note: 'A5', dur: 0.5 }, { note: 'C6', dur: 0.5 }, { note: 'D6', dur: 0.5 }, { note: 'E6', dur: 0.5 },
    { note: 'G6', dur: 0.5 }, { note: 'E6', dur: 0.5 }, { note: 'D6', dur: 0.5 }, { note: 'C6', dur: 0.5 },
    { note: 'A5', dur: 0.5 }, { note: 'E6', dur: 0.5 }, { note: 'A5', dur: 0.5 }, { note: 'E6', dur: 0.5 },
    { note: 'G6', dur: 1 }, { note: 'E6', dur: 1 }, { note: 'rest', dur: 1 }
];

// Mechanical Communist Forced Labor Theme: Pounding bass saw waves
const laborMelody = [
    { note: 'C3', dur: 1 }, { note: 'C3', dur: 1 }, { note: 'F#3', dur: 1 }, { note: 'F3', dur: 1 },
    { note: 'C3', dur: 1 }, { note: 'C3', dur: 1 }, { note: 'F#3', dur: 1 }, { note: 'F3', dur: 1 },
    { note: 'Eb3', dur: 1 }, { note: 'Eb3', dur: 1 }, { note: 'A3', dur: 1 }, { note: 'Ab3', dur: 1 },
    { note: 'D3', dur: 2 }, { note: 'C#3', dur: 2 }
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
        synthVolumeNode.gain.setValueAtTime(slider.value / 100 * 0.15, audioCtx.currentTime); 
    } else {
        synthVolumeNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
    }
    synthVolumeNode.connect(audioCtx.destination);
}

function playHymnSequence() {
    if (!isPlaying || isMuted) return;

    // Pick melody based on current mode
    let activeMelody = hymnMelody;
    let synthType = 'square';
    let speedMod = 1.0;

    if (isHellLaborMode) {
        activeMelody = laborMelody;
        synthType = 'sawtooth';
        speedMod = 0.8; // Heavy and slow
    } else if (isShamanismMode) {
        activeMelody = shamanMelody;
        synthType = 'triangle'; // Ringing bells
        speedMod = 1.6; // High tempo ecstasy
    } else if (isHellMode) {
        activeMelody = hellMelody;
        synthType = 'sawtooth';
        speedMod = 1.3;
    }

    const note = activeMelody[currentNoteIndex];
    const freq = noteFrequencies[note.note];
    const duration = note.dur * (beatDuration / speedMod);

    if (freq > 0) {
        const oscMelody = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscMelody.type = synthType;
        oscMelody.frequency.setValueAtTime(freq, audioCtx.currentTime);

        // Simple ADSR envelope
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(isHellMode || isHellLaborMode ? 0.8 : 1, audioCtx.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration - 0.05);

        oscMelody.connect(gainNode);
        gainNode.connect(synthVolumeNode);

        oscMelody.start();
        oscMelody.stop(audioCtx.currentTime + duration);

        // Sub-bass note for accompaniment
        if (note.note !== 'rest' && currentNoteIndex % 2 === 0) {
            const oscBass = audioCtx.createOscillator();
            const bassGainNode = audioCtx.createGain();

            oscBass.type = isHellMode || isHellLaborMode ? 'sawtooth' : 'triangle';
            oscBass.frequency.setValueAtTime(freq / 2, audioCtx.currentTime); 

            bassGainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            bassGainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
            bassGainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration - 0.05);

            oscBass.connect(bassGainNode);
            bassGainNode.connect(synthVolumeNode);

            oscBass.start();
            oscBass.stop(audioCtx.currentTime + duration);
        }
    }

    updateWinampTime();
    animateVisualizerKick();

    currentNoteIndex = (currentNoteIndex + 1) % activeMelody.length;
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

// Play a scary distorted sweep drone (for the transition alert)
function playScaryDrone() {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, audioCtx.currentTime); // Low B drone
    osc.frequency.linearRampToValueAtTime(45, audioCtx.currentTime + 2.5); // sliding down
    
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.35, audioCtx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.8);
    
    osc.connect(gain);
    gain.connect(synthVolumeNode);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 3);
}

// Play a beautiful, shiny chime arpeggio (for the repentance transition back)
function playHeavenlyChime() {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + index * 0.12);
        
        gain.gain.setValueAtTime(0, audioCtx.currentTime + index * 0.12);
        gain.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + index * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + index * 0.12 + 0.6);
        
        osc.connect(gain);
        gain.connect(synthVolumeNode);
        
        osc.start(audioCtx.currentTime + index * 0.12);
        osc.stop(audioCtx.currentTime + index * 0.12 + 0.6);
    });
}

// Play custom popstar tracks (cheesy 8-bit versions)
function playPopstarTrack(starId) {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    stopMusic();
    
    let notes = [];
    let oscType = 'square';
    
    if (starId === 'gaga') {
        // Bad Romance intro hook: A5 B5 C6 A5 C6 A5 G5 F5
        notes = [880.00, 987.77, 1046.50, 880.00, 1046.50, 880.00, 783.99, 698.46];
        oscType = 'triangle';
    } else if (starId === 'manson') {
        // Rock Is Dead chunky riff: E2 G2 E2 A2 G2 E2 rest E2
        notes = [82.41, 98.00, 82.41, 110.00, 98.00, 82.41, 0, 82.41];
        oscType = 'sawtooth';
    } else if (starId === 'nasx') {
        // Montero riff: C#4 D#4 E4 C#4 B3 C#4 D#4
        notes = [277.18, 311.13, 329.63, 277.18, 246.94, 277.18, 311.13];
        oscType = 'sawtooth';
    } else if (starId === 'madonna') {
        // Like A Virgin intro: E5 G5 A5 G5 A5 E5
        notes = [659.25, 783.99, 880.00, 783.99, 880.00, 659.25];
        oscType = 'sine';
    } else if (starId === 'britney') {
        // Toxic high hook: F#6 G6 F#6 D#6 C#6
        notes = [1479.98, 1567.98, 1479.98, 1244.51, 1109.73];
        oscType = 'square';
    }
    
    notes.forEach((freq, index) => {
        if (freq === 0) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = oscType;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + index * 0.15);
        
        gain.gain.setValueAtTime(0, audioCtx.currentTime + index * 0.15);
        gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + index * 0.15 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + index * 0.15 + 0.35);
        
        osc.connect(gain);
        gain.connect(synthVolumeNode);
        
        osc.start(audioCtx.currentTime + index * 0.15);
        osc.stop(audioCtx.currentTime + index * 0.15 + 0.4);
    });
    
    // Resume loop after playing hook
    setTimeout(() => {
        isPlaying = true;
        currentNoteIndex = 0;
        playHymnSequence();
    }, notes.length * 150 + 200);
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

// Winamp Canvas Visualizer
let canvas, ctx;
let visualizerAnimation = null;
let visualizerHeights = Array(20).fill(2);
let targetHeights = Array(20).fill(2);

function setupVisualizer() {
    canvas = document.getElementById('visualizer-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    
    canvas.width = 240;
    canvas.height = 30;

    renderVisualizer();
}

function animateVisualizerKick() {
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
        if (isPlaying) {
            visualizerHeights[i] += (targetHeights[i] - visualizerHeights[i]) * 0.15;
            targetHeights[i] = Math.max(2, targetHeights[i] - 0.5); 
        } else {
            visualizerHeights[i] += (2 - visualizerHeights[i]) * 0.1; 
        }

        const h = Math.round(visualizerHeights[i]);

        for (let y = 0; y < h; y += 3) {
            let color = isHellMode || isHellLaborMode ? '#ff3300' : '#00ff00';
            if (isShamanismMode) {
                color = '#ff00ff'; // neon purple visualizer
            }
            
            if (y > 15) {
                color = isHellMode || isHellLaborMode ? '#ffff00' : (isShamanismMode ? '#00ffff' : '#ff0000');
            } else if (y > 10) {
                color = isHellMode || isHellLaborMode ? '#ff9900' : (isShamanismMode ? '#ffff00' : '#ffff00');
            }

            ctx.fillStyle = color;
            ctx.fillRect(startX + i * (barWidth + barGap), canvas.height - y - 2, barWidth, 2);
        }
    }

    visualizerAnimation = requestAnimationFrame(renderVisualizer);
}

// --- Guestbook Soul Registration Form Logic (Transition to Shamanism Altar) ---
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
        
        if (guestbook.firstChild) {
            guestbook.insertBefore(entry, guestbook.firstChild);
        } else {
            guestbook.appendChild(entry);
        }

        alert(`✍️ [하늘 생명책 시스템 알림] ✍️\n\n축하합니다! ${name} 성도의 영혼 서약서가 생명책 데이터베이스에 완전히 등재되었습니다.\n\n당신은 오늘 지옥 대열에서 임시 탈출하여 복음 전도 사업 전도사로 임명되었습니다. 행정실로 이동합니다!`);

        // Navigate to Shamanic Altar / Evangelism Spam Factory page
        isShamanismMode = true;
        document.getElementById('heaven-windows').style.display = 'none';
        document.getElementById('heaven-shamanism-windows').style.display = 'block';
        document.body.className = '';
        document.body.classList.add('mode-shamanism');
        
        document.getElementById('main-title-text').innerText = 'HEAVEN SPAM FACTORY';
        document.getElementById('winamp-marquee').innerText = 'Now Playing: OOO 목사의 신비의 안수 기복성회 실황.mid';
        
        stopMusic();
        startMusic();
        
        // Start Heaven game loops (Spam system & negligence timer)
        initHeavenSpamGame();

        // Increment visitor counter
        let count = localStorage.getItem('visitorCount');
        if (count) {
            localStorage.setItem('visitorCount', parseInt(count) + 1);
            setupVisitorCounter();
        }

        nameInput.value = '';
        form.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    });
}

// --- Hell Registration Form Logic (Transition to Socialist popstar rave hell) ---
function setupHellForm() {
    const form = document.getElementById('hell-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nameInput = document.getElementById('hell-name');
        if (!nameInput.value.trim()) return;

        const name = nameInput.value.trim();
        const dateStr = new Date().toISOString().slice(0, 10);

        // Add to hell guestbook
        const guestbook = document.getElementById('hell-guestbook-list');
        const entry = document.createElement('div');
        entry.className = 'guestbook-entry';
        entry.style.color = 'red';
        entry.innerText = `${name} - [스스로 배신함] 정죄 완료 (${dateStr})`;
        
        if (guestbook.firstChild) {
            guestbook.insertBefore(entry, guestbook.firstChild);
        } else {
            guestbook.appendChild(entry);
        }

        alert(`💀 [지옥 형벌 대법관 판결 통보] 💀\n\n정죄된 영혼 "${name}"의 지옥 동의가 완전히 접수되었습니다.\n\n귀하는 사상개조 지옥 최고인민위원회 판결에 따라 즉시 일루미나티 팝스타 레이브 수용소로 압송됩니다!`);

        // Navigate to Popstar rave hell
        isHellLaborMode = true;
        isHellMode = false;
        document.getElementById('hell-windows').style.display = 'none';
        document.getElementById('hell-labor-windows').style.display = 'block';
        document.body.className = '';
        document.body.classList.add('mode-hell-labor');
        
        document.getElementById('main-title-text').innerText = 'ILLUMINATI POP-STAR RAVE HELL';
        document.getElementById('winamp-marquee').innerText = 'Now Playing: 지옥 사상개조위원회 강제노역 노동가.mid';
        
        stopMusic();
        startMusic();
        
        // Start labor loops
        initLaborGame();

        nameInput.value = '';
        form.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    });
}

// --- Heaven Mode: Evangelism Spam-Mail Game Logic ---
let uSouls = [
    { name: "세종대왕 (King Sejong)", email: "sejong@chosun.gov" },
    { name: "이순신 (Admiral Yi)", email: "sunshin@turtle.mil" },
    { name: "아마존 야노마미 부족민", email: "yano@forest.org" },
    { name: "강원도 정선 심마니", email: "ginseng@mountain.kr" },
    { name: "조선 옹기장수 장씨", email: "potter@market.co.kr" },
    { name: "태평양 무인도 원주민", email: "island@coral.net" },
    { name: "신라 화랑 김유신", email: "hwarang@silla.net" }
];
let eSouls = [];
let selectedSoulIndex = -1;
let negligenceRate = 0;
let negligenceInterval = null;
let timersInterval = null;

function initHeavenSpamGame() {
    selectedSoulIndex = -1;
    negligenceRate = 0;
    eSouls = [];
    
    // Clear and render lists
    renderUnEvangelizedList();
    document.getElementById('evangelized-soul-list').innerHTML = '<div style="padding: 4px; color: #888;">(전도 스팸 전송 시 여기에 정죄 타이머가 축적됩니다...)</div>';
    document.getElementById('mail-target-email').innerText = "(선택 대기)";
    document.getElementById('btn-send-spam').disabled = true;
    
    // Stop any previous intervals
    clearInterval(negligenceInterval);
    clearInterval(timersInterval);
    
    // Start Negligence Timer: Increases rate by +5% every 3.5 seconds
    negligenceInterval = setInterval(() => {
        if (!isShamanismMode) return;
        
        negligenceRate += 5;
        if (negligenceRate >= 100) {
            negligenceRate = 100;
            updateNegligenceBar();
            clearInterval(negligenceInterval);
            clearInterval(timersInterval);
            
            // Automatic descent to hell!
            alert(`🚨 [하늘 행명국 긴급 경보] 🚨\n\n귀하의 행정 태만율이 100%에 달하여 하늘 영도자로부터 '직무 유기죄'로 즉시 파면 및 지옥 레이브 수용소로의 강제 송환 판결이 떨어졌습니다!`);
            triggerHellTransition();
            setTimeout(() => {
                enterGatesOfHell();
            }, 3000);
        } else {
            updateNegligenceBar();
        }
    }, 3500);

    // Start Damnation timers ticking for evangelized souls
    timersInterval = setInterval(() => {
        if (!isShamanismMode) return;
        eSouls.forEach(soul => {
            soul.time++;
        });
        renderEvangelizedList();
    }, 1000);
}

function renderUnEvangelizedList() {
    const listDiv = document.getElementById('spam-soul-list');
    if (!listDiv) return;
    listDiv.innerHTML = '';
    
    if (uSouls.length === 0) {
        listDiv.innerHTML = '<div style="padding:4px; color:#555; font-style:italic;">미전도자 풀 고갈 (모든 이가 지옥 적격자가 되었습니다!)</div>';
        return;
    }
    
    uSouls.forEach((soul, index) => {
        const item = document.createElement('div');
        item.style.padding = '4px';
        item.style.borderBottom = '1px solid #eee';
        item.style.cursor = 'pointer';
        item.style.fontSize = '11px';
        item.innerHTML = `👤 <strong>${soul.name}</strong><br><span style="color:#666;font-size:9px;">${soul.email}</span>`;
        
        item.addEventListener('click', () => {
            // Highlight item
            Array.from(listDiv.children).forEach(c => c.style.backgroundColor = '');
            item.style.backgroundColor = '#000080';
            item.style.color = '#fff';
            
            selectedSoulIndex = index;
            document.getElementById('mail-target-email').innerText = soul.email;
            document.getElementById('btn-send-spam').disabled = false;
        });
        
        listDiv.appendChild(item);
    });
}

function renderEvangelizedList() {
    const listDiv = document.getElementById('evangelized-soul-list');
    if (!listDiv) return;
    
    if (eSouls.length === 0) {
        listDiv.innerHTML = '<div style="padding: 4px; color: #888;">(전도 스팸 전송 시 여기에 정죄 타이머가 축적됩니다...)</div>';
        return;
    }
    
    listDiv.innerHTML = '';
    eSouls.forEach(soul => {
        const item = document.createElement('div');
        item.style.padding = '4px';
        item.style.borderBottom = '1px dashed #330000';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        
        // Format seconds to mm:ss
        const mins = Math.floor(soul.time / 60).toString().padStart(2, '0');
        const secs = (soul.time % 60).toString().padStart(2, '0');
        
        item.innerHTML = `<span>⚡ [${soul.name}] 복음 접촉 완료</span> <span style="font-weight:bold; color:yellow;">업보 축적: ${mins}:${secs}</span>`;
        listDiv.appendChild(item);
    });
}

function updateNegligenceBar() {
    const bar = document.getElementById('negligence-progress-bar');
    const txt = document.getElementById('negligence-text');
    if (bar && txt) {
        bar.style.width = `${negligenceRate}%`;
        txt.innerText = `태만 지수: ${negligenceRate}%`;
        
        if (negligenceRate > 70) {
            txt.style.color = '#fff';
        } else {
            txt.style.color = '#000';
        }
    }
}

// --- Shamanic Altar Page Specific Interaction Handlers ---
function setupShamanInteractions() {
    const sendSpamBtn = document.getElementById('btn-send-spam');
    
    if (sendSpamBtn) {
        sendSpamBtn.addEventListener('click', () => {
            if (selectedSoulIndex === -1) return;
            
            const soul = uSouls[selectedSoulIndex];
            
            // Move soul from uneventful to damned
            uSouls.splice(selectedSoulIndex, 1);
            eSouls.push({ name: soul.name, email: soul.email, time: 0 });
            
            selectedSoulIndex = -1;
            document.getElementById('mail-target-email').innerText = "(선택 대기)";
            sendSpamBtn.disabled = true;
            
            // Reset Negligence Index
            negligenceRate = 0;
            updateNegligenceBar();
            
            // Play a nice beep/chime
            playShamanBell();
            
            // Re-render
            renderUnEvangelizedList();
            renderEvangelizedList();
            
            // Floating notification alert
            alert(`📨 [전도 메일 전송 성공] 📨\n\n수신자: ${soul.name}\n\n결과:\n대상자가 전도 메일을 전송받았습니다. 이 순간부터 예수를 믿지 않을 시 지옥으로 떨어지는 '불신 죄인 카르마 타이머'가 영원히 정지하지 않고 구동됩니다!\n\n(나의 행정 태만율이 0%로 초기화되었습니다.)`);
        });
    }
}

// --- Hell Mode: Illuminati Pop-Star Rave Party Game Logic ---
let feverLevel = 0;
let feverDecayInterval = null;

function initLaborGame() {
    feverLevel = 0;
    shovelScore = 0;
    
    document.getElementById('shovel-count').innerText = 0;
    updateFeverBar();
    
    clearInterval(feverDecayInterval);
    
    // Decay fever by 5% every 1.5 seconds
    feverDecayInterval = setInterval(() => {
        if (!isHellLaborMode) return;
        if (feverLevel > 0) {
            feverLevel -= 4;
            if (feverLevel < 0) feverLevel = 0;
            updateFeverBar();
        }
    }, 1500);
}

function updateFeverBar() {
    const bar = document.getElementById('party-fever-bar');
    const txt = document.getElementById('party-fever-text');
    if (bar && txt) {
        bar.style.width = `${feverLevel}%`;
        txt.innerText = feverLevel;
    }
}

// Spark colorful floating text inside the party area
function triggerPartyFloatText(text, color = 'yellow') {
    const area = document.getElementById('party-feedback-area');
    if (!area) return;
    
    const span = document.createElement('div');
    span.innerText = text;
    span.style.color = color;
    span.style.fontSize = `${14 + Math.random() * 8}px`;
    span.style.textShadow = `0 0 5px ${color}`;
    span.style.position = 'absolute';
    span.style.left = `${20 + Math.random() * 60}%`;
    span.style.top = '10px';
    span.style.opacity = '1';
    span.style.transition = 'all 0.8s ease-out';
    span.style.pointerEvents = 'none';
    
    area.appendChild(span);
    
    setTimeout(() => {
        span.style.transform = 'translateY(-30px) scale(1.3)';
        span.style.opacity = '0';
    }, 50);
    
    setTimeout(() => {
        span.remove();
    }, 900);
}

// --- Communist Labor Hell Interaction Handlers ---
let shovelScore = 0;
function setupLaborInteractions() {
    const shovelBtn = document.getElementById('btn-shovel');
    const submitBtn = document.getElementById('btn-submit-work');
    
    if (shovelBtn) {
        shovelBtn.addEventListener('click', () => {
            shovelScore++;
            document.getElementById('shovel-count').innerText = shovelScore;
            
            // Rhythm increments fever
            feverLevel += 12;
            if (feverLevel >= 100) {
                feverLevel = 100;
                triggerPartyFloatText("🔥 RAVE FEVER MAX!! ★", '#ffff00');
            } else {
                const twerkSounds = ["*TWERK!*", "*SHAKE IT!*", "*SATELLITE BEAT!*", "*ILLUMINATI EYE!*", "*SO HOT!*", "*MORE SULFUR!*"];
                const colors = ["#ff00ff", "#00ffff", "#ffff00", "#ff0055", "#00ff00"];
                triggerPartyFloatText(
                    twerkSounds[Math.floor(Math.random() * twerkSounds.length)],
                    colors[Math.floor(Math.random() * colors.length)]
                );
            }
            updateFeverBar();
            
            // Play a rhythmic retro click sound
            if (audioCtx) {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(140 + Math.random() * 40, audioCtx.currentTime);
                osc.frequency.linearRampToValueAtTime(70, audioCtx.currentTime + 0.1);
                
                gain.gain.setValueAtTime(0, audioCtx.currentTime);
                gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
                
                osc.connect(gain);
                gain.connect(synthVolumeNode);
                
                osc.start();
                osc.stop(audioCtx.currentTime + 0.15);
            }
        });
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            if (shovelScore === 0) {
                alert("⚒️ 동지여! 빈 손으로 신청서를 제출할 수 없소! 유황 삽질과 댄스를 더 하시오!");
                return;
            }
            
            alert(`⚠️ [지옥 사상수용소 행정위원회 기결 판결] ⚠️\n\n귀하가 제출한 유황 생산품에 부르주아적 기만이 발견되어 전량 압수 처분합니다.\n\n하지만 뜨거운 트월킹 춤사위와 파티 열정(Rave Fever)을 높이 사 사탄 동지의 서명이 담긴 시원한 맥주 1잔 쿠폰이 배급되었습니다!\n\n(형벌 기간은 500년 늘려놓았으니 밤새 춤이나 추십시오!)`);
            
            shovelScore = 0;
            feverLevel = 0;
            document.getElementById('shovel-count').innerText = 0;
            updateFeverBar();
        });
    }
    
    // Add pop-star selector hooks
    const popstars = [
        { id: 'star-gaga', name: 'Lady Gaga', quote: "Gaga 동지: '우리는 지옥을 런웨이로 만들 것입니다! 궁둥이를 더 흔드시오!'" },
        { id: 'star-manson', name: 'Marilyn Manson', quote: "Manson 동지: '종교 보수주의 꼰대들이 지옥을 설계해 놨더군! 개꿀 댄스 클럽이다!'" },
        { id: 'star-nasx', name: 'Lil Nas X', quote: "Lil Nas 동지: '사탄 동지에게 바치는 랩 댄스 속도를 높이시오!'" },
        { id: 'star-madonna', name: 'Madonna', quote: "Madonna 동지: '순결한 척하는 내숭은 집어치우고 비트에 몸을 던져라!'" },
        { id: 'star-britney', name: 'Britney Spears', quote: "Britney 동지: '비트에 맞춰 엉덩이를 흔들며 유황을 캐는 노역이 가장 아름답다!'" }
    ];
    
    popstars.forEach(star => {
        const item = document.getElementById(star.id);
        if (item) {
            item.addEventListener('click', () => {
                // Play custom 8-bit theme melody of the popstar
                playPopstarTrack(star.id.replace('star-', ''));
                
                // Show quote in feedback area
                triggerPartyFloatText(star.name + " SELECT!", '#00ffff');
                alert(`🎶 [일루미나티 팝스타 동지 교신] 🎶\n\n${star.quote}`);
                
                // Change Winamp title text
                document.getElementById('winamp-marquee').innerText = `Now Playing: [Lover Party] ${star.name} - ${item.querySelector('.cyan-text').innerText}.mid`;
            });
        }
    });
}

// --- Hell Mode Transition Animations ---
function triggerHellTransition() {
    document.body.classList.add('shake');
    playScaryDrone();
    
    setTimeout(() => {
        document.getElementById('hell-transition-overlay').style.display = 'flex';
    }, 400);
}

function enterGatesOfHell() {
    isHellMode = true;
    isShamanismMode = false;
    isHellLaborMode = false;
    
    // Clear intervals
    clearInterval(negligenceInterval);
    clearInterval(timersInterval);
    
    // Stop shake
    document.body.classList.remove('shake');
    
    // Switch styling mode on body
    document.body.className = '';
    document.body.classList.add('mode-hell');
    
    // Toggle Window systems
    document.getElementById('heaven-windows').style.display = 'none';
    document.getElementById('heaven-shamanism-windows').style.display = 'none';
    document.getElementById('hell-labor-windows').style.display = 'none';
    document.getElementById('hell-windows').style.display = 'block';
    
    // Modify Titles
    document.getElementById('main-title-text').innerText = 'HELL IS A PLACE ON EARTH';
    document.getElementById('winamp-marquee').innerText = 'Now Playing: Marilyn Manson - Rock Is Dead.mid';
    
    // Close transition dialog
    document.getElementById('hell-transition-overlay').style.display = 'none';
    
    stopMusic();
    isMuted = false;
    startMusic();
}

function repentAndBackToHeaven() {
    alert(`✨ [성스러운 하늘 생명책 알림] ✨\n\n당신의 애절하고 진실한 회개 기도가 하늘 제단에 상달되었습니다.\n\n지옥의 문과 사상개조 수용소의 장벽이 무너지고, 천국 황금길과 하늘 처소가 복구되었습니다!\n\n오직 골방의 기도와 회개로 하늘 처소를 예비하십시오.`);
    
    isHellMode = false;
    isShamanismMode = false;
    isHellLaborMode = false;
    
    // Clear intervals
    clearInterval(negligenceInterval);
    clearInterval(timersInterval);
    clearInterval(feverDecayInterval);
    
    // Revert body styling
    document.body.className = '';
    
    // Toggle Window systems back
    document.getElementById('hell-windows').style.display = 'none';
    document.getElementById('hell-labor-windows').style.display = 'none';
    document.getElementById('heaven-shamanism-windows').style.display = 'none';
    document.getElementById('heaven-windows').style.display = 'block';
    
    // Restore Titles
    document.getElementById('main-title-text').innerText = 'Heaven is a place on Earth';
    document.getElementById('winamp-marquee').innerText = 'Now Playing: OOO 목사의 천국 찬송가 - 내 주를 가까이 하게 함은.mid';
    
    // Play heavenly arpeggio sound and restart normal hymn music loop
    stopMusic();
    playHeavenlyChime();
    
    setTimeout(() => {
        isMuted = false;
        startMusic();
    }, 700);
}

// --- Initialize Page Setup ---
window.addEventListener('DOMContentLoaded', () => {
    setupVisitorCounter();
    setupDraggableWindows();
    setupVisualizer();
    setupSoulForm();
    setupHellForm();
    setupShamanInteractions();
    setupLaborInteractions();

    // Splash Buttons click handlers
    document.getElementById('btn-enter').addEventListener('click', () => {
        document.getElementById('splash-overlay').style.display = 'none';
        startMusic();
    });

    document.getElementById('btn-enter-mute').addEventListener('click', () => {
        document.getElementById('splash-overlay').style.display = 'none';
        triggerHellTransition();
    });

    // Hell transition buttons
    document.getElementById('btn-enter-hell').addEventListener('click', () => {
        enterGatesOfHell();
    });

    // Repentance backdoor buttons
    document.getElementById('btn-repent-back').addEventListener('click', () => {
        repentAndBackToHeaven();
    });
    
    document.getElementById('btn-repent-back-labor').addEventListener('click', () => {
        repentAndBackToHeaven();
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
