"use strict";

const Task = use("Task");
const { Update } = use("App/Helpers/Update");

class ClearQueue extends Task {
  static get schedule() {
    return "0 */15 * * * *";
  }

  async handle() {
    await Update.retrieve();
  }
}

module.exports = ClearQueue;
