const http = require('http');
const path = require('path');
const fs = require('fs');
const app = require('koa')();
const koaRouter = require('koa-router')();
const Router = require('../lib');

const PAGE_HTML = fs.readFileSync(path.join(__dirname, 'index.html'));
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

koaRouter.get('/*/*.html', (ctx) => {
  ctx.body = PAGE_HTML;
});
koaRouter.use('/:space/:group/:env/**', async (ctx) => {
  console.log(ctx.params);
});

app.use(koaRouter.routes());
app.use(koaRouter.allowedMethods());

server.on('request', app.callback());
server.listen(6677);
