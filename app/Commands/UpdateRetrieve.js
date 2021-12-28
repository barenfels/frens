"use strict";

const { Command } = require("@adonisjs/ace");
/** @type {typeof import('../Helpers/Monitor')} */
const { Update } = use("App/Helpers/Update");

class UpdateRetrieve extends Command {
  static get signature() {
    return `
    update:retrieve
    `;
  }

  static get description() {
    return "Tell something helpful about this command";
  }

  async handle() {
    const action = await Update.retrieve();

    this.info(action);
  }
}

module.exports = UpdateRetrieve;
