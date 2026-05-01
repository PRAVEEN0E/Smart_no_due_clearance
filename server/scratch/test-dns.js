const dns = require('dns');
dns.lookup('ep-bold-wind-amv35hfr-pooler.c-5.us-east-1.aws.neon.tech', (err, address, family) => {
  console.log('address: %j family: IPv%s', address, family);
  if (err) console.error(err);
});
