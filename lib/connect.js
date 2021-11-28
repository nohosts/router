const { request, tunnel, upgrade, getRawHeaders } = require('@nohost/connect');

const ERROR_HEADERS = { 'x-server': 'nohost/connect' };

exports.writeError = (res, err) => {
  res.writeHead(500, ERROR_HEADERS);
  res.end(err.stack);
};

exports.writeHead = (res, svrRes) => {
  res.writeHead(svrRes.statusCode, getRawHeaders(svrRes));
};

exports.writeBody = (res, svrRes) => svrRes.pipe(res);

exports.connect = async (options, req, res) => {
  if (req.upgrade) {
    return req.method === 'CONNECT' ? tunnel(req, options) : upgrade(req, options);
  }
  return request(req, res, options);
};
