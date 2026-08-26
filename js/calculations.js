const EPSILON = 1e-12;

export function validateAttendanceInput(attended, total, requiredPercentage = 75, remainingClasses = 0) {
  assertNonNegativeInteger(attended, "attended");
  assertNonNegativeInteger(total, "total");
  assertPercentage(requiredPercentage, "requiredPercentage");
  assertNonNegativeInteger(remainingClasses, "remainingClasses");

  if (attended > total) {
    throw new RangeError("attended cannot be greater than total");
  }

  return {
    attended,
    total,
    requiredPercentage,
    remainingClasses,
  };
}

export function calculateAttendance(attended, total) {
  assertNonNegativeInteger(attended, "attended");
  assertNonNegativeInteger(total, "total");

  if (attended > total) {
    throw new RangeError("attended cannot be greater than total");
  }

  return total === 0 ? 0 : (attended / total) * 100;
}

export function calculateAbsent(attended, total) {
  assertNonNegativeInteger(attended, "attended");
  assertNonNegativeInteger(total, "total");

  if (attended > total) {
    throw new RangeError("attended cannot be greater than total");
  }

  return total - attended;
}

export function calculateFutureAttendanceAfterPresent(attended, total, futurePresentClasses) {
  validateAttendanceInput(attended, total, 75, futurePresentClasses);

  return calculateAttendance(attended + futurePresentClasses, total + futurePresentClasses);
}

export function calculateFutureAttendanceAfterAbsent(attended, total, futureAbsentClasses) {
  validateAttendanceInput(attended, total, 75, futureAbsentClasses);

  return calculateAttendance(attended, total + futureAbsentClasses);
}

export function calculateProjectedAttendance(attended, total, futureAttended, futureTotal) {
  assertNonNegativeInteger(futureAttended, "futureAttended");
  assertNonNegativeInteger(futureTotal, "futureTotal");
  validateAttendanceInput(attended, total);

  if (futureAttended > futureTotal) {
    throw new RangeError("futureAttended cannot be greater than futureTotal");
  }

  return calculateAttendance(attended + futureAttended, total + futureTotal);
}

export function calculateMaximumFinalAttendance(attended, total, remainingClasses) {
  validateAttendanceInput(attended, total, 75, remainingClasses);

  return calculateProjectedAttendance(attended, total, remainingClasses, remainingClasses);
}

export function calculateRequiredFutureAttendance(attended, total, requiredPercentage, remainingClasses) {
  validateAttendanceInput(attended, total, requiredPercentage, remainingClasses);

  if (remainingClasses === 0) {
    return {
      requiredClasses: calculateAttendance(attended, total) >= requiredPercentage - EPSILON ? 0 : Infinity,
      requiredPercentage: null,
      isPossible: calculateAttendance(attended, total) >= requiredPercentage - EPSILON,
    };
  }

  const requiredFraction = requiredPercentage / 100;
  const exactRequiredClasses = requiredFraction * (total + remainingClasses) - attended;
  const requiredClasses = Math.max(0, Math.ceil(exactRequiredClasses - EPSILON));

  return {
    requiredClasses,
    requiredPercentage: (requiredClasses / remainingClasses) * 100,
    isPossible: requiredClasses <= remainingClasses,
  };
}

export function calculateClassesToRecover(attended, total, requiredPercentage) {
  validateAttendanceInput(attended, total, requiredPercentage);

  if (calculateAttendance(attended, total) >= requiredPercentage - EPSILON) {
    return 0;
  }

  if (requiredPercentage === 100) {
    return Infinity;
  }

  if (requiredPercentage === 0) {
    return 0;
  }

  const requiredFraction = requiredPercentage / 100;
  const exactClasses = (requiredFraction * total - attended) / (1 - requiredFraction);

  return Math.max(0, Math.ceil(exactClasses - EPSILON));
}

export function calculateSafeAbsenceLimit(attended, total, requiredPercentage, remainingClasses = Infinity) {
  assertNonNegativeIntegerOrInfinity(remainingClasses, "remainingClasses");
  validateAttendanceInput(attended, total, requiredPercentage, Number.isFinite(remainingClasses) ? remainingClasses : 0);

  if (requiredPercentage === 0) {
    return remainingClasses;
  }

  if (calculateAttendance(attended, total) < requiredPercentage - EPSILON) {
    return 0;
  }

  const requiredFraction = requiredPercentage / 100;
  const exactSafeMisses = attended / requiredFraction - total;
  const safeMisses = Math.max(0, Math.floor(exactSafeMisses + EPSILON));

  return Math.min(safeMisses, remainingClasses);
}

export function isTargetReachable(attended, total, requiredPercentage, remainingClasses) {
  validateAttendanceInput(attended, total, requiredPercentage, remainingClasses);

  return calculateMaximumFinalAttendance(attended, total, remainingClasses) >= requiredPercentage - EPSILON;
}

export function calculateRemainingClassesFromDays(daysRemaining, classesPerDay) {
  assertNonNegativeInteger(daysRemaining, "daysRemaining");
  assertNonNegativeInteger(classesPerDay, "classesPerDay");

  return daysRemaining * classesPerDay;
}

export function getAttendanceStatus(currentPercentage, requiredPercentage) {
  assertPercentage(currentPercentage, "currentPercentage");
  assertPercentage(requiredPercentage, "requiredPercentage");

  if (currentPercentage + EPSILON < requiredPercentage) {
    return "below-target";
  }

  if (currentPercentage <= requiredPercentage + 5 + EPSILON) {
    return "close-to-target";
  }

  return "comfortably-above-target";
}

function assertNonNegativeInteger(value, name) {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative integer`);
  }
}

function assertNonNegativeIntegerOrInfinity(value, name) {
  if (value === Infinity) {
    return;
  }

  assertNonNegativeInteger(value, name);
}

function assertPercentage(value, name) {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0 || value > 100) {
    throw new RangeError(`${name} must be a number from 0 to 100`);
  }
}
