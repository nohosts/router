const crc32 = require('crc32');
const { getWorkers } = require('./util');

const INTERVAL = 12000;

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
    const workers = await this.getWorkers();
    console.log(workers.length)
  }

  async proxyUI(req, res) {

  }
}

module.exports = Router;
