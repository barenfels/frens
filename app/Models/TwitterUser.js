"use strict";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use("Model");

class TwitterUser extends Model {
  followers() {
    return this.belongsToMany(
      "App/Models/TwitterUser",
      "user_id",
      "follower_id"
    ).pivotTable("followers");
  }

  following() {
    return this.belongsToMany(
      "App/Models/TwitterUser",
      "follower_id",
      "user_id"
    ).pivotTable("followers");
  }

  linkedUser() {
    return this.belongsTo("App/Models/User", "id", "linked_user");
  }
  monitoredBy() {
    return this.belongsToMany("App/Models/User")
      .pivotTable("monitors")
      .withTimestamps()
      .pivotPrimaryKey(null);
  }
}

module.exports = TwitterUser;
