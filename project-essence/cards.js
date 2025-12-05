// Essence Crown: Shard Wars - Card Database
// Generated from raw CSV at src/data/ec_cards_raw.csv

const RAW_CSV_PATH = './src/data/ec_cards_raw.csv';

function readRawCsv() {
    if (typeof module !== 'undefined' && module.exports) {
        const fs = require('fs');
        const path = require('path');
        const resolvedPath = path.join(__dirname, RAW_CSV_PATH);
        return fs.readFileSync(resolvedPath, 'utf8');
    }

    if (typeof XMLHttpRequest !== 'undefined') {
        const request = new XMLHttpRequest();
        request.open('GET', RAW_CSV_PATH, false);
        request.send(null);
        if ((request.status >= 200 && request.status < 400) || request.status === 0) {
            return request.responseText;
        }
    }

    throw new Error(`Unable to load card CSV from ${RAW_CSV_PATH}`);
}

function parseCsv(text, delimiter = '\t') {
    const rows = [];
    let row = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === delimiter && !inQuotes) {
            row.push(current);
            current = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') {
                i++;
            }
            row.push(current);
            rows.push(row);
            row = [];
            current = '';
        } else {
            current += char;
        }
    }

    if (current.length > 0 || row.length > 0) {
        row.push(current);
        rows.push(row);
    }

    return rows.filter(r => r.length > 0);
}

function csvRowsToObjects(rows) {
    if (!rows.length) return [];

    const headers = rows[0].map(header => header.trim());
    const dataRows = rows.slice(1);

    return dataRows
        .filter(r => r.some(cell => (cell ?? '').trim() !== ''))
        .map(cols => {
            const obj = {};
            headers.forEach((header, idx) => {
                if (!header) return;
                obj[header] = cols[idx] !== undefined ? cols[idx] : '';
            });
            return obj;
        });
}

function toNumber(value) {
    if (value === undefined || value === null || value === '') return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
}

function parseType(rawType) {
    const typeText = rawType || '';
    const separatorIndex = typeText.indexOf('—');

    if (separatorIndex === -1) {
        return {
            baseType: typeText.trim(),
            aspects: []
        };
    }

    const baseType = typeText.slice(0, separatorIndex).trim();
    const aspectText = typeText.slice(separatorIndex + 1).trim();
    const aspects = aspectText
        ? aspectText.split('/')
            .map(a => a.trim())
            .filter(Boolean)
        : [];

    return { baseType, aspects };
}

function mapCsvRow(row) {
    const { baseType, aspects } = parseType(row['Type'] || '');
    const power = toNumber(row['Power']);
    const toughness = toNumber(row['Toughness']);
    const essenceValue = toNumber(row['Essence']);
    const costValue = toNumber(row['Cost']);

    const card = {
        id: (row['CardID'] || '').trim(),
        name: row['Name'] || '',
        rarity: row['Rarity'] || '',
        type: baseType || (row['Type'] || '').trim(),
        rawType: row['Type'] || '',
        aspects,
        cost: costValue ?? 0,
        essence: essenceValue ?? null,
        klInfo: row['KLInfo'] || '',
        power: power ?? null,
        toughness: toughness ?? null,
        domain: row['Domain'] || '',
        effect: row['RulesText'] || '',
        stats: row['Stats'] || '',
        image: row['imageUrl'] || ''
    };

    if (row['Unnamed: 1']) {
        card.unnamed1 = row['Unnamed: 1'];
    }

    return card;
}

const RAW_CSV_TEXT = readRawCsv();
const CSV_ROWS = csvRowsToObjects(parseCsv(RAW_CSV_TEXT));
const CARD_BACK_ROW = CSV_ROWS.find(row => (row.CardID || '').trim().toLowerCase() === 'back');
const CARD_BACK_IMAGE = CARD_BACK_ROW?.imageUrl || 'https://cdn1.sharemyimage.com/2025/12/02/Back.png';

const MAPPED_CARDS = CSV_ROWS
    .filter(row => {
        const id = (row.CardID || '').trim();
        return id && id.toLowerCase() !== 'back';
    })
    .map(mapCsvRow);

const DEITY_DATABASE = MAPPED_CARDS.filter(card => (card.type || '').toLowerCase() === 'deity');
const CARD_DATABASE = MAPPED_CARDS.filter(card => (card.type || '').toLowerCase() !== 'deity');

// Create combined ALL_CARDS array with normalized properties
// Cards use power/toughness but game engine expects attack/health
const ALL_CARDS = [...CARD_DATABASE, ...DEITY_DATABASE].map(card => ({
    ...card,
    // Normalize Avatar stats: power -> attack, toughness -> health
    attack: card.attack ?? card.power ?? 0,
    health: card.health ?? card.toughness ?? card.essence ?? 0
}));

// Helper function to get all deities
function getDeities() {
    return DEITY_DATABASE;
}

// Helper function to get all non-deity cards
function getPlayableCards() {
    return CARD_DATABASE;
}

// Helper function to find a card by ID
function getCardById(id) {
    return ALL_CARDS.find(c => c.id === id);
}

// Export for use in game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CARD_DATABASE, DEITY_DATABASE, CARD_BACK_IMAGE, ALL_CARDS, getDeities, getPlayableCards, getCardById };
}
