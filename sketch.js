'use strict';

// Canvas and grid configuration
const canvasConfig = {
    width: 600,
    height: 600
};

// Application state
const appState = {
    pattern: null,
    selectedColor: null,
    progress: [],
    cellSize: 10,
    gridWidth: 30,
    gridHeight: 30,
    isProcessing: false
};

// Configuration settings
const config = {
    gridSize: 30,
    colorCount: 10,
    diamondSize: 10
};

// P5.js setup function
function setup() {
    const canvas = createCanvas(canvasConfig.width, canvasConfig.height);
    canvas.parent('canvas-container');

    setupEventListeners();
}

// P5.js draw function
function draw() {
    background(240);

    if (appState.pattern) {
        drawPattern();
    } else {
        drawEmptyState();
    }
}

// Draw the diamond pattern
function drawPattern() {
    push();

    const totalWidth = appState.gridWidth * appState.cellSize;
    const totalHeight = appState.gridHeight * appState.cellSize;
    const offsetX = (width - totalWidth) / 2;
    const offsetY = (height - totalHeight) / 2;

    translate(offsetX, offsetY);

    // Draw grid cells
    for (let x = 0; x < appState.gridWidth; x++) {
        for (let y = 0; y < appState.gridHeight; y++) {
            drawCell(x, y);
        }
    }

    pop();
}

// Draw individual cell
function drawCell(gridX, gridY) {
    const x = gridX * appState.cellSize;
    const y = gridY * appState.cellSize;
    const filled = appState.progress[gridY] && appState.progress[gridY][gridX];

    if (filled) {
        drawFilledDiamond(x, y, filled);
    } else {
        drawEmptyCell(x, y, appState.pattern[gridY][gridX]);
    }
}

// Draw filled diamond with effect
function drawFilledDiamond(x, y, color) {
    // Base color
    fill(color.r, color.g, color.b);
    noStroke();
    rect(x, y, appState.cellSize, appState.cellSize);

    // Diamond shine effect
    push();

    // Top-left highlight
    fill(255, 60);
    triangle(
        x, y,
        x + appState.cellSize * 0.4, y,
        x, y + appState.cellSize * 0.4
    );

    // Center glow
    fill(255, 40);
    ellipse(
        x + appState.cellSize * 0.3,
        y + appState.cellSize * 0.3,
        appState.cellSize * 0.3
    );

    // Bottom-right shadow
    fill(0, 20);
    triangle(
        x + appState.cellSize, y + appState.cellSize,
        x + appState.cellSize * 0.6, y + appState.cellSize,
        x + appState.cellSize, y + appState.cellSize * 0.6
    );

    pop();
}

// Draw empty cell with symbol
function drawEmptyCell(x, y, targetColor) {
    // Background
    fill(250);
    stroke(200);
    strokeWeight(1);
    rect(x, y, appState.cellSize, appState.cellSize);

    // Color preview
    push();
    noStroke();
    fill(targetColor.r, targetColor.g, targetColor.b, 100);
    rect(x + 2, y + 2, appState.cellSize - 4, appState.cellSize - 4);

    // Symbol
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(appState.cellSize * 0.5);
    text(targetColor.symbol || '', x + appState.cellSize / 2, y + appState.cellSize / 2);
    pop();
}

// Draw empty state message
function drawEmptyState() {
    push();
    textAlign(CENTER, CENTER);
    textSize(16);
    fill(100);
    text('Upload an image to begin', width / 2, height / 2);
    pop();
}

// Handle mouse press events
function mousePressed() {
    if (!appState.pattern || !appState.selectedColor || appState.isProcessing) {
        return;
    }

    const totalWidth = appState.gridWidth * appState.cellSize;
    const totalHeight = appState.gridHeight * appState.cellSize;
    const offsetX = (width - totalWidth) / 2;
    const offsetY = (height - totalHeight) / 2;

    const gridX = floor((mouseX - offsetX) / appState.cellSize);
    const gridY = floor((mouseY - offsetY) / appState.cellSize);

    // Check if click is within grid bounds
    if (gridX >= 0 && gridX < appState.gridWidth && gridY >= 0 && gridY < appState.gridHeight) {
        const targetColor = appState.pattern[gridY][gridX];

        // Check if selected color matches target
        if (colorsMatch(targetColor, appState.selectedColor)) {
            // Fill cell
            if (!appState.progress[gridY]) {
                appState.progress[gridY] = [];
            }
            appState.progress[gridY][gridX] = appState.selectedColor;
            updateProgress();
        }
    }
}

// Check if two colors match
function colorsMatch(color1, color2) {
    return color1.r === color2.r &&
        color1.g === color2.g &&
        color1.b === color2.b;
}

// Update progress bar
function updateProgress() {
    const total = appState.gridWidth * appState.gridHeight;
    let filled = 0;

    for (let y = 0; y < appState.gridHeight; y++) {
        for (let x = 0; x < appState.gridWidth; x++) {
            if (appState.progress[y] && appState.progress[y][x]) {
                filled++;
            }
        }
    }

    const percentage = Math.round((filled / total) * 100);
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    progressBar.style.width = percentage + '%';
    progressBar.setAttribute('aria-valuenow', percentage);
    progressText.textContent = percentage + '% complete';
}

// Setup event listeners
function setupEventListeners() {
    // Image upload
    document.getElementById('imageInput').addEventListener('change', handleImageUpload);
    document.getElementById('processBtn').addEventListener('click', processImage);

    // Configuration controls
    document.getElementById('gridSize').addEventListener('input', handleGridSizeChange);
    document.getElementById('colorCount').addEventListener('input', handleColorCountChange);
    document.getElementById('diamondSize').addEventListener('input', handleDiamondSizeChange);

    // Action buttons
    document.getElementById('clearBtn').addEventListener('click', clearProgress);
    document.getElementById('autoCompleteBtn').addEventListener('click', autoComplete);
}

// Handle grid size change
function handleGridSizeChange(event) {
    config.gridSize = parseInt(event.target.value, 10);
    document.getElementById('gridSizeValue').textContent = `${config.gridSize}x${config.gridSize}`;
}

// Handle color count change
function handleColorCountChange(event) {
    config.colorCount = parseInt(event.target.value, 10);
    document.getElementById('colorCountValue').textContent = config.colorCount;
}

// Handle diamond size change
function handleDiamondSizeChange(event) {
    config.diamondSize = parseInt(event.target.value, 10);
    appState.cellSize = config.diamondSize;
    document.getElementById('diamondSizeValue').textContent = `${config.diamondSize}px`;
}

// Clear all progress
function clearProgress() {
    appState.progress = [];
    updateProgress();
}

// Auto complete functionality
function autoComplete() {
    if (!appState.pattern) {
        alert('Please process an image first!');
        return;
    }

    const modes = {
        '1': { name: 'Instant', fn: fillInstant },
        '2': { name: 'Animated (fast)', fn: () => fillAnimated(10) },
        '3': { name: 'Animated (medium)', fn: () => fillAnimated(50) },
        '4': { name: 'Animated (slow)', fn: () => fillAnimated(100) },
        '5': { name: 'By color', fn: fillByColor }
    };

    const choice = prompt(
        'Choose fill mode:\n' +
        '1 - Instant\n' +
        '2 - Animated (fast)\n' +
        '3 - Animated (medium)\n' +
        '4 - Animated (slow)\n' +
        '5 - By color (fills one color at a time)',
        '1'
    );

    const mode = modes[choice] || modes['1'];
    mode.fn();
}

// Fill pattern instantly
function fillInstant() {
    for (let y = 0; y < appState.gridHeight; y++) {
        if (!appState.progress[y]) {
            appState.progress[y] = [];
        }
        for (let x = 0; x < appState.gridWidth; x++) {
            appState.progress[y][x] = appState.pattern[y][x];
        }
    }

    updateProgress();
}

// Fill pattern with animation
function fillAnimated(delay = 50) {
    const positions = [];

    // Create list of all positions
    for (let y = 0; y < appState.gridHeight; y++) {
        for (let x = 0; x < appState.gridWidth; x++) {
            positions.push({ x, y });
        }
    }

    // Shuffle for more interesting effect
    shuffleArray(positions);

    // Fill with delay
    let index = 0;
    const interval = setInterval(() => {
        if (index >= positions.length) {
            clearInterval(interval);
            updateProgress();
            return;
        }

        const pos = positions[index];
        if (!appState.progress[pos.y]) {
            appState.progress[pos.y] = [];
        }
        appState.progress[pos.y][pos.x] = appState.pattern[pos.y][pos.x];

        updateProgress();
        index++;
    }, delay);
}

// Fill pattern by color groups
function fillByColor() {
    const colorGroups = new Map();

    // Group positions by color
    for (let y = 0; y < appState.gridHeight; y++) {
        for (let x = 0; x < appState.gridWidth; x++) {
            const color = appState.pattern[y][x];
            const key = `${color.r},${color.g},${color.b}`;

            if (!colorGroups.has(key)) {
                colorGroups.set(key, {
                    color: color,
                    positions: []
                });
            }

            colorGroups.get(key).positions.push({ x, y });
        }
    }

    // Convert to array
    const groups = Array.from(colorGroups.values());
    let groupIndex = 0;

    // Fill one color group at a time
    const fillNextGroup = () => {
        if (groupIndex >= groups.length) {
            updateProgress();
            return;
        }

        const group = groups[groupIndex];
        let posIndex = 0;

        const fillPositions = setInterval(() => {
            if (posIndex >= group.positions.length) {
                clearInterval(fillPositions);
                groupIndex++;
                setTimeout(fillNextGroup, 300); // Pause between colors
                return;
            }

            const pos = group.positions[posIndex];
            if (!appState.progress[pos.y]) {
                appState.progress[pos.y] = [];
            }
            appState.progress[pos.y][pos.x] = group.color;

            updateProgress();
            posIndex++;
        }, 20);
    };

    fillNextGroup();
}

// Utility function to shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}