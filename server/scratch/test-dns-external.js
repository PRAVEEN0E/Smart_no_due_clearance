const { Resolver } = require('dns');

const host = 'ep-bold-wind-amv35hfr-pooler.c-5.us-east-1.aws.neon.tech';

async function testExternalDNS() {
  // Google DNS
  const resolverGoogle = new Resolver();
  resolverGoogle.setServers(['8.8.8.8']);
  
  // Cloudflare DNS
  const resolverCloudflare = new Resolver();
  resolverCloudflare.setServers(['1.1.1.1']);

  console.log(`Checking host: ${host}\n`);

  try {
    const addresses = await new Promise((resolve, reject) => {
      resolverGoogle.resolve4(host, (err, addrs) => {
        if (err) reject(err);
        else resolve(addrs);
      });
    });
    console.log(`✅ Google DNS (8.8.8.8) SUCCESS:`, addresses);
  } catch (err) {
    console.log(`❌ Google DNS (8.8.8.8) FAILED:`, err.message);
  }

  try {
    const addresses = await new Promise((resolve, reject) => {
      resolverCloudflare.resolve4(host, (err, addrs) => {
        if (err) reject(err);
        else resolve(addrs);
      });
    });
    console.log(`✅ Cloudflare DNS (1.1.1.1) SUCCESS:`, addresses);
  } catch (err) {
    console.log(`❌ Cloudflare DNS (1.1.1.1) FAILED:`, err.message);
  }
}

testExternalDNS();
