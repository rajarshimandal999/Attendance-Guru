import {
  calculateAbsent,
  calculateAttendance,
  calculateClassesToRecover,
  calculateMaximumFinalAttendance,
  calculateRequiredFutureAttendance,
  calculateSafeAbsenceLimit,
  getAttendanceStatus,
  isTargetReachable,
  validateAttendanceInput,
} from "./calculations.js";

const form = document.querySelector("#attendanceForm");
const fields = {
  subject: document.querySelector("#subject"),
  attended: document.querySelector("#attended"),
  total: document.querySelector("#total"),
  requiredPercentage: document.querySelector("#requiredPercentage"),
  remainingClasses: document.querySelector("#remainingClasses"),
};

const output = {
  subjectLabel: document.querySelector("#subjectLabel"),
  currentPercentage: document.querySelector("#currentPercentage"),
  ringValue: document.querySelector("#ringValue"),
  statusText: document.querySelector("#statusText"),
  barFill: document.querySelector("#barFill"),
  targetMarker: document.querySelector("#targetMarker"),
  targetLabel: document.querySelector("#targetLabel"),
  attendedValue: document.querySelector("#attendedValue"),
  totalValue: document.querySelector("#totalValue"),
  absentValue: document.querySelector("#absentValue"),
  bufferValue: document.querySelector("#bufferValue"),
  safeMissesValue: document.querySelector("#safeMissesValue"),
  recoverValue: document.querySelector("#recoverValue"),
  bestFinalValue: document.querySelector("#bestFinalValue"),
  futureNeededValue: document.querySelector("#futureNeededValue"),
  recommendationTitle: document.querySelector("#recommendationTitle"),
  recommendationText: document.querySelector("#recommendationText"),
  formError: document.querySelector("#formError"),
  ring: document.querySelector(".ring"),
};

form.addEventListener("input", updateDashboard);
updateDashboard();

function updateDashboard() {
  const values = readFormValues();

  try {
    validateAttendanceInput(
      values.attended,
      values.total,
      values.requiredPercentage,
      values.remainingClasses,
    );
    output.formError.textContent = "";
  } catch (error) {
    output.formError.textContent = error.message;
    return;
  }

  const current = calculateAttendance(values.attended, values.total);
  const absent = calculateAbsent(values.attended, values.total);
  const buffer = current - values.requiredPercentage;
  const safeMisses = calculateSafeAbsenceLimit(
    values.attended,
    values.total,
    values.requiredPercentage,
    values.remainingClasses,
  );
  const recoverClasses = calculateClassesToRecover(
    values.attended,
    values.total,
    values.requiredPercentage,
  );
  const bestFinal = calculateMaximumFinalAttendance(
    values.attended,
    values.total,
    values.remainingClasses,
  );
  const futureRequired = calculateRequiredFutureAttendance(
    values.attended,
    values.total,
    values.requiredPercentage,
    values.remainingClasses,
  );
  const reachable = isTargetReachable(
    values.attended,
    values.total,
    values.requiredPercentage,
    values.remainingClasses,
  );
  const status = reachable
    ? getAttendanceStatus(current, values.requiredPercentage)
    : "unreachable";

  renderStatusClass(status);
  renderMain(values, current, status, reachable);
  renderMetrics(values, {
    absent,
    buffer,
    safeMisses,
    recoverClasses,
    bestFinal,
    futureRequired,
  });
  renderRecommendation(values, {
    current,
    status,
    reachable,
    recoverClasses,
    safeMisses,
    bestFinal,
    futureRequired,
  });
}

function readFormValues() {
  return {
    subject: fields.subject.value.trim() || "Current subject",
    attended: Number(fields.attended.value),
    total: Number(fields.total.value),
    requiredPercentage: Number(fields.requiredPercentage.value),
    remainingClasses: Number(fields.remainingClasses.value),
  };
}

function renderMain(values, current, status, reachable) {
  const statusColor = getStatusColor(status);

  output.subjectLabel.textContent = values.subject;
  output.currentPercentage.textContent = formatPercent(current);
  output.ringValue.textContent = formatPercent(current);
  output.statusText.textContent = getStatusText(status, reachable);
  output.barFill.style.width = `${clamp(current, 0, 100)}%`;
  output.barFill.style.background = statusColor;
  output.targetMarker.style.left = `${clamp(values.requiredPercentage, 0, 100)}%`;
  output.targetLabel.textContent = `Target ${formatPercent(values.requiredPercentage)}`;
  output.ring.style.setProperty("--ring-value", `${clamp(current, 0, 100)}%`);
  output.ring.style.setProperty("--ring-color", statusColor);
}

function renderMetrics(values, metrics) {
  output.attendedValue.textContent = values.attended;
  output.totalValue.textContent = values.total;
  output.absentValue.textContent = metrics.absent;
  output.bufferValue.textContent = `${metrics.buffer >= 0 ? "+" : ""}${formatPercent(metrics.buffer)}`;
  output.safeMissesValue.textContent = metrics.safeMisses;
  output.recoverValue.textContent = Number.isFinite(metrics.recoverClasses)
    ? metrics.recoverClasses
    : "Not possible";
  output.bestFinalValue.textContent = formatPercent(metrics.bestFinal);
  output.futureNeededValue.textContent = formatFutureNeed(metrics.futureRequired);
}

function renderRecommendation(values, metrics) {
  if (!metrics.reachable) {
    output.recommendationTitle.textContent = "Target currently unreachable";
    output.recommendationText.textContent =
      `Even perfect attendance in all ${values.remainingClasses} remaining classes only reaches ${formatPercent(metrics.bestFinal)}.`;
    return;
  }

  if (metrics.current >= values.requiredPercentage) {
    output.recommendationTitle.textContent =
      metrics.status === "comfortably-above-target" ? "Comfortably above target" : "Close to your target";
    output.recommendationText.textContent =
      `You can miss ${metrics.safeMisses} of the remaining ${values.remainingClasses} classes and still stay at or above ${formatPercent(values.requiredPercentage)}.`;
    return;
  }

  output.recommendationTitle.textContent = "Recovery plan needed";
  output.recommendationText.textContent =
    `Attend the next ${metrics.recoverClasses} classes consecutively to reach ${formatPercent(values.requiredPercentage)}. For the full remaining set, you need ${formatFutureNeed(metrics.futureRequired)} attendance.`;
}

function renderStatusClass(status) {
  document.body.classList.remove(
    "status-below-target",
    "status-close-to-target",
    "status-comfortably-above-target",
    "status-unreachable",
  );
  document.body.classList.add(`status-${status}`);
}

function getStatusText(status, reachable) {
  if (!reachable) {
    return "Even attending every remaining class cannot reach the required percentage.";
  }

  const messages = {
    "comfortably-above-target": "You are comfortably above the required attendance.",
    "close-to-target": "You are above the line, but a few absences can change that quickly.",
    "below-target": "You are below target. The recovery numbers show the shortest path back.",
  };

  return messages[status];
}

function getStatusColor(status) {
  const styles = getComputedStyle(document.documentElement);
  const colorName = {
    "comfortably-above-target": "--green",
    "close-to-target": "--yellow",
    "below-target": "--red",
    unreachable: "--warning",
  }[status];

  return styles.getPropertyValue(colorName).trim();
}

function formatFutureNeed(result) {
  if (result.requiredPercentage === null) {
    return result.isPossible ? "0%" : "Not possible";
  }

  if (!result.isPossible) {
    return "Not possible";
  }

  return `${formatPercent(result.requiredPercentage)} (${result.requiredClasses} classes)`;
}

function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return "Not possible";
  }

  return `${Number(value.toFixed(2)).toLocaleString("en-US")}%`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
