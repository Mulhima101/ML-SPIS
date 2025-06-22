import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Get student analytics for professors
export const getStudentAnalytics = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.get(
      `${API_URL}/professors/analytics/students`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching student analytics:", error);
    throw error.response
      ? error.response.data
      : new Error("Failed to get student analytics");
  }
};

// Transform API data to dashboard format
export const transformAnalyticsData = (analyticsData) => {
  if (!analyticsData) return null;

  console.log("Transform function received:", analyticsData); // Debug log

  // Log the exact keys available in the response
  console.log("Available keys in API response:", Object.keys(analyticsData));

  // Log analytics summary if available
  if (analyticsData.analytics_summary) {
    console.log("Analytics Summary:", analyticsData.analytics_summary);

    // Specific logging for topic analysis
    const summary = analyticsData.analytics_summary;
    console.log(`📊 Analytics Summary:
      - Total topics analyzed: ${summary.total_topics_analyzed}
      - Quiz questions analyzed: ${summary.total_quiz_questions_analyzed}
      - Topics with knowledge data: ${summary.topics_with_knowledge_data}
      - Topics with quiz data: ${summary.topics_with_quiz_data}
      - Topics with both data: ${summary.topics_with_both_data}`);

    if (summary.total_quiz_questions_analyzed === 0) {
      console.error(
        "🚨 ISSUE: No quiz questions have topic information! This is why topic_analytics is empty."
      );
    }
  }

  // Handle different possible API response structures
  let total_students, overall_statistics, topic_analytics, students;

  // Check if the data is directly in the response or nested
  if (analyticsData.total_students !== undefined) {
    // Data is at root level
    ({ total_students, overall_statistics, topic_analytics, students } =
      analyticsData);
  } else if (analyticsData.data) {
    // Data is nested under 'data' key
    ({ total_students, overall_statistics, topic_analytics, students } =
      analyticsData.data);
  } else {
    // Try to extract from whatever structure is provided
    total_students = analyticsData.total_students || 0;
    overall_statistics = analyticsData.overall_statistics || {
      students_by_level: { high: 0, normal: 0, low: 0, no_data: 0 },
      percentage_distribution: { high: 0, normal: 0, low: 0, no_data: 0 },
    };
    topic_analytics = analyticsData.topic_analytics || {};
    students = analyticsData.students || [];
  }

  // Enhanced debugging for topic_analytics with analytics_summary context
  console.log("Extracted topic_analytics:", topic_analytics);
  console.log("topic_analytics type:", typeof topic_analytics);
  console.log(
    "topic_analytics is empty object:",
    Object.keys(topic_analytics || {}).length === 0
  );

  // Enhanced diagnostic messaging
  if (!analyticsData.topic_analytics) {
    console.error(
      "❌ topic_analytics field is completely missing from API response!"
    );
    console.error("API response keys:", Object.keys(analyticsData));
  } else if (Object.keys(analyticsData.topic_analytics).length === 0) {
    console.warn("⚠️ topic_analytics field exists but is empty");

    // Use analytics_summary to provide specific diagnosis
    if (analyticsData.analytics_summary) {
      const summary = analyticsData.analytics_summary;
      if (summary.total_quiz_questions_analyzed === 0) {
        console.error(
          "🚨 ROOT CAUSE: Quiz questions are not tagged with topics!"
        );
        console.error(
          "💡 SOLUTION: Add topic metadata to your quiz questions in the database"
        );
      } else if (summary.topics_with_both_data === 0) {
        console.warn(
          "⚠️ Quiz questions have topics but no performance data correlation"
        );
      }
    }
  }

  console.log("Students array length:", students?.length || 0); // Debug log

  // Handle case where students might be undefined or empty
  const studentsArray = Array.isArray(students) ? students : [];

  // Transform students data with better error handling
  const transformedStudents = studentsArray.map((student) => {
    try {
      return {
        id: student.student_info?.student_id || student.id || "unknown",
        name: student.student_info
          ? `${student.student_info.first_name} ${student.student_info.last_name}`
          : student.name || "Unknown Student",
        email: student.student_info?.email || student.email || "",
        knowledgeLevel: student.overall_knowledge?.level || "Normal",
        overallScore: student.overall_knowledge?.score || 0.5,
        lastActive:
          student.overall_knowledge?.updated_at?.split("T")[0] ||
          new Date().toISOString().split("T")[0],
        // Replace hardcoded subjects with dynamic module performance
        modules:
          student.module_performance?.reduce((acc, module) => {
            acc[module.module_name] = module.average_score;
            return acc;
          }, {}) || {},
        // Keep topic knowledge for backward compatibility if needed
        subjects:
          student.topic_knowledge?.reduce((acc, topic) => {
            acc[topic.topic] = topic.score;
            return acc;
          }, {}) || {},
        trend:
          (student.overall_knowledge?.score || 0.5) >= 0.8
            ? "up"
            : (student.overall_knowledge?.score || 0.5) >= 0.6
            ? "stable"
            : "down",
        needsAttention:
          (student.overall_knowledge?.level || "Normal") === "Low",
        quizStats: student.quiz_statistics || {},
        knowledgeSummary: student.knowledge_summary || {},
      };
    } catch (error) {
      console.error("Error transforming student data:", error, student);
      return {
        id: "error",
        name: "Error Loading Student",
        email: "",
        knowledgeLevel: "Normal",
        overallScore: 0,
        lastActive: new Date().toISOString().split("T")[0],
        modules: {},
        subjects: {},
        trend: "stable",
        needsAttention: false,
        quizStats: {},
        knowledgeSummary: {},
      };
    }
  });

  // Calculate dashboard statistics with better error handling
  const validStudents = transformedStudents.filter((s) => s.id !== "error");
  const dashboardData = {
    totalStudents: total_students || validStudents.length,
    averageProgress:
      validStudents.length > 0
        ? Math.round(
            validStudents.reduce(
              (sum, student) => sum + student.overallScore * 100,
              0
            ) / validStudents.length
          )
        : 0,
    lowPerformers: overall_statistics?.students_by_level?.low || 0,
    highPerformers: overall_statistics?.students_by_level?.high || 0,
    recentActivities: validStudents.filter((s) => {
      try {
        const lastActive = new Date(s.lastActive);
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        return lastActive >= threeDaysAgo;
      } catch {
        return false;
      }
    }).length,
  };

  const result = {
    dashboardData,
    students: transformedStudents,
    statistics: overall_statistics || {
      students_by_level: { high: 0, normal: 0, low: 0, no_data: 0 },
      percentage_distribution: { high: 0, normal: 0, low: 0, no_data: 0 },
    },
    topicAnalytics: topic_analytics || {},
    generatedAt: analyticsData.generated_at || new Date().toISOString(),
  };

  console.log("Transform result:", result); // Debug log
  return result;
};
