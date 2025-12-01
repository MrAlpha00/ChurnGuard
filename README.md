# 🔮 ChurnGuard — AI-Powered Customer Churn Analysis & Prediction Platform

ChurnGuard is a complete end-to-end machine learning platform designed to **analyze customer churn, train prediction models, visualize insights, and generate actionable retention strategies** — all in one place.

This system allows businesses to upload datasets, train ML models, view risk segmentation dashboards, and export results with ease.
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/1f82b041-7454-4684-b099-189a03330296" />


---

## 🚀 Features

### 📊 **1. Overview Dashboard**
Get a complete birds-eye view of customer churn metrics:
- Total customers & churn distribution  
- High / Medium / Low risk segmentation  
- **Model accuracy & performance metrics**  
- Risk segmentation **pie chart**  
- Churn rate by tenure **bar chart**  
- **High-risk customer table** for quick action  

---

### 📥 **2. Data Upload**
Upload CSV or Excel files and ChurnGuard will automatically:
- Process and clean incoming data  
- Calculate churn risk scores  
- Segment customers into risk groups  
- Store everything inside the database  

---

### 🤖 **3. Model Training**
Train your AI model with a **single click**:
- Uses features like tenure, support tickets, charges, payment method, etc.  
- Generates **accuracy, precision, recall, F1-score**  
- Updates predictions for all customers  
- Stores training history in the database  

---

### 🔍 **4. Predictions**
View AI-powered predictions including:
- Churn probability (0–1)  
- Risk group: **High / Medium / Low**  
- Contract + customer attributes  
- Suggested interventions to reduce churn  

---

### 🧩 **5. Segmentation**
Dive deeper into customer behavior:
- Avg tenure, charges, contract type per risk group  
- Behavior trends  
- **Recommended retention strategies**  
- Actionable intervention plans for each segment  

---

### 📁 **6. Export Tools**
Export results with one click:
- CSV  
- Excel  
- Prediction reports  

---

### 🗄️ **7. Database Integration**
Fully structured backend:
- Customer table  
- Prediction logs  
- Model training history  

---

### 🎨 **8. Modern UI / UX**
- Fully responsive (mobile + desktop)  
- Professional dashboard design  
- **Dark mode included**  
- Smooth navigation  

---

## 🛠️ Tech Stack

| Layer | Technology |
|------|------------|
| Frontend | React / Vite / Tailwind or your preferred stack |
| Backend | Python / FastAPI / Flask (based on your implementation) |
| ML Model | Scikit-Learn (Random Forest, etc.) |
| Database | PostgreSQL / SQLite |
| Visualization | Chart.js / Recharts |
| File Handling | Pandas |

---

## 📦 Installation & Setup


### 1️⃣ Clone the repository
```bash
git clone https://github.com/<your-username>/ChurnGuard.git
cd ChurnGuard
```

2️⃣ Install dependencies

If Python backend:
```
pip install -r requirements.txt

```
If frontend:
```
npm install
```
3️⃣ Run backend
```
python app.py
```

4️⃣ Run frontend
```
npm run dev
```
## 📤 File Upload Format

Your dataset should include these columns (minimum):
| Column          | Description                     |
| --------------- | ------------------------------- |
| tenure          | Customer months of subscription |
| monthly_charges | Billing                         |
| total_charges   | Lifetime value                  |
| support_tickets | Customer complaints             |
| contract_type   | Monthly / Yearly                |
| churn           | 0 / 1 (optional for training)   |



---
##🤝 Contributions

Pull requests are welcome!
If you want new features like:
---
## 📧 Email alerts for high-risk customers

## 🔗 CRM integration

## 🧠 Deep learning model

## 🕒 Scheduled auto-training
---
Feel free to open an issue.
---
###📜 License

This project is licensed under the MIT License.

⭐ Support This Project

If you like ChurnGuard, don’t forget to:

⭐ Star the repo

🍴 Fork it

🔔 Follow for updates
---
🙌 Credits

Developed with ❤️ by Suhas M

---

