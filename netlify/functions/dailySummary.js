// netlify/functions/dailySummary.js

export const handler = async (event, context) => {
  try {
    const baseUrl = process.env.URL || 'https://oceansidehousing.llc';
const response = await fetch(`${baseUrl}/api/email/daily-summary`, {
  method: 'GET',
  headers: { 'User-Agent': 'NetlifyFunction' }
});

    const data = await response.json();
    console.log("Daily summary result:", data);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Daily summary executed successfully",
        data,
      }),
    };
  } catch (error) {
    console.error("Error triggering daily summary:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
