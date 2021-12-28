const TwitterUser = use("App/Models/TwitterUser");
const User = use("App/Models/User");
const kue = use("Kue");
const Show = use("App/Jobs/Show");
const FriendsIds = use("App/Jobs/FriendsIds");
const Lookup = use("App/Jobs/Lookup");
const Database = use("Database");
const Event = use("Event");

class Monitor {
  static async add(name) {
    let account = await User.find(1);
    const params = {
      data: { account_id: account.id, screen_name: name },
      priority: "normal",
      attempts: 1,
      remove: false,
      jobFn: (job) => {
        job.backoff();
      },
    };
    const job = kue.dispatch(Show.key, params.data, params);
    job.on("error", (err) => {
      console.log(err);
    });
    try {
      const result = await job.result;
      const user = result;
      let user_object = await TwitterUser.query()
        .where("id", user.id_str)
        .with("monitoredBy")
        .first();
      let isMonitored = user_object
        ? await user_object.monitoredBy().where("user_id", account.id).first()
        : null;
      if (!user_object) {
        const user_data = {
          id: user.id_str,
          //linked_user: null,
          name: user.name,
          screen_name: user.screen_name,
          description: user.description,
          url: user.url,
          protected: user.protected,
          followers_count: user.followers_count,
          friends_count: user.friends_count,
          listed_count: user.listed_count,
          twitter_created_at: user.created_at,
          favourites_count: user.favourites_count,
          verified: user.verified,
          statuses_count: user.statuses_count,
          lang: user.lang,
          profile_background_color: user.profile_background_color,
          profile_image_url: user.profile_image_url,
          profile_image_url_https: user.profile_image_url_https,
          default_profile_image: user.default_profile_image,
          unaccessible: false,
        };
        user_object = await TwitterUser.create(user_data);
        user_object.id = user.id_str;
      }
      if (!isMonitored) {
        await user_object.monitoredBy().attach([account.id]);
        this.getToDate(user_object.id);
        console.log(`Starting to monitor user: ${name}`);
      }
      if (user_object && isMonitored) {
        console.log("You already monitor this user!");
      }
      return "Done";
    } catch (e) {
      console.log(e);
    }

    return `Adding user to monitor: ${name}`;
  }
  static async getToDate(id, cursorParameter) {
    try {
      let cursor = cursorParameter || "-1";
      let account = await User.find(1);
      let twitter_account = await TwitterUser.find(id);
      console.log(twitter_account.name);
      let follows = await twitter_account.following().ids();
      console.log("follows 0:", follows);
      const params = {
        data: {
          account_id: account.id,
          user_id: twitter_account.id,
          cursor: cursor,
        },
        priority: "normal",
        attempts: 1,
        remove: false,
        jobFn: (job) => {
          job.backoff();
        },
      };
      const job = kue.dispatch(FriendsIds.key, params.data, params);

      const friends_ids_object = await job.result;
      const ids = friends_ids_object.ids;
      const current_twitter_users = await TwitterUser.query()
        .select("id", "screen_name")
        .fetch();
      let idsToHydrate = [];
      try {
        const idsMap = ids.map(async function (follow_id) {
          const isFollowed = follows.indexOf(follow_id) !== -1;
          let followed_object = {};
          const isRegistered = current_twitter_users.rows.filter((el) => {
            return el.id === follow_id;
          }).length;
          if (isRegistered) {
            followed_object = await TwitterUser.find(follow_id);
          } else {
            followed_object = await TwitterUser.create({ id: follow_id });
            followed_object.id = follow_id;
          }
          if (!isFollowed) {
            //console.count("!isFollowed");
            await followed_object.followers().attach([twitter_account.id]);
          }
          if (!followed_object.screen_name) {
            idsToHydrate.push(followed_object.id);
          }
        });
        await Promise.all(idsMap);
      } catch (e) {
        console.log(e);
      }
      console.log(`Will hydrate ${idsToHydrate.length} users`);
      if (idsToHydrate.length > 0) {
        let numberOfRequests = Math.ceil(idsToHydrate.length / 100);
        console.log("number of lookup requests: ", numberOfRequests);
        for (let i = 0; i < numberOfRequests; i++) {
          const lookup_params = {
            data: {
              account_id: account.id,
              user_ids: idsToHydrate.splice(0, 100).join(","),
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
          for (let i = 0; i < hydrated.length; i++) {
            const item = hydrated[i];
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
          }
        }
      }
      const next_cursor =
        friends_ids_object.next_cursor !== 0
          ? friends_ids_object.next_cursor
          : false;

      if (next_cursor) {
        this.getToDate(id, next_cursor);
        return;
      } else {
        console.log("Hydration finished, goodbye");
        return;
      }
    } catch (e) {
      console.log(e);
    }
  }
}

module.exports = {
  Monitor,
};
/*
import { merge, flatten, concat, splitEvery, join, map, pipe } from 'ramda';

function usersLookupPromise(client, ids) {
  const options = { user_id: join(',', ids), include_entities: false };
  return client.post('users/lookup', options).then(({ data }) => data);
}

function ids2userObjects(client, ids) {
  const userLookupPromises = pipe(splitEvery(100), map(usersLookupPromise.bind(null, client)));
  const handler = (...userObjects) => flatten(userObjects);
  return Promise.all(userLookupPromises(ids)).then(handler);
}

function accumulate(client, options, followersIds) {
  return client.get('followers/ids', options).then(({ data: { ids, next_cursor_str: cursor } }) => {
    const accumulatedFollowersIds = concat(followersIds, ids);
    if (cursor === '0') {
      return ids2userObjects(client, accumulatedFollowersIds);
    }
    return accumulate(client, merge(options, { cursor }), accumulatedFollowersIds);
  });
}

export default function getTwitterFollowers(tokens, username) {
  const client = new Twitter(tokens);
  const options = { screen_name: username, stringify_ids: true, count: 5000 };
  return accumulate(client, options, []);
} */
