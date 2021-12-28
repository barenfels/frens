const Model = use("Model");

class Webhook extends Model {
  static get traits() {
    return ["@provider:Notifiable"];
  }

  routeNotificationForWebhook() {
    return this.url;
  }
}

module.exports = Webhook;
