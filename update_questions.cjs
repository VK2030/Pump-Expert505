const fs = require('fs');

const questionsFile = './api/_lib/questions.json';
const newQFile = './new_q_failure.json';

const allQuestions = JSON.parse(fs.readFileSync(questionsFile, 'utf8'));
const newFailureQs = JSON.parse(fs.readFileSync(newQFile, 'utf8'));

console.log("Original failure-investigation questions length:", allQuestions['failure-investigation'].length);

allQuestions['failure-investigation'] = newFailureQs;

fs.writeFileSync(questionsFile, JSON.stringify(allQuestions, null, 2));

console.log("Updated failure-investigation questions length:", allQuestions['failure-investigation'].length);
