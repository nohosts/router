const http = require('http');
const Koa = require('koa');
const koaRouter = require('koa-router')();
const Router = require('../lib');

const {
  SPACE_NAME,
  GROUP_NAME,
  ENV_NAME,
  // CLIENT_ID_FILTER,
  writeHead,
} = Router;
const servers = [
  {
    host: '127.0.0.1',
    port: 8080,
  },
];
const ENV_MAP = {
  '1': {
    space: 'imweb',
    group: 'avenwu',
    env: '测试'
  },
  '2': {
    space: 'imweb',
    group: 'avenwu2',
    env: '测试2'
  }
};

const router = new Router(servers);
const server = http.createServer();
const app = new Koa();

koaRouter.all('/network/:id/(.*)', async (ctx) => {
  const network = ENV_MAP[ctx.params.id];
  if (!network) {
    return;
  }
  const { space, group, env  } = network;
  const { req, res, req: { headers } } = ctx;
  req.url = req.url.replace(`/network/${ctx.params.id}`, '');
  headers[SPACE_NAME] = encodeURIComponent(space);
  headers[GROUP_NAME] = encodeURIComponent(group);
  if (env) {
    headers[ENV_NAME] = encodeURIComponent(env);
  }
  // 过滤某个账号的抓包数据
  // headers[CLIENT_ID_FILTER] = encodeURIComponent(uid);
  const svrRes = await router.proxyUI(req, res, console.log);
  writeHead(res, svrRes);
  // ctx.status = svrRes.statusCode;
  // ctx.set(svrRes.headers);
  ctx.body = svrRes;
});

app.use(koaRouter.routes());
app.use(koaRouter.allowedMethods());

server.on('request', app.callback());
server.listen(6677);
