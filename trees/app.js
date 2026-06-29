(function () {
  const params = new URLSearchParams(window.location.search);
  if (params.get("start") !== "1") {
    window.location.replace("../index.html");
    return;
  }
  window.history.replaceState(null, "", window.location.pathname);

  const QUIZ_SIZE = 5;
  const CHOICE_COUNT = 4;
  const STUDY_SECONDS = 60;

  const app = document.querySelector("#app");
  const statusChip = document.querySelector("#statusChip");
  const trees = Array.isArray(window.TREE_DATA) ? window.TREE_DATA : [];

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
    return shuffle(trees)
      .slice(0, QUIZ_SIZE)
      .map((correct) => {
        const wrongChoices = shuffle(trees.filter((tree) => tree.id !== correct.id)).slice(
          0,
          CHOICE_COUNT - 1,
        );

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

  function goHome() {
    window.location.href = "../index.html";
  }

  function renderStudy() {
    setStatus(`${state.timeLeft}秒`);

    app.innerHTML = `
      <div class="panel study-intro">
        <h2>先溫習樹木</h2>
        <p class="study-copy">請用 60 秒記住以下樹木圖片和名稱，之後回答 5 題選擇題。</p>
        <div class="actions">
          <button class="secondary" type="button" data-action="skip-study">直接開始測驗</button>
        </div>
      </div>
      <div class="tree-grid" aria-label="樹木溫習清單">
        ${trees
          .map(
            (tree) => `
              <article class="tree-card">
                <img src="${tree.image}" alt="${tree.name}" loading="lazy" />
                <p class="tree-name">${tree.name}</p>
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
          <img src="${current.correct.image}" alt="請辨認這張樹木圖片" />
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
        <button class="primary" type="button" data-action="restart">再來一次</button>
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
      goHome();
      return;
    }

    if (target.dataset.answer) {
      answerQuestion(target.dataset.answer);
    }
  });

  if (trees.length < QUIZ_SIZE || trees.length < CHOICE_COUNT) {
    renderError("樹木資料不足，請檢查 data/trees.js。");
    return;
  }

  renderStudy();
  startStudyTimer();
})();
