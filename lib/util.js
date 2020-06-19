const http = require('http');

const HOST_RE = /^[\w.-]+$/;
const RETRY_COUNT = 5;
const TIMEOUT = 2000;

const getBody = (url) => {
  return new Promise((resolve, reject) => {
    let body = '';
    const timer = setTimeout(() => {
      client.abort(); // eslint-disable-line
    }, TIMEOUT);
    const client = http.get(url, (res) => {
      clearTimeout(timer);
      res.on('error', reject);
      if (res.statusCode !== 200) {
        return reject(new Error(`Response status code: ${res.statusCode}`));
      }
      res.setEncoding('utf8');
      res.on('data', (data) => {
        body += data;
      });
      res.on('end', () => {
        resolve(body);
      });
    });
    client.on('error', reject);
    client.end();
  });
};

const getJSON = async (url, retry) => {
  let result;
  try {
    result = await getBody(url);
  } catch (e) {
    if (retry > 0) {
      result = await getJSON(url, --retry);
    }
  }
  return result && JSON.parse(result);
};

const getWorkerNum = async ({ statusUrl }) => {
  try {
    const { workerNum } = await getJSON(statusUrl, RETRY_COUNT);
    return workerNum || 0;
  } catch (e) {}
  return 0;
};

const parseServers = (servers) => {
  const map = {};
  servers = servers.filter((server) => {
    const { host, port } = server;
    if (!HOST_RE.test(host) || !(port > 0 && port < 65535)) {
      return false;
    }
    const statusUrl = `http://${host}:${port}/status`;
    if (map[statusUrl]) {
      return false;
    }
    map[statusUrl] = 1;
    server.statusUrl = statusUrl;
    return true;
  });
  // 确保所有节点顺序一致
  return servers.sort((s1, s2) => {
    return s1.statusUrl > s2.statusUrl ? 1 : -1;
  });
};

exports.getWorkers = async (servers) => {
  servers = parseServers(servers);
  if (!servers.length) {
    return servers;
  }
  const result = await Promise.all(servers.map(getWorkerNum));
  const workers = [];
  const usableServers = [];
  servers.forEach(({ host, port }, i) => {
    const workerNum = result[i];
    if (workerNum) {
      const option = { host, port };
      usableServers.push(option);
      for (i = 0; i < workerNum; i++) {
        workers.push(option);
      }
    }
  });
  workers.totalLen = workers.length;
  usableServers.totalLen = usableServers.length;
  workers._servers = usableServers;
  return workers;
};
