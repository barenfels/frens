"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class TwitterUserSchema extends Schema {
  up() {
    this.create("twitter_users", (table) => {
      table.string("id").primary().notNullable().unique();
      table
        .integer("linked_user")
        .unsigned()
        .unique()
        .references("id")
        .inTable("users");
      table.string("name").notNullable();
      table.string("screen_name").notNullable();
      table.string("description");
      table.string("url");
      table.boolean("protected");
      table.integer("followers_count");
      table.integer("friends_count");
      table.integer("listed_count");
      table.string("twitter_created_at");
      table.integer("favourites_count");
      table.boolean("verified");
      table.integer("statuses_count");
      table.string("lang");
      table.string("profile_background_color");
      table.string("profile_image_url");
      table.string("profile_image_url_https");
      table.boolean("default_profile_image");
      table.boolean("unaccessible");
      table.dateTime("created_at", { useTz: true });
      table.dateTime("updated_at", { useTz: true });
    });
  }
  down() {
    this.drop("twitter_users");
  }
}

module.exports = TwitterUserSchema;
