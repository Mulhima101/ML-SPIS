import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateAnalyticsReport = (
  analyticsData,
  dashboardData,
  students
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;

  // Title and Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text("Student Analytics Report", margin, 30);

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, 40);
  doc.text("ML-Based Student Progress Improvement System", margin, 50);

  // Executive Summary
  let yPosition = 70;
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text("Executive Summary", margin, yPosition);

  yPosition += 20;
  doc.setFontSize(12);

  const summaryData = [
    ["Total Students", dashboardData.totalStudents.toString()],
    ["Average Progress", `${dashboardData.averageProgress}%`],
    ["High Performers", dashboardData.highPerformers.toString()],
    ["Students Needing Attention", dashboardData.lowPerformers.toString()],
    ["Recent Activities (3 days)", dashboardData.recentActivities.toString()],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [["Metric", "Value"]],
    body: summaryData,
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: margin, right: margin },
  });

  // Knowledge Level Distribution
  yPosition = doc.lastAutoTable.finalY + 30;
  doc.setFontSize(16);
  doc.text("Knowledge Level Distribution", margin, yPosition);

  yPosition += 10;
  const distributionData = [
    [
      "High Performers",
      `${
        analyticsData?.overall_statistics?.students_by_level?.high || 0
      } students`,
      `${
        analyticsData?.overall_statistics?.percentage_distribution?.high?.toFixed(
          1
        ) || 0
      }%`,
    ],
    [
      "Normal Performers",
      `${
        analyticsData?.overall_statistics?.students_by_level?.normal || 0
      } students`,
      `${
        analyticsData?.overall_statistics?.percentage_distribution?.normal?.toFixed(
          1
        ) || 0
      }%`,
    ],
    [
      "Low Performers",
      `${
        analyticsData?.overall_statistics?.students_by_level?.low || 0
      } students`,
      `${
        analyticsData?.overall_statistics?.percentage_distribution?.low?.toFixed(
          1
        ) || 0
      }%`,
    ],
    [
      "No Data",
      `${
        analyticsData?.overall_statistics?.students_by_level?.no_data || 0
      } students`,
      `${
        analyticsData?.overall_statistics?.percentage_distribution?.no_data?.toFixed(
          1
        ) || 0
      }%`,
    ],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [["Level", "Count", "Percentage"]],
    body: distributionData,
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: margin, right: margin },
  });

  // Student Details
  yPosition = doc.lastAutoTable.finalY + 30;
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 30;
  }

  doc.setFontSize(16);
  doc.text("Student Details", margin, yPosition);

  yPosition += 10;
  const studentData = students
    .slice(0, 20)
    .map((student) => [
      student.name,
      student.id,
      student.knowledgeLevel,
      `${(student.overallScore * 100).toFixed(0)}%`,
      student.lastActive,
    ]);

  autoTable(doc, {
    startY: yPosition,
    head: [["Name", "ID", "Level", "Score", "Last Active"]],
    body: studentData,
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: margin, right: margin },
    styles: { fontSize: 9 },
  });

  // AI Insights and Recommendations
  yPosition = doc.lastAutoTable.finalY + 30;
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 30;
  }

  doc.setFontSize(16);
  doc.text("AI-Generated Insights & Recommendations", margin, yPosition);

  yPosition += 20;
  doc.setFontSize(12);

  // Generate insights based on topic analytics data (same logic as dashboard)
  let hasInsights = false;

  // Focus Areas - Topics with low performance
  if (analyticsData?.topic_analytics) {
    const strugglingTopics = Object.entries(
      analyticsData.topic_analytics
    ).filter(([_, data]) => data.average_score < 0.6);

    if (strugglingTopics.length > 0) {
      hasInsights = true;
      doc.setFontSize(14);
      doc.setTextColor(255, 165, 0); // Orange
      doc.text("Areas Requiring Immediate Attention:", margin, yPosition);
      yPosition += 15;

      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);

      strugglingTopics.forEach(([topic, data]) => {
        const text = `• ${topic}: Students are struggling with average score of ${(
          data.average_score * 100
        ).toFixed(
          1
        )}%. Consider additional practice sessions or simplified explanations.`;
        const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
        doc.text(lines, margin, yPosition);
        yPosition += lines.length * 5 + 5;

        if (yPosition > 250) {
          doc.addPage();
          yPosition = 30;
        }
      });

      yPosition += 10;
    }

    // Positive Trends - Topics with high performance
    const excellingTopics = Object.entries(analyticsData.topic_analytics)
      .filter(([_, data]) => data.average_score >= 0.75)
      .slice(0, 2); // Limit to top 2

    if (excellingTopics.length > 0) {
      hasInsights = true;
      doc.setFontSize(14);
      doc.setTextColor(34, 197, 94); // Green
      doc.text("Positive Trends:", margin, yPosition);
      yPosition += 15;

      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);

      excellingTopics.forEach(([topic, data]) => {
        const text = `• ${topic}: Students show strong understanding with average score of ${(
          data.average_score * 100
        ).toFixed(1)}%. This teaching approach is working well.`;
        const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
        doc.text(lines, margin, yPosition);
        yPosition += lines.length * 5 + 5;

        if (yPosition > 250) {
          doc.addPage();
          yPosition = 30;
        }
      });

      yPosition += 10;
    }
  }

  // General recommendations based on dashboard data
  if (dashboardData.lowPerformers > 0) {
    hasInsights = true;
    doc.setFontSize(14);
    doc.setTextColor(239, 68, 68); // Red
    doc.text("Immediate Action Required:", margin, yPosition);
    yPosition += 15;

    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    const text = `• ${dashboardData.lowPerformers} students have low knowledge levels and need immediate attention. Consider personalized interventions, one-on-one sessions, or additional support materials.`;
    const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
    doc.text(lines, margin, yPosition);
    yPosition += lines.length * 5 + 10;
  }

  // Class performance insights
  if (dashboardData.averageProgress < 70) {
    hasInsights = true;
    doc.setFontSize(14);
    doc.setTextColor(245, 158, 11); // Amber
    doc.text("Class Performance Alert:", margin, yPosition);
    yPosition += 15;

    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    const text = `• Overall class average is ${dashboardData.averageProgress}%, which is below the recommended 70% threshold. Consider reviewing teaching methods or providing additional learning resources.`;
    const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
    doc.text(lines, margin, yPosition);
    yPosition += lines.length * 5 + 10;
  } else if (dashboardData.averageProgress >= 85) {
    hasInsights = true;
    doc.setFontSize(14);
    doc.setTextColor(34, 197, 94); // Green
    doc.text("Excellent Class Performance:", margin, yPosition);
    yPosition += 15;

    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    const text = `• Outstanding class average of ${dashboardData.averageProgress}%! Students are performing exceptionally well. Consider introducing more challenging material or advanced topics.`;
    const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
    doc.text(lines, margin, yPosition);
    yPosition += lines.length * 5 + 10;
  }

  // If no specific insights, provide general message
  if (!hasInsights) {
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    const text =
      "No specific recommendations available at this time. Continue monitoring student progress and topic performance for actionable insights.";
    const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
    doc.text(lines, margin, yPosition);
    yPosition += lines.length * 5 + 10;
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - margin,
      doc.internal.pageSize.height - 10,
      { align: "right" }
    );
  }

  // Save the PDF
  const fileName = `Analytics_Report_${
    new Date().toISOString().split("T")[0]
  }.pdf`;
  doc.save(fileName);
};

export const generateStudentReport = (student, analyticsData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;

  // Student Report Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text(`Student Report: ${student.name}`, margin, 30);

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Student ID: ${student.id}`, margin, 40);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, 50);

  // Student Summary
  let yPosition = 70;
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text("Performance Summary", margin, yPosition);

  yPosition += 20;
  const studentSummary = [
    ["Knowledge Level", student.knowledgeLevel],
    ["Overall Score", `${(student.overallScore * 100).toFixed(0)}%`],
    ["Last Active", student.lastActive],
    [
      "Performance Trend",
      student.trend === "up"
        ? "Improving"
        : student.trend === "down"
        ? "Declining"
        : "Stable",
    ],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [["Metric", "Value"]],
    body: studentSummary,
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: margin, right: margin },
  });

  // Module Performance
  if (student.modules && Object.keys(student.modules).length > 0) {
    yPosition = doc.lastAutoTable.finalY + 30;
    doc.setFontSize(16);
    doc.text("Module Performance", margin, yPosition);

    yPosition += 10;
    const moduleData = Object.entries(student.modules).map(
      ([module, score]) => [
        module,
        `${(score * 100).toFixed(0)}%`,
        score >= 0.8
          ? "Excellent"
          : score >= 0.6
          ? "Good"
          : "Needs Improvement",
      ]
    );

    autoTable(doc, {
      startY: yPosition,
      head: [["Module", "Score", "Status"]],
      body: moduleData,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: margin, right: margin },
    });
  }

  // Save individual student report
  const fileName = `Student_Report_${student.name.replace(/\s+/g, "_")}_${
    new Date().toISOString().split("T")[0]
  }.pdf`;
  doc.save(fileName);
};
