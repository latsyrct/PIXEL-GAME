function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === "getQuestions") {
      const limit = parseInt(e.parameter.limit) || 5;
      const questions = getRandomQuestions(limit);
      return respond({ status: "success", questions });
    } else if (action === "submitAnswers") {
      const id = e.parameter.id;
      const answers = JSON.parse(e.parameter.answers);
      const passThreshold = parseInt(e.parameter.passThreshold) || 1;
      const result = gradeAndSave(id, answers, passThreshold);
      return respond({ status: "success", result });
    }
    return respond({ status: "error", message: "Invalid action" });
  } catch (error) {
    return respond({ status: "error", message: error.toString() });
  }
}

function respond(data) {
  // Using JSONP or normal JSON
  // Note: if you use CORS from Vite during dev, doing standard doGet works perfectly with fetch.
  // Google Apps Script will handle CORS automatically for doGet.
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getRandomQuestions(limit) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("題目");
  if (!sheet) throw new Error("找不到「題目」工作表");
  
  const data = sheet.getDataRange().getValues();
  const questions = [];
  
  // Start from row 2 (index 1) to skip headers 
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) { // If ID column is not empty
      questions.push({
        id: data[i][0],
        text: data[i][1],
        options: {
          A: data[i][2],
          B: data[i][3],
          C: data[i][4],
          D: data[i][5]
        }
      });
    }
  }
  
  // Shuffle array randomly
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }
  
  return questions.slice(0, limit);
}

function gradeAndSave(userId, userAnswers, passThreshold) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const qSheet = ss.getSheetByName("題目");
  const aSheet = ss.getSheetByName("回答");
  
  if (!aSheet) throw new Error("找不到「回答」工作表");
  
  // Load correct answers mapped by ID
  const qData = qSheet.getDataRange().getValues();
  const correctAnswers = {};
  for (let i = 1; i < qData.length; i++) {
    if (qData[i][0]) {
      correctAnswers[String(qData[i][0]).trim()] = String(qData[i][6]).trim().toUpperCase();
    }
  }
  
  // Calculate score
  let score = 0;
  let totalQuestions = Object.keys(userAnswers).length;
  for (const qId in userAnswers) {
    const cleanId = String(qId).trim();
    const userAnswer = String(userAnswers[qId]).trim().toUpperCase();
    if (userAnswers[qId] && correctAnswers[cleanId] && userAnswer === correctAnswers[cleanId]) {
      score++;
    }
  }
  
  const passed = score >= passThreshold;
  
  // Process history updates
  const aData = aSheet.getDataRange().getValues();
  let rowIndex = -1;
  let historyData = null;
  
  for (let i = 1; i < aData.length; i++) {
    if (String(aData[i][0]).trim() === String(userId).trim()) {
      rowIndex = i + 1; // getRange uses 1-based indexing for rows
      historyData = aData[i];
      break;
    }
  }
  
  const now = new Date();
  
  if (rowIndex > -1) {
    // Modify existing row
    let playCount = (parseInt(historyData[1]) || 0) + 1;
    let totalScore = (parseInt(historyData[2]) || 0) + score;
    let maxScore = Math.max((parseInt(historyData[3]) || 0), score);
    let firstPassScore = historyData[4];
    let triesToPass = historyData[5];
    
    // Check if hasn't passed before, but passed now
    if (!firstPassScore && passed) {
      firstPassScore = score;
      triesToPass = playCount;
    }
    
    aSheet.getRange(rowIndex, 2).setValue(playCount);
    aSheet.getRange(rowIndex, 3).setValue(totalScore);
    aSheet.getRange(rowIndex, 4).setValue(maxScore);
    
    // Only update first pass data if passing (will be false/ignored if already passed previously)
    if (!historyData[4] && passed) {
      aSheet.getRange(rowIndex, 5).setValue(firstPassScore);
      aSheet.getRange(rowIndex, 6).setValue(triesToPass);
    }
    // Always update last play time
    aSheet.getRange(rowIndex, 7).setValue(now);
  } else {
    // Append new row
    const playCount = 1;
    const firstPassScore = passed ? score : "";
    const triesToPass = passed ? 1 : "";
    
    aSheet.appendRow([
      userId,
      playCount,
      score, // Current is total
      score, // Current is max
      firstPassScore,
      triesToPass,
      now
    ]);
  }
  
  return {
    score: score,
    total: totalQuestions,
    passed: passed
  };
}
