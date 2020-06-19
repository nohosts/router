const http = require('http');
const Router = require('../lib');

const {
  SPACE_NAME,
  GROUP_NAME,
  ENV_NAME,
  NOHOST_RULE,
  NOHOST_VALUE,
  CLIENT_ID,
  CLIENT_ID_FILTER,
} = Router;
const servers = [
  {
    host: '127.0.0.1',
    port: 8080,
  },
  {
    host: '127.0.0.1',
    port: 8080,
  },
];

const router = new Router(servers);

const server = http.createServer(async (req, res) => {
  res.on('error', () => {});
  const { headers } = req;
  // 设置抓包环境
  headers[SPACE_NAME] = encodeURIComponent('imweb');
  headers[GROUP_NAME] = encodeURIComponent('avenwu');
  headers[ENV_NAME] = encodeURIComponent('测试'); // 可选
  router.proxyUI(req, res);
});

server.listen(6677);
