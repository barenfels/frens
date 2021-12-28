const Event = use("Event");
const axios = require("axios");
Event.on("follow::new", async (data) => {
  let payload = {
    username: data.username || "Tweetor",
    content: data.content,
    avatar_url: data.avatar_url.replace("_normal.jpg", "_400x400.jpg"),
  };
  try {
    axios({
      method: "post",
      url: "",
      data: payload,
    });
  } catch (e) {
    console.log(e);
  }
});
