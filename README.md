# Frens

## Setup

Copy .env.example and edit it as desired (you will need a mysql instance and a twitter developer account)

Edit start/events.js to put your webhook in the url of the query

Run the following command to run startup migrations.

```js
adonis migration:run
```

Start system by running
```js
./start.sh
``` 
on terminal

Add new users to follow with
```js
adonis monitor:add username
```

Don't add the @ to the username
