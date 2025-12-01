"use client";
import React, { useState } from "react";
import {
  Upload,
  Database,
  Brain,
  Users,
  TrendingDown,
  Download,
  BarChart3,
  PieChart,
  AlertCircle,
  CheckCircle,
  Clock,
  FileSpreadsheet,
  Menu,
  X,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import useUpload from "@/utils/useUpload";

export default function ChurnAnalysisDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const queryClient = useQueryClient();
  const [upload, { loading: uploadLoading }] = useUpload();

  // Fetch customers data
  const { data: customers = [], isLoading: loadingCustomers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const response = await fetch("/api/churn/customers");
      if (!response.ok) throw new Error("Failed to fetch customers");
      return response.json();
    },
  });

  // Fetch model metrics
  const { data: modelMetrics } = useQuery({
    queryKey: ["model-metrics"],
    queryFn: async () => {
      const response = await fetch("/api/churn/model-metrics");
      if (!response.ok) throw new Error("Failed to fetch model metrics");
      return response.json();
    },
  });

  // Fetch segmentation data
  const { data: segmentation = [] } = useQuery({
    queryKey: ["segmentation"],
    queryFn: async () => {
      const response = await fetch("/api/churn/segmentation");
      if (!response.ok) throw new Error("Failed to fetch segmentation");
      return response.json();
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      setUploadError(null);
      const { url, error } = await upload({ url: file });
      if (error) throw new Error(error);

      const response = await fetch("/api/churn/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl: url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["customers"]);
      queryClient.invalidateQueries(["segmentation"]);
    },
    onError: (error) => {
      setUploadError(error.message);
    },
  });

  // Train model mutation
  const trainModelMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/churn/train-model", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Model training failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["model-metrics"]);
      queryClient.invalidateQueries(["customers"]);
    },
  });

  // Export data
  const handleExport = async (format) => {
    try {
      const response = await fetch(`/api/churn/export?format=${format}`);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `churn_analysis.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export error:", error);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        uploadMutation.mutate(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const highRiskCustomers = customers.filter(
    (c) => c.segment === "High Risk",
  ).length;
  const mediumRiskCustomers = customers.filter(
    (c) => c.segment === "Medium Risk",
  ).length;
  const lowRiskCustomers = customers.filter(
    (c) => c.segment === "Low Risk",
  ).length;
  const totalCustomers = customers.length;
  const churnRate =
    totalCustomers > 0
      ? ((highRiskCustomers / totalCustomers) * 100).toFixed(1)
      : 0;

  const segmentationPieData = [
    { name: "High Risk", value: highRiskCustomers, color: "#EF4444" },
    { name: "Medium Risk", value: mediumRiskCustomers, color: "#F59E0B" },
    { name: "Low Risk", value: lowRiskCustomers, color: "#10B981" },
  ];

  const tenureChurnData = React.useMemo(() => {
    if (!customers.length) return [];
    const ranges = [
      { range: "0-6 months", min: 0, max: 6 },
      { range: "7-12 months", min: 7, max: 12 },
      { range: "13-24 months", min: 13, max: 24 },
      { range: "25-48 months", min: 25, max: 48 },
      { range: "48+ months", min: 49, max: 999 },
    ];

    return ranges.map((r) => {
      const inRange = customers.filter(
        (c) => c.tenure >= r.min && c.tenure <= r.max,
      );
      const churned = inRange.filter((c) => c.churn_prediction).length;
      return {
        range: r.range,
        total: inRange.length,
        churned: churned,
        rate:
          inRange.length > 0
            ? ((churned / inRange.length) * 100).toFixed(1)
            : 0,
      };
    });
  }, [customers]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] font-inter">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white dark:bg-[#1E1E1E] border-r border-[#E6E8EB] dark:border-[#404040] z-50 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 w-64`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#FF6F2F] rounded-2xl flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-white" strokeWidth={2} />
              </div>
              <h1 className="text-xl font-bold text-[#13182B] dark:text-white">
                ChurnGuard
              </h1>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X className="h-6 w-6 text-[#6B7280]" />
            </button>
          </div>

          <nav className="space-y-2">
            <NavItem
              icon={BarChart3}
              label="Overview"
              active={activeTab === "overview"}
              onClick={() => {
                setActiveTab("overview");
                setSidebarOpen(false);
              }}
            />
            <NavItem
              icon={Upload}
              label="Data Upload"
              active={activeTab === "upload"}
              onClick={() => {
                setActiveTab("upload");
                setSidebarOpen(false);
              }}
            />
            <NavItem
              icon={Brain}
              label="Model Training"
              active={activeTab === "model"}
              onClick={() => {
                setActiveTab("model");
                setSidebarOpen(false);
              }}
            />
            <NavItem
              icon={Users}
              label="Predictions"
              active={activeTab === "predictions"}
              onClick={() => {
                setActiveTab("predictions");
                setSidebarOpen(false);
              }}
            />
            <NavItem
              icon={PieChart}
              label="Segmentation"
              active={activeTab === "segmentation"}
              onClick={() => {
                setActiveTab("segmentation");
                setSidebarOpen(false);
              }}
            />
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 bg-white dark:bg-[#1E1E1E] border-b border-[#E6E8EB] dark:border-[#404040] z-30 px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-[#F8F9FA] dark:hover:bg-[#404040] rounded-xl"
              >
                <Menu className="h-6 w-6 text-[#6B7280]" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-[#13182B] dark:text-white">
                  Customer Churn Analysis
                </h2>
                <p className="text-sm text-[#6B7280] dark:text-[#A0A0A0]">
                  Predict and prevent customer churn with AI
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleExport("csv")}
                className="flex items-center space-x-2 px-4 py-2 border border-[#E6E8EB] dark:border-[#404040] rounded-2xl hover:bg-[#F8F9FA] dark:hover:bg-[#404040] transition-colors"
              >
                <Download className="h-4 w-4 text-[#6B7280]" />
                <span className="text-sm text-[#374151] dark:text-[#E0E0E0] hidden sm:inline">
                  CSV
                </span>
              </button>
              <button
                onClick={() => handleExport("excel")}
                className="flex items-center space-x-2 px-4 py-2 bg-[#FF6F2F] text-white rounded-2xl hover:bg-[#E55A29] transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span className="text-sm hidden sm:inline">Excel</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 lg:p-8">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                  icon={Users}
                  title="Total Customers"
                  value={totalCustomers}
                  color="blue"
                />
                <StatCard
                  icon={AlertCircle}
                  title="High Risk"
                  value={highRiskCustomers}
                  color="red"
                  percentage={churnRate}
                />
                <StatCard
                  icon={CheckCircle}
                  title="Low Risk"
                  value={lowRiskCustomers}
                  color="green"
                />
                <StatCard
                  icon={Database}
                  title="Model Accuracy"
                  value={
                    modelMetrics?.accuracy
                      ? `${(modelMetrics.accuracy * 100).toFixed(1)}%`
                      : "N/A"
                  }
                  color="purple"
                />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Churn by Tenure */}
                <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-6 border border-[#E6E8EB] dark:border-[#404040]">
                  <h3 className="text-lg font-semibold text-[#13182B] dark:text-white mb-4">
                    Churn Rate by Tenure
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={tenureChurnData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E6E8EB" />
                      <XAxis
                        dataKey="range"
                        tick={{ fill: "#6B7280", fontSize: 12 }}
                      />
                      <YAxis tick={{ fill: "#6B7280", fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1E1E1E",
                          border: "1px solid #404040",
                          borderRadius: "12px",
                          color: "#fff",
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="churned"
                        fill="#EF4444"
                        name="Churned"
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar
                        dataKey="total"
                        fill="#10B981"
                        name="Active"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Risk Segmentation */}
                <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-6 border border-[#E6E8EB] dark:border-[#404040]">
                  <h3 className="text-lg font-semibold text-[#13182B] dark:text-white mb-4">
                    Risk Segmentation
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RePieChart>
                      <Pie
                        data={segmentationPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {segmentationPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* High Risk Customers Table */}
              <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-6 border border-[#E6E8EB] dark:border-[#404040]">
                <h3 className="text-lg font-semibold text-[#13182B] dark:text-white mb-4">
                  High Risk Customers - Immediate Action Required
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#E6E8EB] dark:border-[#404040]">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280] dark:text-[#A0A0A0]">
                          Customer
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280] dark:text-[#A0A0A0]">
                          Risk Score
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280] dark:text-[#A0A0A0]">
                          Tenure
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280] dark:text-[#A0A0A0]">
                          Monthly Charges
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280] dark:text-[#A0A0A0]">
                          Support Tickets
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers
                        .filter((c) => c.segment === "High Risk")
                        .slice(0, 5)
                        .map((customer) => (
                          <tr
                            key={customer.id}
                            className="border-b border-[#E6E8EB] dark:border-[#404040] hover:bg-[#F8F9FA] dark:hover:bg-[#262626]"
                          >
                            <td className="py-3 px-4">
                              <div>
                                <div className="text-sm font-medium text-[#13182B] dark:text-white">
                                  {customer.name}
                                </div>
                                <div className="text-xs text-[#6B7280] dark:text-[#A0A0A0]">
                                  {customer.email}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                {(customer.churn_risk_score * 100).toFixed(0)}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-[#374151] dark:text-[#E0E0E0]">
                              {customer.tenure} months
                            </td>
                            <td className="py-3 px-4 text-sm text-[#374151] dark:text-[#E0E0E0]">
                              ${customer.monthly_charges}
                            </td>
                            <td className="py-3 px-4 text-sm text-[#374151] dark:text-[#E0E0E0]">
                              {customer.support_tickets}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "upload" && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-8 border border-[#E6E8EB] dark:border-[#404040]">
                <div className="text-center mb-8">
                  <Database className="h-16 w-16 text-[#FF6F2F] mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-[#13182B] dark:text-white mb-2">
                    Upload Customer Data
                  </h3>
                  <p className="text-[#6B7280] dark:text-[#A0A0A0]">
                    Upload CSV or Excel files with customer information
                  </p>
                </div>

                <div className="border-2 border-dashed border-[#E6E8EB] dark:border-[#404040] rounded-2xl p-12 text-center hover:border-[#FF6F2F] transition-colors">
                  <Upload className="h-12 w-12 text-[#6B7280] dark:text-[#A0A0A0] mx-auto mb-4" />
                  <label className="cursor-pointer">
                    <span className="text-[#FF6F2F] hover:text-[#E55A29] font-medium">
                      Click to upload
                    </span>
                    <span className="text-[#6B7280] dark:text-[#A0A0A0]">
                      {" "}
                      or drag and drop
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      disabled={uploadLoading || uploadMutation.isPending}
                    />
                  </label>
                  <p className="text-sm text-[#6B7280] dark:text-[#A0A0A0] mt-2">
                    CSV or Excel (MAX. 10MB)
                  </p>
                </div>

                {(uploadLoading || uploadMutation.isPending) && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-blue-600 animate-spin" />
                      <span className="text-sm text-blue-600 dark:text-blue-400">
                        Processing your data...
                      </span>
                    </div>
                  </div>
                )}

                {uploadMutation.isSuccess && (
                  <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-green-600 dark:text-green-400">
                        Data uploaded successfully! {uploadMutation.data?.count}{" "}
                        records processed.
                      </span>
                    </div>
                  </div>
                )}

                {uploadError && (
                  <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <span className="text-sm text-red-600 dark:text-red-400">
                        {uploadError}
                      </span>
                    </div>
                  </div>
                )}

                <div className="mt-8 p-6 bg-[#F8F9FA] dark:bg-[#262626] rounded-2xl">
                  <h4 className="font-semibold text-[#13182B] dark:text-white mb-3">
                    Required Fields:
                  </h4>
                  <ul className="space-y-2 text-sm text-[#6B7280] dark:text-[#A0A0A0]">
                    <li>• customer_id (unique identifier)</li>
                    <li>• name, email (customer information)</li>
                    <li>• tenure (months as customer)</li>
                    <li>• monthly_charges, total_charges (billing)</li>
                    <li>
                      • contract_type (Month-to-month, One year, Two year)
                    </li>
                    <li>
                      • payment_method, internet_service (service details)
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === "model" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-8 border border-[#E6E8EB] dark:border-[#404040]">
                <div className="text-center mb-8">
                  <Brain className="h-16 w-16 text-[#FF6F2F] mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-[#13182B] dark:text-white mb-2">
                    AI Model Training
                  </h3>
                  <p className="text-[#6B7280] dark:text-[#A0A0A0]">
                    Train the churn prediction model with current data
                  </p>
                </div>

                <button
                  onClick={() => trainModelMutation.mutate()}
                  disabled={
                    trainModelMutation.isPending || customers.length === 0
                  }
                  className="w-full bg-[#FF6F2F] hover:bg-[#E55A29] disabled:bg-gray-400 text-white font-semibold py-4 rounded-2xl transition-colors flex items-center justify-center space-x-2"
                >
                  {trainModelMutation.isPending ? (
                    <>
                      <Clock className="h-5 w-5 animate-spin" />
                      <span>Training Model...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="h-5 w-5" />
                      <span>Start Training</span>
                    </>
                  )}
                </button>

                {trainModelMutation.isSuccess && (
                  <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-green-600 dark:text-green-400">
                        Model trained successfully!
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {modelMetrics && (
                <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-8 border border-[#E6E8EB] dark:border-[#404040]">
                  <h3 className="text-xl font-bold text-[#13182B] dark:text-white mb-6">
                    Model Performance Metrics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard
                      title="Accuracy"
                      value={(modelMetrics.accuracy * 100).toFixed(1)}
                      unit="%"
                    />
                    <MetricCard
                      title="Precision"
                      value={(modelMetrics.precision_score * 100).toFixed(1)}
                      unit="%"
                    />
                    <MetricCard
                      title="Recall"
                      value={(modelMetrics.recall_score * 100).toFixed(1)}
                      unit="%"
                    />
                    <MetricCard
                      title="F1 Score"
                      value={(modelMetrics.f1_score * 100).toFixed(1)}
                      unit="%"
                    />
                  </div>
                  <div className="mt-6 p-4 bg-[#F8F9FA] dark:bg-[#262626] rounded-2xl">
                    <p className="text-sm text-[#6B7280] dark:text-[#A0A0A0]">
                      Model Version:{" "}
                      <span className="font-semibold text-[#13182B] dark:text-white">
                        {modelMetrics.model_version}
                      </span>
                    </p>
                    <p className="text-sm text-[#6B7280] dark:text-[#A0A0A0] mt-1">
                      Training Samples:{" "}
                      <span className="font-semibold text-[#13182B] dark:text-white">
                        {modelMetrics.total_samples}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "predictions" && (
            <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-6 border border-[#E6E8EB] dark:border-[#404040]">
              <h3 className="text-xl font-bold text-[#13182B] dark:text-white mb-6">
                Customer Predictions
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E6E8EB] dark:border-[#404040]">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280] dark:text-[#A0A0A0]">
                        Customer
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280] dark:text-[#A0A0A0]">
                        Segment
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280] dark:text-[#A0A0A0]">
                        Churn Risk
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280] dark:text-[#A0A0A0]">
                        Tenure
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280] dark:text-[#A0A0A0]">
                        Contract
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280] dark:text-[#A0A0A0]">
                        Monthly
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280] dark:text-[#A0A0A0]">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="border-b border-[#E6E8EB] dark:border-[#404040] hover:bg-[#F8F9FA] dark:hover:bg-[#262626]"
                      >
                        <td className="py-3 px-4">
                          <div>
                            <div className="text-sm font-medium text-[#13182B] dark:text-white">
                              {customer.name}
                            </div>
                            <div className="text-xs text-[#6B7280] dark:text-[#A0A0A0]">
                              {customer.customer_id}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              customer.segment === "High Risk"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : customer.segment === "Medium Risk"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            }`}
                          >
                            {customer.segment}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-[#374151] dark:text-[#E0E0E0]">
                          {(customer.churn_risk_score * 100).toFixed(0)}%
                        </td>
                        <td className="py-3 px-4 text-sm text-[#374151] dark:text-[#E0E0E0]">
                          {customer.tenure}m
                        </td>
                        <td className="py-3 px-4 text-sm text-[#374151] dark:text-[#E0E0E0]">
                          {customer.contract_type}
                        </td>
                        <td className="py-3 px-4 text-sm text-[#374151] dark:text-[#E0E0E0]">
                          ${customer.monthly_charges}
                        </td>
                        <td className="py-3 px-4">
                          <button className="text-[#FF6F2F] hover:text-[#E55A29] text-sm font-medium">
                            Intervene
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "segmentation" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {segmentation.map((segment) => (
                  <div
                    key={segment.segment}
                    className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-6 border border-[#E6E8EB] dark:border-[#404040]"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-[#13182B] dark:text-white">
                        {segment.segment}
                      </h3>
                      <span
                        className={`text-2xl font-bold ${
                          segment.segment === "High Risk"
                            ? "text-red-600"
                            : segment.segment === "Medium Risk"
                              ? "text-yellow-600"
                              : "text-green-600"
                        }`}
                      >
                        {segment.count}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#6B7280] dark:text-[#A0A0A0]">
                          Avg Tenure:
                        </span>
                        <span className="text-[#13182B] dark:text-white font-medium">
                          {segment.avg_tenure?.toFixed(0)}m
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B7280] dark:text-[#A0A0A0]">
                          Avg Monthly:
                        </span>
                        <span className="text-[#13182B] dark:text-white font-medium">
                          ${segment.avg_monthly_charges?.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B7280] dark:text-[#A0A0A0]">
                          Avg Support Tickets:
                        </span>
                        <span className="text-[#13182B] dark:text-white font-medium">
                          {segment.avg_support_tickets?.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-6 border border-[#E6E8EB] dark:border-[#404040]">
                <h3 className="text-xl font-bold text-[#13182B] dark:text-white mb-6">
                  Recommended Interventions
                </h3>
                <div className="space-y-4">
                  <InterventionCard
                    risk="High Risk"
                    action="Immediate Contact"
                    description="Reach out with personalized retention offers, loyalty discounts, or service upgrades"
                    color="red"
                  />
                  <InterventionCard
                    risk="Medium Risk"
                    action="Proactive Engagement"
                    description="Send satisfaction surveys, offer premium support, and provide usage tips"
                    color="yellow"
                  />
                  <InterventionCard
                    risk="Low Risk"
                    action="Nurture & Upsell"
                    description="Share success stories, introduce new features, and offer referral incentives"
                    color="green"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-3 w-full p-3 rounded-2xl transition-colors ${
        active
          ? "bg-white dark:bg-[#262626] text-[#13182B] dark:text-white shadow-sm border-l-2 border-[#FF6F2F]"
          : "text-[#6B7280] dark:text-[#A0A0A0] hover:text-[#13182B] dark:hover:text-white hover:bg-white dark:hover:bg-[#262626]"
      }`}
    >
      <Icon className="h-5 w-5" strokeWidth={1.5} />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function StatCard({ icon: Icon, title, value, color, percentage }) {
  const colorClasses = {
    blue: "bg-blue-100 dark:bg-blue-900/20 text-blue-600",
    red: "bg-red-100 dark:bg-red-900/20 text-red-600",
    green: "bg-green-100 dark:bg-green-900/20 text-green-600",
    purple: "bg-purple-100 dark:bg-purple-900/20 text-purple-600",
  };

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-6 border border-[#E6E8EB] dark:border-[#404040]">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorClasses[color]}`}
        >
          <Icon className="h-6 w-6" strokeWidth={1.5} />
        </div>
        {percentage && (
          <span className="text-sm font-medium text-red-600">
            {percentage}%
          </span>
        )}
      </div>
      <p className="text-sm text-[#6B7280] dark:text-[#A0A0A0] mb-1">{title}</p>
      <p className="text-2xl font-bold text-[#13182B] dark:text-white">
        {value}
      </p>
    </div>
  );
}

function MetricCard({ title, value, unit }) {
  return (
    <div className="bg-[#F8F9FA] dark:bg-[#262626] rounded-2xl p-4">
      <p className="text-sm text-[#6B7280] dark:text-[#A0A0A0] mb-2">{title}</p>
      <p className="text-2xl font-bold text-[#13182B] dark:text-white">
        {value}
        <span className="text-lg">{unit}</span>
      </p>
    </div>
  );
}

function InterventionCard({ risk, action, description, color }) {
  const colorClasses = {
    red: "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10",
    yellow:
      "border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-900/10",
    green:
      "border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/10",
  };

  return (
    <div className={`border-l-4 p-4 rounded-r-2xl ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-[#13182B] dark:text-white mb-1">
            {risk} - {action}
          </h4>
          <p className="text-sm text-[#6B7280] dark:text-[#A0A0A0]">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
