const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client();

app.post('/verify-token', async (req, res) => {
  const { idToken } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: 'YOUR_CLIENT_ID_HERE'
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    res.json({ success: true, email });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});
