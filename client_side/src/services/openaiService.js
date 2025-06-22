const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export const generateQuizWithAI = async (params) => {
  const { topic, numQuestions, numOptions, difficulty, module } = params;

  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured.");
  }

  const prompt = `Generate a ${difficulty} level quiz about "${topic}" for the module "${module}".

Requirements:
- Generate exactly ${numQuestions} questions
- Each question should have exactly ${numOptions} multiple choice options
- Only one option should be correct
- Questions should be educational and relevant to the topic
- Vary question types (conceptual, practical, analytical)

Please respond with a JSON object in this exact format:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}

Where correctAnswer is the index (0-based) of the correct option in the options array.`;

  try {
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
              "You are an expert educational content creator. Generate high-quality quiz questions that test understanding, not just memorization. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to generate quiz");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    try {
      const quizData = JSON.parse(content);

      // Validate the response format
      if (!quizData.questions || !Array.isArray(quizData.questions)) {
        throw new Error("Invalid response format from AI");
      }

      // Validate each question
      quizData.questions.forEach((q, index) => {
        if (
          !q.question ||
          !q.options ||
          !Array.isArray(q.options) ||
          typeof q.correctAnswer !== "number" ||
          q.correctAnswer < 0 ||
          q.correctAnswer >= q.options.length
        ) {
          throw new Error(`Invalid question format at index ${index}`);
        }
      });

      return quizData;
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse quiz data from AI response");
    }
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw error;
  }
};

export const improveQuestion = async (question, feedback) => {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file");
  }

  const prompt = `Improve this quiz question based on the feedback provided:

Original Question: ${question.question}
Options: ${question.options.join(", ")}
Current Correct Answer: ${question.options[question.correctAnswer]}
Feedback: ${feedback}

Please provide an improved version in JSON format:
{
  "question": "Improved question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Explanation for the correct answer"
}`;

  try {
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
              "You are an expert educational content creator. Improve quiz questions based on feedback while maintaining educational value.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to improve question");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    return JSON.parse(content);
  } catch (error) {
    console.error("Error improving question:", error);
    throw error;
  }
};
