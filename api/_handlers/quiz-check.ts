import { createRequire } from "module";
const require = createRequire(import.meta.url);
const questionsData = require("../_lib/questions.json");

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let { moduleId, questionIdx, questionId, selectedOptions } = req.body;
    
    if (questionId && !moduleId) {
      const parts = questionId.split('_');
      questionIdx = parseInt(parts.pop() || '0');
      moduleId = parts.join('_');
    }

    if (!questionsData) {
      return res.status(500).json({ error: "Questions data missing" });
    }

    const questionsForModule = (questionsData as any)[moduleId] || [];
    const question = questionsForModule[questionIdx];

    if (!question) {
      console.error(`[API] Question not found: module=${moduleId}, idx=${questionIdx}, id=${questionId}`);
      return res.status(404).json({ error: "Question not found" });
    }

    const isCorrect = JSON.stringify(selectedOptions.sort()) === JSON.stringify(question.correct.sort());
    
    res.json({
      isCorrect,
      correctIndices: question.correct
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
