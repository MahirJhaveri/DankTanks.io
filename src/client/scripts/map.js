/**
Deals with rendering the the navigation map at the bottom right corner of each player
*/
const Constants = require('../../shared/constants');
const { MAP_SIZE, NAV_MAP_SIZE, OBSTACLES } = Constants;

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
    context.save();
    context.fillStyle = "#926F5B";
    OBSTACLES.forEach(renderPolygon);
    context.restore();
}

function renderMap() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = 'black';
    context.lineWidth = 2;
    context.strokeRect(originX, originY, NAV_MAP_SIZE, NAV_MAP_SIZE);
    context.fillStyle = 'rgba(24, 99, 35, 0.2)';
    context.fillRect(originX, originY, NAV_MAP_SIZE, NAV_MAP_SIZE);
    context.fillStyle = 'rgba(38, 156, 56, 0.2)';
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