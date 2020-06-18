# router
nohost 集群部署时，用来分发请求到各个节点的路由器。

# 安装
``` sh
npm i --save @nohost/router
```

# 使用

``` js
const Router = require('@nohost/router');

const router = new Router([
    {
      host: '10.11.12.13',
      port: 8080
    },
    ...
  ]);

// 支持http、websocket、tunnel
router.proxy(req, res);

// 查看抓包请求
router.proxyUI(req, res);
```

新增或删除 nohost 节点，可以通过以下方式更新节点列表：
  ``` js
  router.update([
    '10.11.12.13:8080',
    ...
  ]);
  ```

# 内部流程

![请求流程](https://user-images.githubusercontent.com/11450939/84852129-9a5f4180-b08e-11ea-92d2-019d921c4ef3.png)

