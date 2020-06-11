const http = require('http');

const noop = () => {};

exports.noop = noop;

exports.getJSON = (url) => {
  return new Promise((resolve, reject) => {
    let body = '';
    const client = http.get(url, (res) => {
      res.on('error', reject);
      res.setEncoding('utf8');
      res.on('data', (data) => {
        body += data;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });
    client.on('error', reject);
    client.end();
  });
};
