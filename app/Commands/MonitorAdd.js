"use strict";

const { Command } = require("@adonisjs/ace");
/** @type {typeof import('../Helpers/Monitor')} */
const { Monitor } = use("App/Helpers/Monitor");

class MonitorAdd extends Command {
  static get signature() {
    return `
    monitor:add
    { name: handle to monitor }
    `;
  }

  static get description() {
    return "Tell something helpful about this command";
  }

  async handle({ name }) {
    const action = await Monitor.add(name);

    this.info(action);
  }
}

module.exports = MonitorAdd;
