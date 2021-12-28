"use strict";
const Twitter = require("twit");
const { tokens } = require("../../tokens");
const kue = use("Kue");
const rate_limit = 900;
const rate_window = 15;
class Show {
  // If this getter isn't provided, it will default to 1.
  // Increase this number to increase processing concurrency.
  static get concurrency() {
    return 5;
  }

  // This is required. This is a unique key used to identify this job.
  static get key() {
    return "Show-job";
  }

  // This is where the work is done.
  async handle(data) {
    let jobsCompleted = [];
    kue.range(0, -1, "asc", function (err, jobs) {
      jobsCompleted = jobs.filter(
        (job) =>
          job.type === "Show-job" && (job._state === "complete" || "active")
      );
    });
    const options = {
      include_entities: false,
    };
    if (data.screen_name) {
      options.screen_name = data.screen_name;
    } else if (data.user_id) {
      options.user_id = data.user_id;
    }
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
      setTimeout(async () => {
        const client = new Twitter(tokens);

        const user = await client
          .get("users/show", options)
          .then(({ data }) => data);

        return user;
      }, timeout);
    } else {
      const client = new Twitter(tokens);
      const user = client.get("users/show", options).then(({ data }) => data);
      return user;
    }
  }
}

module.exports = Show;
