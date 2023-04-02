const { google } = require("googleapis");
const auth = require("./credentials-load");
const https = require('https');
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  completer: (line) => {
    const completions = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const hits = completions.filter((c) => c.startsWith(line));
    return [hits.length ? hits : completions, line];
  },
  terminal: true
});
const question = async text =>
  new Promise((resolve, reject) => {
    rl.question(text, result =>
      result ? resolve(result) : reject("Nothing entered")
    );
  });

const userdetails = require("./userdetails.json");
const spreadsheetId = userdetails.spreadsheetId;
const limit = 100;

async function getData(optionsDetails) {
  return new Promise((resolve, reject) => {
    https.get(optionsDetails, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(JSON.parse(data));
      });

    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function run() {

  const month = await question("Enter the month (TAB key to list of months supported): ");

  const abbreviation = new Date(`${month} 1, 2000`).toLocaleString('default', { month: 'short' });
  const currentYear = new Date().getFullYear();
  const yearAbbreviation = currentYear.toString().slice(-2);

  const fromDate = getFirstFullDayOfMonth(month)
  const toDate = getLastFullDayOfMonth(month)
  rl.close();
  const optionsUserDetails = {
    hostname: userdetails.hostname,
    path: `/users/current.json`,
    auth: `${userdetails.redminUsername}:${userdetails.redminePassword}`
  };
  const redmineUserId = await getData(optionsUserDetails);

  const optionsTimeEntries = {
    hostname: userdetails.hostname,
    path: `/time_entries.json?user_id=${redmineUserId.user.id}&from=${fromDate}&to=${toDate}&limit=${limit}`,
    auth: `${userdetails.redminUsername}:${userdetails.redminePassword}`
  };

  const redmineData = await getData(optionsTimeEntries);
  const timeEntries = redmineData.time_entries;

  const timeEntriesArray = timeEntries.map(item => {
    const fullDate = new Date(item.spent_on);
    const date = dateFormat(item.spent_on, 'dd/MM/yyyy');
    const day = getDayOfWeek(fullDate);
    return {
      date: date,
      day,
      projectCode: item.project.name,
      ticketNumber: item.issue.id,
      hours: item.hours,
    }
  });

  timeEntriesArray.sort(function(a, b){
    var aa = a.date.split('/').reverse().join(),
        bb = b.date.split('/').reverse().join();
    return aa < bb ? -1 : (aa > bb ? 1 : 0);
  });

  //create sheets client
  const sheets = google.sheets({ version: "v4", auth });

  //get a range of values
  const getRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: abbreviation+ "_" + yearAbbreviation + "!A2:L"
  });
  const currentSpreadSheet = getRes.data.values;

  
  const updatedTime = currentSpreadSheet.map(item => {
    const thatDay = searchByDate(timeEntriesArray, addLeadingZeros(item[0]));
    const projectCode = thatDay?.projectCode || '';
    const ticketNumber = thatDay?.ticketNumber || '';
    const hoursAvailable = thatDay?.hours || '';
    const hoursEstimated = thatDay?.hours || '';
    const hoursActual = thatDay?.hours || '';
    const billableHours = thatDay?.hours ? 8 : '';
    const billable = thatDay?.hours ? 'Yes' : '';
    const clientProject = thatDay?.hours ? 'Yes' : '';
    const actualHours = thatDay?.hours ? 8 : '';

    return {...item, projectCode, ticketNumber, hoursAvailable, hoursEstimated, hoursActual, billable, billableHours, clientProject, actualHours};
  })


  const updatedSpreadSheet = updatedTime.map(item => Object.values(item));

  //replace a range of values (3x3 grid, starting at H8)
  const res = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: abbreviation + "_" + yearAbbreviation + "!A2:L",
    valueInputOption: "USER_ENTERED",
    resource: {
      values: updatedSpreadSheet
    }
  });
  //print results
  console.log(JSON.stringify(res.data, null, 2));
  // {
  //   "spreadsheetId": "xxxxxxxxxxxxxxx",
  //   "updatedRange": "Sheet1!H8:J10",
  //   "updatedRows": 3,
  //   "updatedColumns": 3,
  //   "updatedCells": 9
  // }
}

function dateFormat(inputDate, format) {
  //parse the input date
  const date = new Date(inputDate);

  //extract the parts of the date
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();    

  //replace the month
  format = format.replace("MM", month.toString().padStart(2,"0"));        

  //replace the year
  if (format.indexOf("yyyy") > -1) {
      format = format.replace("yyyy", year.toString());
  } else if (format.indexOf("yy") > -1) {
      format = format.replace("yy", year.toString().substr(2,2));
  }

  //replace the day
  format = format.replace("dd", day.toString().padStart(2,"0"));

  return format;
}

// Accepts a Date object or date string that is recognized by the Date.parse() method
function getDayOfWeek(date) {
  const dayOfWeek = new Date(date).getDay();    
  return isNaN(dayOfWeek) ? null : 
    ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
}

function addLeadingZeros(dateString) {
  const [day, month, year] = dateString.split('/');
  const paddedDay = day.padStart(2, '0');
  const paddedMonth = month.padStart(2, '0');
  return `${paddedDay}/${paddedMonth}/${year}`;
}

function searchByDate(arr, date) {
  // Filter the array to only include objects with matching date
  const results = arr.filter((obj) => obj.date === date);

  // Return the first result or null if no results were found
  return results.length > 0 ? results[0] : null;
}

function getLastFullDayOfMonth(monthName) {
  const monthNumber = new Date(Date.parse(`${monthName} 1, 2000`)).getMonth() + 1;
  const yearNumber = new Date().getFullYear();
  const lastDayOfMonth = new Date(yearNumber, monthNumber, 0).getDate();
  return `${yearNumber}-${monthNumber.toString().padStart(2, '0')}-${lastDayOfMonth.toString().padStart(2, '0')}`;
}

function getFirstFullDayOfMonth(monthName) {
  const monthNumber = new Date(Date.parse(`${monthName} 1, 2000`)).getMonth() + 1;
  const yearNumber = new Date().getFullYear();
  return `${yearNumber}-${monthNumber.toString().padStart(2, '0')}-01`;
}


run().catch(err => console.error("ERR", err));
