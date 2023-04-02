const { google } = require("googleapis");
const auth = require("./credentials-load");
const userdetails = require("./userdetails.json");
const spreadsheetId = userdetails.spreadsheetId;

async function run() {
  //create sheets client
  const sheets = google.sheets({ version: "v4", auth });
  //append a range of values (3x3 grid, starting at A5)
  const res = await sheets.spreadsheets.values.append({
    spreadsheetId: spreadsheetId,
    range: "Sheet1!A1:C3",
    insertDataOption: "INSERT_ROWS",
    valueInputOption: "RAW",
    resource: {
      values: [
        ["Xappend 1.1", "append 1.2", "append 1.3"],
        ["Xappend 2.1", "append 2.2", "append 2.3"],
        ["Xappend 3.1", "append 3.2", "append 3.3"]
      ]
    }
  });
  //print results
  console.log(JSON.stringify(res.data, null, 2));
  // {
  //   "spreadsheetId": "xxxxxxxxxxx",
  //   "tableRange": "Sheet1!A5:C5",
  //   "updates": {
  //     "spreadsheetId": "xxxxxxxxxxx",
  //     "updatedRange": "Sheet1!A6:C8",
  //     "updatedRows": 3,
  //     "updatedColumns": 3,
  //     "updatedCells": 9
  //   }
  // }
}

run().catch(err => console.error("ERR", err));
