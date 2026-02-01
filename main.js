const canvas = document.getElementById("scratch-pad");
const ctx = canvas.getContext("2d");

// Set canvas to a fixed size (can be adjusted)
const canvasSize = 200;
canvas.width = canvasSize;
canvas.height = canvasSize;

// Load the glitter image
const glitterImg = new Image();
glitterImg.src = 'assets/glitter.png';

// Audio handling
const bgMusic = document.getElementById('bg-music');

function playMusic() {
    if (bgMusic && bgMusic.paused) {
        bgMusic.play().catch(e => console.log("Audio play failed/blocked:", e));
    }
}

// Attempt play on load and on first interaction
window.addEventListener('load', () => {
    playMusic();
});
window.addEventListener('mousedown', playMusic, { once: true });
window.addEventListener('touchstart', playMusic, { once: true });

// SVG Path Data (Exact match with index.html)
const svgPathString = "M100,57 C100,0 5,0 5,57 C5,114 43,152 100,190 C157,152 195,114 195,57 C195,0 100,0 100,57 Z";
const heartPath = new Path2D(svgPathString);

// Function to draw the heart with inset/debossed effect
function drawGlitterHeart() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw main heart with glitter texture
    ctx.save();
    ctx.clip(heartPath);

    if (glitterImg.complete && glitterImg.naturalWidth > 0) {
        // Move the glitter image a bit up to fill the heart shape better
        ctx.drawImage(glitterImg, 0, -13, canvasSize, canvasSize);
    } else {
        ctx.fillStyle = '#fff5f8';
        ctx.fill(heartPath);
    }
    ctx.restore();

    // 2. Multi-Pass Inset Effect (Simulating CSS inset box-shadow)
    ctx.save();
    ctx.clip(heartPath);

    // Pass 1: Primary inset shadow (Top-Left)
    // Softened pink shadow, blur 11px, offset 3 3
    ctx.shadowColor = 'rgba(180, 130, 140, 0.45)';
    ctx.shadowBlur = 11;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    // Strokes can help define the edge when clipping
    ctx.strokeStyle = 'rgba(180, 130, 140, 0.15)';
    ctx.lineWidth = 4;
    ctx.stroke(heartPath);

    // Pass 2: Sharp white highlight (Bottom-Right)
    // #FFFFFF, blur 9px, offset -3 -3
    ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
    ctx.shadowBlur = 9;
    ctx.shadowOffsetX = -3;
    ctx.shadowOffsetY = -3;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.stroke(heartPath);

    ctx.restore();

    // 3. Final border rim (Subtle definition)
    ctx.save();
    ctx.strokeStyle = 'rgba(180, 130, 140, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke(heartPath);
    ctx.restore();
}

// Draw immediately with fallback, then redraw when image loads
drawGlitterHeart();

// Redraw when image loads
glitterImg.onload = function () {
    drawGlitterHeart();
};

// Handle image load error
glitterImg.onerror = function () {
    console.error('Failed to load glitter image');
    drawGlitterHeart(); // Draw with gradient fallback
};

let isDrawing = false;

// Mouse events
canvas.addEventListener("mousedown", () => {
    isDrawing = true;
});

canvas.addEventListener("mousemove", (e) => {
    if (isDrawing) {
        scratch(e);
    }
});

canvas.addEventListener("mouseup", () => {
    isDrawing = false;
});

canvas.addEventListener("mouseleave", () => {
    isDrawing = false;
});

// Touch events
canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    isDrawing = true;
    scratch(e.touches[0]);
});

canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    if (isDrawing) {
        scratch(e.touches[0]);
    }
});

canvas.addEventListener("touchend", () => {
    isDrawing = false;
});

let isFinished = false;

// Scratch function
function scratch(e) {
    if (isFinished) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // Check progress every few scratches
    handleProgress();
}

let lastCheck = 0;
function handleProgress() {
    const now = Date.now();
    if (now - lastCheck < 200) return; // Limit checks to every 200ms
    lastCheck = now;

    const percentage = getScratchedPercentage();
    if (percentage > 80 && !isFinished) {
        finishScratch();
    }
}

function getScratchedPercentage() {
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let totalHeartPixels = 0;
    let scratchedPixels = 0;

    // Use the path to determine which pixels are part of the original heart
    // For simplicity, we can just check Alpha of the current canvas 
    // since the canvas ONLY contains the heart.
    for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] > 0) { // If pixel is visible (unscratched)
            totalHeartPixels++;
        }
    }

    // We need the original count to compare. Let's estimate based on canvas fill
    // Or more accurately: total pixels = scratched + unscratched visible
    // But since destination-out makes alpha 0, we can't easily know total from just current state
    // Let's use a fixed target or pre-calculate once.
    // Fixed approximation for this heart path at 200x200: ~18000 pixels
    const ESTIMATED_TOTAL = 18000;
    const remaining = totalHeartPixels;
    const scratched = ESTIMATED_TOTAL - remaining;

    return (scratched / ESTIMATED_TOTAL) * 100;
}

function finishScratch() {
    isFinished = true;

    // Clear remaining heart
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "source-over";

    // 1. Confetti!
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    confetti({
        particleCount: 150,
        spread: 70,
        origin: {
            x: centerX / window.innerWidth,
            y: centerY / window.innerHeight
        },
        colors: ['#a53860', '#ffafcc', '#3a7ca5', '#ffffff']
    });

    // 2. Show Button
    const btn = document.getElementById('calendar-button-container');
    btn.classList.remove('opacity-0', 'scale-90', 'pointer-events-none');
    btn.classList.add('opacity-100', 'scale-100', 'pointer-events-auto');
}

