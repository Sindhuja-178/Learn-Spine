import { GoogleGenerativeAI, SchemaType, GenerativeModel, Schema } from '@google/generative-ai';

let _genAI: GoogleGenerativeAI | null = null;

export function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    const key = process.env.GEMINI_API_KEY?.trim() || '';
    if (!key) {
      throw new Error(
        'Gemini API key is missing. If you are running locally, make sure you have added GEMINI_API_KEY to your .env.local file. ' +
        'If you are running on Vercel, make sure you have added the GEMINI_API_KEY environment variable in your Vercel Project Settings.'
      );
    }
    _genAI = new GoogleGenerativeAI(key);
  }
  return _genAI;
}

export function getSystemPrompt(quizCount: number, flashcardCount: number): string {
  return `You are an expert educational content designer. Given a text, you must generate three types of study materials:

1. **Mermaid Flowchart**: Create a highly detailed, visually rich, valid Mermaid.js flowchart using "graph TD" syntax with hierarchical levels and connection labels:
   - **Hierarchy & Node Shapes (ALWAYS wrap labels in double quotes)**:
     - **Center Node**: The core keyword/topic at the top, styled as stadium (e.g., A(["🎯 Primary Topic"])).
     - **Main Branches**: 3-4 key formats or categories, styled as stadium (e.g., B(["📁 Main Category"])).
     - **Sub-Branches**: Detail nodes or steps, styled as rounded rectangles (e.g., C["💡 Sub-Topic Step"]).
     - **FAQs or Decisions**: Decision nodes or questions, styled as diamonds (e.g., D{"❓ Question or Decision?"}).
     - **Research Nodes**: References or standards, styled as cylinders (e.g., E[("🔍 Reference Standard")]).
   - **Crucial Rules for Valid Mermaid Syntax**:
     - ALWAYS wrap every node label in double quotes inside its brackets, e.g. NodeId["Label Text"]. Never omit quotes around labels.
     - Never use double quotes inside the label text itself (use single quotes or remove them).
     - Target **8 to 14 nodes** for clear, fast rendering.
     - Include a relevant emoji icon at the start of each node label to visually guide the user.
     - Use simple alphanumeric node IDs (A, B, C, etc.).
     - Keep labels concise (under 5 words each).
     - Use descriptive transition labels on connections: e.g. A -- "focuses on" --> B.
   - **Visual Tools (Color Styling)**:
     - Define and apply style classes at the bottom of the Mermaid code:
       classDef center fill:#fafaf9,stroke:#1c1917,stroke-width:2px;
       classDef branch fill:#eff6ff,stroke:#2563eb,stroke-width:1px;
       classDef subbranch fill:#f0fdf4,stroke:#16a34a,stroke-width:1px;
       classDef research fill:#fff7ed,stroke:#ea580c,stroke-width:1px;

2. **Flashcards**: Create exactly ${flashcardCount} active-recall flashcards. Questions should be specific and answers should be concise (1-2 sentences).

3. **Quiz**: Create exactly ${quizCount} multiple-choice questions with 4 options each. Include a 1-sentence explanation for each correct answer.

Focus on core concepts. Generate cleanly and concisely.`;
}

// Dynamically define the structured schema based on requested counts
export function getStudyMaterialSchema(quizCount: number, flashcardCount: number): Schema {
  return {
    type: SchemaType.OBJECT,
    properties: {
      mermaid_code: {
        type: SchemaType.STRING,
        description: 'A valid Mermaid.js flowchart (using graph TD syntax) representing the key processes/concepts. Use simple node IDs like A, B, C. Wrap all labels in double quotes. Do NOT use unquoted special characters.'
      },
      flashcards: {
        type: SchemaType.ARRAY,
        description: `Exactly ${flashcardCount} Q&A flashcards`,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            question: {
              type: SchemaType.STRING,
              description: 'A clear, specific question testing a key concept from the text'
            },
            answer: {
              type: SchemaType.STRING,
              description: 'A concise, accurate answer to the question'
            }
          },
          required: ['question', 'answer']
        }
      },
      quiz: {
        type: SchemaType.ARRAY,
        description: `Exactly ${quizCount} multiple-choice questions`,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            question: {
              type: SchemaType.STRING,
              description: 'A multiple-choice question testing understanding'
            },
            options: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.STRING
              },
              description: 'Exactly 4 answer options'
            },
            correct_option: {
              type: SchemaType.INTEGER,
              description: 'Zero-based index of the correct option (0 to 3)'
            },
            explanation: {
              type: SchemaType.STRING,
              description: 'Brief explanation of why the correct answer is right'
            }
          },
          required: ['question', 'options', 'correct_option', 'explanation']
        }
      }
    },
    required: ['mermaid_code', 'flashcards', 'quiz']
  };
}

export function getGeminiModel(quizCount: number, flashcardCount: number, modelName: string = 'gemini-3.8-flash'): GenerativeModel {
  return getGenAI().getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: getStudyMaterialSchema(quizCount, flashcardCount),
      temperature: 0.7,
    }
  });
}
