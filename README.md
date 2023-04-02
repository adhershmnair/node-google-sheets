# Google spreadsheets V4 API using Node

Sheets v4 API provides:

- Faster responses
- More features
- Uses JSON instead of XML
- `async`/`await` support

See example (`eg`) files in this repository for more information

---

Tips:

- The Node.js API mirrors the "REST Resources" found in the documentation https://developers.google.com/sheets/api/reference/rest/.
- Use a TypeScript enabled editor for useful auto-completes

### How to run the examples

The following process creates a new OAuth application (Client ID/Secret) and gives it access to your Google account's spreadsheets (Refresh token) and stores the results into `credentials.json`

1. Get your credentials
    1. Go to https://console.cloud.google.com/apis/dashboard
    1. Click "Enable APIs and Services"
    1. Search "Sheets"
    1. Click "Enable"
    1. Go to https://console.developers.google.com/apis/credentials/oauthclient
    1. **IMPORTANT** Choose "Desktop app" and choose a name
    1. Should find a form with: Client ID, Client secret
    1. Run `node credentials-fill.js` which will update `credentials.json`
    1. Optional: Updated the `userdetails.json` file with your credentials and other user info.
1. Run the examples (`eg-*.js`)
