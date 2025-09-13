'use strict';

// Image processing module
const imageProcessor = (() => {
    let uploadedImage = null;

    // Constants
    const SYMBOL_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    // Handle image file upload
    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert('Please upload a valid image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedImage = new Image();
            uploadedImage.onload = () => {
                console.log(`Image loaded: ${uploadedImage.width}x${uploadedImage.height}`);
            };
            uploadedImage.onerror = () => {
                alert('Error loading image');
                uploadedImage = null;
            };
            uploadedImage.src = e.target.result;
        };
        reader.onerror = () => {
            alert('Error reading file');
        };
        reader.readAsDataURL(file);
    }

    // Process the uploaded image
    function processImage() {
        if (!uploadedImage) {
            alert('Please upload an image first!');
            return;
        }

        if (appState.isProcessing) {
            return;
        }

        appState.isProcessing = true;
        setLoadingState(true);

        // Use setTimeout to ensure UI updates
        setTimeout(() => {
            try {
                const processedData = processImageData();
                applyProcessedData(processedData);
            } catch (error) {
                console.error('Error processing image:', error);
                alert('Error processing image. Please try again.');
            } finally {
                appState.isProcessing = false;
                setLoadingState(false);
            }
        }, 100);
    }

    // Process image data
    function processImageData() {
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');

        // Set dimensions from config
        appState.gridWidth = config.gridSize;
        appState.gridHeight = config.gridSize;

        tempCanvas.width = appState.gridWidth;
        tempCanvas.height = appState.gridHeight;

        // Draw scaled image
        ctx.drawImage(uploadedImage, 0, 0, appState.gridWidth, appState.gridHeight);

        // Get pixel data
        const imageData = ctx.getImageData(0, 0, appState.gridWidth, appState.gridHeight);
        const pixels = imageData.data;

        // Convert to color map
        const colorMap = createColorMap(pixels, appState.gridWidth, appState.gridHeight);

        // Quantize colors
        return quantizeColors(colorMap, config.colorCount);
    }

    // Create color map from pixel data
    function createColorMap(pixels, width, height) {
        const colorMap = [];

        for (let y = 0; y < height; y++) {
            colorMap[y] = [];
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                colorMap[y][x] = {
                    r: pixels[index],
                    g: pixels[index + 1],
                    b: pixels[index + 2]
                };
            }
        }

        return colorMap;
    }

    // Quantize colors using simplified k-means approach
    function quantizeColors(colorMap, maxColors) {
        const colorFrequency = new Map();

        // Count color frequency
        for (let y = 0; y < colorMap.length; y++) {
            for (let x = 0; x < colorMap[y].length; x++) {
                const color = colorMap[y][x];
                const key = `${color.r},${color.g},${color.b}`;

                if (!colorFrequency.has(key)) {
                    colorFrequency.set(key, {
                        color: color,
                        count: 0,
                        positions: []
                    });
                }

                const entry = colorFrequency.get(key);
                entry.count++;
                entry.positions.push({ x, y });
            }
        }

        // Convert to array and sort by frequency
        let colorArray = Array.from(colorFrequency.values())
            .sort((a, b) => b.count - a.count);

        // Select palette
        let palette = selectPalette(colorArray, maxColors);

        // Create final pattern
        const pattern = createPattern(colorMap, palette);

        return { pattern, palette };
    }

    // Select color palette
    function selectPalette(colorArray, maxColors) {
        let palette;

        if (colorArray.length <= maxColors) {
            // Use all colors if within limit
            palette = colorArray.map((item, index) => ({
                ...item.color,
                symbol: SYMBOL_CHARS[index % SYMBOL_CHARS.length],
                count: item.count
            }));
        } else {
            // Take most frequent colors
            palette = colorArray.slice(0, maxColors).map((item, index) => ({
                ...item.color,
                symbol: SYMBOL_CHARS[index % SYMBOL_CHARS.length],
                count: item.count
            }));

            // Reassign remaining colors to nearest in palette
            for (let i = maxColors; i < colorArray.length; i++) {
                const colorData = colorArray[i];
                const nearest = findNearestColor(colorData.color, palette);
                nearest.count += colorData.count;
            }
        }

        return palette;
    }

    // Create pattern from color map and palette
    function createPattern(colorMap, palette) {
        const pattern = [];

        for (let y = 0; y < colorMap.length; y++) {
            pattern[y] = [];
            for (let x = 0; x < colorMap[y].length; x++) {
                const color = colorMap[y][x];
                const paletteColor = findNearestColor(color, palette);
                pattern[y][x] = paletteColor;
            }
        }

        return pattern;
    }

    // Find nearest color in palette using Euclidean distance
    function findNearestColor(targetColor, palette) {
        let minDistance = Infinity;
        let nearestColor = palette[0];

        for (const paletteColor of palette) {
            const distance = calculateColorDistance(targetColor, paletteColor);

            if (distance < minDistance) {
                minDistance = distance;
                nearestColor = paletteColor;
            }
        }

        return nearestColor;
    }

    // Calculate Euclidean distance between two colors
    function calculateColorDistance(color1, color2) {
        const rDiff = color1.r - color2.r;
        const gDiff = color1.g - color2.g;
        const bDiff = color1.b - color2.b;

        return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
    }

    // Apply processed data to application state
    function applyProcessedData(processedData) {
        appState.pattern = processedData.pattern;
        appState.progress = [];

        updateColorPalette(processedData.palette);
        updateProgress();

        // Resize canvas if needed
        const newCanvasSize = Math.max(
            appState.gridWidth * appState.cellSize,
            appState.gridHeight * appState.cellSize
        );

        if (newCanvasSize > canvasConfig.width) {
            resizeCanvas(newCanvasSize, newCanvasSize);
        }
    }

    // Update color palette UI
    function updateColorPalette(palette) {
        const colorsContainer = document.getElementById('colors');
        colorsContainer.innerHTML = '';

        if (!palette || palette.length === 0) {
            return;
        }

        palette.forEach((color) => {
            const colorBox = createColorBox(color);
            colorsContainer.appendChild(colorBox);
        });
    }

    // Create color box element
    function createColorBox(color) {
        const colorBox = document.createElement('div');
        colorBox.className = 'color-box';
        colorBox.style.backgroundColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
        colorBox.title = `${color.symbol} - ${color.count} diamonds`;
        colorBox.setAttribute('role', 'button');
        colorBox.setAttribute('aria-label', `Color ${color.symbol}, ${color.count} diamonds`);

        // Add count badge
        const countBadge = document.createElement('div');
        countBadge.className = 'count';
        countBadge.textContent = color.count;
        colorBox.appendChild(countBadge);

        // Add click handler
        colorBox.addEventListener('click', () => selectColor(color, colorBox));

        return colorBox;
    }

    // Handle color selection
    function selectColor(color, element) {
        // Remove previous selection
        document.querySelectorAll('.color-box').forEach(box => {
            box.classList.remove('selected');
        });

        // Add selection to clicked color
        element.classList.add('selected');
        appState.selectedColor = color;

        // Update selected color text
        document.getElementById('selectedColor').textContent =
            `Selected color: ${color.symbol}`;
    }

    // Set loading state for UI
    function setLoadingState(isLoading) {
        const processBtn = document.getElementById('processBtn');
        const container = document.querySelector('.container');

        if (isLoading) {
            processBtn.textContent = 'Processing...';
            processBtn.disabled = true;
            container.classList.add('loading');
        } else {
            processBtn.textContent = 'Process Image';
            processBtn.disabled = false;
            container.classList.remove('loading');
        }
    }

    // Public API
    return {
        handleImageUpload,
        processImage
    };
})();

// Bind functions to window for p5.js access
window.handleImageUpload = imageProcessor.handleImageUpload;
window.processImage = imageProcessor.processImage;