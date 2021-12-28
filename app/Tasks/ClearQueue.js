"use strict";

const Task = use("Task");
const kue = use("Kue");

class ClearQueue extends Task {
  static get schedule() {
    return "0 */15 * * * *";
  }

  async handle() {
    kue.range(0, -1, "asc", function (err, jobs) {
      if (!err) {
        jobs
          .filter((el) => el._state === "complete" || el._state === "failed")
          .forEach(function (job) {
            job.remove();
            console.log(`Removed job of Type ${job.type} with Id ${job.id}`);
          });
      } else {
        console.error(err);
      }
    });
  }
}

module.exports = ClearQueue;
