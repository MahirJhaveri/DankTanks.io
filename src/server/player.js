const Tank = require("./tank");
const Constants = require("../shared/constants");

/**
 * Player - Human-controlled tank
 * Extends Tank with socket-specific input handling
 */
class Player extends Tank {
  constructor(id, username, x, y, tankStyle, fireToogle) {
    super(id, username, x, y, tankStyle);

    // Player-specific properties
    this.fireToogle = fireToogle;
    this.successiveToogle = !fireToogle;
  }

  /**
   * Update player state
   * Overrides Tank.update to handle firing
   */
  update(dt) {
    const { oldX, oldY } = super.update(dt);

    // Handle automatic firing based on cooldown and fire toggle
    if (
      this.fireCooldown <= 0 &&
      (!this.fireToogle || (this.fireToogle && this.successiveToogle))
    ) {
      return this.fire(oldX, oldY, this.fireToogle, this.successiveToogle);
    }
    return null;
  }

  /**
   * Update fire toggle for player input
   */
  updateFireToggle(toggle) {
    if (this.fireToogle) {
      this.successiveToogle = toggle;
    }
  }
}

module.exports = Player;
