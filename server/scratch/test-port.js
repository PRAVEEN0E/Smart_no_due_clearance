const net = require('net');
const client = net.createConnection({ port: 5432, host: '127.0.0.1' }, () => {
  console.log('✅ Connected to local PostgreSQL on 127.0.0.1:5432!');
  client.end();
});
client.on('error', (err) => {
  console.error('❌ Connection to local PostgreSQL failed:', err.message);
});
