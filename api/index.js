'use strict';

const express = require('express');
const PORT = process.env.PORT || 8002;
const HOST = process.env.HOST || '0.0.0.0';
const app = express();
const jwt = require('jsonwebtoken');

const azureAdPublicKey = `
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAp2DzxOZiWEHhtVavuwIm
ryTRxW4kJ0mbA1lbXon550DUnKDZCNZaztno8HpOl6NSbVbW+QLDz5VOqCn+PDvS
IRcw+2hrJPRnCNob4yGEuC7v9dPVpPDFRiUrOcwCbJak6xsK9PEsX8FQ/onFHO6Y
JkjsFG8S2nMhgRK+JdURUcuj9paywSBtW9ddeqjQPgCPbZJtk39ReouoBYNm9xiw
hTN0InY9Rt9PKUh4cRetg3OeKQ2E8TOVh1nHeTT2HIIYnAgB7ESUA07wYBuvet4U
GemC2SdfpTSWk2YqzjZONW8p01hJg9x8lcSeyaQVOxTP/SjQoP99la1V8lArF35q
xQIDAQAB
-----END PUBLIC KEY-----
`

// Generic request handler
app.get('*', (req, res) => {
  console.log(`Request received by the API: ${req.method} ${req.originalUrl}`);
  const token = req.header('authorization').replace("Bearer ", "");
  console.log(`token: ${token}`);
  try {
    const decoded = jwt.verify(token, azureAdPublicKey);
    console.log(`decoded token: ${decoded}`);
  } catch(err){
    console.log(err);
    res.sendStatus(403);
    return;
  }

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
