const { request, tunnel, upgrade, getRawHeaders } = require('@nohost/connect');

const ERROR_HEADERS = { 'x-server': 'nohost/connect' };
const isUpgrade = ({ headers }) => /\bupgrade\b/i.test(headers.connection);

exports.writeError = (res, err) => {
  res.writeHead(500, ERROR_HEADERS);
  res.end(err.stack);
};

exports.writeHead = (res, svrRes) => {
  res.writeHead(svrRes.statusCode, getRawHeaders(svrRes));
};

exports.writeBody = (res, svrRes) => svrRes.pipe(res);

exports.connect = async (options, req, res) => {
  if (res.writeHead) {
    return request(req, res, options);
  }
  if (isUpgrade(req)) {
    return upgrade(req, options);
  }
  return tunnel(req, options);
};
