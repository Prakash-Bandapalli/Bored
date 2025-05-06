import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import env from "dotenv";

env.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// --- Keep-Alive Logic for the PDF Query Backend ---
const PDF_QUERY_BACKEND_URL_TO_PING = process.env.PDF_QUERY_BACKEND_URL_TO_PING;
const KEEP_ALIVE_INTERVAL_MS = 5 * 60 * 1000;

function getFormattedLocalTime() {
  const now = new Date();
  return now.toLocaleString("en-US", {
    // 'en-US' is a common locale for this format
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true, // Use AM/PM
  });
}

function keepPdfQueryBackendAlive() {
  if (!PDF_QUERY_BACKEND_URL_TO_PING) {
    console.log(
      `PDF_QUERY_BACKEND_URL_TO_PING is not set. Skipping ping at ${getFormattedLocalTime()}.`
    );
    return;
  }

  axios
    .get(PDF_QUERY_BACKEND_URL_TO_PING)
    .then((response) => {
      console.log(
        `Ping to PDF Query Backend (${PDF_QUERY_BACKEND_URL_TO_PING}) successful at ${getFormattedLocalTime()}: Status ${
          response.status
        }`
      );
    })
    .catch((error) => {
      console.error(
        `Error pinging PDF Query Backend (${PDF_QUERY_BACKEND_URL_TO_PING}) at ${getFormattedLocalTime()}: ${
          error.message
        }`
      );
    });
}
// --- End Keep-Alive Logic ---

app.get("/", async (req, res) => {
  try {
    const response = await axios.get("https://bored-api.appbrewery.com/random");
    const result = response.data;
    res.render("index.ejs", { data: result });
  } catch (error) {
    console.error(
      `Failed to make request at ${getFormattedLocalTime()}:`,
      error.message
    );
    res.render("index.ejs", {
      error: error.message,
    });
  }
});

app.post("/", async (req, res) => {
  const Type = req.body.type;
  const Participants = req.body.participants;
  try {
    const Response = await axios.get(
      `https://bored-api.appbrewery.com/filter?type=${Type}&participants=${Participants}`
    );
    const Result = Response.data;
    const RandomNo = Math.floor(Math.random() * Result.length);
    res.render("index.ejs", { data: Result[RandomNo] });
  } catch (error) {
    console.error(
      `Failed to make request at ${getFormattedLocalTime()}:`,
      error.message
    );
    res.render("index.ejs", {
      error: "No activities that match your criteria",
    });
  }
});

app.listen(port, () => {
  console.log(
    `Node.js (Pinger App) server running on port: ${port} at ${getFormattedLocalTime()}`
  );

  if (PDF_QUERY_BACKEND_URL_TO_PING) {
    const intervalMinutes = KEEP_ALIVE_INTERVAL_MS / 1000 / 60;
    console.log(
      `Starting pings to PDF Query Backend (${PDF_QUERY_BACKEND_URL_TO_PING}) every ${intervalMinutes} minute(s) at ${getFormattedLocalTime()}.`
    );
    setInterval(keepPdfQueryBackendAlive, KEEP_ALIVE_INTERVAL_MS);
    setTimeout(() => {
      console.log(`Initial ping scheduled at ${getFormattedLocalTime()}.`);
      keepPdfQueryBackendAlive();
    }, 5000); // Ping 5 seconds after this Node.js server starts
  } else {
    console.log(
      `PDF_QUERY_BACKEND_URL_TO_PING not configured. Pings for PDF Query Backend will not start. Checked at ${getFormattedLocalTime()}.`
    );
  }
});
