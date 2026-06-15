const https = require('https');

const data = JSON.stringify({ name: 'petlive', private: true });

const options = {
  hostname: 'api.github.com',
  path: '/user/repos',
  method: 'POST',
  headers: {
    'Authorization': 'token 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',
    'User-Agent': 'Node.js',
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log(body));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
