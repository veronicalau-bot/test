// Get the canvas and context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Set canvas size dynamically
function resizeCanvas() {
    const aspectRatio = 600 / 400;
    const targetWidth = window.innerWidth * 0.7;
    const targetHeight = window.innerHeight * 0.7;
    let newWidth = targetWidth;
    let newHeight = newWidth * aspectRatio;
    if (newHeight > targetHeight) {
        newHeight = targetHeight;
        newWidth = newHeight / aspectRatio;
    }
    canvas.width = newWidth;
    canvas.height = newHeight;
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
    flapAngle: 0,
    invincible: false,
    invincibleTime: 0,
    flashState: true
};

// Pipe properties
let pipes = [];
let pipeGap = 150;
let pipeFrequency = 90;
let frameCount = 0;
let gameState = "start";
let score = 0;
let countdown = 0; // Countdown timer in frames (60 FPS)

// Questions array (15 questions)
const questions = [
    { text: "Is the sky blue?", answer: true },
    { text: "Can birds fly underwater?", answer: false },
    { text: "Is 2 + 2 equal to 4?", answer: true },
    { text: "Does the sun rise in the west?", answer: false },
    { text: "Is water wet?", answer: true },
    { text: "Can humans breathe in space?", answer: false },
    { text: "Is a square a circle?", answer: false },
    { text: "Does 5 equal 3 + 2?", answer: true },
    { text: "Is ice hot?", answer: false },
    { text: "Do dogs meow?", answer: false },
    { text: "Is the moon made of cheese?", answer: false },
    { text: "Can fish climb trees?", answer: false },
    { text: "Is rain dry?", answer: false },
    { text: "Does 10 divided by 2 equal 5?", answer: true },
    { text: "Is fire cold?", answer: false }
];
let currentQuestionIndex = 0;

// UI elements
const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const questionScreen = document.getElementById("questionScreen");
const wrongAnswerScreen = document.getElementById("wrongAnswerScreen");
const questionText = document.getElementById("questionText");
const wrongAnswerText = document.getElementById("wrongAnswerText");
const yesButton = document.getElementById("yesButton");
const noButton = document.getElementById("noButton");
const nextQuestionButton = document.getElementById("nextQuestionButton");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

// Function to draw the background
function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(1, "#E0F6FF");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 600);
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
    if (bird.invincible) return false;
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

// Reset game state fully (no countdown)
function resetGame() {
    bird.y = 300;
    bird.velocity = 0;
    bird.flapAngle = 0;
    bird.invincible = false;
    bird.invincibleTime = 0;
    pipes = [];
    frameCount = 0;
    score = 0;
    gameState = "playing"; // Start immediately, no countdown
    gameOverScreen.style.display = "none";
    questionScreen.style.display = "none";
    wrongAnswerScreen.style.display = "none";
    createPipe();
}

// Resume game with countdown and invincibility
function resumeGame() {
    bird.y = 300;
    bird.velocity = 0;
    bird.flapAngle = 0;
    bird.invincible = true;
    bird.invincibleTime = 180; // 3 seconds at 60 FPS
    countdown = 180; // 3 seconds countdown
    gameState = "countdown"; // Start with countdown before resuming
    questionScreen.style.display = "none";
    wrongAnswerScreen.style.display = "none";
}

// Show next question
function showQuestion() {
    currentQuestionIndex = (currentQuestionIndex + 1) % questions.length;
    questionText.textContent = questions[currentQuestionIndex].text;
    wrongAnswerScreen.style.display = "none";
    questionScreen.style.display = "flex";
}

// Handle wrong answer
function showWrongAnswer() {
    wrongAnswerText.textContent = `Wrong! Correct answer: ${questions[currentQuestionIndex].answer ? "Yes" : "No"}`;
    questionScreen.style.display = "none";
    wrongAnswerScreen.style.display = "flex";
}

// Handle Yes/No answers
function handleAnswer(userAnswer) {
    if (userAnswer === questions[currentQuestionIndex].answer) {
        resumeGame();
    } else {
        showWrongAnswer();
    }
}

// Game loop
function gameLoop() {
    ctx.clearRect(0, 0, 400, 600);
    drawBackground();

    if (gameState === "start") {
        startScreen.style.display = "block";
        ctx.fillStyle = "#FFD700";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.fillRect(bird.x, bird.y, bird.width, bird.height);
        ctx.strokeRect(bird.x, bird.y, bird.width, bird.height);
    } else if (gameState === "countdown") {
        // Draw bird in starting position
        ctx.fillStyle = "#FFD700";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        if (bird.flashState) { // Flash bird during countdown too
            ctx.fillRect(bird.x, bird.y, bird.width, bird.height);
            ctx.strokeRect(bird.x, bird.y, bird.width, bird.height);
        }
        bird.flashState = !bird.flashState; // Toggle flash

        // Draw countdown
        ctx.font = "40px 'Press Start 2P'";
        const countdownText = Math.ceil(countdown / 60); // Convert frames to seconds
        const textWidth = ctx.measureText(countdownText).width;
        ctx.fillStyle = "white";
        ctx.fillText(countdownText, 400 / 2 - textWidth / 2, 300);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 4;
        ctx.strokeText(countdownText, 400 / 2 - textWidth / 2, 300);

        countdown--;
        if (countdown <= 0) {
            gameState = "playing";
        }
    } else if (gameState === "over") {
        ctx.fillStyle = "black";
        ctx.font = "16px 'Press Start 2P'";
        const scoreText = `Score: ${score}`;
        const scoreWidth = ctx.measureText(scoreText).width;
        ctx.fillText(scoreText, 400 / 2 - scoreWidth / 2, 100);

        showQuestion();
        gameState = "question";
    } else if (gameState === "playing") {
        bird.velocity += bird.gravity;
        bird.y += bird.velocity;
        bird.flapAngle = Math.min(Math.max(bird.velocity * 2, -20), 20);

        if (bird.invincible) {
            bird.invincibleTime--;
            bird.flashState = !bird.flashState;
            if (bird.invincibleTime <= 0) {
                bird.invincible = false;
                bird.flashState = true;
            }
        }

        if (bird.y + bird.height > 550 || bird.y < 0) {
            gameState = "over";
        }

        ctx.save();
        ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
        ctx.rotate((bird.flapAngle * Math.PI) / 180);
        ctx.fillStyle = "#FFD700";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        if (!bird.invincible || bird.flashState) {
            ctx.fillRect(-bird.width / 2, -bird.height / 2, bird.width, bird.height);
            ctx.strokeRect(-bird.width / 2, -bird.height / 2, bird.width, bird.height);
        }
        ctx.restore();

        frameCount++;
        if (frameCount % pipeFrequency === 0) {
            createPipe();
        }

        for (let i = pipes.length - 1; i >= 0; i--) {
            pipes[i].x -= pipes[i].speed;

            if (!pipes[i].passed && bird.x > pipes[i].x + pipes[i].width) {
                pipes[i].passed = true;
                score++;
            }

            ctx.fillStyle = "#228B22";
            ctx.strokeStyle = "black";
            ctx.lineWidth = 2;
            ctx.fillRect(pipes[i].x, 0, pipes[i].width, pipes[i].topHeight);
            ctx.strokeRect(pipes[i].x, 0, pipes[i].width, pipes[i].topHeight);
            ctx.fillRect(pipes[i].x, pipes[i].bottomY, pipes[i].width, 600 - pipes[i].bottomY);
            ctx.strokeRect(pipes[i].x, pipes[i].bottomY, pipes[i].width, 600 - pipes[i].bottomY);

            if (checkCollision(bird, pipes[i])) {
                gameState = "over";
            }

            if (pipes[i].x + pipes[i].width < 0) {
                pipes.splice(i, 1);
            }
        }

        ctx.font = "20px 'Press Start 2P'";
        const scoreText = `Score: ${score}`;
        const scoreWidth = ctx.measureText(scoreText).width;
        const scorePadding = 10;
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.fillRect(10 - scorePadding, 30 - 20, scoreWidth + scorePadding * 2, 30);
        ctx.fillStyle = "black";
        ctx.fillText(scoreText, 10, 30);
    }

    requestAnimationFrame(gameLoop);
}

// Flap handler
function flapHandler(e) {
    e.preventDefault();
    if (gameState === "playing") {
        bird.velocity = bird.lift;
        bird.flapAngle = -20;
    }
}

canvas.addEventListener("touchstart", flapHandler);
canvas.addEventListener("click", flapHandler);

// Start button handler
function startHandler(e) {
    e.preventDefault();
    startScreen.style.display = "none";
    resetGame();
}
startButton.addEventListener("click", startHandler);
startButton.addEventListener("touchstart", startHandler);

// Restart button handler
function restartHandler(e) {
    e.preventDefault();
    resetGame();
}
restartButton.addEventListener("click", restartHandler);
restartButton.addEventListener("touchstart", restartHandler);

// Yes/No button handlers
yesButton.addEventListener("click", () => handleAnswer(true));
yesButton.addEventListener("touchstart", (e) => { e.preventDefault(); handleAnswer(true); });
noButton.addEventListener("click", () => handleAnswer(false));
noButton.addEventListener("touchstart", (e) => { e.preventDefault(); handleAnswer(false); });

// Next question button handler
nextQuestionButton.addEventListener("click", () => {
    wrongAnswerScreen.style.display = "none";
    showQuestion();
});
nextQuestionButton.addEventListener("touchstart", (e) => {
    e.preventDefault();
    wrongAnswerScreen.style.display = "none";
    showQuestion();
});

// Initial setup
gameLoop();
