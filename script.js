const dirName = 'music/beethoven_symphonies';

const loadPieces = async () => {
    const response = await fetch(`${dirName}/pieces.txt`);
    const text = await response.text();
    const lines = text.split('\n');
    const pieces = lines.map(line => {
        const index = line.indexOf(':');
        const [name, url] = [line.slice(0, index), line.slice(index + 1)];
        return { name, url: `${dirName}/${url}` };
    });

    return pieces;
}
const paddingStart = 5;
const paddingEnd = 5;
// const selectRandomRange = (length) => new Promise((resolve) => {
//     const piece = pieces[Math.floor(Math.random() * pieces.length)];
//     const audio = new Audio(piece.url);
//     let result;
//     audio.onloadedmetadata = () => {
//         const duration = audio.duration;
//         const start = Math.floor(Math.random() * (duration - paddingStart - paddingEnd - length)) + paddingStart;
//         const end = start + length;
//         result = { audio, start, end, piece };
//     }
//     audio.oncanplaythrough = () => {
//         resolve(result);
//     }
//     audio.load();
// });


let symphoniesFilter = [];
let movementsFilter = [];

const LENGTH = 5
const audioContext = new AudioContext();
const selectRandomRange = async () => {
    console.log("selectRandomRange");
    const filteredPieces = pieces
        .filter(piece => symphoniesFilter.includes(piece.name[0]))
        .filter(piece => movementsFilter.includes(piece.name[1]));
    if (filteredPieces.length === 0) {
        return null;
    }

    const piece = filteredPieces[Math.floor(Math.random() * filteredPieces.length)];

    const response = await fetch(piece.url);
    const buffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(buffer);
    const duration = audioBuffer.duration;
    const start = Math.floor(Math.random() * (duration - paddingStart - paddingEnd - LENGTH)) + paddingStart;
    const end = start + LENGTH;

    return { buffer: audioBuffer, start, end, piece };
};

const playRange = ({ buffer, start, end }) => new Promise((resolve) => {
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0, start, end - start);
    setTimeout(() => {
        source.stop();
        source.disconnect();
        resolve();
    }, LENGTH * 1000);
});

let pieces = null, range = null;

let output, button, input, loading;

let playing = false;

const score = [0, 0];

let streak = 0;

const LOADING = "loading";

const play = async () => {
    if (playing || range === null) {
        return;
    }
    playing = true;
    loading.innerHTML = "Playing...";
    await playRange(range);
    playing = false;
    loading.innerHTML = "";
};
const reveal = async () => {
    if (playing || range === null) {
        return;
    }
    const correct = range.piece.name === input.value.trim();
    if (correct) {
        score[0]++;
        streak++;
    } else {
        streak = 0;
    }
    score[1]++;

    input.value = "";
    const correctText = correct ? "Correct!" : "Incorrect! Correct answer: " + range.piece.name;
    const scoreText = `Score: ${score[0]} / ${score[1]}`;
    const streakText = streak > 1 ? `Streak: ${streak}` : "";
    output.innerHTML = `${correctText}<br/>${scoreText}<br/>${streakText}`;
    range = null;
    loading.innerHTML = "Loading...";
    range = LOADING;
    range = await selectRandomRange();
    loading.innerHTML = "";
};

const click = async () => {
    if (range === LOADING) {
        return;
    }
    if (range === null) {
        reroll();
    } else if (input.value === "") {
        play();
    } else {
        await reveal();
        play();
    }
}

const reroll = async () => {
    loading.innerHTML = "Loading...";
    range = LOADING;
    range = await selectRandomRange();
    loading.innerHTML = "";
    play();
};
const main = async () => {
    output = document.querySelector("#output");
    button = document.querySelector("button");
    input = document.querySelector("input");
    input.value = "";
    loading = document.querySelector("#loading");

    document.querySelectorAll(".radios input").forEach(radio => {
        if (radio.checked) {
            symphoniesFilter = filters[radio.value];
        }
        radio.addEventListener('change', () => {
            symphoniesFilter = filters[radio.value];
        });
    });

    const symphonyCheckboxes = document.querySelectorAll(".symphonies input");
    symphonyCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            symphoniesFilter.push(checkbox.value);
        }
        checkbox.addEventListener('change', () => {
            symphoniesFilter = Array.from(symphonyCheckboxes).filter(checkbox => checkbox.checked).map(checkbox => checkbox.value);
        });
    });


    const movementCheckboxes = document.querySelectorAll(".movements input");
    movementCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            movementsFilter.push(checkbox.value);
        }
        checkbox.addEventListener('change', () => {
            movementsFilter = Array.from(movementCheckboxes).filter(checkbox => checkbox.checked).map(checkbox => checkbox.value);
        });
    });

    loading.innerHTML = "Loading...";
    pieces = await loadPieces();
    loading.innerHTML = "";

    input.addEventListener('keydown', async (evt) => {
        if (evt.key === 'Enter') {
            evt.preventDefault();
            await click();
        }
    });
    button.addEventListener('click', click);
}

window.addEventListener('load', main)