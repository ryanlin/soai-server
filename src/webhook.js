"use strict";

const crypto = require("crypto");
const envalid = require("envalid");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const fetch = require("node-fetch");
const cors = require("cors");
const fs = require("fs");
const multer = require("multer");

// Allow cors (client/server requests on same machine)
app.use(cors({
  origin: [/http:\/\/localhost:\d+$/]
}))

// Setup storage for uploads
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
var upload = multer({ storage: storage }).single('file');

// Environment variables from .env
const env = envalid.cleanEnv(process.env, {
  PORT: envalid.num(),
  SECRET: envalid.str(),
  ACCESS_TOKEN: envalid.str()
});

// Cyanite Webhook (/incoming-webhook/)
const isSignatureValid = (secret, signature, message) => {
  const hmac = crypto.createHmac("sha512", secret);
  hmac.write(message);
  hmac.end();
  const compareSignature = hmac.read().toString("hex");
  return signature === compareSignature;
};

const WEBHOOK_ROUTE_NAME = "/incoming-webhook";

const asynchronouslyFetchlibraryTrackResult = async libraryTrackId => {
  // fetch the whole information
  const libraryTrackQueryDocument = /* GraphQL */ `
    query LibraryTrack($libraryTrackId: ID!) {
      libraryTrack(id: $libraryTrackId) {
        ... on LibraryTrackNotFoundError {
          message
        }
        ... on LibraryTrack {
          id
          audioAnalysisV6 {
            ... on AudioAnalysisV6Finished {
              result {
                segments {
                  timestamps
                  genre {
                    classical
                    ambient
                    blues
                  }
                  mood {
                    calm
                    chilled
                    dark
                    sexy
                  }
                }
                genreTags
                moodTags
                bpmPrediction {
                  value
                  confidence
                }
              }
            }
          }
          similarLibraryTracks {
            ... on SimilarLibraryTracksError {
              message
            }
            ... on SimilarLibraryTrackConnection {
              edges {
                node {
                  libraryTrack {
                    id
                  }
                }
              }
            }
          }
        }
      }
    }  
  `;

  const result = await fetch(env.API_URL, {
    method: "POST",
    body: JSON.stringify({
      query: libraryTrackQueryDocument,
      variables: { libraryTrackId }
    }),
    headers: {
      Authorization: "Bearer " + env.ACCESS_TOKEN,
      "Content-Type": "application/json"
    }
  }).then(res => res.json());
  console.log("[info] libraryTrack result");
  console.log(JSON.stringify(result, undefined, 2));
};

app.use(bodyParser.json());
app.post(WEBHOOK_ROUTE_NAME, (req, res) => {
  if (!req.body) {
    console.log('[info] unprocessable entity')
    return res.sendStatus(422); // Unprocessable Entity
  }

  console.log("[info] incoming event:");
  console.log(JSON.stringify(req.body, undefined, 2));

  if (req.body.type === "TEST") {
    console.log("[info] processing test event");
    return res.sendStatus(200);
  }

  // verifying the request signature is not required but recommended
  // by verifying the signature you can ensure the incoming request was sent by Cyanite.ai
  if (
    !isSignatureValid(
      env.SECRET,
      req.headers.signature,
      JSON.stringify(req.body)
    )
  ) {
    console.log("[info] signature is invalid");
    return res.sendStatus(400);
  }
  console.log("[info] signature is valid");

  if (req.body.event.type === "AudioAnalysisV6" && req.body.event.status === "finished") {
    console.log("[info] processing finish event");

    // You can use the result here, but keep in mind that you should probably process the result asynchronously
    // The request of the incoming webhook will be canceled after 3 seconds.
    asynchronouslyFetchlibraryTrackResult(req.body.resource.id);
  }

  // Do something with the result here

  return res.sendStatus(200);
});


// REST API for soai client (/api/)
app.get('/api/', (req, res) => {
  res.send({ version: '1.0' })
})

app.post('/api/upload', async (req, res) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err);
    } else if (err) {
      return res.status(500).json(err);
    }

    return res.status(200).send(req.file);
  });
});


// Begin listening, API and Web hook share a port
app.listen(env.PORT, () => {
  console.log(
    `Server listening on http://localhost:${env.PORT}${WEBHOOK_ROUTE_NAME}`
  );
});


// Socket.io
// const server = require('http').createServer(app);
// const io = require('socket.io')(server);

// io.on('connection', (socket) => {
//   console.log(socket.id)

//   socket.on('upload', data => {
//     console.log(data)
//   })
// })
// server.listen(env.SOCKET_PORT, () => {
//   console.log(
//     `Server Socket listening on http://localhost:${env.SOCKET_PORT}`
//   )
// })
