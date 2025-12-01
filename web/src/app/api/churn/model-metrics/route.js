import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const metrics = await sql`
      SELECT * FROM model_history 
      ORDER BY training_date DESC 
      LIMIT 1
    `;

    if (metrics.length === 0) {
      return Response.json(null);
    }

    return Response.json(metrics[0]);
  } catch (error) {
    console.error("Error fetching model metrics:", error);
    return Response.json(
      { error: "Failed to fetch model metrics" },
      { status: 500 },
    );
  }
}
