// netlify/functions/dailySummary.js

export const handler = async (event, context) => {
  try {
    const response = await fetch(`${process.env.URL || 'http://localhost:3000'}/api/email/daily-summary`);

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
