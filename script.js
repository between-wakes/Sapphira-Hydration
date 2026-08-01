/*
  Get Hydrated with Sapphira
  Gift Edition v1.1
*/

document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "getHydratedWithSapphiraGiftV1";
  const DEFAULT_GOAL = 2500;

  const defaultData = {
    water: 0,
    goal: DEFAULT_GOAL,
    streak: 0,
    currentDate: getLocalDateKey(),
    goalCompletedToday: false,
    lastCompletedDate: null,
    welcomeSeen: false
  };

  const elements = {
    splashScreen: document.getElementById("splashScreen"),
    startButton: document.getElementById("startButton"),
    app: document.getElementById("app"),
    bunnyImage: document.getElementById("bunnyImage"),
    statusText: document.getElementById("statusText"),
    dateText: document.getElementById("dateText"),
    streak: document.getElementById("streak"),
    progressText: document.getElementById("progressText"),
    fill: document.getElementById("fill"),
    add100: document.getElementById("add100"),
    add200: document.getElementById("add200"),
    add500: document.getElementById("add500"),
    resetButton: document.getElementById("resetButton")
  };

  let appData = loadData();

  initialiseApp();

  function initialiseApp() {
    ensureCurrentDay();
    setInitialScreen();
    bindEvents();
    render();

    // Zachytí nový deň aj vtedy, keď aplikácia zostane otvorená cez polnoc.
    window.setInterval(() => {
      const dayChanged = ensureCurrentDay();

      if (dayChanged) {
        render();
      }
    }, 60_000);

    // Po návrate do aplikácie z pozadia znova overí dátum.
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        ensureCurrentDay();
        render();
      }
    });
  }

  function bindEvents() {
    elements.startButton.addEventListener("click", startApp);
    elements.add100.addEventListener("click", () => addWater(100));
    elements.add200.addEventListener("click", () => addWater(200));
    elements.add500.addEventListener("click", () => addWater(500));
    elements.resetButton.addEventListener("click", resetWater);
  }

  function startApp() {
    appData.welcomeSeen = true;
    saveData();

    elements.splashScreen.classList.add("hidden");
    elements.app.classList.remove("hidden");

    render();
  }

  function setInitialScreen() {
    if (appData.welcomeSeen) {
      elements.splashScreen.classList.add("hidden");
      elements.app.classList.remove("hidden");
    } else {
      elements.splashScreen.classList.remove("hidden");
      elements.app.classList.add("hidden");
    }
  }

  function addWater(amount) {
    ensureCurrentDay();

    appData.water += amount;

    if (
      appData.water >= appData.goal &&
      appData.goalCompletedToday === false
    ) {
      completeToday();
    }

    saveData();
    render();
  }

  function resetWater() {
    ensureCurrentDay();

    appData.water = 0;

    // Úmyselne nemeníme streak ani už získané dnešné splnenie.
    // Tlačidlo resetuje iba dnešné množstvo vody.
    saveData();
    render();
  }

  function completeToday() {
    const today = getLocalDateKey();
    const yesterday = shiftDateKey(today, -1);

    if (appData.lastCompletedDate === yesterday) {
      appData.streak += 1;
    } else {
      appData.streak = 1;
    }

    appData.goalCompletedToday = true;
    appData.lastCompletedDate = today;
  }

  function ensureCurrentDay() {
    const today = getLocalDateKey();

    if (appData.currentDate === today) {
      return false;
    }

    const elapsedDays = daysBetween(appData.currentDate, today);

    /*
      Ak bol posledný uložený deň nesplnený, séria sa ruší.
      Ak aplikácia nebola otvorená viac než jeden deň, najmenej jeden deň
      nevieme potvrdiť, preto sa séria tiež ruší.
    */
    if (!appData.goalCompletedToday || elapsedDays > 1) {
      appData.streak = 0;
    }

    appData.water = 0;
    appData.goalCompletedToday = false;
    appData.currentDate = today;

    saveData();
    return true;
  }

  function render() {
    const stage = getHydrationStage(appData.water);
    const progressPercent = Math.min(
      (appData.water / appData.goal) * 100,
      100
    );

    elements.dateText.textContent = formatDisplayDate();
    elements.streak.textContent = `🔥 Streak: ${appData.streak}`;
    elements.progressText.textContent =
      `${appData.water} / ${appData.goal} ml`;

    elements.fill.style.width = `${progressPercent}%`;
    elements.fill.style.background = getProgressColour(appData.water);

    elements.statusText.textContent = stage.text;
    elements.bunnyImage.src = stage.image;
    elements.bunnyImage.alt = stage.alt;
  }

  function getHydrationStage(water) {
    if (water < 500) {
      return {
        text: "Hydratácia: hanba. Sapphira kvôli tebe ničí veci.",
        image: "IMG_5819.jpeg",
        alt: "Sapphira ničí veci"
      };
    }

    if (water < 1000) {
      return {
        text: "Tváriš sa, že piješ vodu. Sapphira vie, že klameš.",
        image: "IMG_5028.jpeg",
        alt: "Sapphira sa pozerá bokom"
      };
    }

    if (water < 1500) {
      return {
        text: "Sapphira ťa potichu pozoruje, ale hlasno odsudzuje.",
        image: "IMG_5781.jpeg",
        alt: "Sapphira prísne pozoruje z diaľky"
      };
    }

    if (water < 2000) {
      return {
        text: "Nemysli si, že Sapphira na teba zabudla. Stále ťa sleduje.",
        image: "IMG_9260.jpeg",
        alt: "Sapphira stále pozoruje"
      };
    }

    if (water < 2500) {
      return {
        text: "Sapphira sa upokojila. Nepokaz to.",
        image: "IMG_6798.jpeg",
        alt: "Sapphira oddychuje"
      };
    }

    return {
      text:
        "Splnil si očakávania kráľovnej Sapphiry. " +
        "Môžeš existovať v pokoji. Dnes.",
      image: "IMG_0851.jpeg",
      alt: "Kráľovná Sapphira"
    };
  }

  function getProgressColour(water) {
    if (water < 1000) {
      return "#ff6b6b";
    }

    if (water < 2000) {
      return "#ffd93d";
    }

    return "#6bcbef";
  }

  function loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        return { ...defaultData };
      }

      const parsed = JSON.parse(saved);

      return {
        ...defaultData,
        ...parsed,
        water: toNonNegativeNumber(parsed.water, 0),
        goal: toPositiveNumber(parsed.goal, DEFAULT_GOAL),
        streak: toNonNegativeInteger(parsed.streak, 0),
        currentDate: isDateKey(parsed.currentDate)
          ? parsed.currentDate
          : getLocalDateKey(),
        goalCompletedToday: Boolean(parsed.goalCompletedToday),
        lastCompletedDate: isDateKey(parsed.lastCompletedDate)
          ? parsed.lastCompletedDate
          : null,
        welcomeSeen: Boolean(parsed.welcomeSeen)
      };
    } catch (error) {
      console.warn("Uložené dáta sa nepodarilo načítať:", error);
      return { ...defaultData };
    }
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    } catch (error) {
      console.warn("Dáta sa nepodarilo uložiť:", error);
    }
  }

  function getLocalDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function shiftDateKey(dateKey, amount) {
    const date = dateKeyToDate(dateKey);
    date.setDate(date.getDate() + amount);

    return getLocalDateKey(date);
  }

  function daysBetween(earlierDateKey, laterDateKey) {
    const earlier = dateKeyToUtcNumber(earlierDateKey);
    const later = dateKeyToUtcNumber(laterDateKey);

    return Math.round((later - earlier) / 86_400_000);
  }

  function dateKeyToDate(dateKey) {
    const [year, month, day] = dateKey.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function dateKeyToUtcNumber(dateKey) {
    const [year, month, day] = dateKey.split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  }

  function formatDisplayDate() {
    const formatter = new Intl.DateTimeFormat("sk-SK", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    const formatted = formatter.format(new Date());
    return `📅 ${formatted.charAt(0).toUpperCase()}${formatted.slice(1)}`;
  }

  function isDateKey(value) {
    return typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  function toNonNegativeNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : fallback;
  }

  function toPositiveNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : fallback;
  }

  function toNonNegativeInteger(value, fallback) {
    const number = Number(value);
    return Number.isInteger(number) && number >= 0 ? number : fallback;
  }
});
