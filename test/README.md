1. 启动正常请求转发服务： [node proxy.js](./proxy.js)
2. 启动查看抓包转发服务：[node data.js](./data.js)
    > 也可以将上述两个服务合成一个，通过域名做区分
3. 在 [whistle](https://github.com/avwo/whistle) 上设置规则：
    ``` txt
    # 查看抓包数据
    www.test.com internal-proxy://127.0.0.1:6677

    # ke.qq.com 域下的所有请求转到 proxy server
    ke.qq.com internal-proxy://127.0.0.1:5566
    ```

![whistle规则](https://user-images.githubusercontent.com/11450939/85247237-ae84b380-b47f-11ea-92c7-601fb120ed54.png)

![正常请求](https://user-images.githubusercontent.com/11450939/85247348-06bbb580-b480-11ea-8640-6142f6b01e3e.png)

![抓包数据](https://user-images.githubusercontent.com/11450939/85247316-ee4b9b00-b47f-11ea-9973-dc5e3f6454c4.png)
