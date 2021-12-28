"use strict";
const Twitter = require("twit");
const { tokens } = require("../../tokens");
const kue = use("Kue");
const rate_limit = 900;
const rate_window = 15;
class Lookup {
  // If this getter isn't provided, it will default to 1.
  // Increase this number to increase processing concurrency.
  static get concurrency() {
    return 5;
  }

  // This is required. This is a unique key used to identify this job.
  static get key() {
    return "Lookup-job";
  }

  // This is where the work is done.
  async handle(data) {
    let jobsCompleted = [];
    kue.range(0, -1, "asc", function (err, jobs) {
      jobsCompleted = jobs.filter(
        (job) =>
          job.type === "Lookup-job" && (job._state === "complete" || "active")
      );
    });
    if (jobsCompleted > rate_limit - 1) {
      let time = new Date();
      let m = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        d.getHours(),
        d.getMinutes() + rate_window,
        0,
        0
      );
      let timeout = m - time;
      setTimeout(() => {
        const client = new Twitter(tokens);
        const options = {
          user_id: data.user_ids,
          include_entities: false,
        };
        const users = client
          .get("users/lookup", options)
          .then(({ data }) => data);
        return users;
      }, timeout);
    } else {
      const client = new Twitter(tokens);
      const options = {
        user_id: data.user_ids,
        include_entities: false,
      };
      const users = client
        .post("users/lookup", options)
        .then(({ data }) => data)
        .catch((e) => {
          console.log(data);
          console.log("options.user_id: ", options.user_id);
          console.log("data.user_ids.length: ", data.user_ids.length);
        });
      return users;
    }
  }
}

module.exports = Lookup;
