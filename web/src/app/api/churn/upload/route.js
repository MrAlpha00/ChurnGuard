import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const body = await request.json();
    const { fileUrl } = body;

    if (!fileUrl) {
      return Response.json({ error: "File URL is required" }, { status: 400 });
    }

    // Fetch the file content
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      return Response.json({ error: "Failed to fetch file" }, { status: 400 });
    }

    const fileContent = await fileResponse.text();

    // Parse CSV (simple parser - assumes CSV format)
    const lines = fileContent.split("\n").filter((line) => line.trim());
    if (lines.length < 2) {
      return Response.json(
        { error: "File is empty or invalid" },
        { status: 400 },
      );
    }

    const headers = lines[0]
      .split(",")
      .map((h) => h.trim().toLowerCase().replace(/"/g, ""));
    const rows = lines.slice(1);

    let processedCount = 0;

    for (const row of rows) {
      const values = row.split(",").map((v) => v.trim().replace(/"/g, ""));
      const record = {};

      headers.forEach((header, index) => {
        record[header] = values[index];
      });

      // Calculate churn risk score based on available data
      const tenure = parseInt(record.tenure) || 0;
      const supportTickets = parseInt(record.support_tickets) || 0;
      const contractType = record.contract_type || "";
      const monthlyCharges = parseFloat(record.monthly_charges) || 0;

      let riskScore = 0.5; // base risk

      // Higher risk for shorter tenure
      if (tenure < 6) riskScore += 0.3;
      else if (tenure < 12) riskScore += 0.2;
      else if (tenure < 24) riskScore += 0.1;
      else riskScore -= 0.1;

      // Higher risk for more support tickets
      if (supportTickets > 5) riskScore += 0.2;
      else if (supportTickets > 3) riskScore += 0.1;

      // Higher risk for month-to-month contracts
      if (contractType.toLowerCase().includes("month-to-month"))
        riskScore += 0.15;
      else if (contractType.toLowerCase().includes("one year"))
        riskScore -= 0.05;
      else if (contractType.toLowerCase().includes("two year"))
        riskScore -= 0.15;

      // Higher risk for high monthly charges with short tenure
      if (monthlyCharges > 80 && tenure < 12) riskScore += 0.1;

      // Normalize to 0-1 range
      riskScore = Math.max(0, Math.min(1, riskScore));

      const churnPrediction = riskScore > 0.6;
      let segment = "Low Risk";
      if (riskScore > 0.6) segment = "High Risk";
      else if (riskScore > 0.4) segment = "Medium Risk";

      try {
        await sql`
          INSERT INTO customers (
            customer_id, name, email, tenure, monthly_charges, total_charges,
            contract_type, payment_method, internet_service, phone_service,
            support_tickets, account_age_days, last_interaction_days,
            churn_risk_score, churn_prediction, segment
          ) VALUES (
            ${record.customer_id || `CUST${Date.now()}-${processedCount}`},
            ${record.name || "Unknown"},
            ${record.email || ""},
            ${tenure},
            ${monthlyCharges},
            ${parseFloat(record.total_charges) || 0},
            ${contractType},
            ${record.payment_method || ""},
            ${record.internet_service || ""},
            ${record.phone_service === "true" || record.phone_service === "1"},
            ${supportTickets},
            ${parseInt(record.account_age_days) || tenure * 30},
            ${parseInt(record.last_interaction_days) || 30},
            ${riskScore},
            ${churnPrediction},
            ${segment}
          )
          ON CONFLICT (customer_id) DO UPDATE SET
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            tenure = EXCLUDED.tenure,
            monthly_charges = EXCLUDED.monthly_charges,
            total_charges = EXCLUDED.total_charges,
            contract_type = EXCLUDED.contract_type,
            payment_method = EXCLUDED.payment_method,
            internet_service = EXCLUDED.internet_service,
            phone_service = EXCLUDED.phone_service,
            support_tickets = EXCLUDED.support_tickets,
            account_age_days = EXCLUDED.account_age_days,
            last_interaction_days = EXCLUDED.last_interaction_days,
            churn_risk_score = EXCLUDED.churn_risk_score,
            churn_prediction = EXCLUDED.churn_prediction,
            segment = EXCLUDED.segment,
            updated_at = CURRENT_TIMESTAMP
        `;

        processedCount++;
      } catch (insertError) {
        console.error("Error inserting customer:", insertError);
      }
    }

    return Response.json({
      success: true,
      count: processedCount,
      message: `Successfully processed ${processedCount} customer records`,
    });
  } catch (error) {
    console.error("Error uploading customer data:", error);
    return Response.json(
      { error: error.message || "Failed to upload data" },
      { status: 500 },
    );
  }
}
