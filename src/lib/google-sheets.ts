/**
 * Log signups to Google Sheets via a Google Apps Script Web App
 * 
 * To set this up:
 * 1. Create a new Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Create a new script with the following code:
 * 
 * function doPost(e) {
 *   var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
 *   var data = JSON.parse(e.postData.contents);
 *   sheet.appendRow([
 *     new Date(),
 *     data.event || 'signup',
 *     data.email,
 *     data.name || '',
 *     data.source || 'direct'
 *   ]);
 *   return ContentService.createTextOutput(JSON.stringify({ success: true }))
 *     .setMimeType(ContentService.MimeType.JSON);
 * }
 * 
 * 4. Deploy as Web App (Execute as: Me, Who has access: Anyone)
 * 5. Copy the Web App URL and set it as GOOGLE_SHEETS_WEBHOOK_URL env var
 */

interface SignupData {
  email: string
  name?: string | null
  source?: string
}

interface UserEventData {
  email: string
  name?: string | null
  source?: string
  event: "signup" | "profile_update" | "login"
}

export async function logSignupToGoogleSheets(data: SignupData): Promise<boolean> {
  return logUserEventToGoogleSheets({
    email: data.email,
    name: data.name,
    source: data.source,
    event: "signup",
  })
}

export async function logUserEventToGoogleSheets(data: UserEventData): Promise<boolean> {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL

  if (!webhookUrl) {
    console.log("Google Sheets webhook URL not configured, skipping signup logging")
    return false
  }

  try {
    // IMPORTANT: We only log non-sensitive profile metadata - NEVER passwords
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email,
        name: data.name || "",
        source: data.source || "direct",
        event: data.event,
        // timestamp is added by the Google Apps Script
      }),
    })

    if (!response.ok) {
      console.error("Failed to log signup to Google Sheets:", response.status)
      return false
    }

    console.log("User event logged to Google Sheets:", data.event, data.email)
    return true
  } catch (error) {
    // Don't throw - logging failure shouldn't break signup flow
    console.error("Error logging signup to Google Sheets:", error)
    return false
  }
}

/**
 * Alternative: Use Google Sheets API directly
 * Requires setting up a service account and credentials
 */
export async function logSignupToGoogleSheetsAPI(data: SignupData): Promise<boolean> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY
  const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || "Signups"

  if (!spreadsheetId || !apiKey) {
    console.log("Google Sheets API not configured, skipping signup logging")
    return false
  }

  try {
    const range = `${sheetName}!A:D`
    const values = [[
      new Date().toISOString(),
      data.email,
      data.name || "",
      data.source || "direct"
    ]]

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values }),
      }
    )

    if (!response.ok) {
      console.error("Failed to log to Google Sheets API:", response.status)
      return false
    }

    return true
  } catch (error) {
    console.error("Error logging to Google Sheets API:", error)
    return false
  }
}
