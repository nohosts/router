1. 启动正常请求转发服务： `node proxy.js`
2. 启动查看抓包转发服务：`node data.js`
    > 也可以将上述两个服务合成一个，通过域名做区分
3. 在 [whistle](https://github.com/avwo/whistle) 上设置规则：
    ``` txt
    # 查看抓包数据
    www.test.com internal-proxy://127.0.0.1:6677

    # ke.qq.com 域下的所有请求转到 proxy server
    ke.qq.com internal-proxy://127.0.0.1:5566
    ```

![whistle规则]()

![正常请求]()

![抓包数据]()

