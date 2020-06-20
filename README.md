# router
nohost 集群部署时，用来分发请求到各个节点的路由器。

# 安装
``` sh
npm i --save @nohost/router
```

# 使用

``` js
const Router = require('@nohost/router');

const {
  SPACE_NAME,
  GROUP_NAME,
  ENV_NAME,
  NOHOST_RULE,
  NOHOST_VALUE,
  CLIENT_ID,
  CLIENT_ID_FILTER,
} = Router;
// 初始化传人部署的 nohost 服务器列表
const router = new Router([
    {
      host: '10.11.12.13',
      port: 8080
    },
    ...
  ]);

// 更新服务器列表


// 支持http、websocket、tunnel
router.proxy(req, res);

// 查看抓包请求
router.proxyUI(req, res);
```

#### 更新服务器列表
``` js
router.update([
  {
    host: '10.11.12.13',
    port: 8080
  },
  {
    host: '10.31.32.33',
    port: 8080
  },
  ...
]);
```
> router 每 12s 会检测一遍所有服务，并剔除不可用的

#### 转发正常请求
``` js
const { headers } = req;
// 设置规则，可以从数据库动态获取
headers[NOHOST_RULE] = encodeURIComponent('ke.qq.com file://{test.html}');
headers[NOHOST_VALUE] = encodeURIComponent(JSON.stringify({ 'test.html': 'hell world.' }));

// 设置环境
headers[SPACE_NAME] = encodeURIComponent('imweb');
headers[GROUP_NAME] = encodeURIComponent('avenwu');
headers[ENV_NAME] = encodeURIComponent('测试'); // 可选

// 如果从外网转发过来的带登录态请求，设置下 clientId 方便插件当前用户的请求抓包
// headers[CLIENT_ID] = uin;

router.proxy(req, res);

// 或自己处理响应
// const svrRes = await router.proxy(req);

```
#### 查看抓包数据
``` js
// 设置环境
headers[SPACE_NAME] = encodeURIComponent('imweb');
headers[GROUP_NAME] = encodeURIComponent('avenwu');
headers[ENV_NAME] = encodeURIComponent('测试'); // 可选

// 只查看指定 clientId 的请求
// headers[CLIENT_ID_FILTER] = uin;

router.proxyUI(req, res);
```

具体实现参考：[测试用例](./test/README.md)

