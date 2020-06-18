const Router = require('../lib');

const servers = [
  {
    host: 'nohost.oa.com',
    port: 8080,
  },
  {
    host: 'imwebtest.oa.com',
    port: 8080,
  },
];

const router = new Router(servers);

router.proxy();

setInterval(() => router.proxy(), 5000);

setTimeout(() => {
  router.update( [
    {
      host: 'nohost.oa.com',
      port: 8080,
    },
  ]);
  setTimeout(() => {
    router.update( [
      {
        host: 'imwebtest.oa.com',
        port: 8080,
      },
    ]);
  }, 10000);
}, 10000);
