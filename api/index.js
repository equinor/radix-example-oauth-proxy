'use strict';

const express = require('express');
const PORT = process.env.PORT || 8002;
const HOST = process.env.HOST || '0.0.0.0';
const app = express();
const jwt = require('jsonwebtoken');
const azureADPublicKey = process.env.AZURE_AD_PUBLIC_KEY.replace(/\\n/g, "\n");
const resourceID = process.env.API_RESOURCE_ID;

// Generic request handler
app.get('*', (req, res) => {
  console.log(`Request received by the API: ${req.method} ${req.originalUrl}`);
  if (!isAuthorized(req, ["Radix"])){
    res.sendStatus(403);
    return;
  }

  let output = `
    Request received by the API: ${req.method} ${req.originalUrl}
    Headers: ${JSON.stringify(req.headers, null, 2)}
  `;

  res.send(output);
});

// Start server
app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
console.log(azureADPublicKey);

/**
 * authorize request
 * req - request Request<Dictionary<string>>
 * [roles] - array of roles. If empty skip check. The token is authorized if it has any of the roles
 * returns - isAuthorized = true/false.
 */
const isAuthorized = (req, roles) => {
  const token = req.header('authorization').replace("Bearer ", "");
  let isAuthorized = false;
  try {
    const decodedToken = jwt.verify(token, azureADPublicKey, { audience: resourceID } );
    if (roles && roles.length > 0) {
      isAuthorized = decodedToken.roles && roles.some(role => decodedToken.roles.some(userRole => userRole === role));
    } else {
      isAuthorized = true;
    }
  } catch(err){
    console.log(err);
  }
  return isAuthorized;
}
