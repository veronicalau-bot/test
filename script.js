const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

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

let bird = {
    x: 50,
    y: 300,
    width: 24,
    height: 24,
    gravity: 0.6,
    lift: -12,
    velocity: 0,
    flapAngle: 0,
    invincible: false,
    invincibleTime: 0,
    flashState: true
};

let pipes = [];
let pipeGap = 150;
let pipeFrequency = 90;
let frameCount = 0;
let gameState = "start";
let score = 0;
let countdown = 0;
let attempts = 15;
let finalGameOverTriggered = false;

const questions = [
    { text: "Is rephrasing someone else's idea without citation acceptable?", answer: false, wrongMessage: "Nope. Proper citation is required for rephrasing someone else's idea." },
    { text: "Does academic honesty apply only to written work?", answer: false, wrongMessage: "Nope. Academic honesty extends beyond written assignments. It applies to all format of academic work." },
    { text: "Can accidental omission of a citation be considered plagiarism?", answer: true, wrongMessage: "Nope. Any missing of citations can be considered as plagiarism" },
    { text: "Does plagiarism include copying images and data?", answer: true, wrongMessage: "Nope. You should provide proper citation to ALL formats of sources." },
    { text: "Do you need to cite sources for common knowledge?", answer: false, wrongMessage: "Nope. Citing for common knowledge is not neccessary." },
    { text: "Can you plagiarize your own previous work?", answer: true, wrongMessage: "Nope. Reusing your previous work without proper citation can be considered as self-plagiarism." },
    { text: "Are you allowed to use different citation styles in one work?", answer: false, wrongMessage: "Nope. You are not allowed to mix different citation styles (e.g., APA, Chicago, MLA) within the same work." },
    { text: "Is paraphrasing without proper citation considered plagiarism?", answer: true, wrongMessage: "Nope. Even if you paraphrase the original idea in your own words, proper citation is necessary to avoid plagiarism." },
    { text: "Can you be penalized for a first-time academic dishonesty offense?", answer: true, wrongMessage: "Nope. Breaching the academic honesty policy can lead to serious consequences and may result in disciplinary actions even for a first offense." },
    { text: "Do you need to cite the same source each time you use its information in the same work?", answer: true, wrongMessage: "Nope. You need to provide an in-text citation every time but you only include one entry in the reference list." },
    { text: "Is using a translation without citation plagiarism?", answer: true, wrongMessage: "Nope. Using a translation without citation is also plagiarism." },
    { text: "Can RefWorks help you reference sources?", answer: true, wrongMessage: "Nope. RefWorks can helps you to generate bibliographies and insert citations into your documents, streamlining the research and writing process." },
    { text: "Does APA citation style require the publication year in every in-text citation?", answer: true, wrongMessage: "Nope. In APA style, the information of publication year is included in every citation." },
    { text: "Is the title of a book italicized in an APA reference list entry?", answer: true, wrongMessage: "Nope. In APA style, the title of a book is italicized in the reference list." },
    { text: "Can you use 'ibid.' in Chicago Author-Date style for repeated citations?", answer: false, wrongMessage: "Nope. 'ibid' is used in Chicago's Notes-Bibliography style" }
];
let currentQuestionIndex = 0;

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

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(1, "#E0F6FF");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 600);
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(0, 550, 400, 50);
}

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

function resetGame() {
    bird.y = 300;
    bird.velocity = 0;
    bird.flapAngle = 0;
    bird.invincible = false;
    bird.invincibleTime = 0;
    pipes = [];
    frameCount = 0;
    score = 0;
    attempts = 15;
    gameState = "playing";
    gameOverScreen.style.display = "none";
    document.getElementById("gameOverMessage").textContent = "";
    document.getElementById("finalScoreText").textContent = "";
    questionScreen.style.display = "none";
    wrongAnswerScreen.style.display = "none";
    finalGameOverTriggered = false; // Reset the flag here
    createPipe();
}

function resumeGame() {
    bird.y = 300;
    bird.velocity = 0;
    bird.flapAngle = 0;
    bird.invincible = true;
    bird.invincibleTime = 180;
    countdown = 180;
    gameState = "countdown";
    questionScreen.style.display = "none";
    wrongAnswerScreen.style.display = "none";
    gameOverScreen.style.display = "none";
}

function showQuestion() {
    currentQuestionIndex = (currentQuestionIndex + 1) % questions.length;
    questionText.textContent = questions[currentQuestionIndex].text;
    wrongAnswerScreen.style.display = "none";
    questionScreen.style.display = "flex";
    gameOverScreen.style.display = "none";
    gameState = "question";
    console.log("Showing question:", questions[currentQuestionIndex].text, "State:", gameState);
}

function showWrongAnswer() {
    wrongAnswerText.textContent = questions[currentQuestionIndex].wrongMessage;
    questionScreen.style.display = "none";
    wrongAnswerScreen.style.display = "flex";
    gameOverScreen.style.display = "none";
    gameState = "wrong";
    console.log("Wrong answer screen shown, attempts:", attempts, "Text:", wrongAnswerText.textContent, "State:", gameState);
}

function handleAnswer(userAnswer) {
    console.log("Answer selected:", userAnswer, "Correct:", questions[currentQuestionIndex].answer, "State before:", gameState);
    if (userAnswer === questions[currentQuestionIndex].answer) {
        console.log("Correct answer, resuming game");
        resumeGame();
    } else {
        attempts--;
        console.log("Wrong answer, attempts left:", attempts);
        if (attempts <= 0) {
            gameState = "finalGameOver";
            gameOverScreen.style.display = "flex";
            questionScreen.style.display = "none";
            wrongAnswerScreen.style.display = "none";
            console.log("Game over due to no attempts left, State:", gameState);
        } else {
            showWrongAnswer();
        }
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, 400, 600);
    drawBackground();

    if (gameState === "start") {
        startScreen.style.display = "block";
        gameOverScreen.style.display = "none";
        questionScreen.style.display = "none";
        wrongAnswerScreen.style.display = "none";
        ctx.font = "24px Arial";
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("😵‍💫", bird.x + bird.width / 2, bird.y + bird.height / 2);
    } else if (gameState === "countdown") {
        gameOverScreen.style.display = "none";
        questionScreen.style.display = "none";
        wrongAnswerScreen.style.display = "none";
        if (bird.flashState) {
            ctx.font = "24px Arial";
            ctx.fillStyle = "black";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("😵‍💫", bird.x + bird.width / 2, bird.y + bird.height / 2);
        }
        bird.flashState = !bird.flashState;

        ctx.font = "40px 'Press Start 2P'";
        const countdownText = Math.ceil(countdown / 60);
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
    } else if (gameState === "finalGameOver") {
    gameOverScreen.style.display = "flex";
    document.getElementById("gameOverMessage").textContent = "Game Over";
    document.getElementById("finalScoreText").textContent = `Final Score: ${score}`;
    questionScreen.style.display = "none";
    wrongAnswerScreen.style.display = "none";
    // Send the score to Google Analytics once
    if (!finalGameOverTriggered && typeof gtag === 'function') {
        gtag('event', 'game_over', {
            'event_category': 'game',
            'event_label': 'final_score',
            'value': score
        });
        finalGameOverTriggered = true;
    }
    } else if (gameState === "over") {
        gameOverScreen.style.display = "flex";
        document.getElementById("gameOverMessage").textContent = "Answer to continue!";
        document.getElementById("finalScoreText").textContent = `Score: ${score}`;
        showQuestion();
    } else if (gameState === "question") {
        gameOverScreen.style.display = "none";
        questionScreen.style.display = "flex";
        wrongAnswerScreen.style.display = "none";
    } else if (gameState === "wrong") {
        gameOverScreen.style.display = "none";
        questionScreen.style.display = "none";
        wrongAnswerScreen.style.display = "flex";
    } else if (gameState === "playing") {
        gameOverScreen.style.display = "none";
        questionScreen.style.display = "none";
        wrongAnswerScreen.style.display = "none";
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
            attempts--;
            if (attempts <= 0) {
                gameState = "finalGameOver";
                gameOverScreen.style.display = "flex";
                document.getElementById("gameOverMessage").textContent = "Game Over";
                document.getElementById("finalScoreText").textContent = `Final Score: ${score}`;
            } else {
                gameState = "over";
            }
        }

        ctx.save();
        ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
        ctx.rotate((bird.flapAngle * Math.PI) / 180);
        ctx.font = "24px Arial";
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (!bird.invincible || bird.flashState) {
            ctx.fillText("😵‍💫", 0, 0);
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
                attempts--;
                if (attempts <= 0) {
                    gameState = "finalGameOver";
                    gameOverScreen.style.display = "flex";
                    document.getElementById("gameOverMessage").textContent = "Game Over";
                    document.getElementById("finalScoreText").textContent = `Final Score: ${score}`;
                } else {
                    gameState = "over";
                }
            }

            if (pipes[i].x + pipes[i].width < 0) {
                pipes.splice(i, 1);
            }
        }

        ctx.font = "16px 'Press Start 2P'";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        const scoreText = `Score: ${score}`;
        const attemptsText = `Attempts: ${attempts}`;
        const scoreWidth = ctx.measureText(scoreText).width;
        const attemptsWidth = ctx.measureText(attemptsText).width;
        const padding = 8;

        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.fillRect(5 - padding, 20 - 12, scoreWidth + padding * 2, 24);
        ctx.fillStyle = "black";
        ctx.fillText(scoreText, 5, 20);

        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.fillRect(5 - padding, 40 - 12, attemptsWidth + padding * 2, 24);
        ctx.fillStyle = "black";
        ctx.fillText(attemptsText, 5, 40);
    }

    requestAnimationFrame(gameLoop);
}

function flapHandler(e) {
    e.preventDefault();
    if (gameState === "playing") {
        bird.velocity = bird.lift;
        bird.flapAngle = -20;
    }
}

canvas.addEventListener("touchstart", flapHandler);
canvas.addEventListener("click", flapHandler);

function startHandler(e) {
    e.preventDefault();
    startScreen.style.display = "none";
    attempts = 15;
    resetGame();
}
startButton.addEventListener("click", startHandler);
startButton.addEventListener("touchstart", startHandler);

function restartHandler(e) {
    e.preventDefault();
    resetGame();
    gameState = "start";
    startScreen.style.display = "block";
    gameOverScreen.style.display = "none";
    questionScreen.style.display = "none";
    wrongAnswerScreen.style.display = "none";
}
restartButton.addEventListener("click", restartHandler);
restartButton.addEventListener("touchstart", restartHandler);

yesButton.addEventListener("click", () => {
    console.log("Yes button clicked");
    handleAnswer(true);
});
yesButton.addEventListener("touchstart", (e) => {
    e.preventDefault();
    console.log("Yes button touched");
    handleAnswer(true);
});
noButton.addEventListener("click", () => {
    console.log("No button clicked");
    handleAnswer(false);
});
noButton.addEventListener("touchstart", (e) => {
    e.preventDefault();
    console.log("No button touched");
    handleAnswer(false);
});

nextQuestionButton.addEventListener("click", () => {
    console.log("Next Question clicked");
    wrongAnswerScreen.style.display = "none";
    showQuestion();
});
nextQuestionButton.addEventListener("touchstart", (e) => {
    e.preventDefault();
    console.log("Next Question touched");
    wrongAnswerScreen.style.display = "none";
    showQuestion();
});

gameLoop();
