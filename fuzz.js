const ARGS = process.argv.slice(2);
// How many sections to generate
const SECTIONS = ARGS.length > 0 ? parseInt(ARGS[0]) : 20;
// How many doc lines per section
const LINE_PER_SECTION = 300;

// Chance for a line to have an icon
const ICON_CHANCE = 0.2;
// Chance for an icon to be on the document
const ICON_DOC_CHANCE = 0.9;
// Chance for an icon to be on the map
const ICON_MAP_CHANCE = 0.9;
// Chance for a line to have a counter
const COUNTER_CHANCE = 0.2;
// Chance for a line to have a marker
const MARKER_CHANCE = 0.2;
// Range for random movement between lines
const SHIFT_RANGE = 1000;
// Change for movement to be a warp
const WARP_CHANCE = 0.1;
// Chance for a line to have secondary text
const SECONDARY_TEXT_CHANCE = 0.5;
// Chance for a line to be middle length instead of short
const MIDDLE_LENGTH_CHANCE = 0.2;
// Chance for an icon to be primary or secondary
// (will be other otherwise)
const PRIMARY_ICON_CHANCE = 0.1;
const SECONDARY_ICON_CHANCE = 0.1;
// Map bounds
const MAX_X = 6000;
const MAX_Y = 5000;
const MIN_X = -6000;
const MIN_Y = -5000;
const MIN_Z = -1000;
const MAX_Z = 1000;
// Random word length bound
const MIN_WORD_LENGTH = 3;
const MAX_WORD_LENGTH = 10;
const DASH_CHANCE = 0.05;
function randomChars(length) {
    let output = "";
    for (let i = 0; i < length; i++) {
        output += String.fromCharCode(Math.floor(Math.random() * 26) + 97);
    }
    return output;
};

function randomWord() {
    const length = Math.floor(Math.random() * (MAX_WORD_LENGTH - MIN_WORD_LENGTH)) + MIN_WORD_LENGTH;
    const output = randomChars(length);
    if (Math.random() < DASH_CHANCE) {
        let i = Math.floor(Math.random() * length);
        output[i] = "-";
    }
    return output;
};
// Parameters for generating paragraphs
const SHORT_LENGTH_BASE = 2;
const SHORT_LENGTH_RANDOMNESS = 1;
const MIDDLE_LENGTH_BASE = 15;
const MIDDLE_LENGTH_RANDOMNESS = 5;
const LONG_LENGTH_BASE = 50;
const LONG_LENGTH_RANDOMNESS = 20;
const COMMA_CHANCE = 0.1;
// The chance for the sentence to just be a space
const SPACE_CHANCE = 0.01;
// How likely a word is tagged
const TAG_CHANCE = 0.2;
// How likely to switch tags per word
// higher this is, the shorter the phrase in one tag is
const TAG_SWITCH_CHANCE = 0.3;
const TAGPOOL = [
    undefined,
    "location",
    "npc",
    "abc",
    "shrine-counter",
];

function randomSentence(baseLength, randomness, commaChance) {
    if (Math.random() < SPACE_CHANCE) {
        return [{
            text: " ",
        }]
    }
    const minLength = baseLength - randomness;
    const maxLength = baseLength + randomness;
    const length = Math.floor(Math.random() * (maxLength - minLength)) + minLength;
    const blocks = [];
    let currentOutput = randomWord();
    for (let i = 1; i < length; i++) {
        if (Math.random() < commaChance) {
            currentOutput += ", ";
        } else {
            currentOutput += " ";
        }
        currentOutput += randomWord();
        if (Math.random < TAG_SWITCH_CHANCE) {
            const block = {
                text: currentOutput,
            }
            if (Math.random() < TAG_CHANCE) {
                block.tag = TAGPOOL[Math.floor(Math.random() * TAGPOOL.length)];
            }
            blocks.push(block);
            currentOutput = randomWord();
        }
    }
    const block = {
        text: currentOutput,
    }
    if (Math.random() < TAG_CHANCE) {
        // -1 to exclude the undefined
        block.tag = TAGPOOL[Math.floor(Math.random() * TAGPOOL.length-1)];
    }
    blocks.push(block);
    if (blocks[0].text.length > 0) {
        blocks[0].text[0] = blocks[0].text[0].toUpperCase();
    }
    return blocks;
};
function randomShortSentence() {
    return randomSentence(SHORT_LENGTH_BASE, SHORT_LENGTH_RANDOMNESS, 0);
}
function randomMiddleSentence() {
    return randomSentence(MIDDLE_LENGTH_BASE, MIDDLE_LENGTH_RANDOMNESS, COMMA_CHANCE);
}
function randomLongSentence() {
    return randomSentence(LONG_LENGTH_BASE, LONG_LENGTH_RANDOMNESS, COMMA_CHANCE);
}
function removeTags(blocks) {
    return blocks.map(({text}) => text).join("");
};
function randomLineText() {
    if (Math.random() < MIDDLE_LENGTH_CHANCE) {
        return randomMiddleSentence();
    }
    return randomShortSentence();
};
function randomCounterText() {
    const tag = TAGPOOL[Math.floor(Math.random() * TAGPOOL.length)];
    const length = Math.floor(Math.random() * 5);
    const text = randomChars(length);
    return { tag, text };
};
// Notes parameters
// chance for a line to have a note
const NOTE_CHANCE = 0.1;
// chance for notes to have 3 blocks
const NOTE_CHANCE_THREE = 0.05;
// chance for notes to have 2 blocks
const NOTE_CHANCE_TWO = 0.2;
// chance for a note block to be long
const NOTE_LONG_CHANCE = 0.7;
function randomNotes() {
    const x = Math.random();
    let blocks = [];
    function g() {
        if (Math.random() < NOTE_LONG_CHANCE) {
            return randomLongSentence();
        }
        return randomMiddleSentence();
    }
    if (x < NOTE_CHANCE_THREE) {
        blocks.push(toRichText(g()));
    } 
    if (x < NOTE_CHANCE_THREE + NOTE_CHANCE_TWO) {
        blocks.push(toRichText(g()));
    }
    blocks.push(toRichText(g()));
    return blocks;
};
// diagnostic parameters
const DIAGNOSTIC_CHANCE = 0.01;
const ERROR_CHANCE = 0.5;
const DIAGNOSTIC_CONTINUE_CHANCE = 0.3;
const DIAGNOSTIC_SOURCE_POOL = (() => {
    const out = [];
    for (let i = 0; i < 30; i++) {
       out.push(randomWord() + "/" + randomWord()); 
    }
    return out;
})();
const randomDiagnostics = () => {
    const output = [];
    output.push({
        type: Math.random() < ERROR_CHANCE ? "error" : "warn",
        source: DIAGNOSTIC_SOURCE_POOL[Math.floor(Math.random() * DIAGNOSTIC_SOURCE_POOL.length)],
        msg: removeTags(randomMiddleSentence()),
    });
    while (Math.random() < DIAGNOSTIC_CONTINUE_CHANCE) {
        output.push({
            type: Math.random() < ERROR_CHANCE ? "error" : "warn",
            source: DIAGNOSTIC_SOURCE_POOL[Math.floor(Math.random() * DIAGNOSTIC_SOURCE_POOL.length)],
            msg: removeTags(randomMiddleSentence()),
        });
    }
    return output;
};

// Pool of random colors
const COLORPOOL = (() => {
    const colors = [];
    for (let i = 0; i < 5; i++) {
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        colors.push(`rgb(${r}, ${g}, ${b})`);
    }
    return colors;
})();

function randomPoint() {
    return [
        Math.floor(Math.random() * (MAX_X - MIN_X)) + MIN_X, 
        Math.floor(Math.random() * (MAX_Z - MIN_Z)) + MIN_Z,
        Math.floor(Math.random() * (MAX_Y - MIN_Y)) + MIN_Y,
    ];
};

function randomShift(base) {
    return [
        base[0] + Math.floor(Math.random() * SHIFT_RANGE) - SHIFT_RANGE/2,
        base[1] + Math.floor(Math.random() * SHIFT_RANGE) - SHIFT_RANGE/2,
        base[2] + Math.floor(Math.random() * SHIFT_RANGE) - SHIFT_RANGE/2,
    ];
};

function randomColor() {
    return COLORPOOL[Math.floor(Math.random() * COLORPOOL.length)];
};

function toRichText(blocks) {
    function convert({text, tag}) {
        if (!tag) {
            return text;
        }
        return `.${tag}(${text})`;
    }
    if (Array.isArray(blocks)) {
        return blocks.map(convert).join("");
    }
    return convert(blocks);
}
function randomSection() {
    const sectionName = removeTags(randomMiddleSentence());
    const sectionLines = [];
    let currentPoint = randomPoint();
    for (let i = 0; i < LINE_PER_SECTION; i++) {
        const docLineText = toRichText(randomLineText());
        const docLine = {
        };

        if (Math.random() < WARP_CHANCE) {
            // is a warp
            currentPoint = randomPoint();
            docLine.color = randomColor();
            docLine.movements = [{
                to: currentPoint,
                warp: true,
            }];
        } else {
            // is a shift
            currentPoint = randomShift(currentPoint);
            docLine.movements = [];
            while (Math.random() < 0.4) {
                docLine.movements.push({
                    to: randomShift(currentPoint),
                    warp: false,
                });
            }
        }
        // docLine.mapCoord = currentPoint;
        // docLine.otherMovements = []; //TODO too hard to test  with random doc

        // should we have an icon
        docLine["icon-priority"] = 0;
        if (Math.random() < ICON_CHANCE) {
            // is it on the doc
            if (Math.random() < ICON_DOC_CHANCE) {
                docLine["icon-doc"] = "shrine";
            }
            // is it on the map
            if (Math.random() < ICON_MAP_CHANCE) {
                docLine["icon-map"] = "shrine";
                docLine["icon-priority"] = randomIconPriority();
            }
        }

        // should we have a marker
        docLine.markers = [];
        while (Math.random() < MARKER_CHANCE) {
            docLine.markers.push(randomMarker(randomShift(currentPoint)));
        }

        // should we have secondary text
        if (Math.random() < SECONDARY_TEXT_CHANCE) {
            docLine.comment = toRichText(randomLineText());
        }

        // should we have counter text
        if (Math.random() < COUNTER_CHANCE) {
            docLine.counter = toRichText(randomCounterText());
        }

        // should we have notes
        if (Math.random() < NOTE_CHANCE) {
            docLine.notes = randomNotes();
        }

        // TODO: can't specify diagnostics directly
        // should we have diagnostics
        // if (Math.random() < DIAGNOSTIC_CHANCE) {
        //     docLine.diagnostics = randomDiagnostics();
        // } else {
        //     docLine.diagnostics = [];
        // }

        sectionLines.push({
            [docLineText]: docLine,
        });
    }
    return {[sectionName]: sectionLines};
}

function randomIconPriority() {
    const x = Math.random();
    let priority = 2;
    if (x < SECONDARY_ICON_CHANCE) {
        priority = 1;
    } else if (x < SECONDARY_ICON_CHANCE + PRIMARY_ICON_CHANCE) {
        priority = 0;
    }
    return priority;
}

function randomMarker(coord) {
    return {
        at: coord,
        color: randomColor(),
    };
}

const route = [];

for (let i = 0; i < SECTIONS; i++) {
    const docSection = randomSection();
    route.push(docSection);
}

const jsonPayload = JSON.stringify(route);
const fs = require("fs");
fs.writeFileSync("route.json", jsonPayload);
