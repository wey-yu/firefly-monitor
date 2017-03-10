const express = require("express");
const bodyParser = require("body-parser");
const fetch = require('node-fetch');
const Discover = require('firefly-consumer').Discover

const servicesUrl =  process.env.SERVICES_URL || `http://localhost:8080/services`
const discover = new Discover({servicesUrl})

const port = process.env.PORT || 9090;

const app = express();
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

app.listen(port);
console.log(`🌍 Web Server is started - listening on ${port}`);

// tools
console.panda = function(...args) { console.log("🐼", ...args) }
console.bear = function(...args) { console.log("🐻", ...args) }
console.fox = function(...args) { console.log("🦊", ...args) }
console.pig = function(...args) { console.log("🐷", ...args) }
console.happy = function(...args) { console.log("😀", ...args) }
console.angry = function(...args) { console.log("😡", ...args) }
console.good = function(...args) { console.log("👍", ...args) }
console.bad = function(...args) { console.log("👎", ...args) }

   