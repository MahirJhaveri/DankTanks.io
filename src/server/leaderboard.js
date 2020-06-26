

class Leaderboard {

    // size is the number of elements in the leaderboard
    constructor(size) {
        this.size = size;
        this.topPlayers = [];  // holds the top size players
    }

    // Return the object to send to each of the players
    // This function also internally resets the leaderboard for the next update
    serializeForUpdate() {
        const result = {}
        var i = 1;
        this.topPlayers.forEach(player => {
            result[i] = {
                username: player[1],
                score: player[2],
            };
            i += 1
        });
        this.reset()
        return result;
    }

    updatePlayerScore(playerID, username, score) {
        if (this.topPlayers.length < this.size) {
            this.topPlayers.push([playerID, username, score]);
            this.sort();
        } else {
            if (score > this.getMinScore()) {
                this.topPlayers[-1] = [playerID, username, score];
                this.sort();
            }
        }
    }

    // Private methods

    // return the player with the minimum score in leaderboard
    getMinScore() {
        return this.topPlayers[this.topPlayers.length - 1][2];
    }

    // Not an actual sorting function just one iteration of bubble sort
    sort() {
        var i = this.topPlayers.length - 1;
        while (i > 0 && this.topPlayers[i - 1][2] < this.topPlayers[i][2]) {
            const temp = this.topPlayers[i];
            this.topPlayers[i] = this.topPlayers[i - 1];
            this.topPlayers[i - 1] = temp;
            i -= 1
        }
    }

    reset() {
        this.topPlayers = [];
    }
}

module.exports = Leaderboard;