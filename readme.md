# Quickstart

To get required packages, run:
`npm install`

To start the server, run:
`npm start`

*Note: This only starts the server app. Will still run even if the integrations are not set up, but will error if you try to make requests.*

# To use with soai app
Install this extension if you use Chrome, turn on when debugging, off when done debugging:
https://chrome.google.com/webstore/detail/moesif-origin-cors-change/digfbfaphojjndkpccljibejjbppifbc/related

idk if u use another browser.

# Cyanite.ai Integration

This example app showcases how you can integrate the Cyanite.ai API into your own application.

## Prerequisites

Before getting started you will need to create an integration over at https://app.cyanite.ai/integrations

You need the following:

- Access Token
- Webhook Secret

After receiving these copy `.env.sample` to `.env` and adjust the values.

Then you can install the dependencies using either `yarn install` (or `npm install`).

## Starting the webhook listener

The script uses [`ngrok.io`](https://ngrok.io) for exposing the port to the internet. This allows to make the webhook accessible from the Cyanite.ai servers for development purposes. In production environment you should not rely on ngrok.io but rather have a public facing server/service.

run `yarn proxy-port` (`npm run proxy-port`)

Wait until you see the following output (in case your port is already in use you will have to configure the port inside your `.env` file.)

```
yarn run v1.15.2
$ node src/proxy-port.js
Server listening on https://f288XXXX.ngrok.io/incoming-webhook
```

Copy the ngrok.io url and update your Cyanite.ai Integration Webhook Url to the given value. (You can use the test button to ensure that the requests arrive).

Please keep the proxy-port running.

run `yarn start` (or `npm start`)

## Upload a new file

Run the `src/file-upload.js` script using `yarn file-upload` (or `npm run file-upload`).

```bash
yarn file-upload "./piano-sample.mp3"
```

## Enqueueing a file analysis

Run the `src/file-enqueue-analysis.js` script using `yarn file-enqueue-analysis` (or `npm run file-enqueue-analysis`).
The script will enqueue a file analysis. After a few seconds you should be able to see some output in the terminal of the webhook server.

```bash
yarn file-enqueue-analysis "<put-analysis-id-here>"
```

## Further References

- [Cyanite.ai Public GraphQL API](https://api-docs.cyanite.ai/)
