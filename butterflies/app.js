(function () {
  const QUIZ_SIZE = 5;
  const CHOICE_COUNT = 4;
  const STUDY_SECONDS = 60;

  const app = document.querySelector("#app");
  const statusChip = document.querySelector("#statusChip");
  const butterflies = Array.isArray(window.BUTTERFLY_DATA)
    ? window.BUTTERFLY_DATA
    : [];

  const state = {
    timeLeft: STUDY_SECONDS,
    timerId: null,
    questions: [],
    questionIndex: 0,
    score: 0,
  };

  function setStatus(text) {
    statusChip.textContent = text;
  }

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function clearTimer() {
    if (!state.timerId) return;
    window.clearInterval(state.timerId);
    state.timerId = null;
  }

  function startStudyTimer() {
    clearTimer();
    state.timeLeft = STUDY_SECONDS;
    setStatus(`${state.timeLeft}秒`);

    state.timerId = window.setInterval(() => {
      state.timeLeft -= 1;
      setStatus(`${state.timeLeft}秒`);

      if (state.timeLeft <= 0) {
        startQuiz();
      }
    }, 1000);
  }

  function buildQuestions() {
    return shuffle(butterflies)
      .slice(0, QUIZ_SIZE)
      .map((correct) => {
        const wrongChoices = shuffle(
          butterflies.filter((butterfly) => butterfly.id !== correct.id),
        ).slice(0, CHOICE_COUNT - 1);

        return {
          correct,
          choices: shuffle([correct, ...wrongChoices]),
        };
      });
  }

  function startQuiz() {
    clearTimer();
    state.questions = buildQuestions();
    state.questionIndex = 0;
    state.score = 0;
    renderQuiz();
  }

  function restart() {
    state.questions = [];
    state.questionIndex = 0;
    state.score = 0;
    renderStudy();
    startStudyTimer();
  }

  function renderStudy() {
    setStatus(`${state.timeLeft}秒`);

    app.innerHTML = `
      <div class="panel study-intro">
        <h2>先溫習蝴蝶</h2>
        <p class="study-copy">請用 60 秒記住以下蝴蝶圖片和名稱，之後回答 5 題選擇題。</p>
        <div class="actions">
          <button class="secondary" type="button" data-action="skip-study">直接開始測驗</button>
        </div>
      </div>
      <div class="butterfly-grid" aria-label="蝴蝶溫習清單">
        ${butterflies
          .map(
            (butterfly) => `
              <article class="butterfly-card">
                <img src="${butterfly.image}" alt="${butterfly.name}" loading="lazy" />
                <p class="butterfly-name">${butterfly.name}</p>
              </article>
            `,
          )
          .join("")}
      </div>
    `;
  }

  function renderQuiz() {
    const current = state.questions[state.questionIndex];
    const currentNumber = state.questionIndex + 1;
    setStatus(`${currentNumber}/${QUIZ_SIZE}`);

    app.innerHTML = `
      <div class="panel quiz-card">
        <div class="quiz-meta">
          <span>第 ${currentNumber} 題</span>
          <span>分數 ${state.score}</span>
        </div>
        <div class="question-image">
          <img src="${current.correct.image}" alt="請辨認這張蝴蝶圖片" />
        </div>
        <div class="answer-grid" aria-label="答案選項">
          ${current.choices
            .map(
              (choice) => `
                <button class="answer-option" type="button" data-answer="${choice.id}">
                  ${choice.name}
                </button>
              `,
            )
            .join("")}
        </div>
      </div>
    `;
  }

  function renderResult() {
    clearTimer();
    setStatus("完成");

    app.innerHTML = `
      <div class="panel result">
        <h2>測驗完成</h2>
        <div class="score" aria-label="分數">
          <strong>${state.score}</strong>
          <span>/ ${QUIZ_SIZE}</span>
        </div>
        <button class="primary" type="button" data-action="restart">再玩一次</button>
      </div>
    `;
  }

  function answerQuestion(answerId) {
    const current = state.questions[state.questionIndex];
    if (answerId === current.correct.id) {
      state.score += 1;
    }

    state.questionIndex += 1;
    if (state.questionIndex >= QUIZ_SIZE) {
      renderResult();
      return;
    }

    renderQuiz();
  }

  function renderError(message) {
    clearTimer();
    setStatus("錯誤");
    app.innerHTML = `
      <div class="panel error">
        <h2>資料不足</h2>
        <p>${message}</p>
      </div>
    `;
  }

  app.addEventListener("click", (event) => {
    const target = event.target.closest("button");
    if (!target) return;

    if (target.dataset.action === "skip-study") {
      startQuiz();
      return;
    }

    if (target.dataset.action === "restart") {
      restart();
      return;
    }

    if (target.dataset.answer) {
      answerQuestion(target.dataset.answer);
    }
  });

  if (butterflies.length < QUIZ_SIZE || butterflies.length < CHOICE_COUNT) {
    renderError("蝴蝶資料不足，請檢查 data/butterflies.js。");
    return;
  }

  renderStudy();
  startStudyTimer();
})();
