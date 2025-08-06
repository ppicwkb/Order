const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const creds = require('./creds.json');


const SPREADSHEET_ID = '1XqOc2FAH5VvlyzhdTL2vs7T1jgS45U5W4zDCn03rZ1g';
const SHEET_NAME = 'INBOUND';

const app = express();
app.use(bodyParser.json());

const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});
const sheets = google.sheets({ version: 'v4', auth });

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:B`
  });
  const rows = resp.data.values || [];
  const user = rows.find(r => r[0] === username && r[1] === password);
  res.json({ success: !!user });
});

app.get('/data', async (req, res) => {
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:K`
  });
  res.json({ data: resp.data.values });
});

app.post('/update', async (req, res) => {
  const { rowIndex, ceklis, catatan } = req.body;
  const rowNumber = rowIndex + 2;
  const resp = await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!J${rowNumber}:K${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [[ceklis, catatan]] }
  });
  res.json({ success: !!resp.data.updatedCells });
});

app.listen(3000, () => {
  console.log('Backend running on http://localhost:3000');
});
