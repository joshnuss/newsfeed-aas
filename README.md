Newsfeed as a Service
---------------------

A service that provides storage, querying, push notification, email notification and read tracking.

[Based on idea](https://1000experiments.dev/posts/newsfeed-as-a-service)

## Features

### Storage

Stores activities by `POST`ing to `/activities`. Data is stored in memory atm, but would be a database in real life.

```bash
curl localhost:3000/activities -H 'content-type: application/json' -d '{"type": "order", "verb": "canceled", "id": 1234, "accountId": 1}'
```

### Querying

Activities can be queried via `/activities` endpoint.

```bash
curl localhost:3000/activities | jq
```

### Push notifications

When a new activity is created a push notification is sent web sockets that are connected with the same `accountId`

```javascript
const client = new WebSocket('ws://localhost:3000?accountId=1')

client.on('message', message => {
  message = JSON.parse(message)

  if (message.type == 'activity:new') {
    console.log(`new activity: ${message.activity}`)
  }
})
```

### Email notifications

Not yet implemented

### Read tracking

A activity can be marked read via the websocket, and all other clients with the same `accountId` will be notified.

```javascript
const client = new WebSocket('ws://localhost:3000?accountId=1')

// marking an activity as read
const message = JSON.stringify({
  type: 'activity:read',
  id: 999 // the activity id
})
client.send(message)

// receiving a notification of activity being marked read
client.on('message', message => {
  message = JSON.parse(message)

  if (message.type == 'activity:read') {
    console.log(`activity is marked read: ${message.activity}`)
  }
})
```

**Disclaimer**: no access tokens or api keys are enforced yet, it's just an early prototype.

## License

BSL
