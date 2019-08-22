'use strict';

const express = require('express');
const PORT = process.env.PORT || 8002;
const HOST = process.env.HOST || '0.0.0.0';
const app = express();

// Generic request handler
app.get('*', (req, res) => {
  let output = `
    Request received by the API: ${req.method} ${req.originalUrl}
    Headers: ${JSON.stringify(req.headers, null, 2)}
  `;

  res.send(output);
  console.log(req.method, req.originalUrl);
});

// Start server
app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
