import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import env from "dotenv";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.get("/", async (req, res) => {
  try {
    const response = await axios.get("https://bored-api.appbrewery.com/random");
    const result = response.data;
    res.render("index.ejs", { data: result });
  } catch (error) {
    console.error("Failed to make request:", error.message);
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
    console.error("Falied to make request ", error.message);
    res.render("index.ejs", {
      error: "No activities that match your criteria",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
