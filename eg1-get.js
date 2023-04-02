const { google } = require("googleapis");
const auth = require("./credentials-load");
const userdetails = require("./userdetails.json");
const spreadsheetId = userdetails.spreadsheetId;

async function run() {
  //create sheets client
  const sheets = google.sheets({ version: "v4", auth });
  //get a range of values
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId,
    range: "Sheet1!A1:E"
  });
  //print results
  console.log(JSON.stringify(res.data, null, 2));
}

run().catch(err => console.error("ERR", err));
