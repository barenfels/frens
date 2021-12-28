const WebhookMessage = use("WebhookMessage");

class MyNotification {
  constructor(body) {
    this.body = JSON.stringify(body);
  }

  via() {
    return ["webhook"];
  }

  toWebhook() {
    const message = new WebhookMessage();
    console.log(this.body);
    message.body(this.body).header("content-type", "application/json");
    return message;
  }
}

module.exports = MyNotification;
