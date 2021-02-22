const http = require('http');
const Router = require('../lib');

const {
  SPACE_NAME,
  GROUP_NAME,
  ENV_NAME,
  NOHOST_RULE,
  NOHOST_VALUE,
  CLIENT_ID,
} = Router;
// router 会自动去重
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

const addEnv = (req, res) => {
  const { headers } = req;
  // 设置规则
  headers[NOHOST_RULE] = encodeURIComponent('file://{test.html} km.oa2.com www.test2.com');
  headers[NOHOST_VALUE] = encodeURIComponent(JSON.stringify({ 'test.html': 'hell world.' }));
  // 设置环境
  if (req.headers.host === 'km.oa2.com') {
    headers[SPACE_NAME] = encodeURIComponent('imweb');
    headers[GROUP_NAME] = encodeURIComponent('avenwu');
    headers[ENV_NAME] = encodeURIComponent('测试'); // 可选
  } else if (req.headers.host !== 'km.oa.com') {
    headers[SPACE_NAME] = encodeURIComponent('imweb');
    headers[GROUP_NAME] = encodeURIComponent('avenwu2');
    headers[ENV_NAME] = encodeURIComponent('测试2'); // 可选
  }
  // 设置 clientId (如果有)
  // headers[CLIENT_ID] = uid;
};

const server = http.createServer(async (req, res) => {
  await addEnv(req, res);
  router.proxy(req, res, console.log);
  // 如果需要修改响应内容，可以采用下面的方式
  // const svrRes = await router.proxy(req);
  // if (svrRes) {
  //   res.writeHead(svrRes.statusCode, svrRes.headers);
  //   svrRes.pipe(res);
  // }
});

const handleSocket = async (req, socket) => {
  await addEnv(req, socket);
  router.proxy(req, socket, console.log);
}; 
// TCP 请求
server.on('connect', handleSocket);
// WebSocket 请求
server.on('upgrade', handleSocket);

server.listen(5566);
