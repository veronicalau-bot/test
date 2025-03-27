// Get the canvas and context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Set canvas size dynamically
function resizeCanvas() {
    const aspectRatio = 600 / 400; // Original height / width
    // Calculate 70% of the viewport width and height
    const targetWidth = window.innerWidth * 0.7;
    const targetHeight = window.innerHeight * 0.7;
    // Determine the limiting dimension while maintaining aspect ratio
    let newWidth = targetWidth;
    let newHeight = newWidth * aspectRatio;
    if (newHeight > targetHeight) {
        newHeight = targetHeight;
        newWidth = newHeight / aspectRatio;
    }
    canvas.width = newWidth;
    canvas.height = newHeight;
    // Scale context for consistent rendering (based on original 400x600)
    ctx.scale(canvas.width / 400, canvas.height / 600);
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Bird properties
let bird = {
    x: 50,
    y: 300,
    width: 20,
    height: 20,
    gravity: 0.6,
    lift: -12,
    velocity: 0,
    flapAngle: 0
};

// Pipe properties
let pipes = [];
let pipeGap = 150;
let pipeFrequency = 90;
let frameCount = 0;
let gameState = "start";
let score = 0;

// Array of random game over messages
const gameOverMessages = [
    "Library Learning Resources Room will be opened until 11:30pm",
    "Try using the Inter-Library Loan Services",
    "You can access the electronic resources by login you account"
];
let currentGameOverMessage = "";

// UI elements
const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

// Function to draw the background
function drawBackground() {
    // Gradient sky
    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(1, "#E0F6FF");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 600);

    // Ground
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(0, 550, 400, 50);
}

// Function to create a new pipe
function createPipe() {
    let pipeHeight = Math.floor(Math.random() * (600 - pipeGap - 100)) + 50;
    pipes.push({
        x: 400,
        topHeight: pipeHeight,
        bottomY: pipeHeight + pipeGap,
        width: 50,
        speed: 2,
        passed: false
    });
}

// Check collision between bird and pipe
function checkCollision(bird, pipe) {
    let birdRight = bird.x + bird.width;
    let birdBottom = bird.y + bird.height;
    let pipeLeft = pipe.x;
    let pipeRight = pipe.x + pipe.width;

    if (birdRight > pipeLeft && bird.x < pipeRight) {
        if (bird.y < pipe.topHeight || birdBottom > pipe.bottomY) {
            return true;
        }
    }
    return false;
}

// Function to wrap text into multiple lines
function wrapText(text, maxWidth) {
    const words = text.split(" ");
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const testLine = currentLine + " " + words[i];
        const testWidth = ctx.measureText(testLine).width;
        if (testWidth <= maxWidth) {
            currentLine = testLine;
        } else {
            lines.push(currentLine);
            currentLine = words[i];
        }
    }
    lines.push(currentLine);
    return lines;
}

// Reset game state
function resetGame() {
    bird.y = 300;
    bird.velocity = 0;
    bird.flapAngle = 0;
    pipes = [];
    frameCount = 0;
    score = 0;
    gameState = "playing";
    gameOverScreen.style.display = "none";
    createPipe();
}

// Game loop
function gameLoop() {
    ctx.clearRect(0, 0, 400, 600);

    // Draw background
    drawBackground();

    if (gameState === "start") {
        startScreen.style.display = "block";
        ctx.fillStyle = "#FFD700";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.fillRect(bird.x, bird.y, bird.width, bird.height);
        ctx.strokeRect(bird.x, bird.y, bird.width, bird.height);
    } else if (gameState === "over") {
        // Set font for game over message (using Arial)
        ctx.font = "20px Arial";
        const maxWidth = 400 - 40;
        const lines = wrapText(currentGameOverMessage, maxWidth);
        const lineHeight = 24;
        const padding = 10;

        // Calculate dimensions of the background box for game over message
        let maxTextWidth = 0;
        lines.forEach(line => {
            const lineWidth = ctx.measureText(line).width;
            maxTextWidth = Math.max(maxTextWidth, lineWidth);
        });
        const boxWidth = maxTextWidth + padding * 2;
        const boxHeight = lines.length * lineHeight + padding * 2;
        const boxX = 400 / 2 - boxWidth / 2;
        const boxY = 100 - (lines.length * lineHeight) / 2 - padding;

        // Draw semi-transparent white background box with border
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 3;
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        // Draw the game over message on top
        ctx.fillStyle = "red";
        lines.forEach((line, index) => {
            const textWidth = ctx.measureText(line).width;
            const textX = 400 / 2 - textWidth / 2;
            const textY = 100 - (lines.length - 1) * lineHeight / 2 + index * lineHeight;
            ctx.fillText(line, textX, textY);
        });

        // Display final score below the game over message (using Press Start 2P)
        ctx.fillStyle = "black";
        ctx.font = "16px 'Press Start 2P'";
        const scoreText = `Score: ${score}`;
        const scoreWidth = ctx.measureText(scoreText).width;
        ctx.fillText(scoreText, 400 / 2 - scoreWidth / 2, 100 + (lines.length * lineHeight) / 2 + 40);

        // Show the game over screen with the Restart button
        gameOverScreen.style.display = "block";
    } else if (gameState === "playing") {
        // Update bird
        bird.velocity += bird.gravity;
        bird.y += bird.velocity;
        bird.flapAngle = Math.min(Math.max(bird.velocity * 2, -20), 20);

        // Fail condition: edges or pipes (include ground collision)
        if (bird.y + bird.height > 550 || bird.y < 0) {
            gameState = "over";
            currentGameOverMessage = gameOverMessages[Math.floor(Math.random() * gameOverMessages.length)];
        }

        // Draw bird with flapping
        ctx.save();
        ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
        ctx.rotate((bird.flapAngle * Math.PI) / 180);
        ctx.fillStyle = "#FFD700";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.fillRect(-bird.width / 2, -bird.height / 2, bird.width, bird.height);
        ctx.strokeRect(-bird.width / 2, -bird.height / 2, bird.width, bird.height);
        ctx.restore();

        // Handle pipes and score
        frameCount++;
        if (frameCount % pipeFrequency === 0) {
            createPipe();
        }

        for (let i = pipes.length - 1; i >= 0; i--) {
            pipes[i].x -= pipes[i].speed;

            // Check if bird passes the pipe
            if (!pipes[i].passed && bird.x > pipes[i].x + pipes[i].width) {
                pipes[i].passed = true;
                score++;
            }

            // Draw pipes with outline
            ctx.fillStyle = "#228B22";
            ctx.strokeStyle = "black";
            ctx.lineWidth = 2;
            ctx.fillRect(pipes[i].x, 0, pipes[i].width, pipes[i].topHeight);
            ctx.strokeRect(pipes[i].x, 0, pipes[i].width, pipes[i].topHeight);
            ctx.fillRect(pipes[i].x, pipes[i].bottomY, pipes[i].width, 600 - pipes[i].bottomY);
            ctx.strokeRect(pipes[i].x, pipes[i].bottomY, pipes[i].width, 600 - pipes[i].bottomY);

            // Check collision
            if (checkCollision(bird, pipes[i])) {
                gameState = "over";
                currentGameOverMessage = gameOverMessages[Math.floor(Math.random() * gameOverMessages.length)];
            }

            // Remove off-screen pipes
            if (pipes[i].x + pipes[i].width < 0) {
                pipes.splice(i, 1);
            }
        }

        // Display score during gameplay with background (using Press Start 2P)
        ctx.font = "20px 'Press Start 2P'";
        const scoreText = `Score: ${score}`;
        const scoreWidth = ctx.measureText(scoreText).width;
        const scorePadding = 10;
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.fillRect(10 - scorePadding, 30 - 20, scoreWidth + scorePadding * 2, 30);
        ctx.fillStyle = "black";
        ctx.fillText(scoreText, 10, 30);
    }

    // Keep the loop running regardless of state
    requestAnimationFrame(gameLoop);
}

// Flap handler for both touch and mouse
function flapHandler(e) {
    e.preventDefault();
    if (gameState === "playing") {
        bird.velocity = bird.lift;
        bird.flapAngle = -20;
    }
}

// Add both touch and mouse events for flapping
canvas.addEventListener("touchstart", flapHandler);
canvas.addEventListener("click", flapHandler);

// Start button handler for both touch and mouse
function startHandler(e) {
    e.preventDefault();
    startScreen.style.display = "none";
    resetGame();
}
startButton.addEventListener("click", startHandler);
startButton.addEventListener("touchstart", startHandler);

// Restart button handler for both touch and mouse
function restartHandler(e) {
    e.preventDefault();
    resetGame();
}
restartButton.addEventListener("click", restartHandler);
restartButton.addEventListener("touchstart", restartHandler);

// Initial setup
gameLoop();