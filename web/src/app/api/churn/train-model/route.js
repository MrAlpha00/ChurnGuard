import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    // Get all customers for training
    const customers = await sql`SELECT * FROM customers`;

    if (customers.length === 0) {
      return Response.json(
        { error: "No customer data available for training" },
        { status: 400 },
      );
    }

    // Simulate model training with improved algorithm
    // In a real scenario, this would use actual ML libraries
    let correctPredictions = 0;
    let truePositives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let falseNegatives = 0;

    // Re-calculate predictions for all customers with improved model
    for (const customer of customers) {
      const tenure = customer.tenure || 0;
      const supportTickets = customer.support_tickets || 0;
      const monthlyCharges = customer.monthly_charges || 0;
      const contractType = customer.contract_type || "";
      const paymentMethod = customer.payment_method || "";

      let riskScore = 0.4; // Adjusted base risk

      // Tenure factor (most important)
      if (tenure < 3) riskScore += 0.35;
      else if (tenure < 6) riskScore += 0.25;
      else if (tenure < 12) riskScore += 0.15;
      else if (tenure < 24) riskScore += 0.05;
      else if (tenure > 48) riskScore -= 0.15;

      // Support tickets factor
      if (supportTickets > 7) riskScore += 0.25;
      else if (supportTickets > 5) riskScore += 0.18;
      else if (supportTickets > 3) riskScore += 0.12;
      else if (supportTickets === 0) riskScore -= 0.08;

      // Contract type factor
      if (contractType.toLowerCase().includes("month-to-month"))
        riskScore += 0.2;
      else if (contractType.toLowerCase().includes("one year"))
        riskScore -= 0.05;
      else if (contractType.toLowerCase().includes("two year"))
        riskScore -= 0.18;

      // Payment method factor
      if (paymentMethod.toLowerCase().includes("electronic check"))
        riskScore += 0.12;
      else if (paymentMethod.toLowerCase().includes("credit card"))
        riskScore -= 0.05;
      else if (paymentMethod.toLowerCase().includes("bank transfer"))
        riskScore -= 0.08;

      // Monthly charges with tenure interaction
      if (monthlyCharges > 85 && tenure < 12) riskScore += 0.15;
      else if (monthlyCharges < 30 && tenure > 24) riskScore -= 0.05;

      // Normalize
      riskScore = Math.max(0, Math.min(1, riskScore));

      const newPrediction = riskScore > 0.58;
      let newSegment = "Low Risk";
      if (riskScore > 0.58) newSegment = "High Risk";
      else if (riskScore > 0.38) newSegment = "Medium Risk";

      // Update customer with new prediction
      await sql`
        UPDATE customers 
        SET churn_risk_score = ${riskScore},
            churn_prediction = ${newPrediction},
            segment = ${newSegment},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${customer.id}
      `;

      // Calculate accuracy metrics (simulated ground truth)
      // In real scenario, you'd have actual churn labels
      const actualChurn = customer.churn_prediction; // Using current as "actual" for demo
      if (newPrediction === actualChurn) {
        correctPredictions++;
        if (newPrediction) truePositives++;
        else trueNegatives++;
      } else {
        if (newPrediction) falsePositives++;
        else falseNegatives++;
      }
    }

    const accuracy =
      customers.length > 0 ? correctPredictions / customers.length : 0;
    const precision =
      truePositives + falsePositives > 0
        ? truePositives / (truePositives + falsePositives)
        : 0;
    const recall =
      truePositives + falseNegatives > 0
        ? truePositives / (truePositives + falseNegatives)
        : 0;
    const f1Score =
      precision + recall > 0
        ? (2 * (precision * recall)) / (precision + recall)
        : 0;

    // Store model metrics
    const modelVersion = `v${Date.now()}`;
    await sql`
      INSERT INTO model_history (
        model_version, accuracy, precision_score, recall_score, f1_score, 
        total_samples, features_used
      ) VALUES (
        ${modelVersion},
        ${accuracy},
        ${precision},
        ${recall},
        ${f1Score},
        ${customers.length},
        ${["tenure", "monthly_charges", "support_tickets", "contract_type", "payment_method"]}
      )
    `;

    // Log predictions
    for (const customer of customers) {
      const riskLevel = customer.segment;
      let recommendedAction = "";

      if (riskLevel === "High Risk") {
        recommendedAction = "Immediate outreach with retention offer";
      } else if (riskLevel === "Medium Risk") {
        recommendedAction = "Proactive engagement and satisfaction survey";
      } else {
        recommendedAction = "Nurture relationship and upsell opportunities";
      }

      await sql`
        INSERT INTO predictions_log (
          customer_id, churn_probability, risk_level, recommended_action
        ) VALUES (
          ${customer.customer_id},
          ${customer.churn_risk_score},
          ${riskLevel},
          ${recommendedAction}
        )
      `;
    }

    return Response.json({
      success: true,
      modelVersion,
      metrics: {
        accuracy,
        precision,
        recall,
        f1Score,
        totalSamples: customers.length,
      },
    });
  } catch (error) {
    console.error("Error training model:", error);
    return Response.json({ error: "Failed to train model" }, { status: 500 });
  }
}
