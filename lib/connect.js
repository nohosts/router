const http = require('http');
const net = require('net');
const { getRawHeaders, getRawHeaderNames, formatHeaders } = require('hparser');
const { isLocalAddress } = require('./address');

const noop = () => {};
const LOCALHOST = '127.0.0.1';
const XFF = 'x-forwarded-for';
const XWCP = 'x-whistle-client-port';
const WS_RE = /websocket/i;
const CLOSED_ERR = new Error('Closed');
const TIMEOUT_ERR = new Error('Timeout');
const TIMEOUT = 3600;

const connect = function(options, callback) {
  let socket;
  let timer;
  let done;
  let retry;
  const execCallback = function(err) {
    clearTimeout(timer);
    timer = null;
    if (!done) {
      done = true;
      callback(err, socket);
    }
  };
  const handleError = function(err) {
    if (done) {
      return;
    }
    socket.removeAllListeners();
    socket.on('error', noop);
    socket.destroy(err);
    clearTimeout(timer);
    if (retry) {
      return execCallback(err);
    }
    retry = true;
    timer = setTimeout(() => handleError(TIMEOUT_ERR), TIMEOUT);
    try {
      socket = net.connect(options, execCallback);
    } catch (e) {
      return execCallback(e);
    }
    socket.on('error', handleError);
    socket.on('close', (e) => {
      if (!done) {
        execCallback(e || new Error('closed'));
      }
    });
  };
  timer = setTimeout(() => handleError(TIMEOUT_ERR), TIMEOUT);
  try {
    socket = net.connect(options, execCallback);
  } catch (e) {
    return execCallback(e);
  }
  socket.on('error', handleError);
};

const getClientPort = (req) => {
  return req.socket.remotePort || 0;
};

const removeIPV6Prefix = (ip) => {
  if (typeof ip !== 'string') {
    return '';
  }
  return ip.indexOf('::ffff:') === 0 ? ip.substring(7) : ip;
};

const getClientIp = (req) => {
  let ip = req.headers[XFF];
  if (!net.isIP(ip) || isLocalAddress(ip)) {
    ip = req.socket.remoteAddress;
  }
  ip = removeIPV6Prefix(ip);
  return isLocalAddress(ip) ? LOCALHOST : ip;
};

const restoreHeaders = (req) => {
  const { headers, rawHeaders } = req;
  headers[XFF] = getClientIp(req);
  headers[XWCP] = getClientPort(req);
  return formatHeaders(headers, rawHeaders && getRawHeaderNames(rawHeaders));
};

const destroy = (req) => {
  if (req) {
    if (req.destroy) {
      req.destroy();
    } else if (req.abort) {
      req.abort();
    }
  }
};

const getOptions = (req) => {
  return {
    path: req.url || '/',
    method: req.method,
    agent: false,
    headers: restoreHeaders(req),
  };
};

const addCloseEvent = (req, cb) => {
  req.on('error', cb);
  req.once('close', cb);
};

const onClose = (req, res, cb) => {
  const execCb = (err) => {
    if (req._hasError) {
      return;
    }
    req._hasError = true;
    cb(err || CLOSED_ERR);
  };
  if (typeof res === 'function') {
    cb = res;
  } else {
    addCloseEvent(res, execCb);
  }
  addCloseEvent(req, execCb);
};

const connectNohost = (options, req, reqSock, callback) => {
  connect(options, (err, socket) => {
    // 确保销毁所有连接
    if (err) {
      if (!req._hasError) {
        destroy(req);
        destroy(reqSock);
      }
      return callback(err);
    }
    if (req._hasError) {
      socket.destroy();
      return callback(CLOSED_ERR);
    }
    onClose(reqSock || req, () => socket.destroy());
    callback(null, socket);
  });
};

const proxyConnect = (options, req, reqSock) => {
  connectNohost(options, req, reqSock, (err, socket) => {
    if (err) {
      return;
    }
    socket.write([
      `${WS_RE.test(req.headers.upgrade) ? 'GET' : 'CONNECT'} ${req.url} HTTP/1.1`,
      getRawHeaders(restoreHeaders(req)),
      '\r\n',
    ].join('\r\n'));
    reqSock.pipe(socket).pipe(reqSock);
  });
};

const proxyRequest = (options, req, callback) => {
  connectNohost(options, req, null, (err, socket) => {
    if (err) {
      return callback(err);
    }
    let done;
    const execCb = (e, res) => {
      if (e) {
        destroy(client); // eslint-disable-line
        destroy(req);
      }
      if (!done) {
        done = true;
        callback(e, res);
      }
    };
    const opts = getOptions(req);
    opts.createConnection = () => socket;
    opts.agent = null;
    const client = http.request(opts, res => {
      res.on('error', execCb);
      execCb(null, res);
    });
    onClose(req, execCb);
    client.on('error', execCb);
    req.pipe(client);
  });
};

exports.passToNohost = (options, req, res) => {
  if (res && !res.writeHead) {
    return proxyConnect(options, req, res);
  }
  if (!res) {
    return new Promise((resolve, reject) => {
      proxyRequest(options, req, (err, svrRes) => {
        if (err) {
          reject(err);
        } else {
          resolve(svrRes);
        }
      });
    });
  }
  proxyRequest(options, req, (err, svrRes) => {
    if (!err) {
      res.writeHead(svrRes.statusCode, restoreHeaders(svrRes));
      svrRes.pipe(res);
    }
  });
};
