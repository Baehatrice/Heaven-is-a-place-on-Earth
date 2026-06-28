/* ==========================================================================
   Heaven is a place on Earth - 90s/2000s Web 1.0 Retro Interactions
   ========================================================================== */

// --- Global state variables ---
let isHellMode = false;
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
    
    // Different symbols based on theme mode
    const symbols = isHellMode ? ['🔥', '🔱', '💀', '🔥', '🔱'] : ['†', '✨', '✙', '✞', '✠'];
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

const tempoBPM = 110;
const beatDuration = 60 / tempoBPM; // Seconds per beat

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    synthVolumeNode = audioCtx.createGain();
    
    // Set initial volume from slider
    const slider = document.getElementById('volume-slider');
    if (slider) {
        synthVolumeNode.gain.setValueAtTime(slider.value / 100 * 0.15, audioCtx.currentTime); // cap max gain to 0.15
    } else {
        synthVolumeNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
    }
    synthVolumeNode.connect(audioCtx.destination);
}

function playHymnSequence() {
    if (!isPlaying || isMuted) return;

    const activeMelody = isHellMode ? hellMelody : hymnMelody;
    const note = activeMelody[currentNoteIndex];
    const freq = noteFrequencies[note.note];
    
    // Fast arpeggiator beat in Hell mode
    const activeBeatDuration = isHellMode ? 0.35 : beatDuration;
    const duration = note.dur * activeBeatDuration;

    if (freq > 0) {
        // Create retro 8-bit oscillator (Square for heaven, Sawtooth for hellish metal vibe)
        const oscMelody = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscMelody.type = isHellMode ? 'sawtooth' : 'square';
        oscMelody.frequency.setValueAtTime(freq, audioCtx.currentTime);

        // Simple ADSR envelope (Retro clicky sound)
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(isHellMode ? 0.8 : 1, audioCtx.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration - 0.05);

        oscMelody.connect(gainNode);
        gainNode.connect(synthVolumeNode);

        oscMelody.start();
        oscMelody.stop(audioCtx.currentTime + duration);

        // Sub-bass note for accompaniment
        if (note.note !== 'rest' && currentNoteIndex % 2 === 0) {
            const oscBass = audioCtx.createOscillator();
            const bassGainNode = audioCtx.createGain();

            oscBass.type = isHellMode ? 'sawtooth' : 'triangle';
            oscBass.frequency.setValueAtTime(freq / 2, audioCtx.currentTime); // One octave down

            bassGainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            bassGainNode.gain.linearRampToValueAtTime(isHellMode ? 0.35 : 0.3, audioCtx.currentTime + 0.05);
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

// Winamp Canvas Visualizer (renders retro green/red vertical spectrum bars)
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
            targetHeights[i] = Math.max(2, targetHeights[i] - 0.5); // Falloff
        } else {
            visualizerHeights[i] += (2 - visualizerHeights[i]) * 0.1; // Rest
        }

        const h = Math.round(visualizerHeights[i]);

        for (let y = 0; y < h; y += 3) {
            // Spectrum colors change to red/orange in Hell mode
            let color = isHellMode ? '#ff3300' : '#00ff00';
            if (y > 15) {
                color = isHellMode ? '#ffff00' : '#ff0000';
            } else if (y > 10) {
                color = isHellMode ? '#ff9900' : '#ffff00';
            }

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
        
        if (guestbook.firstChild) {
            guestbook.insertBefore(entry, guestbook.firstChild);
        } else {
            guestbook.appendChild(entry);
        }

        alert(`✍️ [하늘 생명책 시스템 알림] ✍️\n\n축하합니다! ${name} 성도의 영혼 서약서가 생명책 데이터베이스에 완전히 등재되었습니다.\n\n지상의 모든 위선과 칭찬(국민훈장, 장관상 등)을 완벽히 비우십시오.\n오직 하늘의 작은 3층집을 다듬기 위한 헌신과 회개만이 상으로 기록됩니다.\n\n당신은 오늘 지옥 오는 대열에서 벗어났습니다.`);

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

// --- Hell Registration Form Logic ---
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

        alert(`💀 [지옥 형벌 대법관 판결 통보] 💀\n\n정죄된 영혼 "${name}"의 지옥 인수 동의가 완전히 승인되어 생명책에서 즉시 말소되었습니다.\n\n너는 영원한 흑암 가운데 구더기와 타는 유황불에서 "물! 물! 물!" 외치며 슬피 울게 될 것입니다.\n\n회개하여 회개기도문을 온 정성으로 낭독하지 않는 한 너의 지옥 형벌은 영원히 지속됩니다.`);

        nameInput.value = '';
        form.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    });
}

// --- Hell Mode Transition Animations ---
function triggerHellTransition() {
    // 1. Shake screen and play scary sound
    document.body.classList.add('shake');
    playScaryDrone();
    
    // 2. Open scary transition dialog overlay after 500ms
    setTimeout(() => {
        document.getElementById('hell-transition-overlay').style.display = 'flex';
    }, 400);
}

function enterGatesOfHell() {
    isHellMode = true;
    
    // Stop shake
    document.body.classList.remove('shake');
    
    // Switch styling mode on body
    document.body.classList.add('mode-hell');
    
    // Toggle Window systems
    document.getElementById('heaven-windows').style.display = 'none';
    document.getElementById('hell-windows').style.display = 'block';
    
    // Modify Titles
    document.getElementById('main-title-text').innerText = 'HELL IS A PLACE ON EARTH';
    document.getElementById('winamp-marquee').innerText = 'Now Playing: Marilyn Manson - Rock Is Dead.mid';
    
    // Close transition dialog
    document.getElementById('hell-transition-overlay').style.display = 'none';
    
    // Force reset synth sequence indices and play fast metal synth arpeggio
    stopMusic();
    isMuted = false;
    startMusic();
}

function repentAndBackToHeaven() {
    // Show beautiful angelic alert
    alert(`✨ [성스러운 하늘 생명책 알림] ✨\n\n당신의 애절하고 진실한 회개 기도가 하늘 제단에 상달되었습니다.\n\n지옥의 문이 굳게 닫히고, 천국 황금길과 하늘 처소가 다시 배치되었습니다!\n\n국민훈장이나 세상의 공적 칭찬을 모두 비우고 오직 골방의 기도와 가난한 거지에게 옷을 주어 상을 쌓으십시오.`);
    
    isHellMode = false;
    
    // Revert body styling
    document.body.classList.remove('mode-hell');
    
    // Toggle Window systems back
    document.getElementById('hell-windows').style.display = 'none';
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

    // Splash Buttons click handlers
    document.getElementById('btn-enter').addEventListener('click', () => {
        document.getElementById('splash-overlay').style.display = 'none';
        startMusic();
    });

    document.getElementById('btn-enter-mute').addEventListener('click', () => {
        document.getElementById('splash-overlay').style.display = 'none';
        // Autoplay muting does not just mute anymore, it triggers a scary hell warning!
        triggerHellTransition();
    });

    // Hell transition buttons
    document.getElementById('btn-enter-hell').addEventListener('click', () => {
        enterGatesOfHell();
    });

    // Repentance backdoor button
    document.getElementById('btn-repent-back').addEventListener('click', () => {
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
