if (process.env.APPDYNAMICS_CONTROLLER_HOST_NAME)
  require("appdynamics").profile({
    controllerHostName: process.env.APPDYNAMICS_CONTROLLER_HOST_NAME,
    controllerPort: process.env.APPDYNAMICS_CONTROLLER_PORT,
    controllerSslEnabled: process.env.APPDYNAMICS_CONTROLLER_SSL_ENABLED,
    accountName: process.env.APPDYNAMICS_AGENT_ACCOUNT_NAME,
    accountAccessKey: process.env.APPDYNAMICS_AGENT_ACCOUNT_ACCESS_KEY,
    applicationName:  process.env.APP_NAME || 'firefly-monitor',
    tierName: process.env.APP_ID,
    nodeName: process.env.INSTANCE_ID // The controller will automatically append the node name with a unique number
  });

if (process.env.ELASTIC_APM_SERVER_URLS)
  require("elastic-apm-node").start()

const express = require("express");
const bodyParser = require("body-parser");
const fetch = require('node-fetch');
const Discover = require('firefly-consumer').Discover
const pgp = require('pg-promise')();

const servicesUrl =  process.env.SERVICES_URL || `http://localhost:8080/services`
const discover = new Discover({servicesUrl})


const port = process.env.PORT || 9090;

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);


function onNotification(data) {
  console.log('Received Payload:', data.payload);
  if (data.payload != 'lifeline') {
    io.emit('pgnotif', data.payload);
  }
}

function setListeners(client) {
  client.on('notification', onNotification);
  return connection.none('LISTEN $1~', 'my-channel')
      .catch(error => {
          console.log(error); // unlikely to ever happen
      });
}

function removeListeners(client) {
  client.removeListener('notification', onNotification);
}

function onConnectionLost(err, e) {
  console.log('Connectivity Problem:', err);
  connection = null; // prevent use of the broken connection
  removeListeners(e.client);
  reconnect(5000, 100) // retry 10 times, with 5-second intervals
      .then(() => {
          console.log('Successfully Reconnected');
      })
      .catch(() => {
          // failed after 10 attempts
          console.log('Connection Lost Permanently');
          process.exit(); // exiting the process
      });
}

function reconnect(delay, maxAttempts) {
  delay = delay > 0 ? parseInt(delay) : 0;
  maxAttempts = maxAttempts > 0 ? parseInt(maxAttempts) : 1;
  return new Promise((resolve, reject) => {
      setTimeout(() => {
          db.connect({direct: true, onLost: onConnectionLost})
              .then(obj => {
                  connection = obj; // global connection is now available
                  resolve(obj);
                  return setListeners(obj.client);
              })
              .catch(error => {
                  console.log('Error Connecting:', error);
                  if (--maxAttempts) {
                      reconnect(delay, maxAttempts)
                          .then(resolve)
                          .catch(reject);
                  } else {
                      reject(error);
                  }
              });
      }, delay);
  });
}

function sendNotifications() {
  // send a notification to our listener every second:
  setInterval(() => {
      if (connection) {
          connection.none('NOTIFY $1~, $2', ['my-channel', 'lifeline'])
              .catch(error => {
                  console.log('Failed to Notify:', error); // unlikely to ever happen
              })
      }
  }, 1000);
}

  let connection; // global connection for permanent event listeners
  const cn = {
    connectionString:  process.env.POSTGRESQL_ADDON_URI,
    max: 5
};

  const db = pgp(cn); // Database Object
  reconnect() // = same as reconnect(0, 1)
    .then(obj => {
        console.log('Successful Initial Connection');
        // obj.done(); - releases the connection
        sendNotifications();
    })
    .catch(error => {
        console.log('Failed Initial Connection:', error);
    });


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(express.static('public'));

// Expose env data about the current application
app.get('/env/vars', (req, res) => {
  const d = new Date();
  res.send({
      APP_ID: process.env.APP_ID || "APP_ID",
      INSTANCE_ID: process.env.INSTANCE_ID || "INSTANCE_ID",
      INSTANCE_TYPE: process.env.INSTANCE_TYPE || "INSTANCE_TYPE",
      COMMIT_ID: process.env.COMMIT_ID || "COMMIT_ID",
      INSTANCE_NUMBER: process.env.INSTANCE_NUMBER || "INSTANCE_NUMBER",
      WHOAMI: process.env.WHOAMI || "🤖"
  })
});

// Get some informations about my discovery server
// So you can update some variables on the discovery server side for the demonstration
app.get('/discovery-server/informations', (req, res) => {

  let urlOrigin = servicesUrl.split("/").slice(0,3).reduce((tmp, part)=> tmp + (part=="" ? "//" : part))

  fetch(`${urlOrigin}/informations`, {
    method: 'GET',
    headers: {
      "Content-Type": "application/json"
    }
  })
  .then(response => response.json())
  .then(informations => {
    res.send(informations)
  }).catch(error => {
    res.send(error)
  })
});

// list of connected gateways
// http://localhost:9090/gateways/all
// fetch("http://localhost:9090/gateways/all").then(res=>res.json()).then(data=> console.log(data))
app.get('/gateways/all', (req, res) => {
  discover.services().then(services => {
    res.send(services.filter(serviceKey => serviceKey.startsWith('sensors')))
  }).catch(error => {
    res.send([])
  })
});

// list of connected gateways and details
// http://localhost:9090/gateways/details
// fetch("http://localhost:9090/gateways/details").then(res=>res.json()).then(data=> console.log(data))
app.get('/gateways/details', (req, res) => {
  discover.servicesDetails().then(services => {
    res.send(services.filter(service => service.name.startsWith('sensors')))
  }).catch(error => {
    res.send([])
  })
});

// get temperature values of a gateway
//http://localhost:9090/gateways/sensors_quarter_b:42/sensors/temperature/values
// fetch("http://localhost:9090/gateways/sensors_quarter_b:42/sensors/temperature/values").then(res=>res.json()).then(data=> console.log(data))
app.get('/gateways/:gateway_id/sensors/temperature/values', (req, res) => {
  let serviceKey = req.params.gateway_id
  discover.operations({serviceKey}).then(operations => {
    operations.temperatureValues().then(data => {
      res.send(data)
    })
  }).catch(error => {
    res.send([])
  })
});

// get humidity values of a gateway
//http://localhost:9090/gateways/sensors_quarter_b:42/sensors/humidity/values
// fetch("http://localhost:9090/gateways/sensors_quarter_b:42/sensors/humidity/values").then(res=>res.json()).then(data=> console.log(data))
app.get('/gateways/:gateway_id/sensors/humidity/values', (req, res) => {
  let serviceKey = req.params.gateway_id
  discover.operations({serviceKey}).then(operations => {
    operations.humidityValues().then(data => {
      res.send(data)
    })
  }).catch(error => {
    res.send([])
  })
});

server.listen(port);
console.log(`🌍 Web Server is started - listening on ${port}`);


io.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});

// tools
console.panda = function(...args) { console.log("🐼", ...args) }
console.bear = function(...args) { console.log("🐻", ...args) }
console.fox = function(...args) { console.log("🦊", ...args) }
console.pig = function(...args) { console.log("🐷", ...args) }
console.happy = function(...args) { console.log("😀", ...args) }
console.angry = function(...args) { console.log("😡", ...args) }
console.good = function(...args) { console.log("👍", ...args) }
console.bad = function(...args) { console.log("👎", ...args) }

   
