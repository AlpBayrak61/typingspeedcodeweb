require('dotenv').config();
const apiKey = process.env.OPENAI_API_KEY;
let previousAttempts = []; // Array to store previous attempts

async function fetchCodeSnippet() {
    const prompt = "Generate a short function code snippet suitable for a typing speed test"; // Prompt for API

    try {
        // Send request to OpenAI API for code snippet generation
        const response = await axios.post(
            'https://api.openai.com/v1/completions',
            {
                model: "text-davinci-003", // Model to use
                prompt: prompt, // The prompt message
                max_tokens: 100, // Limit the response length
                temperature: 0.7 // Controls randomness
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}` // Authorization header with API key
                }
            }
        );

        // Extract and return the generated code snippet
        const codeSnippet = response.data.choices[0].text.trim();
        return codeSnippet;

    } catch (error) {
        // Handle error in fetching the code snippet
        console.error("Error fetching code snippet from OpenAI API:", error);
        return "function example() {\n    console.log('Error fetching code');\n}"; // Fallback snippet
    }
}


let currentSnippet = "";
let currentPosition = 0;
let startTime;
let timerInterval;
let isStarted = false;

async function startTest() {
    document.getElementById("typingArea").value = "";
    document.getElementById("wpm").innerText = "WPM: 0";
    document.getElementById("accuracy").innerText = "Accuracy: 100%";
    document.getElementById("time").innerText = "Time: 60s";
    document.getElementById("results").innerText = "";
    currentPosition = 0;
    isStarted = false;

    currentSnippet = await fetchCodeSnippet();
    displayCodeSnippet();

    startTime = new Date().getTime();
    let timeLeft = 60;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById("time").innerText = `Time: ${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            calculateResults();
        }
    }, 1000);

    document.getElementById("typingArea").addEventListener("input", checkTyping);
}

function displayCodeSnippet() {
    const highlightedText = currentSnippet
        .split("")
        .map((char, index) => `<span id="char-${index}">${char}</span>`)
        .join("");
    document.getElementById("codeSnippet").innerHTML = highlightedText;
    highlightCurrentChar();
}

function highlightCurrentChar() {
    for (let i = 0; i < currentSnippet.length; i++) {
        const charElement = document.getElementById(`char-${i}`);
        charElement.classList.remove("correct", "incorrect", "current");
    }
    if (currentPosition < currentSnippet.length) {
        document.getElementById(`char-${currentPosition}`).classList.add("current");
    }
}

function checkTyping() {
    const typedText = document.getElementById("typingArea").value;
    if (!isStarted) {
        startTime = new Date().getTime();
        isStarted = true;
    }

    // Handle backspacing
    if (typedText.length < currentPosition) {
        currentPosition--;
        document.getElementById(`char-${currentPosition}`).classList.remove("correct", "incorrect");
        highlightCurrentChar();
        return;
    }

    const currentChar = typedText.slice(-1);
    const correctChar = currentSnippet[currentPosition];

    if (currentChar === correctChar) {
        document.getElementById(`char-${currentPosition}`).classList.add("correct"); // Green for correct
        currentPosition++;
        updateStats();
    } else {
        document.getElementById(`char-${currentPosition}`).classList.add("incorrect"); // Red for incorrect
    }

    highlightCurrentChar();

    if (currentPosition === currentSnippet.length) {
        clearInterval(timerInterval);
        displayResults();
    }
}

function updateStats() {
    let correctChars = document.querySelectorAll(".correct").length;
    const accuracy = (correctChars / currentPosition) * 100 || 0;
    document.getElementById("accuracy").innerText = `Accuracy: ${accuracy.toFixed(2)}%`;
    const timeElapsed = (new Date().getTime() - startTime) / 1000 / 60;
    const wpm = (correctChars / 5) / timeElapsed || 0;
    document.getElementById("wpm").innerText = `WPM: ${wpm.toFixed(2)}`;
}

function displayResults() {
    const wpm = document.getElementById("wpm").innerText;
    const accuracy = document.getElementById("accuracy").innerText;
    const result = `WPM: ${wpm}, ${accuracy}`;
    document.getElementById("results").innerHTML = `<p>Test Completed!</p><p>${result}</p>`;
    previousAttempts.push(result);
    updatePreviousAttempts();
}

function updatePreviousAttempts() {
    const previousAttemptsContainer = document.getElementById("previousAttempts");
    previousAttemptsContainer.innerHTML = "";
    previousAttempts.forEach((attempt, index) => {
        const attemptElement = document.createElement("p");
        attemptElement.textContent = `Attempt ${index + 1}: ${attempt}`;
        previousAttemptsContainer.appendChild(attemptElement);
    });
}