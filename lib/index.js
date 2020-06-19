const crc32 = require('crc32');
const url = require('url');
const { getWorkers } = require('./util');
const { proxyToNohost, destroy } = require('./connect');

const INTERVAL = 12000;
const SPACE_NAME = 'x-whistle-nohost-space-name';
const GROUP_NAME = 'x-whistle-nohost-group-name';
const ENV_NAME = 'x-whistle-nohost-env-name';
const ENV_HEAD = 'x-whistle-nohost-env';
let index = 0;

class Router {
  constructor(servers) {
    this.update(servers);
  }

  getWorkers() {
    return this._workers == null ? this._pending : this._workers;
  }

  update(servers) {
    this._servers = servers || [];
    if (this._pending) {
      this._waiting = true;
      return;
    }
    clearTimeout(this._timer);
    this._pending = getWorkers(this._servers);
    this._pending.then((workers) => {
      this._workers = workers;
      this._pending = null;
      if (this._waiting) {
        this._waiting = false;
        this.update(this._servers);
      } else {
        this._timer = setTimeout(() => this.update(this._servers), INTERVAL);
      }
    });
    return this._pending;
  }

  async proxy(req, res) {
    const space = req.headers[SPACE_NAME];
    const group = req.headers[GROUP_NAME];
    const name = req.headers[ENV_NAME];
    const workers = await this.getWorkers();
    if (!workers.totalLen || req.socket.destroyed) {
      destroy(req);
      destroy(res);
      return;
    }
    const { headers } = req;
    if (!space || !group) {
      if (req.isUIRequest) {
        return destroy(req);
      }
      const servers = workers._servers;
      delete headers[ENV_HEAD];
      return proxyToNohost(servers[index++ % servers.totalLen], req, res);
    }

    const hash = parseInt(crc32(`${space}/${group}/${name || ''}`), 16) % workers.totalLen;
    const env = `$${hash}`;
    headers[ENV_HEAD] = env;
    if (req.isUIRequest) {
      headers['x-whistle-nohost-ui'] = 1;
      headers['x-whistle-filter-key'] = ENV_HEAD;
      headers['x-whistle-filter-value'] = env;
      let path = req.url || '/';
      if (path[0] !== '/') {
        path = url.parse(req.url).path;
      }
      req.url = `/account/${env}${path}`;
    }
    return proxyToNohost(workers[hash], req, res);
  }

  proxyUI(req, res) {
    req.isUIRequest = true;
    return this.proxy(req, res);
  }
}

Router.SPACE_NAME = SPACE_NAME;
Router.GROUP_NAME = GROUP_NAME;
Router.ENV_NAME = ENV_NAME;
Router.NOHOST_RULE = 'x-whistle-nohost-rule';
Router.NOHOST_VALUE = 'x-whistle-nohost-value';
Router.CLIENT_ID = 'x-whistle-client-id';
Router.CLIENT_ID_FILTER = 'x-whistle-filter-client-id';
module.exports = Router;
