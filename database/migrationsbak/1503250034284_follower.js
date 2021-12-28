"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class FollowerSchema extends Schema {
  up() {
    this.create("followers", (table) => {
      table.increments();
      table
        .string("user_id")
        .notNullable()
        .references("id")
        .inTable("twitter_users");
      table
        .string("follower_id")
        .notNullable()
        .references("id")
        .inTable("twitter_users");
      table.timestamps();
    });
  }

  down() {
    this.drop("followers");
  }
}

module.exports = FollowerSchema;
