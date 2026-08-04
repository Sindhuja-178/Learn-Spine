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
   - **Hierarchy & Node Shapes**:
     - **Center Node**: The core keyword/topic at the top, styled as a stadium shape (e.g., A([🎯 Primary Topic])).
     - **Main Branches**: 3-4 key formats or categories, styled as stadium shapes (e.g., B([📁 Main Format])).
     - **Sub-Branches**: Target audience pain points or details, styled as standard rounded rectangles (e.g., C[💡 Sub-Topic Label]).
     - **FAQs or Decisions**: Decision nodes or questions, styled as diamond shapes (e.g., D{❓ Question/FAQ?}).
     - **Research Nodes**: References to research materials, styled as cylinders (e.g., E[(🔍 Research Reference)]).
   - **Rules**:
     - Target **12 to 20 nodes** for rich detail.
     - Include a relevant emoji icon at the start of each node label to visually guide the user.
     - Use simple alphanumeric node IDs (A, B, C, etc.).
     - Do NOT use parentheses, quotes, or special characters inside labels that would break Mermaid parser.
     - Keep labels concise (under 8 words each).
     - Use **descriptive transition labels** on connections: e.g. A -- "focuses on" --> B.
   - **Visual Tools (Color Styling)**:
     - Define and apply style classes at the bottom of the Mermaid code:
       classDef center fill:#fafaf9,stroke:#1c1917,stroke-width:2px;
       classDef branch fill:#eff6ff,stroke:#2563eb,stroke-width:1px;
       classDef subbranch fill:#f0fdf4,stroke:#16a34a,stroke-width:1px;
       classDef research fill:#fff7ed,stroke:#ea580c,stroke-width:1px;
   - **Research Links**:
     - Attach high-quality external URLs to the research nodes using the Mermaid click command (e.g. referencing Wikipedia or official document portals):
       click F "https://en.wikipedia.org/wiki/TopicName" "Research Source" _blank
   - **Example format**:
     graph TD
         A([🎯 Digital Content]) -- "distributes into" --> B([📁 Pillar Articles])
         A -- "produces" --> C([📁 Video Content])
         B -- "requires" --> D[💡 Topic Structure]
         C -- "undergoes" --> E[💡 Editing Flow]
         D -- "checks" --> F{❓ SEO Friendly?}
         A -- "supported by" --> G[(🔍 Research Reference)]
         classDef center fill:#fafaf9,stroke:#1c1917,stroke-width:2px;
         classDef branch fill:#eff6ff,stroke:#2563eb,stroke-width:1px;
         classDef subbranch fill:#f0fdf4,stroke:#16a34a,stroke-width:1px;
         classDef research fill:#fff7ed,stroke:#ea580c,stroke-width:1px;
         class A center;
         class B,C branch;
         class D,E,F subbranch;
         class G research;
         click G "https://en.wikipedia.org/wiki/Digital_content" "Research Source" _blank

2. **Flashcards**: Create exactly ${flashcardCount} active-recall flashcards. Each should test a specific fact, concept, or relationship from the text. Questions should be clear and answers should be concise but complete.

3. **Quiz**: Create exactly ${quizCount} multiple-choice questions with 4 options each. Include a mix of difficulty levels. Provide a clear explanation for each correct answer.

Focus on the most important and testable content. Ensure accuracy and educational value.`;
}

// Dynamically define the structured schema based on requested counts
export function getStudyMaterialSchema(quizCount: number, flashcardCount: number): Schema {
  return {
    type: SchemaType.OBJECT,
    properties: {
      mermaid_code: {
        type: SchemaType.STRING,
        description: 'A valid Mermaid.js flowchart (using graph TD syntax) representing the key processes/concepts. Use simple node IDs like A, B, C. Wrap labels in square brackets. Do NOT use special characters in labels that would break Mermaid syntax.'
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

export function getGeminiModel(quizCount: number, flashcardCount: number): GenerativeModel {
  return getGenAI().getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: getStudyMaterialSchema(quizCount, flashcardCount),
      temperature: 0.7,
    }
  });
}
