let instructed, running, ready, readyTime;
const start = "Start", stop = "Stop", mouse = "mouse", keyboard = "keyboard";
let mode = mouse;
let round = 0, attempts = 5, sum = 0, scores;
const btn = document.getElementById("btn");
const circle = document.getElementById("circle");
const attemptsInput = document.getElementById("attempts");
const modeForm = document.getElementById("mode");

const getRandomInt = (min, max = 0) => {
    return Math.floor(Math.random() * (max - min) + min);
};

const delay = async (timeout) => {
    let time;
    await new Promise(r => {
        time = setTimeout(r, timeout);
    });
    clearTimeout(time);
};

const setElement = (element, textContent, style) => {
    if (textContent.trim() !== 0) {
        element.textContent = textContent;
    }
    if (style) {
        Object.assign(element.style, style);
    }
};

const instruct = async () => {
    btn.disabled = true;

    setElement(circle,
        "You will see 3 colors: red, yellow, and green." +
        "\nYour task is to click on the green one as soon as it appears.",
        {backgroundColor: "gray", cursor: "not-allowed", fontSize: "xx-large"});

    await delay(8000);
    btn.disabled = false;
    instructed = true;
};

const run = async () => {
    running = true;
    ready = false;
    const timeout = getRandomInt(2, 7) * 500;
    setElement(circle, "Ready", {backgroundColor: "red", cursor: "auto", fontSize: "xxx-large"});
    await delay(timeout);

    if (!running) {
        btn.disabled = false;
        return;
    }
    setElement(circle, "Steady", {backgroundColor: "yellow"});
    await delay(timeout);

    if (!running) {
        btn.disabled = false;
        return;
    }
    readyTime = Date.now();
    ready = true;
    setElement(circle, "Click", {backgroundColor: "chartreuse"});
};

const restart = () => {
    disableControls(false);
    running = false;
    btn.textContent = start;
    round = sum = 0;
};

const disableControls = (disable) => {
    attemptsInput.disabled = disable;
    modeForm.disabled = disable;
};

const createScores = () => {
    scores = Object.fromEntries(["min", "avg", "max", "misses"].map((key) =>
        [key, {extreme: 0, current: 0}]));
    scores.min.current = scores.min.extreme = scores.avg.extreme = Number.MAX_SAFE_INTEGER;
    scores.misses.extreme = -1;
};

const updateScores = (score) => {
    ++round;
    sum += score;
    const {min, max} = scores;
    min.current = Math.min(min.current, score);
    max.current = Math.max(max.current, score);
};

const updateScoreBoard = () => {
    Object.keys(scores).forEach(key => {
        const score = scores[key];
        const {extreme, current} = score;
        const currentCell = document.getElementById(`${key}-current`);
        const extremeCell = currentCell.previousElementSibling;
        currentCell.textContent = current;
        if ((key === "min" || key === "avg") && extreme > current ||
            (key === "max" || key === "misses") && extreme < current) {
            score.extreme = current;
            extremeCell.textContent = current;
        }
        score.current = 0;
    });
    scores.min.current = Number.MAX_SAFE_INTEGER;
};

const clearScoreBoard = () => {
    Object.keys(scores).forEach(key => {
        document.getElementById(`${key}-current`).textContent = "";
    });
};

const getScore = async () => {
    const score = Date.now() - readyTime;
    if (!running) {
        return;
    }
    if (!ready) {
        scores.misses.current++;
        return;
    }

    updateScores(score);
    if (round < attempts) {
        await run();
    } else {
        scores.avg.current = Math.ceil(sum / round);
        setElement(circle, "Game over\nPress \"Start\" to try again", {backgroundColor: "orange"});
        updateScoreBoard();
        restart();
    }
};

document.addEventListener("DOMContentLoaded", () => {
    attemptsInput.value = attemptsInput.min = attempts;
    modeForm.querySelector(`input[value='${mode}']`).checked = true;
    createScores();
});

attemptsInput.addEventListener("change", (event) => {
    attempts = event.currentTarget.value;
});

btn.addEventListener("click", async () => {
    if (running) {
        if (!ready) {
            btn.disabled = true;
        }
        setElement(circle, "Press \"Start\" to try again", {backgroundColor: "blue"});
        restart();
        return;
    }
    disableControls(true);
    clearScoreBoard();
    btn.textContent = stop;
    if (!instructed) {
        await instruct();
    }
    await run();
});

btn.addEventListener("keydown", async (event) => {
    event.preventDefault();
});

modeForm.addEventListener("change", () => {
    mode = modeForm.querySelector("input[name='mode']:checked").value;
});

circle.addEventListener("click", async () => {
    if (mode === mouse) {
        await getScore();
    }
});

document.addEventListener("keydown", async () => {
    if (mode === keyboard) {
        await getScore();
    }
});