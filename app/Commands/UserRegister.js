"use strict";

const { Command } = require("@adonisjs/ace");

class UserRegister extends Command {
  static get signature() {
    return `
    user:register
    { name: name,
      access_token: access token,
      access_token_secret: access token secret,
    }
    `;
  }

  static get description() {
    return "Tell something helpful about this command";
  }

  async handle(args, options) {
    this.info("Dummy implementation for user:register command");
  }
}

module.exports = UserRegister;
