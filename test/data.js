const http = require('http');
const path = require('path');
const fs = require('fs');
const Koa = require('koa');
const koaRouter = require('koa-router')();
const Router = require('../lib');

const PAGE_HTML = fs.readFileSync(path.join(__dirname, 'index.html'));
const FAVICON = fs.readFileSync(path.join(__dirname, 'favicon.ico'));
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
  {
    host: '127.0.0.1',
    port: 8080,
  },
];

const router = new Router(servers);
const server = http.createServer();
const app = new Koa();

koaRouter.get('/:space/:group.html', (ctx) => {
  ctx.type = 'html';
  ctx.body = PAGE_HTML;
});
koaRouter.get('/favicon.ico', (ctx) => {
  ctx.type = 'ico';
  ctx.body = FAVICON;
});
// /space/group/env:uin/path/to
koaRouter.all(/^\/([^/]+)\/([^/]+)\/([^/]+)\/(.*)/, async (ctx) => {
  const space = ctx.params[0];
  const group = ctx.params[1];
  let env = ctx.params[2];
  const path = ctx.params[3];
  let index = env.lastIndexOf(':');
  if (index === -1) {
    return;
  }
  const uin = env.substring(index + 1);
  env = env.substring(0, index);
  const { req, res } = ctx;
  const { headers } = req;
  index = ctx.url.indexOf('?');
  req.url = `/${path}${index === -1 ? '' : ctx.url.substring(index)}`;
  headers[SPACE_NAME] = encodeURIComponent(space);
  headers[GROUP_NAME] = encodeURIComponent(group);
  if (env) {
    headers[ENV_NAME] = encodeURIComponent(env);
  }
  if (uin) {
    headers[CLIENT_ID_FILTER] = encodeURIComponent(uin);
  }
  await router.proxyUI(req, res);
});

app.use(koaRouter.routes());
app.use(koaRouter.allowedMethods());

server.on('request', app.callback());
server.listen(6677);
