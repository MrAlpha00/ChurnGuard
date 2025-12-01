import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";

    const customers = await sql`
      SELECT 
        customer_id, name, email, tenure, monthly_charges, total_charges,
        contract_type, payment_method, internet_service, phone_service,
        support_tickets, churn_risk_score, churn_prediction, segment
      FROM customers
      ORDER BY churn_risk_score DESC
    `;

    if (format === "csv") {
      // Generate CSV
      const headers = [
        "Customer ID",
        "Name",
        "Email",
        "Tenure (months)",
        "Monthly Charges",
        "Total Charges",
        "Contract Type",
        "Payment Method",
        "Internet Service",
        "Phone Service",
        "Support Tickets",
        "Churn Risk Score",
        "Churn Prediction",
        "Segment",
      ];

      let csv = headers.join(",") + "\n";

      for (const customer of customers) {
        const row = [
          customer.customer_id,
          `"${customer.name}"`,
          customer.email,
          customer.tenure,
          customer.monthly_charges,
          customer.total_charges,
          `"${customer.contract_type}"`,
          `"${customer.payment_method}"`,
          `"${customer.internet_service}"`,
          customer.phone_service,
          customer.support_tickets,
          (customer.churn_risk_score * 100).toFixed(2) + "%",
          customer.churn_prediction ? "Yes" : "No",
          `"${customer.segment}"`,
        ];
        csv += row.join(",") + "\n";
      }

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="churn_analysis.csv"',
        },
      });
    } else if (format === "excel") {
      // Generate simple Excel-compatible CSV (Excel can open CSV files)
      const headers = [
        "Customer ID",
        "Name",
        "Email",
        "Tenure (months)",
        "Monthly Charges",
        "Total Charges",
        "Contract Type",
        "Payment Method",
        "Internet Service",
        "Phone Service",
        "Support Tickets",
        "Churn Risk Score (%)",
        "Churn Prediction",
        "Segment",
      ];

      let excel = headers.join("\t") + "\n";

      for (const customer of customers) {
        const row = [
          customer.customer_id,
          customer.name,
          customer.email,
          customer.tenure,
          customer.monthly_charges,
          customer.total_charges,
          customer.contract_type,
          customer.payment_method,
          customer.internet_service,
          customer.phone_service ? "Yes" : "No",
          customer.support_tickets,
          (customer.churn_risk_score * 100).toFixed(2),
          customer.churn_prediction ? "Yes" : "No",
          customer.segment,
        ];
        excel += row.join("\t") + "\n";
      }

      return new Response(excel, {
        headers: {
          "Content-Type": "application/vnd.ms-excel",
          "Content-Disposition": 'attachment; filename="churn_analysis.xls"',
        },
      });
    }

    return Response.json({ error: "Invalid format" }, { status: 400 });
  } catch (error) {
    console.error("Error exporting data:", error);
    return Response.json({ error: "Failed to export data" }, { status: 500 });
  }
}
