import { getSupabase } from "./supabase.client.js";

const STORAGE_KEYS = {
  sessions: "trainlog-web-sessions",
  programs: "trainlog-web-programs",
  exercises: "trainlog-web-exercises",
  draft: "trainlog-web-session-draft"
};

const API_COLLECTION_NAMES = {
  [STORAGE_KEYS.sessions]: "sessions",
  [STORAGE_KEYS.programs]: "programs",
  [STORAGE_KEYS.exercises]: "exercises"
};

const collectionCache = {
  [STORAGE_KEYS.sessions]: [],
  [STORAGE_KEYS.programs]: [],
  [STORAGE_KEYS.exercises]: []
};

const defaultExercises = [
  {
    id: "exercise-bench-press",
    name: "Bench Press",
    muscleGroup: "Gogus",
    equipment: "Barbell",
    instructions: "Kurek kemiklerini sabitle, ayaklarini yere kilitle ve kontrollu in."
  },
  {
    id: "exercise-incline-dumbbell-press",
    name: "Incline Dumbbell Press",
    muscleGroup: "Gogus",
    equipment: "Dumbbell",
    instructions: "Dirsek hattini kontrol et ve ust noktada kontrollu sikistir."
  },
  {
    id: "exercise-row",
    name: "Seated Row",
    muscleGroup: "Sirt",
    equipment: "Cable",
    instructions: "Omuzlarini asagi tut ve cekiste sirtini aktif kullan."
  },
  {
    id: "exercise-squat",
    name: "Back Squat",
    muscleGroup: "Bacak",
    equipment: "Barbell",
    instructions: "Karini sIk, core'u stabil tut ve cIkisi ayak tabaniyla it."
  },
  {
    id: "exercise-smith-incline-bench",
    name: "Smith Machine Incline Bench Press",
    muscleGroup: "Gogus",
    equipment: "Smith Machine",
    instructions: "Bench acisini sabit tut, dirsek yolunu kontrol et ve ustte gogusu sik."
  },
  {
    id: "exercise-smith-overhead-press",
    name: "Smith Machine Overhead Press",
    muscleGroup: "Omuz",
    equipment: "Smith Machine",
    instructions: "Core'u sabit tut, bar yolunu duz koru ve lockout'u kontrollu yap."
  },
  {
    id: "exercise-pectoral-fly",
    name: "Pectoral Fly",
    muscleGroup: "Gogus",
    equipment: "Machine",
    instructions: "Omuzlari one firlatmadan hareketi gogusla tamamla."
  },
  {
    id: "exercise-cable-lateral-raise",
    name: "Cable Lateral Raise",
    muscleGroup: "Omuz",
    equipment: "Cable",
    instructions: "Dirsek acisini sabit tut ve ivmeyle degil omuzla kaldir."
  },
  {
    id: "exercise-dumbbell-skull-crusher",
    name: "Dumbbell Skull Crusher",
    muscleGroup: "Triceps",
    equipment: "Dumbbell",
    instructions: "Dirsekleri kacirmadan kontrollu aci-kapa."
  },
  {
    id: "exercise-triceps-pushdown",
    name: "Triceps Pushdown",
    muscleGroup: "Triceps",
    equipment: "Cable",
    instructions: "Dirsekleri govdeye yakin tut ve altta tricepsi tamamen sik."
  },
  {
    id: "exercise-side-plank",
    name: "Side Plank",
    muscleGroup: "Core",
    equipment: "Bodyweight",
    instructions: "Kalca dusmeden yanal core aktivasyonunu koru."
  },
  {
    id: "exercise-wide-grip-lat-pulldown",
    name: "Wide Grip Lat Pulldown",
    muscleGroup: "Sirt",
    equipment: "Cable",
    instructions: "Boyna degil ust goguse cek ve omuzlari asagi sabitle."
  },
  {
    id: "exercise-barbell-row",
    name: "Barbell Row",
    muscleGroup: "Sirt",
    equipment: "Barbell",
    instructions: "Gövde acisini sabit tut ve cekisi sirtla baslat."
  },
  {
    id: "exercise-chest-supported-machine-row",
    name: "Chest Supported Machine Row",
    muscleGroup: "Sirt",
    equipment: "Machine",
    instructions: "Gogus desteginden ayrilmadan kontrollu cekis yap."
  },
  {
    id: "exercise-smith-shrug",
    name: "Smith Machine Shrug",
    muscleGroup: "Trapez",
    equipment: "Smith Machine",
    instructions: "Omuzlari kulaga dogru dik yukari cek, yuvarlama yapma."
  },
  {
    id: "exercise-single-arm-preacher-curl",
    name: "Single Arm Dumbbell Preacher Curl",
    muscleGroup: "Biceps",
    equipment: "Dumbbell",
    instructions: "Alt noktada tansiyonu koru ve momentum kullanma."
  },
  {
    id: "exercise-dumbbell-hammer-curl",
    name: "Dumbbell Hammer Curl",
    muscleGroup: "Biceps",
    equipment: "Dumbbell",
    instructions: "Nötr tutusla dirsekleri sabit tutarak yukari cek."
  },
  {
    id: "exercise-reverse-crunch",
    name: "Reverse Crunch",
    muscleGroup: "Core",
    equipment: "Bodyweight",
    instructions: "Belden savurmadan pelvisi kontrollu sekilde yukari al."
  },
  {
    id: "exercise-barbell-squat",
    name: "Barbell Squat",
    muscleGroup: "Bacak",
    equipment: "Barbell",
    instructions: "Bracing kur, diz-ayak hizasini koru ve derinligi kontrollu al."
  },
  {
    id: "exercise-hip-thrust",
    name: "Hip Thrust",
    muscleGroup: "Glute",
    equipment: "Barbell",
    instructions: "Ust noktada kalcayi tam kilitle ve belden asiri acilma yapma."
  },
  {
    id: "exercise-leg-extension",
    name: "Leg Extension",
    muscleGroup: "Quadriceps",
    equipment: "Machine",
    instructions: "Ust noktada kisa durakla ve eksantrigi kontrollu indir."
  },
  {
    id: "exercise-lying-leg-curl",
    name: "Lying Leg Curl",
    muscleGroup: "Hamstring",
    equipment: "Machine",
    instructions: "Kalcalari sabit tut ve hamstring ile cekisi tamamla."
  },
  {
    id: "exercise-smith-calf-raise",
    name: "Smith Machine Calf Raise",
    muscleGroup: "Calf",
    equipment: "Smith Machine",
    instructions: "Alt noktada esneme al, ustte baldiri tam sik."
  },
  {
    id: "exercise-pallof-press",
    name: "Pallof Press",
    muscleGroup: "Core",
    equipment: "Cable",
    instructions: "Govdeyi donmeye karsi sabitle ve kollari duz hatta uzat."
  },
  {
    id: "exercise-plank",
    name: "Plank",
    muscleGroup: "Core",
    equipment: "Bodyweight",
    instructions: "Kalca seviyesi sabit, karin aktif ve nefes kontrollu olsun."
  }
];

const defaultPrograms = [
  {
    id: "program-upper-a",
    name: "Upper A",
    day: "Pazartesi - Ust Vucut",
    goal: "Temel kuvvet",
    exercises: ["Bench Press", "Incline Dumbbell Press", "Seated Row"],
    notes: "Program yuklendiginde hareketler otomatik gelir."
  },
  {
    id: "program-push",
    name: "Push",
    day: "Gun 1",
    goal: "Gogus, omuz, triceps",
    exercises: [
      { name: "Smith Machine Incline Bench Press", sets: "3", reps: "6-8", rir: "1" },
      { name: "Smith Machine Overhead Press", sets: "3", reps: "6-8", rir: "2" },
      { name: "Pectoral Fly", sets: "3", reps: "8-12", rir: "1" },
      { name: "Cable Lateral Raise", sets: "3", reps: "10-15", rir: "1" },
      { name: "Dumbbell Skull Crusher", sets: "2", reps: "8-12", rir: "1" },
      { name: "Triceps Pushdown", sets: "3", reps: "8-12", rir: "1" },
      { name: "Side Plank", sets: "3", reps: "40", rir: "" }
    ],
    notes: "3 gunluk programin Push gunu."
  },
  {
    id: "program-pull",
    name: "Pull",
    day: "Gun 2",
    goal: "Sirt, biceps, core",
    exercises: [
      { name: "Wide Grip Lat Pulldown", sets: "3", reps: "12-15", rir: "2" },
      { name: "Barbell Row", sets: "3", reps: "6-10", rir: "2" },
      { name: "Chest Supported Machine Row", sets: "3", reps: "8-10", rir: "1" },
      { name: "Smith Machine Shrug", sets: "3", reps: "12-15", rir: "2" },
      { name: "Single Arm Dumbbell Preacher Curl", sets: "2", reps: "8-12", rir: "1,5" },
      { name: "Dumbbell Hammer Curl", sets: "2", reps: "8-12", rir: "1" },
      { name: "Reverse Crunch", sets: "3", reps: "40", rir: "1" }
    ],
    notes: "3 gunluk programin Pull gunu."
  },
  {
    id: "program-legs",
    name: "Legs",
    day: "Gun 3",
    goal: "Alt vucut ve core",
    exercises: [
      { name: "Barbell Squat", sets: "4", reps: "6-8", rir: "2" },
      { name: "Hip Thrust", sets: "3", reps: "6-10", rir: "1" },
      { name: "Leg Extension", sets: "2", reps: "8-10", rir: "1,5" },
      { name: "Lying Leg Curl", sets: "3", reps: "10-15", rir: "1" },
      { name: "Smith Machine Calf Raise", sets: "3", reps: "10-15", rir: "1" },
      { name: "Pallof Press", sets: "3", reps: "40", rir: "1" },
      { name: "Plank", sets: "3", reps: "40", rir: "1" }
    ],
    notes: "3 gunluk programin Legs gunu."
  }
];

const state = {
  currentView: "dashboard",
  activeExerciseId: null,
  editingSessionId: null,
  editingProgramId: null,
  inspectorHistoryIndex: 0,
  pendingImportedSessions: [],
  sessionDraft: createSessionDraft(),
  programDraft: createProgramDraft()
};

const supabase = await getSupabase();

const currentUserEmail = document.getElementById("currentUserEmail");
const logoutButton = document.getElementById("logoutButton");

const viewButtons = [...document.querySelectorAll(".nav-link")];
const views = [...document.querySelectorAll(".view")];
const shortcuts = [...document.querySelectorAll("[data-shortcut]")];

const todayLabel = document.getElementById("todayLabel");
const heroSummary = document.getElementById("heroSummary");

const statWorkoutCount = document.getElementById("statWorkoutCount");
const statProgramCount = document.getElementById("statProgramCount");
const statExerciseCount = document.getElementById("statExerciseCount");
const statWeeklyCount = document.getElementById("statWeeklyCount");

const dashboardHistory = document.getElementById("dashboardHistory");
const dashboardPrograms = document.getElementById("dashboardPrograms");
const historyList = document.getElementById("historyList");
const exerciseList = document.getElementById("exerciseList");
const programList = document.getElementById("programList");

const sessionNameInput = document.getElementById("sessionName");
const sessionDateInput = document.getElementById("sessionDate");
const sessionDurationInput = document.getElementById("sessionDuration");
const sessionProgramSelect = document.getElementById("sessionProgramSelect");
const loadProgramButton = document.getElementById("loadProgramButton");
const addExerciseButton = document.getElementById("addExerciseButton");
const sessionImportFile = document.getElementById("sessionImportFile");
const importPastedTableButton = document.getElementById("importPastedTableButton");
const sessionImportTextarea = document.getElementById("sessionImportTextarea");
const importPreviewPanel = document.getElementById("importPreviewPanel");
const importPreviewTitle = document.getElementById("importPreviewTitle");
const importPreviewList = document.getElementById("importPreviewList");
const cancelImportButton = document.getElementById("cancelImportButton");
const confirmImportButton = document.getElementById("confirmImportButton");
const sessionExercises = document.getElementById("sessionExercises");
const saveSessionButton = document.getElementById("saveSessionButton");
const saveDraftButton = document.getElementById("saveDraftButton");
const exerciseSuggestions = document.getElementById("exerciseSuggestions");

const inspectorExerciseInput = document.getElementById("inspectorExerciseInput");
const inspectorPrevButton = document.getElementById("inspectorPrevButton");
const inspectorNextButton = document.getElementById("inspectorNextButton");
const inspectorPositionLabel = document.getElementById("inspectorPositionLabel");
const inspectorContent = document.getElementById("inspectorContent");

const programForm = document.getElementById("programForm");
const programTitleInput = document.getElementById("programTitleInput");
const programGoalInput = document.getElementById("programGoalInput");
const programNotesInput = document.getElementById("programNotesInput");
const programDays = document.getElementById("programDays");
const addProgramDayButton = document.getElementById("addProgramDayButton");
const exerciseForm = document.getElementById("exerciseForm");

async function init() {
  bindEvents();
  todayLabel.textContent = formatDate(new Date().toISOString(), {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
  const bootstrap = await fetchBootstrapCollections();
  if (!bootstrap.authenticated) {
    window.location.replace("/login");
    return;
  }
  currentUserEmail.textContent = bootstrap.user?.email || "";
  await seedInitialData(bootstrap);
  loadStoredDraft();
  renderAll();
  showView("dashboard");
}

function bindEvents() {
  logoutButton.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.replace("/login");
  });

  viewButtons.forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.view));
  });

  shortcuts.forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.shortcut));
  });

  sessionNameInput.addEventListener("input", (event) => {
    state.sessionDraft.name = event.target.value;
  });

  sessionDateInput.addEventListener("input", (event) => {
    state.sessionDraft.date = event.target.value;
  });

  sessionDurationInput.addEventListener("input", (event) => {
    state.sessionDraft.duration = event.target.value;
  });

  sessionProgramSelect.addEventListener("change", (event) => {
    state.sessionDraft.programId = event.target.value;
    persistDraft();
  });

  loadProgramButton.addEventListener("click", () => {
    const selectedProgramDay = findSelectedProgramDay(sessionProgramSelect.value);
    if (!selectedProgramDay) {
      window.alert("Yuklenecek bir program sec.");
      return;
    }

    state.sessionDraft.programId = selectedProgramDay.selectionValue;
    state.sessionDraft.name = state.sessionDraft.name || `${selectedProgramDay.program.name} - ${selectedProgramDay.day.label}`;
    state.sessionDraft.exercises = normalizeProgramExercises(selectedProgramDay.day.exercises).map((exercise) => createExerciseBlock(exercise.name, exercise));
    state.activeExerciseId = state.sessionDraft.exercises[0] ? state.sessionDraft.exercises[0].id : null;
    syncSessionMetaInputs();
    renderSessionBuilder();
    renderInspector();
  });

  addExerciseButton.addEventListener("click", () => {
    const newBlock = createExerciseBlock();
    state.sessionDraft.exercises.push(newBlock);
    state.activeExerciseId = newBlock.id;
    state.inspectorHistoryIndex = 0;
    renderSessionBuilder();
    renderInspector();
  });

  inspectorExerciseInput.addEventListener("input", (event) => {
    const block = state.sessionDraft.exercises.find((item) => item.id === state.activeExerciseId);
    if (!block) {
      return;
    }

    block.name = event.target.value;
    state.inspectorHistoryIndex = 0;
    renderSessionBuilder();
    renderInspector();
    persistDraft();
  });

  inspectorPrevButton.addEventListener("click", () => {
    const history = getExerciseHistoryForActiveBlock();
    if (!history.length) {
      return;
    }
    state.inspectorHistoryIndex = Math.min(state.inspectorHistoryIndex + 1, history.length - 1);
    renderInspector();
  });

  inspectorNextButton.addEventListener("click", () => {
    const history = getExerciseHistoryForActiveBlock();
    if (!history.length) {
      return;
    }
    state.inspectorHistoryIndex = Math.max(state.inspectorHistoryIndex - 1, 0);
    renderInspector();
  });

  sessionImportFile.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const content = await file.text();
    importSessionFromTableText(content, detectDelimiter(content));
    event.target.value = "";
  });

  importPastedTableButton.addEventListener("click", () => {
    const rawTable = sessionImportTextarea.value.trim();
    if (!rawTable) {
      window.alert("Excel tablosunu once kutuya yapistir.");
      return;
    }

    importSessionFromTableText(rawTable, rawTable.includes("\t") ? "\t" : detectDelimiter(rawTable));
  });

  cancelImportButton.addEventListener("click", () => {
    state.pendingImportedSessions = [];
    renderImportPreview();
  });

  confirmImportButton.addEventListener("click", () => {
    if (!state.pendingImportedSessions.length) {
      return;
    }

    const nextSessions = mergeSessions(getSessions(), state.pendingImportedSessions);
    saveCollection(STORAGE_KEYS.sessions, nextSessions);

    const latestImportedSession = state.pendingImportedSessions[0];
    state.editingSessionId = null;
    state.sessionDraft = sessionToDraft(latestImportedSession);
    state.activeExerciseId = state.sessionDraft.exercises[0]?.id || null;
    state.pendingImportedSessions = [];
    syncSessionMetaInputs();
    renderAll();
    persistDraft();
    showView("history");
    window.alert("Import tamamlandi ve seanslar kaydedildi.");
  });

  sessionExercises.addEventListener("input", handleSessionInput);
  sessionExercises.addEventListener("focusin", handleSessionFocus);
  sessionExercises.addEventListener("click", handleSessionClick);

  saveSessionButton.addEventListener("click", saveFullSession);
  saveDraftButton.addEventListener("click", saveDraftOnly);

  programForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const normalizedDays = normalizeProgramDraftDays();
    const programTitle = programTitleInput.value.trim();
    const programs = getPrograms();

    if (!programTitle) {
      window.alert("Program basligini gir.");
      return;
    }

    if (!normalizedDays.length) {
      window.alert("En az bir gun ve bir hareket gir.");
      return;
    }

    const savedProgram = {
      id: state.editingProgramId || createId("program"),
      name: programTitle,
      goal: programGoalInput.value.trim(),
      notes: programNotesInput.value.trim(),
      days: normalizedDays
    };

    if (state.editingProgramId) {
      const existingIndex = programs.findIndex((program) => program.id === state.editingProgramId);
      if (existingIndex >= 0) {
        programs[existingIndex] = savedProgram;
      } else {
        programs.unshift(savedProgram);
      }
    } else {
      programs.unshift(savedProgram);
    }

    saveCollection(STORAGE_KEYS.programs, programs);
    state.programDraft = createProgramDraft();
    state.editingProgramId = null;
    syncProgramDraftInputs();
    renderProgramBuilder();
    renderAll();
  });

  addProgramDayButton.addEventListener("click", () => {
    state.programDraft.days.push(createProgramDayDraft());
    renderProgramBuilder();
  });

  programTitleInput.addEventListener("input", (event) => {
    state.programDraft.name = event.target.value;
  });

  programGoalInput.addEventListener("input", (event) => {
    state.programDraft.goal = event.target.value;
  });

  programNotesInput.addEventListener("input", (event) => {
    state.programDraft.notes = event.target.value;
  });

  programDays.addEventListener("input", handleProgramBuilderInput);
  programDays.addEventListener("click", handleProgramBuilderClick);

  exerciseForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(exerciseForm).entries());
    const exercises = getExercises();

    exercises.unshift({
      id: createId("exercise"),
      name: values.name.trim(),
      muscleGroup: values.muscleGroup.trim(),
      equipment: values.equipment.trim(),
      instructions: values.instructions.trim()
    });

    saveCollection(STORAGE_KEYS.exercises, exercises);
    exerciseForm.reset();
    renderAll();
  });
}

function handleSessionInput(event) {
  const blockId = event.target.closest("[data-block-id]")?.dataset.blockId;
  const setId = event.target.closest("[data-set-id]")?.dataset.setId;
  const role = event.target.dataset.role;

  if (!blockId || !role) {
    return;
  }

  const block = state.sessionDraft.exercises.find((item) => item.id === blockId);
  if (!block) {
    return;
  }

  if (role === "exercise-name") {
    block.name = event.target.value;
    state.activeExerciseId = blockId;
    state.inspectorHistoryIndex = 0;
    persistDraft();
    renderInspector();
    return;
  }

  const set = block.sets.find((item) => item.id === setId);
  if (!set) {
    return;
  }

  if (role === "reps") {
    set.reps = event.target.value;
  }

  if (role === "weight") {
    set.weight = event.target.value;
  }

  if (role === "rir") {
    set.rir = event.target.value;
  }

  persistDraft();
}

function handleSessionFocus(event) {
  const blockId = event.target.closest("[data-block-id]")?.dataset.blockId;
  if (!blockId) {
    return;
  }

  state.activeExerciseId = blockId;
  state.inspectorHistoryIndex = 0;
  renderInspector();
}

function handleSessionClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  const action = button.dataset.action;
  const blockId = button.closest("[data-block-id]")?.dataset.blockId;
  const setId = button.closest("[data-set-id]")?.dataset.setId;
  const blockIndex = state.sessionDraft.exercises.findIndex((item) => item.id === blockId);
  const block = state.sessionDraft.exercises[blockIndex];

  if (!block) {
    return;
  }

  state.activeExerciseId = blockId;

  if (action === "add-set") {
    block.sets.push(createSet());
  }

  if (action === "save-set") {
    const set = block.sets.find((item) => item.id === setId);
    if (set && hasAnySetValue(set)) {
      set.saved = true;
    }
  }

  if (action === "edit-set") {
    const set = block.sets.find((item) => item.id === setId);
    if (set) {
      set.saved = false;
    }
  }

  if (action === "delete-set") {
    block.sets = block.sets.filter((item) => item.id !== setId);
    if (!block.sets.length) {
      block.sets = [createSet()];
    }
  }

  if (action === "remove-exercise") {
    state.sessionDraft.exercises = state.sessionDraft.exercises.filter((item) => item.id !== blockId);
    if (!state.sessionDraft.exercises.length) {
      const freshBlock = createExerciseBlock();
      state.sessionDraft.exercises = [freshBlock];
      state.activeExerciseId = freshBlock.id;
    } else if (state.activeExerciseId === blockId) {
      state.activeExerciseId = state.sessionDraft.exercises[0].id;
      state.inspectorHistoryIndex = 0;
    }
  }

  renderSessionBuilder();
  renderInspector();
  persistDraft();
}

function saveDraftOnly() {
  markAllFilledSetsSaved();
  persistDraft();
  window.alert("Hareketler taslak olarak kaydedildi.");
}

function saveFullSession() {
  const session = normalizeSessionDraft();

  if (!session.name) {
    window.alert("Seans adini gir.");
    return;
  }

  if (!session.date) {
    window.alert("Seans tarihini sec.");
    return;
  }

  if (!session.exercises.length) {
    window.alert("En az bir hareket ve doldurulmus set gir.");
    return;
  }

  const sessions = getSessions();
  const existingIndex = sessions.findIndex((item) => item.id === state.editingSessionId);
  const persistedSession = {
    id: state.editingSessionId || createId("session"),
    ...session,
    createdAt: existingIndex >= 0 ? sessions[existingIndex].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    sessions[existingIndex] = persistedSession;
  } else {
    sessions.unshift(persistedSession);
  }

  saveCollection(STORAGE_KEYS.sessions, sessions);
  state.sessionDraft = createSessionDraft();
  state.editingSessionId = null;
  state.activeExerciseId = state.sessionDraft.exercises[0].id;
  localStorage.removeItem(STORAGE_KEYS.draft);
  renderAll();
  showView("history");
}

function normalizeSessionDraft() {
  const selectedProgramDay = findSelectedProgramDay(state.sessionDraft.programId);
  return {
    name: state.sessionDraft.name.trim(),
    date: state.sessionDraft.date,
    duration: state.sessionDraft.duration,
    programId: state.sessionDraft.programId,
    programName: selectedProgramDay ? `${selectedProgramDay.program.name} / ${selectedProgramDay.day.label}` : "Serbest antrenman",
    exercises: state.sessionDraft.exercises
      .map((block) => ({
        name: block.name.trim(),
        sets: block.sets
          .filter((set) => hasAnySetValue(set))
          .map((set, index) => ({
            setNumber: index + 1,
            reps: set.reps,
            weight: set.weight,
            rir: set.rir
          }))
      }))
      .filter((block) => block.name && block.sets.length)
  };
}

function showView(name) {
  state.currentView = name;
  viewButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === name);
  });
  views.forEach((view) => {
    view.classList.toggle("active", view.dataset.view === name);
  });
}

function renderAll() {
  renderStats();
  renderPrograms();
  renderExercises();
  renderHistory();
  renderDashboard();
  renderHeroSummary();
  renderProgramSelect();
  renderExerciseSuggestions();
  syncSessionMetaInputs();
  syncProgramDraftInputs();
  renderProgramBuilder();
  if (!state.activeExerciseId && state.sessionDraft.exercises[0]) {
    state.activeExerciseId = state.sessionDraft.exercises[0].id;
  }
  renderSessionBuilder();
  renderInspector();
}

function renderStats() {
  const sessions = getSessions();
  statWorkoutCount.textContent = String(sessions.length);
  statProgramCount.textContent = String(getPrograms().length);
  statExerciseCount.textContent = String(getExercises().length);
  statWeeklyCount.textContent = String(countThisWeek(sessions));
}

function renderProgramSelect() {
  const options = getProgramSelectOptions();
  const hasSelectedProgram = options.some((option) => option.value === state.sessionDraft.programId);
  if (!hasSelectedProgram) {
    state.sessionDraft.programId = "";
  }
  sessionProgramSelect.innerHTML = `
    <option value="">Program sec</option>
    ${options.map((option) => `<option value="${option.value}">${option.label}</option>`).join("")}
  `;
  sessionProgramSelect.value = state.sessionDraft.programId || "";
}

function renderExerciseSuggestions() {
  const names = getExerciseSuggestionNames();
  exerciseSuggestions.innerHTML = names.map((name) => `<option value="${name}"></option>`).join("");
}

function renderImportPreview() {
  if (!state.pendingImportedSessions.length) {
    importPreviewPanel.hidden = true;
    importPreviewList.innerHTML = "";
    return;
  }

  importPreviewPanel.hidden = false;
  importPreviewTitle.textContent = `${state.pendingImportedSessions.length} seans olusacak`;
  importPreviewList.innerHTML = state.pendingImportedSessions.map((session) => `
    <article class="list-card compact-card">
      <strong>${formatDate(session.date)} - ${session.exercises.length} hareket</strong>
      <span>${session.exercises.map((exercise) => `${exercise.name} (${exercise.sets.length} set)`).join(", ")}</span>
    </article>
  `).join("");
}

function renderSessionBuilder() {
  const blocks = state.sessionDraft.exercises;
  sessionExercises.innerHTML = blocks.map((block, blockIndex) => `
    <article class="session-exercise-card ${state.activeExerciseId === block.id ? "active" : ""}" data-block-id="${block.id}">
      <div class="session-exercise-head">
        <label class="exercise-name-field">
          Hareket
          <input
            type="text"
            list="exerciseSuggestions"
            value="${escapeAttribute(block.name)}"
            placeholder="Hareket ara veya yaz"
            data-role="exercise-name"
          >
        </label>
        <div class="exercise-head-actions">
          <button class="secondary-button small-button" type="button" data-action="remove-exercise">
            Hareketi kaldir
          </button>
        </div>
      </div>

        <div class="set-table">
          <div class="set-table-head">
            <span>Set</span>
            <span>Agirlik</span>
            <span>Tekrar</span>
            <span>RIR</span>
            <span>Islemler</span>
          </div>
          ${block.targetReps || block.targetRir ? `
            <div class="set-target-row">
              <span>Hedef</span>
              <span>-</span>
              <span>${block.targetReps || "-"}</span>
              <span>${block.targetRir || "-"}</span>
              <span></span>
            </div>
          ` : ""}
          ${block.sets.map((set, setIndex) => `
          <div class="set-row" data-set-id="${set.id}">
            <span class="set-label">${setIndex + 1}. set</span>
            <input type="text" value="${escapeAttribute(set.weight)}" placeholder="60 / BW / 8,5" data-role="weight" ${set.saved ? "disabled" : ""}>
            <input type="number" min="0" value="${escapeAttribute(set.reps)}" placeholder="${escapeAttribute(block.targetReps || "8")}" data-role="reps" ${set.saved ? "disabled" : ""}>
            <input type="text" value="${escapeAttribute(set.rir)}" placeholder="${escapeAttribute(block.targetRir || "2")}" data-role="rir" ${set.saved ? "disabled" : ""}>
            <div class="set-actions">
              <button class="secondary-button tiny-button" type="button" data-action="save-set">Kaydet</button>
              <button class="secondary-button tiny-button" type="button" data-action="edit-set">Duzenle</button>
              <button class="secondary-button tiny-button danger-button" type="button" data-action="delete-set">Sil</button>
            </div>
          </div>
        `).join("")}
      </div>

      <button class="secondary-button add-set-button" type="button" data-action="add-set">+ Yeni set</button>
    </article>
  `).join("");
}

function renderInspector() {
  const block = state.sessionDraft.exercises.find((item) => item.id === state.activeExerciseId);

  if (!block || !block.name.trim()) {
    inspectorExerciseInput.value = block?.name || "";
    inspectorPositionLabel.textContent = "Kayit yok";
    inspectorPrevButton.disabled = true;
    inspectorNextButton.disabled = true;
    inspectorContent.innerHTML = `<div class="empty-state">Bir hareket secildiginde burada son seanstaki setlerini goreceksin.</div>`;
    return;
  }

  inspectorExerciseInput.value = block.name;
  const exerciseHistory = findExerciseSessions(block.name);
  if (state.inspectorHistoryIndex > exerciseHistory.length - 1) {
    state.inspectorHistoryIndex = 0;
  }
  const previousExercise = exerciseHistory[state.inspectorHistoryIndex];

  inspectorPositionLabel.textContent = exerciseHistory.length ? `${state.inspectorHistoryIndex + 1} / ${exerciseHistory.length}` : "Kayit yok";
  inspectorPrevButton.disabled = state.inspectorHistoryIndex >= exerciseHistory.length - 1 || !exerciseHistory.length;
  inspectorNextButton.disabled = state.inspectorHistoryIndex <= 0 || !exerciseHistory.length;

  if (!previousExercise) {
    inspectorContent.innerHTML = `<div class="empty-state">Bu hareket icin onceki kayit bulunamadi.</div>`;
    return;
  }

  inspectorContent.innerHTML = `
    <div class="inspector-meta">
      <strong>${previousExercise.sessionName}</strong>
      <span>${formatDate(previousExercise.date)}</span>
    </div>
    <div class="inspector-table">
      <div class="inspector-row inspector-head">
        <span>Agirlik</span>
        <span>Tekrar</span>
        <span>RIR</span>
      </div>
      ${previousExercise.sets.map((set) => `
        <div class="inspector-row">
          <span>${set.weight || "-"}</span>
          <span>${set.reps || "-"}</span>
          <span>${set.rir || "-"}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderHistory() {
  const sessions = getSessions();
  if (!sessions.length) {
    historyList.innerHTML = emptyState("Henuz kayitli seans yok. Seans Gir ekranindan ilk antrenmanini olustur.");
    return;
  }

  historyList.innerHTML = sessions.map((session) => `
    <article class="list-card">
      <div class="list-head">
        <div>
          <strong>${session.name}</strong>
          <span>${session.programName || "Serbest antrenman"}</span>
        </div>
        <time>${formatDate(session.date || session.createdAt)}</time>
      </div>
      <p>${session.exercises.map((exercise) => `${exercise.name} (${exercise.sets.length} set)`).join(", ")}</p>
      ${session.duration ? `<p class="note-text">Toplam sure: ${session.duration} dk</p>` : ""}
      <div class="history-actions">
        <button class="secondary-button small-button" type="button" data-history-action="edit-session" data-session-id="${session.id}">Seansi Duzenle</button>
      </div>
    </article>
  `).join("");
}

function renderPrograms() {
  const programs = getPrograms();
  if (!programs.length) {
    programList.innerHTML = emptyState("Kayitli program yok. Ilk programini ekleyerek basla.");
    return;
  }

  programList.innerHTML = programs.map((program) => `
    <article class="list-card">
      <div class="list-head">
        <div>
          <strong>${program.name}</strong>
          <span>${normalizeProgramDays(program).length} gun</span>
        </div>
        <span class="badge">${program.goal || "Program"}</span>
      </div>
      <div class="history-actions">
        <button class="secondary-button small-button" type="button" data-program-list-action="edit-program" data-program-id="${program.id}">Duzenle</button>
        <button class="secondary-button small-button danger-button" type="button" data-program-list-action="delete-program" data-program-id="${program.id}">Sil</button>
      </div>
      ${normalizeProgramDays(program).map((day) => `
        <div class="program-day-summary">
          <strong>${day.label}</strong>
          <p>${normalizeProgramExercises(day.exercises).map((exercise) => {
            const target = [exercise.sets, exercise.reps, exercise.rir].filter(Boolean).join(" / ");
            return target ? `${exercise.name} (${target})` : exercise.name;
          }).join(", ")}</p>
        </div>
      `).join("")}
      ${program.notes ? `<p class="note-text">${program.notes}</p>` : ""}
    </article>
  `).join("");
}

function renderProgramBuilder() {
  programDays.innerHTML = state.programDraft.days.map((day, dayIndex) => `
    <article class="program-day-card" data-day-id="${day.id}">
      <div class="program-day-head">
        <label>
          Gun Basligi
          <input type="text" value="${escapeAttribute(day.label)}" placeholder="${dayIndex + 1}. Gun" data-role="day-label">
        </label>
        <div class="exercise-head-actions">
          <button class="secondary-button small-button" type="button" data-program-action="add-day-exercise">Hareket Ekle</button>
          <button class="secondary-button small-button" type="button" data-program-action="remove-day" ${state.programDraft.days.length === 1 ? "disabled" : ""}>Gunu Sil</button>
        </div>
      </div>

      <div class="program-day-exercises">
        ${day.exercises.map((exercise, exerciseIndex) => `
          <div class="program-day-exercise-row" data-exercise-id="${exercise.id}">
            <input type="text" list="exerciseSuggestions" value="${escapeAttribute(exercise.name)}" placeholder="Hareket gir" data-role="program-exercise-name">
            <input type="number" min="1" value="${escapeAttribute(exercise.sets)}" placeholder="Set" data-role="program-exercise-sets">
            <input type="text" value="${escapeAttribute(exercise.reps)}" placeholder="Hedef tekrar" data-role="program-exercise-reps">
            <input type="text" value="${escapeAttribute(exercise.rir)}" placeholder="Hedef RIR" data-role="program-exercise-rir">
            <button class="secondary-button tiny-button danger-button" type="button" data-program-action="remove-day-exercise" ${day.exercises.length === 1 ? "disabled" : ""}>Sil</button>
          </div>
        `).join("")}
      </div>
    </article>
  `).join("");
}

function renderExercises() {
  const exercises = getExercises();
  if (!exercises.length) {
    exerciseList.innerHTML = emptyState("Kutuphanede hareket yok. Bir hareket ekleyerek baslayabilirsin.");
    return;
  }

  exerciseList.innerHTML = exercises.map((exercise) => `
    <article class="exercise-card">
      <span class="pill">${exercise.muscleGroup}</span>
      <h3>${exercise.name}</h3>
      <p class="subtle">${exercise.equipment || "Ekipman belirtilmedi"}</p>
      <p>${exercise.instructions || "Aciklama eklenmedi."}</p>
    </article>
  `).join("");
}

function renderDashboard() {
  const sessions = getSessions().slice(0, 3);
  const programs = getPrograms().slice(0, 3);

  dashboardHistory.innerHTML = sessions.length ? sessions.map((session) => `
    <article class="list-card compact-card">
      <strong>${session.name}</strong>
      <span>${formatDate(session.date || session.createdAt)} / ${session.exercises.length} hareket</span>
    </article>
  `).join("") : emptyState("Son seanslarin burada gorunecek.");

  dashboardPrograms.innerHTML = programs.length ? programs.map((program) => `
    <article class="list-card compact-card">
      <strong>${program.name}</strong>
      <span>${normalizeProgramDays(program).length} gun / ${normalizeProgramDays(program).reduce((total, day) => total + day.exercises.length, 0)} hareket</span>
    </article>
  `).join("") : emptyState("Henuz aktif program eklenmedi.");
}

function renderHeroSummary() {
  const sessions = getSessions();
  if (!sessions.length) {
    heroSummary.textContent = "Henuz kayit yok. Ilk seansini olusturarak basla.";
    return;
  }

  const latestSession = sessions[0];
  heroSummary.textContent = `Son kayit: ${latestSession.name} / ${latestSession.exercises.length} hareket / ${formatDate(latestSession.date || latestSession.createdAt)}.`;
}

function syncSessionMetaInputs() {
  sessionNameInput.value = state.sessionDraft.name;
  sessionDateInput.value = state.sessionDraft.date;
  sessionDurationInput.value = state.sessionDraft.duration;
}

function createSessionDraft() {
  const firstBlock = createExerciseBlock();
  return {
    name: "",
    date: getTodayValue(),
    duration: "",
    programId: "",
    exercises: [firstBlock]
  };
}

function createProgramDraft() {
  return {
    name: "",
    goal: "",
    notes: "",
    days: [createProgramDayDraft()]
  };
}

function loadProgramIntoBuilder(program) {
  state.editingProgramId = program.id;
  state.programDraft = {
    name: program.name || "",
    goal: program.goal || "",
    notes: program.notes || "",
    days: normalizeProgramDays(program).map((day) => ({
      id: createId("program-day"),
      label: day.label || "",
      exercises: normalizeProgramExercises(day.exercises).map((exercise) => ({
        id: createId("program-exercise"),
        name: exercise.name || "",
        sets: exercise.sets || "",
        reps: exercise.reps || "",
        rir: exercise.rir || ""
      }))
    }))
  };

  syncProgramDraftInputs();
  renderProgramBuilder();
  showView("programs");
}

function createProgramDayDraft() {
  return {
    id: createId("program-day"),
    label: "",
    exercises: [createProgramExerciseDraft()]
  };
}

function createProgramExerciseDraft() {
  return {
    id: createId("program-exercise"),
    name: "",
    sets: "",
    reps: "",
    rir: ""
  };
}

function createSet(template = {}) {
  return {
    id: createId("set"),
    reps: template.reps || "",
    weight: template.weight || "",
    rir: template.rir || "",
    saved: false
  };
}

function createExerciseBlock(name = "", template = {}) {
  const setCount = Math.max(Number.parseInt(template.sets, 10) || 1, 1);
  return {
    id: createId("draft-exercise"),
    name,
    targetReps: template.reps || "",
    targetRir: template.rir || "",
    sets: Array.from({ length: setCount }, () => createSet())
  };
}

function syncProgramDraftInputs() {
  programTitleInput.value = state.programDraft.name;
  programGoalInput.value = state.programDraft.goal;
  programNotesInput.value = state.programDraft.notes;
}

function findExerciseSessions(exerciseName) {
  const normalizedName = exerciseName.trim().toLowerCase();
  const matches = [];

  for (const session of getSessions()) {
    const match = session.exercises.find((exercise) => exercise.name.trim().toLowerCase() === normalizedName);
    if (match) {
      matches.push({
        sessionName: session.name,
        date: session.date || session.createdAt,
        sets: match.sets
      });
    }
  }

  return matches;
}

function getExerciseHistoryForActiveBlock() {
  const block = state.sessionDraft.exercises.find((item) => item.id === state.activeExerciseId);
  if (!block || !block.name.trim()) {
    return [];
  }
  return findExerciseSessions(block.name);
}

function getSessions() {
  return readCollection(STORAGE_KEYS.sessions);
}

function getPrograms() {
  return readCollection(STORAGE_KEYS.programs);
}

function getExercises() {
  return readCollection(STORAGE_KEYS.exercises);
}

function readCollection(key) {
  return Array.isArray(collectionCache[key]) ? collectionCache[key] : [];
}

function saveCollection(key, value) {
  collectionCache[key] = Array.isArray(value) ? value : [];
  void persistCollection(key);
}

async function seedInitialData(remoteCollections = null) {
  const resolvedCollections = remoteCollections || await fetchBootstrapCollections();
  collectionCache[STORAGE_KEYS.sessions] = resolvedCollections.sessions;
  collectionCache[STORAGE_KEYS.programs] = resolvedCollections.programs;
  collectionCache[STORAGE_KEYS.exercises] = resolvedCollections.exercises;

  const legacySessions = readLegacyCollection(STORAGE_KEYS.sessions);
  const legacyPrograms = readLegacyCollection(STORAGE_KEYS.programs);
  const legacyExercises = readLegacyCollection(STORAGE_KEYS.exercises);

  const mergedSessions = mergeSessions(collectionCache[STORAGE_KEYS.sessions], legacySessions);
  const mergedPrograms = mergePrograms(mergePrograms(collectionCache[STORAGE_KEYS.programs], legacyPrograms), defaultPrograms);
  const mergedExercises = mergeExercises(mergeExercises(collectionCache[STORAGE_KEYS.exercises], legacyExercises), defaultExercises);

  const changed =
    hasCollectionChanged(collectionCache[STORAGE_KEYS.sessions], mergedSessions) ||
    hasCollectionChanged(collectionCache[STORAGE_KEYS.programs], mergedPrograms) ||
    hasCollectionChanged(collectionCache[STORAGE_KEYS.exercises], mergedExercises);

  collectionCache[STORAGE_KEYS.sessions] = mergedSessions;
  collectionCache[STORAGE_KEYS.programs] = mergedPrograms;
  collectionCache[STORAGE_KEYS.exercises] = mergedExercises;

  if (changed) {
    await persistAllCollections();
  }
}

async function fetchBootstrapCollections() {
  try {
    const [{ data: sessionData }, { data: userData, error: userError }] = await Promise.all([
      supabase.auth.getSession(),
      supabase.auth.getUser()
    ]);

    const user = userData?.user || sessionData?.session?.user || null;
    if (userError || !user) {
      return {
        authenticated: false,
        sessions: [],
        programs: [],
        exercises: []
      };
    }

    const { data, error } = await supabase
      .from("user_collections")
      .select("name,payload")
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    const collectionMap = Object.fromEntries(
      (data || []).map((row) => [row.name, Array.isArray(row.payload) ? row.payload : []])
    );

    return {
      authenticated: true,
      user,
      sessions: collectionMap.sessions || [],
      programs: collectionMap.programs || [],
      exercises: collectionMap.exercises || []
    };
  } catch (error) {
    console.error("Bootstrap error", error);
    return {
      authenticated: false,
      sessions: [],
      programs: [],
      exercises: []
    };
  }
}

function readLegacyCollection(key) {
  try {
    const rawValue = localStorage.getItem(key);
    const parsedValue = JSON.parse(rawValue || "[]");
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

async function persistCollection(key) {
  const collectionName = API_COLLECTION_NAMES[key];
  if (!collectionName) {
    return;
  }

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw userError || new Error("Kullanici bulunamadi.");
    }

    const { error } = await supabase
      .from("user_collections")
      .upsert({
        user_id: userData.user.id,
        name: collectionName,
        payload: collectionCache[key],
        updated_at: new Date().toISOString()
      }, {
        onConflict: "user_id,name"
      });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Persist error", error);
    window.alert("Supabase kaydi sirasinda bir hata oldu. SQL semasini ve auth ayarlarini kontrol et.");
  }
}

async function persistAllCollections() {
  await Promise.all([
    persistCollection(STORAGE_KEYS.sessions),
    persistCollection(STORAGE_KEYS.programs),
    persistCollection(STORAGE_KEYS.exercises)
  ]);
}

function hasCollectionChanged(previousValue, nextValue) {
  return JSON.stringify(previousValue) !== JSON.stringify(nextValue);
}

function handleProgramBuilderInput(event) {
  const dayId = event.target.closest("[data-day-id]")?.dataset.dayId;
  const exerciseId = event.target.closest("[data-exercise-id]")?.dataset.exerciseId;
  const role = event.target.dataset.role;
  const day = state.programDraft.days.find((item) => item.id === dayId);

  if (!day || !role) {
    return;
  }

  if (role === "day-label") {
    day.label = event.target.value;
    return;
  }

  const exercise = day.exercises.find((item) => item.id === exerciseId);
  if (!exercise) {
    return;
  }

  if (role === "program-exercise-name") {
    exercise.name = event.target.value;
  }

  if (role === "program-exercise-sets") {
    exercise.sets = event.target.value;
  }

  if (role === "program-exercise-reps") {
    exercise.reps = event.target.value;
  }

  if (role === "program-exercise-rir") {
    exercise.rir = event.target.value;
  }
}

function handleProgramBuilderClick(event) {
  const button = event.target.closest("[data-program-action]");
  if (!button) {
    return;
  }

  const action = button.dataset.programAction;
  const dayId = button.closest("[data-day-id]")?.dataset.dayId;
  const exerciseId = button.closest("[data-exercise-id]")?.dataset.exerciseId;
  const day = state.programDraft.days.find((item) => item.id === dayId);
  if (!day) {
    return;
  }

  if (action === "add-day-exercise") {
    day.exercises.push(createProgramExerciseDraft());
  }

  if (action === "remove-day") {
    state.programDraft.days = state.programDraft.days.filter((item) => item.id !== dayId);
  }

  if (action === "remove-day-exercise") {
    day.exercises = day.exercises.filter((item) => item.id !== exerciseId);
    if (!day.exercises.length) {
      day.exercises = [createProgramExerciseDraft()];
    }
  }

  renderProgramBuilder();
}

function normalizeProgramDraftDays() {
  return state.programDraft.days
    .map((day, index) => ({
      id: createId("saved-day"),
      label: day.label.trim() || `${index + 1}. Gun`,
      exercises: day.exercises
        .map((exercise) => ({
          name: exercise.name.trim(),
          sets: exercise.sets.trim(),
          reps: exercise.reps.trim(),
          rir: exercise.rir.trim()
        }))
        .filter((exercise) => exercise.name)
    }))
    .filter((day) => day.exercises.length);
}

function loadStoredDraft() {
  const storedDraft = localStorage.getItem(STORAGE_KEYS.draft);
  if (!storedDraft) {
    state.activeExerciseId = state.sessionDraft.exercises[0].id;
    return;
  }

  try {
    const parsedDraft = JSON.parse(storedDraft);
    state.sessionDraft = hydrateDraft(parsedDraft);
    state.editingSessionId = parsedDraft.editingSessionId || null;
    state.activeExerciseId = state.sessionDraft.exercises[0]?.id || null;
  } catch {
    state.sessionDraft = createSessionDraft();
    state.activeExerciseId = state.sessionDraft.exercises[0].id;
  }
}

function getExerciseSuggestionNames() {
  return [...new Set(
    getExercises()
      .map((exercise) => exercise.name.trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "tr"));
}

function parseDelimitedTable(rawText, delimiter) {
  const normalizedText = rawText.replace(/\r\n/g, "\n").trim();
  if (!normalizedText) {
    return [];
  }

  const lines = normalizedText.split("\n").filter(Boolean);
  if (lines.length < 2) {
    return [];
  }

  const headers = splitDelimitedLine(lines[0], delimiter).map((header) => header.trim().toLowerCase());
  return lines
    .slice(1)
    .map((line) => {
      const values = splitDelimitedLine(line, delimiter);
      return headers.reduce((accumulator, header, index) => {
        accumulator[header] = (values[index] || "").trim();
        return accumulator;
      }, {});
    })
    .filter((row) => Object.values(row).some(Boolean));
}

function splitDelimitedLine(line, delimiter) {
  if (delimiter === "\t") {
    return line.split("\t");
  }

  const result = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === delimiter && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  result.push(current);
  return result;
}

function detectDelimiter(rawText) {
  const firstLine = rawText.split(/\r?\n/).find(Boolean) || "";
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  return semicolonCount > commaCount ? ";" : ",";
}

function buildImportedSessionsFromRows(rows) {
  const normalizedRows = rows.map((row) => ({
    date: row.date || row.tarih || "",
    workout: row.workout || row.hareket || "",
    set: row.set || "",
    weight: row.weight || row.weigth || row.agirlik || "",
    rep: row.rep || row.reps || row.tekrar || "",
    rir: row.rir || ""
  })).filter((row) => row.date && row.workout);

  if (!normalizedRows.length) {
    return [];
  }

  const rowsByDate = new Map();

  normalizedRows.forEach((row) => {
    const sessionDateValue = parseImportedDate(row.date);
    if (!rowsByDate.has(sessionDateValue)) {
      rowsByDate.set(sessionDateValue, []);
    }

    rowsByDate.get(sessionDateValue).push(row);
  });

  return [...rowsByDate.entries()]
    .sort((left, right) => new Date(right[0]).getTime() - new Date(left[0]).getTime())
    .map(([sessionDateValue, sessionRows]) => {
      const groupedExercises = new Map();

      sessionRows.forEach((row) => {
        const workoutName = row.workout.trim();
        if (!groupedExercises.has(workoutName)) {
          groupedExercises.set(workoutName, []);
        }

        groupedExercises.get(workoutName).push({
          setOrder: Number.parseInt(row.set, 10) || groupedExercises.get(workoutName).length + 1,
          weight: row.weight.trim(),
          reps: row.rep.trim(),
          rir: row.rir.trim()
        });
      });

      const exercises = [...groupedExercises.entries()].map(([name, sets]) => ({
        name,
        sets: sets
          .sort((left, right) => left.setOrder - right.setOrder)
          .map((set, index) => ({
            setNumber: index + 1,
            reps: set.reps,
            weight: set.weight,
            rir: set.rir
          }))
      }));

      return {
        id: createId("session"),
        name: `Import - ${formatDate(sessionDateValue)}`,
        date: sessionDateValue,
        duration: "",
        programId: "",
        programName: "Serbest antrenman",
        exercises,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });
}

function parseImportedDate(rawDate) {
  const trimmedDate = rawDate.trim();
  const slashMatch = trimmedDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, month, day, year] = slashMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const dottedMatch = trimmedDate.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dottedMatch) {
    const [, day, month, year] = dottedMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const dashedMatch = trimmedDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (dashedMatch) {
    const [, year, month, day] = dashedMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const parsedDate = new Date(trimmedDate);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString().split("T")[0];
  }

  return getTodayValue();
}

function splitExerciseNames(rawValue) {
  return rawValue
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeProgramExercises(exercises) {
  return (exercises || []).map((exercise) => {
    if (typeof exercise === "string") {
      return { name: exercise, sets: "", reps: "", rir: "" };
    }
    return {
      name: exercise.name || "",
      sets: exercise.sets || "",
      reps: exercise.reps || "",
      rir: exercise.rir || ""
    };
  });
}

function normalizeProgramDays(program) {
  if (Array.isArray(program.days) && program.days.length) {
    return program.days.map((day, index) => ({
      id: day.id || `${program.id}-day-${index + 1}`,
      label: day.label || `${index + 1}. Gun`,
      exercises: normalizeProgramExercises(day.exercises)
    }));
  }

  return [{
    id: program.id,
    label: program.day || "1. Gun",
    exercises: normalizeProgramExercises(program.exercises)
  }];
}

function getProgramSelectOptions() {
  return getPrograms().flatMap((program) =>
    normalizeProgramDays(program).map((day) => ({
      value: `${program.id}::${day.id}`,
      label: `${program.name} / ${day.label}`,
      programId: program.id,
      dayId: day.id
    }))
  );
}

function findSelectedProgramDay(selectionValue) {
  if (!selectionValue) {
    return null;
  }

  const [programId, dayId] = selectionValue.split("::");
  const program = getPrograms().find((item) => item.id === programId);
  if (!program) {
    return null;
  }

  const day = normalizeProgramDays(program).find((item) => item.id === dayId);
  if (!day) {
    return null;
  }

  return {
    program,
    day,
    selectionValue
  };
}

function importSessionFromTableText(rawText, delimiter) {
  const rows = parseDelimitedTable(rawText, delimiter);
  if (!rows.length) {
    window.alert("Okunabilir satir bulunamadi.");
    return;
  }

  const importedSessions = buildImportedSessionsFromRows(rows);
  if (!importedSessions.length) {
    window.alert("Beklenen sutunlar bulunamadi: Date, Workout, Set, Weight, Rep, RIR.");
    return;
  }

  state.pendingImportedSessions = importedSessions;
  renderImportPreview();
}

function mergeExercises(existingExercises, incomingExercises) {
  const merged = [...existingExercises];
  const existingNames = new Set(existingExercises.map((exercise) => exercise.name.trim().toLowerCase()));

  incomingExercises.forEach((exercise) => {
    const key = exercise.name.trim().toLowerCase();
    if (!existingNames.has(key)) {
      merged.push(exercise);
      existingNames.add(key);
    }
  });

  return merged;
}

function mergePrograms(existingPrograms, incomingPrograms) {
  const merged = [...existingPrograms];
  const existingNames = new Set(existingPrograms.map((program) => program.name.trim().toLowerCase()));

  incomingPrograms.forEach((program) => {
    const key = program.name.trim().toLowerCase();
    if (!existingNames.has(key)) {
      merged.push(program);
      existingNames.add(key);
    }
  });

  return merged;
}

function mergeSessions(existingSessions, incomingSessions) {
  const merged = [...existingSessions];
  const existingKeys = new Set(existingSessions.map((session) => buildSessionMergeKey(session)));

  incomingSessions.forEach((session) => {
    const mergeKey = buildSessionMergeKey(session);
    if (!existingKeys.has(mergeKey)) {
      merged.push(session);
      existingKeys.add(mergeKey);
    }
  });

  return merged.sort((left, right) => {
    const leftDate = new Date(left.date || left.createdAt || 0).getTime();
    const rightDate = new Date(right.date || right.createdAt || 0).getTime();
    return rightDate - leftDate;
  });
}

function buildSessionMergeKey(session) {
  if (session.id) {
    return `id:${session.id}`;
  }
  return JSON.stringify({
    name: session.name || "",
    date: session.date || session.createdAt || "",
    exercises: (session.exercises || []).map((exercise) => ({
      name: exercise.name || "",
      sets: (exercise.sets || []).map((set) => ({
        weight: set.weight || "",
        reps: set.reps || "",
        rir: set.rir || ""
      }))
    }))
  });
}

function markAllFilledSetsSaved() {
  state.sessionDraft.exercises.forEach((block) => {
    block.sets.forEach((set) => {
      if (hasAnySetValue(set)) {
        set.saved = true;
      }
    });
  });
  renderSessionBuilder();
}

function persistDraft() {
  localStorage.setItem(STORAGE_KEYS.draft, JSON.stringify({
    editingSessionId: state.editingSessionId,
    sessionDraft: state.sessionDraft
  }));
}

function hydrateDraft(payload) {
  const sourceDraft = payload.sessionDraft || payload;
  const exercises = (sourceDraft.exercises || []).map((block) => ({
    id: block.id || createId("draft-exercise"),
    name: block.name || "",
    targetReps: block.targetReps || "",
    targetRir: block.targetRir || "",
    sets: (block.sets && block.sets.length ? block.sets : [createSet()]).map((set) => ({
      id: set.id || createId("set"),
      reps: set.reps || "",
      weight: set.weight || "",
      rir: set.rir || "",
      saved: Boolean(set.saved)
    }))
  }));

  return {
    name: sourceDraft.name || "",
    date: sourceDraft.date || getTodayValue(),
    duration: sourceDraft.duration || "",
    programId: sourceDraft.programId || "",
    exercises: exercises.length ? exercises : [createExerciseBlock()]
  };
}

function sessionToDraft(session) {
  return {
    name: session.name || "",
    date: session.date || getTodayValue(),
    duration: session.duration || "",
    programId: session.programId || "",
    exercises: (session.exercises || []).map((exercise) => ({
      id: createId("draft-exercise"),
      name: exercise.name || "",
      targetReps: "",
      targetRir: "",
      sets: (exercise.sets || []).map((set) => ({
        id: createId("set"),
        reps: set.reps || "",
        weight: set.weight || "",
        rir: set.rir || "",
        saved: false
      }))
    }))
  };
}

historyList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-history-action='edit-session']");
  if (!button) {
    return;
  }

  const sessionId = button.dataset.sessionId;
  const session = getSessions().find((item) => item.id === sessionId);
  if (!session) {
    return;
  }

  state.editingSessionId = session.id;
  state.sessionDraft = sessionToDraft(session);
  state.activeExerciseId = state.sessionDraft.exercises[0]?.id || null;
  persistDraft();
  renderAll();
  showView("workouts");
});

programList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-program-list-action]");
  if (!button) {
    return;
  }

  const action = button.dataset.programListAction;
  const programId = button.dataset.programId;
  const programs = getPrograms();
  const program = programs.find((item) => item.id === programId);

  if (!program) {
    return;
  }

  if (action === "edit-program") {
    loadProgramIntoBuilder(program);
    return;
  }

  if (action === "delete-program") {
    const nextPrograms = programs.filter((item) => item.id !== programId);
    saveCollection(STORAGE_KEYS.programs, nextPrograms);
    if (state.editingProgramId === programId) {
      state.editingProgramId = null;
      state.programDraft = createProgramDraft();
      syncProgramDraftInputs();
      renderProgramBuilder();
    }
    renderAll();
  }
});

function hasAnySetValue(set) {
  return Boolean(set.reps || set.weight || set.rir);
}

function countThisWeek(sessions) {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);

  return sessions.filter((session) => {
    const sessionDate = new Date(session.date || session.createdAt);
    return sessionDate >= weekAgo && sessionDate <= now;
  }).length;
}

function formatDate(dateValue, overrides = {}) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...overrides
  }).format(new Date(dateValue));
}

function getTodayValue() {
  return new Date().toISOString().split("T")[0];
}

function createId(prefix) {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}`;
}

function emptyState(message) {
  return `<div class="empty-state">${message}</div>`;
}

function escapeAttribute(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

init().catch((error) => {
  console.error("Init error", error);
  window.alert("Uygulama baslatilirken bir hata olustu.");
});
