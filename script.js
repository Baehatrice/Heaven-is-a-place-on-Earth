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
    
    // Shamanic High Bells
    'A5': 880.00, 'C6': 1046.50, 'D6': 1174.66, 'E6': 1318.51, 'G6': 1567.98,
    
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

// Play a high pitch shamanic bell effect (for the anointing button)
function playShamanBell() {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const bellFreqs = [1200, 1500, 1800, 2200];
    bellFreqs.forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq + Math.random() * 50, audioCtx.currentTime + index * 0.05);
        
        gain.gain.setValueAtTime(0, audioCtx.currentTime + index * 0.05);
        gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + index * 0.05 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + index * 0.05 + 0.25);
        
        osc.connect(gain);
        gain.connect(synthVolumeNode);
        
        osc.start(audioCtx.currentTime + index * 0.05);
        osc.stop(audioCtx.currentTime + index * 0.05 + 0.25);
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

        alert(`✍️ [하늘 생명책 시스템 알림] ✍️\n\n축하합니다! ${name} 성도의 영혼 서약서가 생명책 데이터베이스에 완전히 등재되었습니다.\n\n당신은 오늘 지옥 대열에서 임시 탈출하여 목사님의 특별 영적 제단으로 호송됩니다!`);

        // Navigate to Shamanic Altar page
        isShamanismMode = true;
        document.getElementById('heaven-windows').style.display = 'none';
        document.getElementById('heaven-shamanism-windows').style.display = 'block';
        document.body.className = '';
        document.body.classList.add('mode-shamanism');
        
        document.getElementById('main-title-text').innerText = 'SHAMAN CHRISTIAN ALTAR';
        document.getElementById('winamp-marquee').innerText = 'Now Playing: OOO 목사의 신비의 안수 기복성회 실황.mid';
        
        stopMusic();
        startMusic();

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

// --- Hell Registration Form Logic (Transition to Socialist labor hell) ---
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

        alert(`💀 [지옥 형벌 대법관 판결 통보] 💀\n\n정죄된 영혼 "${name}"의 지옥 동의가 완전히 접수되었습니다.\n\n귀하는 사상개조 지옥 최고인민위원회 판결에 따라 즉시 유황 광산 강제노역 수용소로 압송됩니다!`);

        // Navigate to Socialist labor camp hell
        isHellLaborMode = true;
        isHellMode = false;
        document.getElementById('hell-windows').style.display = 'none';
        document.getElementById('hell-labor-windows').style.display = 'block';
        document.body.className = '';
        document.body.classList.add('mode-hell-labor');
        
        document.getElementById('main-title-text').innerText = 'SOCIALIST HELL FORCED LABOR';
        document.getElementById('winamp-marquee').innerText = 'Now Playing: 지옥 사상개조위원회 강제노역 노동가.mid';
        
        stopMusic();
        startMusic();

        nameInput.value = '';
        form.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    });
}

// --- Shamanic Altar Page Specific Interaction Handlers ---
function setupShamanInteractions() {
    // 1. Shamanic healing anointing clicker
    const anointBtn = document.getElementById('btn-shaman-anoint');
    if (anointBtn) {
        anointBtn.addEventListener('click', () => {
            playShamanBell();
            alert(`⚡ [기복주의 안수성령 대성취] ⚡\n\n목사님의 영적 안수 파동이 당신의 정수리를 뚫었습니다!\n\n- 기복 축원: 사업체의 3년 내 매출 300% 상승\n- 질병 퇴치: 가슴 속 한과 정욕의 질병이 떠남\n\n※ 주의: 목사님의 절대 영적 권위에 불순종하거나 물질을 대접하는 손길이 부실할 경우, 이 축복은 3대까지 이어지는 저주와 가난의 살로 즉시 치환됩니다.\n(예배 후 감사 헌금 10만원 감사 복채로 납부 권장)`);
        });
    }

    // 2. Charm download
    const downloadCharmBtn = document.getElementById('btn-download-charm');
    if (downloadCharmBtn) {
        downloadCharmBtn.addEventListener('click', () => {
            alert(`💾 [다운로드 완료] 💾\n\n'예수보혈_액막이_수호부적.png'이 컴퓨터 바탕화면에 다운로드되었습니다.\n\n이 신령한 기독교 부적을 스마트폰 배경화면으로 설정하거나 문앞에 붙여두시면, 집안에 악귀와 귀신이 절대 침입하지 못하고, 사업체에 마귀가 틈타지 못합니다. 십일조를 감사 복채처럼 정직히 바치는 성도는 100배의 현세적 축복을 약속받습니다.`);
        });
    }

    // 3. Tongsung ecstatic prayer (Tongues)
    const prayBtn = document.getElementById('btn-shaman-pray');
    const prayWindow = document.getElementById('window-shaman-prayer');
    if (prayBtn && prayWindow) {
        prayBtn.addEventListener('click', () => {
            // Rapid chaotic beep sound loop for 4 seconds
            let tongueCounter = 0;
            const tongueInterval = setInterval(() => {
                if (tongueCounter > 15) {
                    clearInterval(tongueInterval);
                    prayWindow.classList.remove('shake');
                    document.getElementById('winamp-marquee').innerText = 'Now Playing: OOO 목사의 신비의 안수 기복성회 실황.mid';
                    return;
                }
                // Play random high frequencies
                const randomFreq = 400 + Math.random() * 800;
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                
                osc.type = 'square';
                osc.frequency.setValueAtTime(randomFreq, audioCtx.currentTime);
                
                gain.gain.setValueAtTime(0, audioCtx.currentTime);
                gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
                
                osc.connect(gain);
                gain.connect(synthVolumeNode);
                
                osc.start();
                osc.stop(audioCtx.currentTime + 0.2);
                tongueCounter++;
            }, 180);

            // Shake the tongues window
            prayWindow.classList.add('shake');
            document.getElementById('winamp-marquee').innerText = '🔊 랄랄라 따따따 방언 폭발! 통성기도 엑스타시 가동 중!';
        });
    }
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
            
            // 5 minutes reduced per shovel
            const reduceDays = (shovelScore * 5);
            document.getElementById('shovel-reduce').innerText = reduceDays;
            
            // Play a metallic shovel clink beep
            if (audioCtx) {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(120, audioCtx.currentTime);
                osc.frequency.linearRampToValueAtTime(60, audioCtx.currentTime + 0.1);
                
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
                alert("⚒️ 동지여! 빈 손으로 신청서를 접수할 순 없소! 유황 삽질을 하시오!");
                return;
            }
            
            alert(`⚠️ [지옥 사상개조위원회 재판소 기각 판결] ⚠️\n\n신청인 영혼번호 #HELL-9481의 노동 감형 신청을 각하함!\n\n이유:\n제출된 유황 생산품에 '부르주아식 불평주의'와 '미신에 대한 미련'이 다량 묻어 있음이 성분 검사로 확인되었음. 국가 생산물 가치를 훼손했으므로 전량 몰수 처분하며, 사상 개조 상태가 태만하므로 오히려 형벌 기간을 500년 추가로 연장함.`);
            
            shovelScore = 0;
            document.getElementById('shovel-count').innerText = 0;
            document.getElementById('shovel-reduce').innerText = 0;
        });
    }
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
