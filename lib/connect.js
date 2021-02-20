const { request, tunnel, upgrade, getRawHeaders, onClose } = require('@nohost/connect');

const ERROR_HEADERS = { 'x-server': 'nohost/connect' };
const isUpgrade = ({ headers }) => /\bupgrade\b/i.test(headers.connection);

const destroy = (req) => {
  if (req) {
    if (req.destroy) {
      req.destroy();
    } else if (req.abort) {
      req.abort();
    }
  }
};

exports.destroy = destroy;

exports.proxyToNohost = async (options, req, res) => {
  if (!res) {
    return request(req, options);
  }

  if (!res.writeHead) {
    if (isUpgrade(req)) {
      upgrade(req, options);
    } else {
      tunnel(req, options);
    }
    return;
  }

  onClose(res, (err) => req.emit('close', err));
  try {
    const svrRes = await request(req, options);
    res.writeHead(svrRes.statusCode, getRawHeaders(svrRes));
    svrRes.pipe(res);
  } catch (err) {
    res.writeHead(500, ERROR_HEADERS);
    res.end(err.stack);
  }
};
