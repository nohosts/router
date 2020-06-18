
const { getWorkers } = require('./util');

const timer = Symbol('timer');
const pending = Symbol('pending');
const waiting = Symbol('waiting');
const servers = Symbol('servers');
const workers = Symbol('workers');
const INTERVAL = 10000;

class Router {
  constructor(servers) {
    this.update(servers);
  }

  getWorkers() {
    return this[workers] == null ? this[pending] : this[workers];
  }

  update(svrs) {
    this[servers] = svrs || [];
    if (this[pending]) {
      this[waiting] = true;
      return;
    }
    clearTimeout(this[timer]);
    this[pending] = getWorkers(svrs);
    this[pending].then((workers) => {
      this[workers] = workers;
      this[pending] = null;
      if (this[waiting]) {
        this[waiting] = false;
        this.update(this[servers]);
      } else {
        this[timer] = setTimeout(() => this.update(this[servers]), INTERVAL);
      }
    });
    return this[pending];
  }

  async proxy(req, res) {

  }

  async proxyUI(req, res) {

  }
}
