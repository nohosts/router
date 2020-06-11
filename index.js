const assert = require('assert');
const { setup, updateServers } = require('./lib/servers');

module.exports = async (servers) => {
  init = true;
  servers = servers.filter(({ host, port }) => {
    return host && typeof host === 'string' && port > 0 && port < 65536;
  });
  assert(servers.length, 'nohost servers is required.');
  await setup(servers);

};


