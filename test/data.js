const http = require('http');
const Koa = require('koa');
const koaRouter = require('koa-router')();
const Router = require('../lib');

const {
  SPACE_NAME,
  GROUP_NAME,
  ENV_NAME,
  CLIENT_ID_FILTER,
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
  const { req, req: { headers }, request: { query: { uid } } } = ctx;
  req.url = req.url.replace(`/network/${ctx.params.id}`, '');
  headers[SPACE_NAME] = encodeURIComponent(space);
  headers[GROUP_NAME] = encodeURIComponent(group);
  if (env) {
    headers[ENV_NAME] = encodeURIComponent(env);
  }
  if (uid) {
    headers[CLIENT_ID_FILTER] = encodeURIComponent(uid);
  }
  const svrRes = await router.proxyUI(req);
  ctx.status = svrRes.statusCode;
  ctx.set(svrRes.headers);
  ctx.body = svrRes;
});

app.use(koaRouter.routes());
app.use(koaRouter.allowedMethods());

server.on('request', app.callback());
server.listen(6677);
