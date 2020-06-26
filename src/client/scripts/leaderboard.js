const Constants = require('../../shared/constants');

var leaderboard = null;
var score = 0;

const leaderboardTable = document.getElementById('leaderboard');
const rows = document.querySelectorAll('#leaderboard table tr');
const scorecard = document.getElementById('scorecard');
const scorebox = document.querySelector('#scorecard span');

// Take the contents of the leaderboard variable and actually render it
const renderLeaderboard = () => {
    if (leaderboard != null) {
        for (let i = 0; i < Object.keys(leaderboard).length; i++) {
            rows[i].innerHTML = `<td>${i + 1})</td><td>${escape(leaderboard[i + 1].username.slice(0, 15)) || 'Anonymous'}</td><td>${
                leaderboard[i + 1].score}</td>`;
        }
        for (let i = Object.keys(leaderboard).length; i < 5; i++) {
            rows[i].innerHTML = '<td></td><td></td><td></td>';
        }
    }
    renderScore();
};

const renderScore = () => {
    scorebox.textContent = score;
}

// save the leaderboard to the local leaderboard variable
export const processLeaderboardUpdate = (update) => {
    leaderboard = update.leaderboardUpdate;
    score = update.score;
};

let renderInterval = null;

// Starts updating the contents and rendering of the leaderboard at regular intervals
export const startRenderingLeaderboard = () => {
    // render leaderboard every 100 ms
    console.log('Started rendering leaderboard');
    leaderboardTable.classList.remove('hidden');
    renderInterval = setInterval(renderLeaderboard, 1000 / 10);
    scorecard.classList.remove("hidden");
};

// stops updating and rendering leaderboard
export const stopRenderingLeaderboard = () => {
    leaderboardTable.classList.add('hidden');
    scorecard.classList.add("hidden");
    clearInterval(renderInterval);
};