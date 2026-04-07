# Civic OS

A custom UI for the Comhairle Project.

## Environment variables:

```bash
API_URL=http://localhost:3000
PUBLIC_CONVERSATION_ID=xxxx-xxxx-xxxx
PUBLIC_INVITE_ID=xxxx-xxxx-xxxx
PUBLIC_POLIS_URL=https://polis.comhairle.scot/
PUBLIC_POLIS_ID=xxxxxx
```

When working with a local instance of the Comhairle backend API, set `PUBLIC_CONVERSATION_ID`, `PUBLIC_INVITE_ID` and `PUBLIC_POLIS_ID` to
values of assets created from your local database. Otherwise you can point these variables to id from the remote database (consult the Crownshy)
team for these values.

## Development

Once you've installed the dependencies with `pnpm install`, start a development server:

```sh
pnpm dev
```

## Building

To create a production version of your app:

```sh
pnpm build
```

You can preview the production build with `pnpm preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
