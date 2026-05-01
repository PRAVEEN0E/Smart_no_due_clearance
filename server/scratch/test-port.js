const net = require('net');
const client = net.createConnection({ port: 5432, host: 'ep-bold-wind-amv35hfr-pooler.c-5.us-east-1.aws.neon.tech' }, () => {
  console.log('connected to server!');
  client.end();
});
client.on('error', (err) => {
  console.error('connection failed:', err.message);
});
