import axios from "axios";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Collect wrong answers from all quiz results
export const collectWrongAnswers = async (userId) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }

    // Get all quiz results for the user
    const response = await axios.get(
      `http://localhost:5000/api/students/quiz-results`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const wrongAnswers = [];

    // Handle the new API response structure
    if (
      response.data &&
      response.data.incorrect_answers &&
      response.data.incorrect_answers.length > 0
    ) {
      response.data.incorrect_answers.forEach((answer) => {
        wrongAnswers.push({
          question: answer.question_text,
          topic: answer.question_topic,
          correctAnswer: answer.options[answer.correct_answer],
          studentAnswer:
            answer.student_answer !== null
              ? answer.options[answer.student_answer]
              : "No answer",
          explanation: answer.explanation || "",
          quizTitle: answer.quiz_title,
          moduleTitle: answer.module_name,
          pointsLost: answer.points_lost,
          answeredAt: answer.answered_at,
        });
      });
    }

    console.log(`Collected ${wrongAnswers.length} wrong answers for analysis`);
    return wrongAnswers;
  } catch (error) {
    console.error("Error collecting wrong answers:", error);
    return [];
  }
};

// Generate AI guidance for wrong answers
export const generateAIGuidance = async (wrongAnswers) => {
  if (!OPENAI_API_KEY || wrongAnswers.length === 0) {
    return null;
  }

  try {
    // Group wrong answers by topic
    const topicGroups = wrongAnswers.reduce((acc, answer) => {
      const topic = answer.topic || "General";
      if (!acc[topic]) {
        acc[topic] = [];
      }
      acc[topic].push(answer);
      return acc;
    }, {});

    const prompt = `Based on the following incorrectly answered questions from a student, provide personalized learning guidance. For each topic, suggest:
1. Key concepts to review
2. Learning strategies
3. 2-3 specific website/blog references with actual URLs
4. 2-3 YouTube video suggestions with search terms
5. Practice recommendations

Topics and wrong answers:
${Object.entries(topicGroups)
  .map(
    ([topic, answers]) =>
      `\n**${topic}:**\n${answers
        .map(
          (a) =>
            `- Question: ${a.question}\n- Student answered: ${a.studentAnswer}\n- Correct answer: ${a.correctAnswer}\n- Explanation: ${a.explanation}`
        )
        .join("\n")}`
  )
  .join("\n")}

Please provide a comprehensive JSON response with this structure:
{
  "topics": [
    {
      "topic": "topic name",
      "weaknesses": ["weakness1", "weakness2"],
      "keyConcepts": ["concept1", "concept2"],
      "learningStrategies": ["strategy1", "strategy2"],
      "websiteReferences": [
        {"title": "Resource Title", "url": "actual URL", "description": "brief description"},
        {"title": "Resource Title", "url": "actual URL", "description": "brief description"}
      ],
      "youtubeVideos": [
        {"title": "Video Title", "searchTerm": "search term", "description": "what to learn"},
        {"title": "Video Title", "searchTerm": "search term", "description": "what to learn"}
      ],
      "practiceRecommendations": ["practice1", "practice2"]
    }
  ],
  "generalAdvice": "Overall learning advice based on patterns in wrong answers"
}`;

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are an expert educational advisor. Provide detailed, actionable learning guidance based on student performance. Always include real, accessible website URLs and specific YouTube search terms.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate AI guidance");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return null;
  } catch (error) {
    console.error("Error generating AI guidance:", error);
    return null;
  }
};

// Save guidance to localStorage
export const saveGuidanceToStorage = (guidance) => {
  try {
    const guidanceData = {
      guidance,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    };
    localStorage.setItem("aiGuidance", JSON.stringify(guidanceData));
  } catch (error) {
    console.error("Error saving guidance to storage:", error);
  }
};

// Load guidance from localStorage
export const loadGuidanceFromStorage = () => {
  try {
    const stored = localStorage.getItem("aiGuidance");
    if (!stored) return null;

    const guidanceData = JSON.parse(stored);
    const now = new Date();
    const expiresAt = new Date(guidanceData.expiresAt);

    // Check if guidance has expired
    if (now > expiresAt) {
      localStorage.removeItem("aiGuidance");
      return null;
    }

    return guidanceData.guidance;
  } catch (error) {
    console.error("Error loading guidance from storage:", error);
    localStorage.removeItem("aiGuidance");
    return null;
  }
};
