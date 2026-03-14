import { useState, useEffect } from 'react';
import './index.css';

type Question = {
  id: string;
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
};

type GameState = 'LOGIN' | 'LOADING' | 'PLAYING' | 'SUBMITTING' | 'RESULT';

function App() {
  const [gameState, setGameState] = useState<GameState>('LOGIN');
  const [userId, setUserId] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number, total: number, passed: boolean } | null>(null);
  const [bossSeeds, setBossSeeds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const GAS_URL = import.meta.env.VITE_GOOGLE_APP_SCRIPT_URL;
  const QUESTION_COUNT = parseInt(import.meta.env.VITE_QUESTION_COUNT || "5");
  const PASS_THRESHOLD = parseInt(import.meta.env.VITE_PASS_THRESHOLD || "3");

  useEffect(() => {
    const seeds = [];
    for (let i = 0; i < 100; i++) {
        seeds.push(`boss-${Math.floor(Math.random() * 999999)}`);
    }
    setBossSeeds(seeds);
    
    seeds.slice(0, QUESTION_COUNT).forEach(seed => {
      const img = new Image();
      img.src = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${seed}`;
    });
  }, [QUESTION_COUNT]);

  const startGame = async () => {
    if (!userId.trim()) {
      setErrorMsg('請輸入得不得了的ID!');
      return;
    }
    setErrorMsg('');
    setGameState('LOADING');

    try {
      if (!GAS_URL || GAS_URL.includes("YOUR_GOOGLE_APP")) {
         console.warn("GAS URL not configured. Using mock data.");
         setTimeout(() => {
           setQuestions([
             { id: '1', text: '請問蘋果的英文是什麼？', options: { A: 'Apple', B: 'Banana', C: 'Cat', D: 'Dog' } },
             { id: '2', text: '台灣的首都在哪裡？', options: { A: '高雄', B: '台北', C: '台中', D: '台南' } },
             { id: '3', text: '請問一加一等於？', options: { A: '1', B: '2', C: '3', D: '4' } }
           ].slice(0, QUESTION_COUNT));
           setGameState('PLAYING');
         }, 1000);
         return;
      }

      const res = await fetch(`${GAS_URL}?action=getQuestions&limit=${QUESTION_COUNT}`);
      const data = await res.json();
      
      if (data.status === 'success' && data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setGameState('PLAYING');
      } else {
        throw new Error(data.message || '無法取得題目');
      }
    } catch (err: any) {
      setErrorMsg('載入題目失敗: ' + err.message);
      setGameState('LOGIN');
    }
  };

  const handleAnswer = (option: string) => {
    const currentQ = questions[currentQuestionIndex];
    const newAnswers = { ...answers, [currentQ.id]: option };
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(curr => curr + 1);
    } else {
      submitGame(newAnswers);
    }
  };

  const submitGame = async (finalAnswers: Record<string, string>) => {
    setGameState('SUBMITTING');
    try {
      if (!GAS_URL || GAS_URL.includes("YOUR_GOOGLE_APP")) {
         setTimeout(() => {
            const mockScore = Object.keys(finalAnswers).length; 
            setResult({ score: mockScore, total: questions.length, passed: mockScore >= PASS_THRESHOLD });
            setGameState('RESULT');
         }, 1500);
         return;
      }

      const params = new URLSearchParams({
        action: 'submitAnswers',
        id: userId,
        answers: JSON.stringify(finalAnswers),
        passThreshold: PASS_THRESHOLD.toString()
      });

      const res = await fetch(`${GAS_URL}?${params.toString()}`);
      const data = await res.json();

      if (data.status === 'success') {
        setResult(data.result);
        setGameState('RESULT');
      } else {
         throw new Error(data.message);
      }
    } catch (err: any) {
      setErrorMsg('傳送成績失敗: ' + err.message);
      // Let's at least show the result page so they aren't stuck
      setGameState('RESULT');
    }
  };

  const resetGame = () => {
    setGameState('LOGIN');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setResult(null);
    setErrorMsg('');
  };

  return (
    <div className="container">
      {gameState === 'LOGIN' && (
        <div className="pixel-box">
          <h1 className="title">PIXEL QUEST</h1>
          <p>請輸入你的玩家 ID</p>
          <input 
            type="text" 
            className="pixel-input" 
            placeholder="PLAYER ID" 
            value={userId}
            onChange={e => setUserId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && startGame()}
          />
          <br/>
          <button className="pixel-button" onClick={startGame}>START GAME</button>
          {errorMsg && <p style={{color: 'var(--primary-color)', marginTop: '20px'}}>{errorMsg}</p>}
        </div>
      )}

      {gameState === 'LOADING' && (
        <div className="pixel-box">
          <h2 className="title">LOADING...</h2>
          <p>正在通往異世界...</p>
        </div>
      )}

      {gameState === 'PLAYING' && questions.length > 0 && (
        <div className="pixel-box">
          <h2>LEVEL {currentQuestionIndex + 1} / {questions.length}</h2>
          
          <img 
            className="boss-image" 
            src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${bossSeeds[currentQuestionIndex]}`} 
            alt="Boss" 
          />
          
          <div className="question-text">
            {questions[currentQuestionIndex].text}
          </div>

          <div className="options-grid">
            {Object.entries(questions[currentQuestionIndex].options).map(([key, value]) => (
              <button 
                key={key} 
                className="pixel-button" 
                style={{ backgroundColor: 'var(--box-bg)' }}
                onClick={() => handleAnswer(key)}
              >
                {key}. {value}
              </button>
            ))}
          </div>
        </div>
      )}

      {gameState === 'SUBMITTING' && (
        <div className="pixel-box">
          <h2 className="title">CALCULATING...</h2>
          <p>傳送成就中...</p>
        </div>
      )}

      {gameState === 'RESULT' && (
        <div className="pixel-box">
          <h1 className="title">{result?.passed ? 'VICTORY' : 'DEFEAT'}</h1>
          
          <img 
            className="boss-image" 
            src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${result?.passed ? 'happy-hero' : 'sad-hero'}`} 
            alt="Result" 
            style={{ filter: result?.passed ? 'sepia(1) hue-rotate(50deg) saturate(3)' : 'grayscale(100%)' }}
          />

          <p style={{ fontSize: '1.5rem', margin: '20px 0' }}>
            SCORE: {result?.score} / {result?.total}
          </p>
          
          <p style={{ color: result?.passed ? 'var(--secondary-color)' : 'var(--primary-color)', lineHeight: '1.5' }}>
            {result?.passed ? '恭喜通關！你的名字已被記錄在冊。' : `還差一點！需要答對 ${PASS_THRESHOLD} 題才能通關。`}
          </p>

          <button className="pixel-button" onClick={resetGame} style={{ marginTop: '30px' }}>
            PLAY AGAIN
          </button>
          
          {errorMsg && <p style={{color: 'var(--primary-color)', fontSize: '0.8rem', marginTop: '10px'}}>{errorMsg}</p>}
        </div>
      )}
    </div>
  );
}

export default App;
