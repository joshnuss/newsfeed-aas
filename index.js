import express from 'express'
import ws from 'ws'
import http from 'http'
import bodyParser from 'body-parser'
import qs from 'qs'

const app = express()
const server = http.createServer(app)
const wss = new ws.Server({server})
const activities = []

app.use(bodyParser.json())

wss.on('connection', (ws, request) => {
  const params = qs.parse(request.url.split('?')[1])

  ws.accountId = params.accountId

  ws.on('message', message => {
    message = JSON.parse(message)

    console.log(message)

    if (message.type == 'activity:read') {
      markRead(message.id)

      ws.send(JSON.stringify({type: "activity:read:ack", id: message.id}))
    }
  })
})

function findActivity(id) {
  return activities.find(activity => activity.id == id)
}

function markRead(id) {
  const activity = findActivity(id)
  activity.read = true

  publishEvent(activity.accountId, 'activity:read', {activity})
}

function addActivity(data) {
  const errors = {}

  if (!data.type)
    errors['type'] = 'is required'

  if (!data.id)
    errors['id'] = 'is required'

  if (!data.verb)
    errors['verb'] = 'is required'

  if (!data.accountId)
    errors['accountId'] = 'is required'

  if (Object.keys(errors).length > 0)
    return { success: false, errors }

  const {type, verb, id, accountId} = data

  const activity = {type, verb, id, accountId, id: activities.length + 1, read: false}
  activities.push(activity)

  publishEvent(accountId, 'activity:new', {activity})

  return {success: true, activity}
}

function publishEvent(accountId, type, data) {
  wss.clients.forEach(client => {
    if (client.readyState === ws.OPEN && client.accountId == accountId) {
      client.send(JSON.stringify({type, ...data}))
    }
  })
}

app.post('/activities', (req, res) => {
  const result = addActivity(req.body)

  if (result.success) {
    res.json({message: 'ok', activityId: result.activity.id})
  } else {
    res.status(400).json({message: 'error', errors: result.errors})
  }
})

app.get('/activities', (req, res) => {
  res.json({activities})
})

app.post('/activities/:id/read', (req, res) => {
  markRead(req.params.id)
  res.json({message: 'ok'})
})

app.get('/', (req, res) => {
  res.end('hello')
})

server.listen(process.env.PORT || 3000)
