"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class MonitorSchema extends Schema {
  up() {
    this.create("monitors", (table) => {
      table.increments();
      table.integer("user_id").unsigned().references("id").inTable("users");
      table
        .string("twitter_user_id")
        .notNullable()
        .references("id")
        .inTable("twitter_users");
      table.timestamps();
    });
  }

  down() {
    this.drop("monitors");
  }
}

module.exports = MonitorSchema;
