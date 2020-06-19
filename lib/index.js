const crc32 = require('crc32');
const { getWorkers } = require('./util');
const { proxyToNohost, destroy } = require('./connect');

const INTERVAL = 12000;
const SPACE_HEAD = 'x-whistle-nohost-space';
const GROUP_HEAD = 'x-whistle-nohost-group';
const NAME_HEAD = 'x-whistle-nohost-name';
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
    const space = req.headers[SPACE_HEAD];
    const group = req.headers[GROUP_HEAD];
    const name = req.headers[NAME_HEAD];
    const workers = await this.getWorkers();
    if (!workers.totalLen) {
      destroy(req);
      destroy(res);
      return;
    }
    const { headers } = req;
    if (!space || !group) {
      const servers = workers._servers;
      delete headers[ENV_HEAD];
      return proxyToNohost(servers[index++ % servers.totalLen], req, res);
    }

    const hash = crc32(`${space}/${group}/${name || ''}`) % workers.totalLen;
    headers[ENV_HEAD] = hash;
    if (req.isUIRequest) {
      headers['x-whistle-nohost-ui'] = 1;
      headers['x-whistle-filter-key'] = ENV_HEAD;
      headers['x-whistle-filter-value'] = hash;
    }
    proxyToNohost(req, res);
  }

  proxyUI(req, res) {
    req.isUIRequest = true;
    return this.proxy(req, res);
  }
}

module.exports = Router;
