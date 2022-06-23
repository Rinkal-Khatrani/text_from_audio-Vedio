const express = require("express");

const cluster = require("cluster");

const ffmpeg = require("fluent-ffmpeg");

const os = require("os");

const { exec } = require("child_process");

const app = express();

const numCpu = os.cpus().length;

require("dotenv").config({ path: "./config.env" });
// Enable dotenv to access environment variables in the .env file.

// const ffmpeg = require("ffmpeg");

app.use(express.static("public/uploads"));
const PORT = process.env.PORT || 5000;

const path = require("path");

const multer = require("multer");
const fs = require("fs");

const sdk = require("microsoft-cognitiveservices-speech-sdk");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); //Appending extension
  },
});

const audioStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/audioUploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); //Appending extension
  },
});

const upload = multer({ storage: storage }).single("file");
const audioUpload = multer({ storage: audioStorage }).single("fileaudio");

const speechConfig = sdk.SpeechConfig.fromSubscription(
  process.env.SUBSCRIPTION_KEY, // Subscription Key
  "centralindia" // Service Region
);

// console.log("process>>", process.env);
speechConfig.speechRecognitionLanguage = "en-US";

// speechConfig.speechRecognitionLanguage = process.env.SOURCE_LANGUAGE; // Set the speech recognition language.
// speechConfig.addTargetLanguage(process.env.TARGET_LANGUAGE);
/**
 * Transcribes speech audio to text from the file specified within the function.
 */
function fromFile(file) {
  console.log("file>>", file);
  let audioConfig = sdk.AudioConfig.fromWavFileInput(
    fs.readFileSync(file),
    "output.wav"
  );
  let speechRecognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

  speechRecognizer.recognizeOnceAsync((result) => {
    switch (result.reason) {
      case sdk.ResultReason.RecognizedSpeech:
        console.log(`RECOGNIZED: Text=${result.text}`);
        break;
      case sdk.ResultReason.NoMatch:
        console.log("NOMATCH: Speech could not be recognized.");

        break;
      case sdk.ResultReason.Canceled:
        const cancellation = sdk.CancellationDetails.fromResult(result);
        console.log(`CANCELED: Reason=${cancellation.reason}`);

        if (cancellation.reason == sdk.CancellationReason.Error) {
          console.log(`CANCELED: ErrorCode=${cancellation.ErrorCode}`);
          console.log(`CANCELED: ErrorDetails=${cancellation.errorDetails}`);
          console.log(
            "CANCELED: Did you set the speech resource key and region values?"
          );
        }
        break;
    }
    speechRecognizer.close();
  });
  return recognized;
}
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
  // res.send("ok...");
});

function convert(input, output, callback) {
  ffmpeg(input)
    .output(output)
    .on("end", function () {
      console.log("conversion ended");
      callback(null);
    })
    .on("error", function (err) {
      console.log("error: ", e.code, e.msg);
      callback(err);
    })
    .run();
}

app.post("/videotowav", async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.log("errors in upload>>", err);
    } else {
      console.log("filePath>>>", `/${req.file.path}`);
      const outputFileName = Date.now() + "output.wav";
      console.log("outputFileName>>>", outputFileName);
      let myPath = req.file.path;
      myPath = myPath.split("\\");
      myPath = myPath.join("/"); // escape backslashes
      convert(req.file.path, `./${outputFileName}`, function (err) {
        if (!err) {
          console.log("conversion complete");
          let audioConfig = sdk.AudioConfig.fromWavFileInput(
            fs.readFileSync(outputFileName),
            "output.wav"
          );
          let speechRecognizer = new sdk.SpeechRecognizer(
            speechConfig,
            audioConfig
          );

          console.log("speechrecognizer>>", speechRecognizer);

          speechRecognizer.recognizeOnceAsync((result) => {
            switch (result.reason) {
              case sdk.ResultReason.RecognizedSpeech:
                console.log(`RECOGNIZED: Text=${result.text}`);
                res.send(result.text);
                break;
              case sdk.ResultReason.NoMatch:
                console.log("NOMATCH: Speech could not be recognized.");

                break;
              case sdk.ResultReason.Canceled:
                const cancellation = sdk.CancellationDetails.fromResult(result);
                console.log(`CANCELED: Reason=${cancellation.reason}`);

                if (cancellation.reason == sdk.CancellationReason.Error) {
                  console.log(`CANCELED: ErrorCode=${cancellation.ErrorCode}`);
                  console.log(
                    `CANCELED: ErrorDetails=${cancellation.errorDetails}`
                  );
                  console.log(
                    "CANCELED: Did you set the speech resource key and region values?"
                  );
                }
                break;
            }
            speechRecognizer.close();
          });
          //...
        }
      });
    }
  });
});

app.post("/audioText", (req, res) => {
  audioUpload(req, res, async (err) => {
    if (err) {
      console.log("errors in upload>>", err);
    } else {
      console.log("filePathaudio>>>", req.file.path);
      const outputFileName = Date.now() + "outputaudio.wav";
      convert(req.file.path, `./${outputFileName}`, function (err) {
        if (!err) {
          console.log("conversion complete");

          let audioConfig2 = sdk.AudioConfig.fromWavFileInput(
            fs.readFileSync(req.file.path),
            "outputaudio.wav"
          );
          let speechRecognizer2 = new sdk.SpeechRecognizer(
            speechConfig,
            audioConfig2
          );

          speechRecognizer2.recognizeOnceAsync((result) => {
            switch (result.reason) {
              case sdk.ResultReason.RecognizedSpeech:
                console.log(`RECOGNIZED: Text=${result.text}`);
                res.send(result.text);
                break;
              case sdk.ResultReason.NoMatch:
                console.log("NOMATCH: Speech could not be recognized.");

                break;
              case sdk.ResultReason.Canceled:
                const cancellation = sdk.CancellationDetails.fromResult(result);
                console.log(`CANCELED: Reason=${cancellation.reason}`);

                if (cancellation.reason == sdk.CancellationReason.Error) {
                  console.log(`CANCELED: ErrorCode=${cancellation.ErrorCode}`);
                  console.log(
                    `CANCELED: ErrorDetails=${cancellation.errorDetails}`
                  );
                  console.log(
                    "CANCELED: Did you set the speech resource key and region values?"
                  );
                }
                break;
            }
            speechRecognizer2.close();
          });
        }
      });
      // exec(
      //   `ffmpeg -i ${req.file.path} -vn -ar 44100 -ac 2 -ab 192 -f wav ${outputFileName}`,
      //   (err, stderr, stdout) => {
      //     if (err) {
      //       console.log("error in conversion", err);
      //     } else {

      //       // res.download(outputFileName, () => {
      //       //   console.log("file dowloaded");
      //       // });
      //     }
      //   }
      // );
    }
  });
});

if (cluster.isMaster) {
  for (let i = 0; i < numCpu; i++) {
    cluster.fork();
  }
} else {
  app.listen(PORT, () => {
    console.log(
      "app is started on port===",
      PORT,
      "---process Pid---",
      process.pid,
      numCpu
    );
  });
}

// app.listen(PORT, () => {
//   console.log(
//     "app is started on port===",
//     PORT,
//     "---process Pid---",
//     process.pid,
//     numCpu
//   );
// });
