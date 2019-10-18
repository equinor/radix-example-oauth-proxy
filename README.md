# Radix example: front proxy

This is a sample application that showcases how to use an authentication proxy to provide authentication for a SPA front-end that calls an protected API. Only a users that is granted a specific role (through being part of an AD Groupd) have access to the API. 

This pattern can be used to wrap existing or new components in an application with a single authentication mechanism. It is an alterntive to implementing authentication directly in client, e.g. using [MSAL](https://github.com/AzureAD/microsoft-authentication-library-for-js). 

![Diagram](radix-front-proxy.png "Application diagram")

The `frontend` components is only accessible through the `auth-proxy`. The `auth-proxy` ensures that the client is correctly authenticated.

The `api` is accessible on its own url. It protect itself by validating that the access token is signed by AzureAD private key, that it's not [expired](https://tools.ietf.org/html/rfc7519#section-4.1.4), that [audience](https://tools.ietf.org/html/rfc7519#section-4.1.3) matches it's application/resource ID, and that the token has the correct role.

## Requirements

Note: In Equinor AccessIT you need to have the role `Application Developer` for access `AZURE ACTIVE DIRECTORY` to be able to work with Azure AD. See (slack message)[https://equinor.slack.com/archives/C04E6T3AQ/p1567530111001700] for more information.

### API

To make use of this authentication pattern, you will need to:

- Create an **app registration** in Azure AD
- Get the API app's **client ID** (from Azure AD, also called _application ID_)
- Define a scope named `user_impersonation` for the API.
- Define a **role** called `Radix` for the API **app registration**

The `apis` **client ID** is used to tell Azure which resource a user is attempting to access. **Scopes** define the specific actions applications can be allowed to do on a user's behalf. We'll bind the **role** to an AD group, where any user that has access to this group will get a access token where the role `Radix` is set. 

To generate a **scope**, in the APIs Azure AD app, go to "Expose an API" and generate a **scope** called `user_impersonation`. Both `Admin and users` should be allowed to consent. Verify that the scopes name is in form `api://${client ID}/user_impersonation`

To generate a **role**, in the APIs Azure AD app, go to "Manifest" and update the "appRoles" value of the json doc. You need to replace the id with your own [UUID](https://www.uuidgenerator.net/):

```
"appRoles": [
    {
        "allowedMemberTypes": [
            "User"
        ],
        "description": "An radix user.",
        "displayName": "Radix",
        "id": "d1c2ade8-98f8-45fd-aa4a-6d06b947c661",
        "isEnabled": true,
        "lang": null,
        "origin": "Application",
        "value": "Radix"
    }
]
```

To grant a AD user or group a **role**, in the APIs Azure AD app, go to "Overview" and click the link for "Manage application in local directory". This will open Enterprise application overview of the app we're working on. Go to "Users and Groups" -> "Add User" -> select an AD group your part of (e.g. `Radix Playground Users`) and grant it the **role** "Radix". 

Node: User thats not part of the AD group you granted the Radix **role**, will still be able to authenticate, get a valid access token, and get access to the Client. It's up to the API to authorize based on the **role**. This enable the possibility to limit API calls based on which **role** a user has.

### Client

To make use of this authentication pattern, you will need to:

- Create a second **app registration** in Azure AD for the client
- Get the app's **client ID** (from Azure, also called _application ID_)
- Get a **client secret** (generated in Azure)
- Create a **cookie secret** (generated locally)
- Extend the apps **API permissions** with the **scope** defined for API

The **client ID** is used to tell Azure which application a user is attempting to access. The **client secret** is proves to Azure that the authentication request is coming from a legitimate source (the `auth-proxy`). And the **cookie secret** is used to encrypt/decrypt the authentication cookie set in the user's browser, so that it is only readable by the `auth-proxy`.

The **client ID** is not a secret, and is set directly as an environment variable (`OAUTH2_PROXY_CLIENT_ID`). The **client secret** and **cookie secret** should be handled securely and never committed to git.

To generate the **client secret**, in the Azure app, go to "Certificates & secrets", then generate a new "Client secret".

To generate the **cookie secret**, you can use this command:

    python -c 'import os,base64; print base64.urlsafe_b64encode(os.urandom(16))'

## Running locally

To run the example locally, ensure that the values for `OAUTH2_PROXY_CLIENT_ID`, `OAUTH2_PROXY_CLIENT_SECRET`, `OAUTH2_PROXY_COOKIE_SECRET` and `API_RESOURCE_ID` are set in a `.env` file (this will be excluded from git; you can use the `.env.template` file as a… template 🤓).

You can now run `docker-compose up`.

The main endpoint (which is routed through `auth-proxy`) will be available at http://localhost:8000. The `frontend` and `api` endpoints will be at http://localhost:8001 and http://localhost:8002, respectively, if you need direct access. `api` will be available directly, but will return 403 if you do not provide a valid auth token in request header "authorization".

## Running in Radix

You will need to change the value for the `OAUTH2_PROXY_CLIENT_ID`, `OAUTH2_PROXY_SCOPE` and `API_RESOURCE_ID` environment variable in `radixconfig.yaml`. You can then [set up the application](https://www.radix.equinor.com/guides/configure-an-app/#registering-the-application) in Radix.

The two [secrets](https://www.radix.equinor.com/docs/topic-concepts/#secret) that must be configured in the Radix Web Console are `OAUTH2_PROXY_CLIENT_SECRET` and `OAUTH2_PROXY_COOKIE_SECRET`. Note that the **cookie secret** does not need to match the one used locally.

The application should then build and deploy, and it will be availble at `https://<app-name>.app.radix.equinor.com/`. The `auth-proxy` component will be exposed via this endpoint. Api will also be availble 

## Further development

The implementations of `frontend` and `api` should of course be specific to your needs.

If `frontend` is a single-page app you'll want to include its build process in `frontend/Dockerfile`. You can also consider changing routing rules in the `frontend/nginx.conf` file — for instance, the application assumes that static files are served from the `/app` directory.

The `api` component represents a backend. It will receive the following headers with every request:

- `Authorization`: The [access token](https://docs.microsoft.com/en-us/azure/active-directory/develop/access-tokens) (JWT) provided by Azure for the authenticated user. The backend should perform the appropriate [validation](https://docs.microsoft.com/en-us/azure/active-directory/develop/access-tokens#validating-tokens) of this token.
