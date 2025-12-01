import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const segmentation = await sql`
      SELECT 
        segment,
        COUNT(*) as count,
        AVG(tenure) as avg_tenure,
        AVG(monthly_charges) as avg_monthly_charges,
        AVG(support_tickets) as avg_support_tickets,
        AVG(churn_risk_score) as avg_risk_score
      FROM customers
      WHERE segment IS NOT NULL
      GROUP BY segment
      ORDER BY 
        CASE segment
          WHEN 'High Risk' THEN 1
          WHEN 'Medium Risk' THEN 2
          WHEN 'Low Risk' THEN 3
        END
    `;

    return Response.json(segmentation);
  } catch (error) {
    console.error("Error fetching segmentation:", error);
    return Response.json(
      { error: "Failed to fetch segmentation" },
      { status: 500 },
    );
  }
}
