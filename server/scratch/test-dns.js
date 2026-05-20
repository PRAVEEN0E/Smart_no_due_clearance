const dns = require('dns');

const host = 'ep-bold-wind-amv35hfr.c-5.us-east-1.aws.neon.tech';

dns.lookup(host, (err, address, family) => {
  if (err) {
    console.error(`❌ FAILED to resolve direct host ${host}:`, err.message);
  } else {
    console.log(`✅ SUCCESS resolving direct host ${host} -> Address:`, address);
  }
});
