/**
Deals with rendering the the navigation map at the bottom right corner of each player
*/
const Constants = require('../../shared/constants');
const { MAP_SIZE, NAV_MAP_SIZE, OBSTACLES } = Constants;

const Theme = require('../../shared/theme');
const { getCurrentTheme } = Theme;

const canvas = document.getElementById('map-canvas');
const context = canvas.getContext('2d');

// Make the map canvas fullscreen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var navMap = null;

const originX = canvas.width - NAV_MAP_SIZE - 30;
const originY = canvas.height - NAV_MAP_SIZE - 30;

function drawPlayerOnMap(x, y) {
    context.beginPath();
    context.arc(x, y - 2, 2, 0, 2 * Math.PI, false);
    context.fill();
}

function renderPolygon(vertices) {
    context.beginPath();
    context.moveTo(originX + (vertices[0][0] * NAV_MAP_SIZE * 1.0 / MAP_SIZE), originY + (vertices[0][1] * NAV_MAP_SIZE * 1.0 / MAP_SIZE));
    var i = 1;
    while (i < vertices.length) {
        context.lineTo(originX + (vertices[i][0] * NAV_MAP_SIZE * 1.0 / MAP_SIZE), originY + (vertices[i][1] * NAV_MAP_SIZE * 1.0 / MAP_SIZE));
        i++;
    }
    //context.stroke();
    context.fill();
}

function drawObstaclesOnMap() {
    const theme = getCurrentTheme();
    context.save();
    context.fillStyle = theme.minimap.obstacleColor;
    OBSTACLES.forEach(renderPolygon);
    context.restore();
}

function renderMap() {
    const theme = getCurrentTheme();
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Border
    context.strokeStyle = theme.minimap.borderColor;
    context.lineWidth = theme.minimap.borderWidth;
    context.strokeRect(originX, originY, NAV_MAP_SIZE, NAV_MAP_SIZE);

    // Background checkerboard pattern
    context.fillStyle = theme.minimap.background[0];
    context.fillRect(originX, originY, NAV_MAP_SIZE, NAV_MAP_SIZE);
    context.fillStyle = theme.minimap.background[1];
    context.fillRect(originX, originY, NAV_MAP_SIZE / 2, NAV_MAP_SIZE / 2);
    context.fillRect(originX + NAV_MAP_SIZE / 2, originY + NAV_MAP_SIZE / 2, NAV_MAP_SIZE / 2, NAV_MAP_SIZE / 2);

    drawObstaclesOnMap();

    if (navMap) {
        context.lineWidth = 0.1;
        context.fillStyle = '#FF0000';
        navMap.players.forEach(player => {
            drawPlayerOnMap(originX + (player.x * NAV_MAP_SIZE * 1.0 / MAP_SIZE), originY + (player.y * NAV_MAP_SIZE * 1.0 / MAP_SIZE));
        });
        context.fillStyle = '#FFFF00';
        drawPlayerOnMap(originX + (navMap.curr.x * NAV_MAP_SIZE * 1.0 / MAP_SIZE), originY + (navMap.curr.y * NAV_MAP_SIZE * 1.0 / MAP_SIZE));
    }
}

var interval = null;

export function processMapUpdate(update) {
    navMap = update;
}

export function startRenderingMap() {
    interval = setInterval(renderMap, 1000 / 5);
}

export function stopRenderingMap() {
    if (interval) clearInterval(interval);
    context.clearRect(0, 0, canvas.width, canvas.height);
}