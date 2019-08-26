# Radix example: front proxy

This is a sample application that showcases how to use an authentication proxy to provide authentication for a SPA front-end and a backend API.

This pattern can be used to wrap all components in an application with a single authentication mechanism.

![Diagram](radix-front-proxy.png "Application diagram")

The two protected components in this example — `api` and `frontend` — can only be accessed via `auth-proxy`, which ensures that the client is correctly authenticated.

## Requirements

To make use of this authentication pattern, you will need to:

- Create an **app registration** in Azure
- Get the app's **client ID** (from Azure, also called _application ID_)
- Get a **client secret** (generated in Azure)
- Create a **cookie secret** (generated locally)

The **client ID** is used to tell Azure which application a user is attempting to access. The **client secret** is proves to Azure that the authentication request is coming from a legitimate source (the `auth-proxy`). And the **cookie secret** is used to encrypt/decrypt the authentication cookie set in the user's browser, so that it is only readable by the `auth-proxy`.

The **client ID** is not a secret, and is set directly as an environment variable (`OAUTH2_PROXY_CLIENT_ID`). The **client secret** and **cookie secret** should be handled securely and never committed to git.

To generate the **client secret**, in the Azure app, go to "Certificates & secrets", then generate a new "Client secret".

To generate the **cookie secret**, you can use this command:

    python -c 'import os,base64; print base64.urlsafe_b64encode(os.urandom(16))'

## Running locally

To run the example locally, ensure that the values for `OAUTH2_PROXY_CLIENT_ID`, `OAUTH2_PROXY_CLIENT_SECRET` and `OAUTH2_PROXY_COOKIE_SECRET` are set in a `.env` file (this will be excluded from git; you can use the `.env.template` file as a… template 🤓).

You can now run `docker-compose up`.

The main endpoint (which is routed through `auth-proxy`) will be available at http://localhost:8000. The `frontend` and `api` endpoints will be at http://localhost:8001 and http://localhost:8002, respectively, if you need direct access.

## Running in Radix

You will need to change the value for the `OAUTH2_PROXY_CLIENT_ID` environment variable in `radixconfig.yaml` (under `spec.components["auth-proxy"].environmentConfig.variables`). You can then [set up the application](https://www.radix.equinor.com/guides/configure-an-app/#registering-the-application) in Radix.

The two [secrets](https://www.radix.equinor.com/docs/topic-concepts/#secret) that must be configured in the Radix Web Console are `OAUTH2_PROXY_CLIENT_SECRET` and `OAUTH2_PROXY_COOKIE_SECRET`. Note that the **cookie secret** does not need to match the one used locally.

The application should then build and deploy, and it will be availble at `https://<app-name>.app.radix.equinor.com/`. Only the `auth-proxy` component will be exposed via this endpoint.

## Further development

The implementations of `frontend` and `api` should of course be specific to your needs.

If `frontend` is a single-page app you'll want to include its build process in `frontend/Dockerfile`. You can also consider changing routing rules in the `frontend/nginx.conf` file — for instance, the application assumes that static files are served from the `/app` directory.

The `api` component represents a backend. It will receive the following headers with every request:

- `x-forwarded-access-token`: The [access token](https://docs.microsoft.com/en-us/azure/active-directory/develop/access-tokens) (JWT) provided by Azure for the authenticated user. The backend should perform the appropriate [validation](https://docs.microsoft.com/en-us/azure/active-directory/develop/access-tokens#validating-tokens) of this token.
- `x-forwarded-user`: The username of the authenticated user.
