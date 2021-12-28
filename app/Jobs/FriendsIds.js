"use strict";
const Twitter = require("twit");
const { tokens } = require("../../tokens");
const kue = use("Kue");
const rate_limit = 15;
const rate_window = 15;

class FriendsIds {
  // If this getter isn't provided, it will default to 1.
  // Increase this number to increase processing concurrency.
  static get concurrency() {
    return 1;
  }

  // This is required. This is a unique key used to identify this job.
  static get key() {
    return "FriendsIds-job";
  }

  // This is where the work is done.
  async handle(data) {
    let jobsCompleted = [];
    kue.range(0, -1, "asc", function (err, jobs) {
      console.log(
        jobs.filter(
          (job) => job.type === "FriendsIds-job" && job._state === "failed"
        )
      );
      jobsCompleted = jobs.filter(
        (job) =>
          job.type === "FriendsIds-job" &&
          (job._state === "complete" || "active")
      );
    });
    const options = {
      stringify_ids: "true",
      count: "5000",
    };
    data.cursor === 0 ? null : (options.cursor = data.cursor);
    if (data.user_id) {
      options.user_id = data.user_id;
    } else if (data.screen_name) {
      options.screen_name = data.screen_name;
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
      setTimeout(() => {
        const client = new Twitter(tokens);
        const data_object = client
          .get("friends/ids", options)
          .then(({ data }) => {
            return data;
          });
        return data_object;
      }, timeout);
    } else {
      const client = new Twitter(tokens);
      const data_object = client
        .get("friends/ids", options)
        .then(({ data }) => {
          return data;
        });
      return data_object;
    }
  }
}

module.exports = FriendsIds;
