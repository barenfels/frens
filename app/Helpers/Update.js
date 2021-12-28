const TwitterUser = use("App/Models/TwitterUser");
const User = use("App/Models/User");
const kue = use("Kue");
const Show = use("App/Jobs/Show");
const FriendsIds = use("App/Jobs/FriendsIds");
const Lookup = use("App/Jobs/Lookup");
const Event = use("Event");

class Update {
  static async retrieve() {
    let account = await User.find(1);
    let monitors = await account.monitors().ids();
    for (let monitored of monitors) {
      let user = await TwitterUser.find(monitored);
      const params = {
        data: { account_id: account.id, user_id: user.id },
        priority: "normal",
        attempts: 1,
        remove: false,
        jobFn: (job) => {
          job.backoff();
        },
      };
      const job = kue.dispatch(Show.key, params.data, params);
      const user_info = await job.result;
      console.log("old:", user.friends_count, " new:", user_info.friends_count);
      if (user.friends_count !== user_info.friends_count) {
        user.friends_count = user_info.friends_count;
        await user.save();
        this.getNew(user.id, account.id);
      } else {
        console.log(`No changes for @${user.screen_name}`);
      }
    }
    return "Done";
  }
  static async getNew(id, account_id, cursor, previous) {
    let user = await TwitterUser.find(id);
    let follows = await user.following().ids();
    const params = {
      data: {
        account_id: account_id,
        user_id: user.id,
        cursor: cursor ? cursor : "-1",
      },
      priority: "normal",
      attempts: 1,
      remove: false,
      jobFn: (job) => {
        job.backoff();
      },
    };
    const job = kue.dispatch(FriendsIds.key, params.data, params);
    const result = await job.result;
    let ids = [];
    if (previous) {
      ids = [...previous, ...result.ids];
    } else {
      ids = result.ids;
    }
    const next_cursor = result.next_cursor !== 0 ? result.next_cursor : false;
    if (next_cursor) {
      this.getNew(id, account_id, next_cursor, ids);
    } else {
      let usersToHydrate = [];
      for (let newId of ids) {
        let newFollow = false;
        let followUser = await TwitterUser.findOrCreate({ id: newId });
        let isHydrated = followUser.screen_name;
        let isFollowed = follows.filter((follow) => {
          return follow === newId;
        }).length;
        if (!isFollowed) {
          user.following().attach([newId]);
          newFollow = true;
        }
        if (!isHydrated) {
          console.log(followUser);
          usersToHydrate.push(newId);
        } else if (isHydrated && newFollow) {
          let date = this.simpleDate(followUser.twitter_created_at);
          let message = `@${user.screen_name} started following @${followUser.screen_name}, this account was created on ${date}`;
          console.log(message);
          Event.fire("follow::new", {
            username: user.screen_name,
            content: message,
            avatar_url: user.profile_image_url_https,
          });
        }
      }
      for (let oldId of follows) {
        let oldFollow = false;
        let followUser = await TwitterUser.findOrCreate({ id: oldId });
        let isFollowed = ids.filter((id) => {
          return id === oldId;
        }).length;
        if (!isFollowed) {
          await user.following().detach([oldId]);
          oldFollow = true;
        }
        if (oldFollow) {
          let date = this.simpleDate(followUser.twitter_created_at);
          let message = `@${user.screen_name} stopped following @${followUser.screen_name}, this account was created on ${date}`;
          console.log(message);
          Event.fire("follow::new", {
            username: user.screen_name,
            content: message,
            avatar_url: user.profile_image_url_https,
          });
        }
      }
      if (usersToHydrate.length > 0) {
        let numberOfRequests = Math.ceil(usersToHydrate.length / 100);
        for (let i = 0; i < numberOfRequests; i++) {
          const lookup_params = {
            data: {
              account_id: account_id,
              user_ids: usersToHydrate.splice(0, 100).join(","),
              after: "saveOrUpdate",
            },
            priority: "normal",
            attempts: 1,
            remove: false,
            jobFn: (job) => {
              job.backoff();
            },
          };
          const lookup_job = kue.dispatch(
            Lookup.key,
            lookup_params.data,
            lookup_params
          );
          const hydrated = await lookup_job.result;
          for (let item of hydrated) {
            let userToHydrate = await TwitterUser.find(item.id);
            userToHydrate.name = item.name;
            userToHydrate.screen_name = item.screen_name;
            userToHydrate.description = item.description;
            userToHydrate.url = item.url;
            userToHydrate.protected = item.protected;
            userToHydrate.followers_count = item.followers_count;
            userToHydrate.friends_count = item.friends_count;
            userToHydrate.listed_count = item.listed_count;
            userToHydrate.twitter_created_at = item.created_at;
            userToHydrate.favourites_count = item.favourites_count;
            userToHydrate.verified = item.verified;
            userToHydrate.statuses_count = item.statuses_count;
            userToHydrate.lang = item.lang;
            userToHydrate.profile_background_color =
              item.profile_background_color;
            userToHydrate.profile_image_url = item.profile_image_url;
            userToHydrate.profile_image_url_https =
              item.profile_image_url_https;
            userToHydrate.default_profile_image = item.default_profile_image;
            userToHydrate.unaccessible = false;
            await userToHydrate.save();
            //TODO: this message is incorrect if for whatever reason we have a saved id that is not hydrated which has been removed with this loop
            let date = this.simpleDate(item.created_at);
            let message = `@${user.screen_name} started following @${item.screen_name}, this account was created on ${date}`;
            console.log(message);
            Event.fire("follow::new", {
              username: user.screen_name,
              content: message,
              avatar_url: user.profile_image_url_https,
            });
          }
        }
      }
    }
  }
  static simpleDate(s) {
    const date = new Date(
      s.replace(/^\w+ (\w+) (\d+) ([\d:]+) \+0000 (\d+)$/, "$1 $2 $4 $3 UTC")
    );
    const day =
      date.getDate() < 10 ? `0${date.getDate()}` : `${date.getDate()}`;
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }
}

module.exports = {
  Update,
};
