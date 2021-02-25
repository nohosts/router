const url = require('url');
const { parse: parseUrl } = require('url');
const { getServers, isFinished, getJSON } = require('./util');
const connect = require('./connect');

const INTERVAL = 10000;
const ONE_MINU = 1000 * 60;
const SPACE_NAME = 'x-whistle-nohost-space-name';
const GROUP_NAME = 'x-whistle-nohost-group-name';
const ENV_NAME = 'x-whistle-nohost-env-name';
const ENV_HEAD = 'x-whistle-nohost-env';

class Router {
  constructor(servers) {
    if (!Array.isArray(servers)) {
      this._nohostAddress = {
        host: servers.host,
        port: servers.port,
      };
      return;
    }
    this._index = 0;
    this._statusCache = {};
    let curMinute = Math.floor(Date.now() / ONE_MINU);
    setInterval(() => {
      const minute = Math.floor(Date.now() / ONE_MINU);
      if (minute === curMinute) {
        return;
      }
      curMinute = minute;
      const cache = this._statusCache;
      Object.keys(cache).forEach((key) => {
        if (cache[key].initTime !== minute) {
          delete cache[key];
        }
      });
    }, 1000);
    this.update(servers);
  }

  _connectDefault(req, res, callback) {
    const { servers } = this._result;
    const i = this._index++ % servers.length;
    if (this._index >= Number.MAX_SAFE_INTEGER) {
      this._index = 0;
    }
    req.headers[ENV_HEAD] = '$';
    const server = servers[i];
    if (typeof callback === 'function') {
      callback(server);
    }
    return connect(server, req, res);
  }

  _getStatus(space, group, env) {
    const { base64, servers } = this._result;
    if (!this._base64 || this._base64 !== base64) {
      this._statusCache = {};
      this._base64 = base64;
    }
    const query = `?space=${space}&group=${group}&env=${env || ''}`;
    // 考虑到实际使用场景不会有那么多在线的环境，这里不使用 LRU cache
    let status = this._statusCache[query];
    if (!status) {
      const options = parseUrl(`${servers[0].statusUrl}${query}`);
      options.headers = { 'x-nohost-servers': base64 };
      status = getJSON(options);
      status.initTime = Math.floor(Date.now() / ONE_MINU);
      this._statusCache[query] = status;
    }
    return status;
  }

  update(servers) {
    this._servers = servers || [];
    if (this._pending) {
      this._waiting = true;
      return;
    }
    clearTimeout(this._timer);
    this._pending = getServers(this._servers);
    this._pending.then((result) => {
      this._result = result || '';
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

  async proxy(req, res, callback) {
    if (typeof res === 'function') {
      callback = res;
      res = null;
    }
    if (this._nohostAddress) {
      if (req.isUIRequest) {
        req.headers['x-whistle-nohost-ui'] = 1;
      }
      if (typeof callback === 'function') {
        callback(this._nohostAddress);
      }
      return connect(this._nohostAddress, req, res);
    }
    let result = this._result;
    if (result == null) {
      result = await this._pending;
    }
    if (!result || isFinished(req)) {
      if (!res) {
        throw new Error(result ? 'request is finished.' : 'not found nohost server.');
      }
      req.destroy();
      return;
    }
    const { headers } = req;
    const space = headers[SPACE_NAME];
    const group = headers[GROUP_NAME];
    const name = headers[ENV_NAME];
    if (!space || !group) {
      if (req.isUIRequest) {
        if (!res) {
          throw new Error('space & group is required.');
        }
        req.destroy();
        return;
      }
      return this._connectDefault(req, res, callback);
    }
    const status = await this._getStatus(space, group, name);
    if (!status || !status.host) {
      return this._connectDefault(req, res, callback);
    }
    const env = `$${status.index}`;
    if (req.isUIRequest) {
      headers['x-whistle-nohost-ui'] = 1;
      headers['x-whistle-filter-key'] = name ? ENV_NAME : ENV_HEAD;
      headers['x-whistle-filter-value'] = name || env;
      let path = req.url || '/';
      if (path[0] !== '/') {
        path = url.parse(req.url).path;
      }
      req.url = `/account/${env}${path}`;
    }
    headers[ENV_HEAD] = env;
    if (typeof callback === 'function') {
      callback(status);
    }
    return connect(status, req, res);
  }

  proxyUI(req, res, callback) {
    req.isUIRequest = true;
    return this.proxy(req, res, callback);
  }
}

Router.SPACE_NAME = SPACE_NAME;
Router.GROUP_NAME = GROUP_NAME;
Router.ENV_NAME = ENV_NAME;
Router.NOHOST_RULE = 'x-whistle-rule-value';
Router.NOHOST_VALUE = 'x-whistle-key-value';
Router.CLIENT_ID = 'x-whistle-client-id';
Router.CLIENT_ID_FILTER = 'x-whistle-filter-client-id';
module.exports = Router;
