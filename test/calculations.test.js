import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateAbsent,
  calculateAttendance,
  calculateClassesToRecover,
  calculateFutureAttendanceAfterAbsent,
  calculateFutureAttendanceAfterPresent,
  calculateMaximumFinalAttendance,
  calculateProjectedAttendance,
  calculateRemainingClassesFromDays,
  calculateRequiredFutureAttendance,
  calculateSafeAbsenceLimit,
  getAttendanceStatus,
  isTargetReachable,
  validateAttendanceInput,
} from "../js/calculations.js";

const almostEqual = (actual, expected) => {
  assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} should equal ${expected}`);
};

test("calculates current attendance from exact counts", () => {
  almostEqual(calculateAttendance(61, 80), 76.25);
  almostEqual(calculateAttendance(0, 0), 0);
  almostEqual(calculateAttendance(0, 10), 0);
  almostEqual(calculateAttendance(10, 10), 100);
});

test("calculates absent classes", () => {
  assert.equal(calculateAbsent(61, 80), 19);
  assert.equal(calculateAbsent(0, 0), 0);
});

test("calculates future present and absent scenarios", () => {
  almostEqual(calculateFutureAttendanceAfterPresent(61, 80, 10), (71 / 90) * 100);
  almostEqual(calculateFutureAttendanceAfterAbsent(61, 80, 3), (61 / 83) * 100);
});

test("calculates projected attendance from future attended and future total", () => {
  almostEqual(calculateProjectedAttendance(61, 80, 8, 10), (69 / 90) * 100);
  assert.throws(() => calculateProjectedAttendance(61, 80, 11, 10), /futureAttended/);
});

test("finds the minimum consecutive classes required to recover", () => {
  assert.equal(calculateClassesToRecover(72, 100, 75), 12);
  assert.equal(calculateClassesToRecover(75, 100, 75), 0);
  assert.equal(calculateClassesToRecover(90, 100, 100), Infinity);
  assert.equal(calculateClassesToRecover(100, 100, 100), 0);
  assert.equal(calculateClassesToRecover(0, 0, 75), 0);
});

test("finds the maximum number of safe absences", () => {
  assert.equal(calculateSafeAbsenceLimit(80, 100, 75, 20), 6);
  assert.equal(calculateSafeAbsenceLimit(75, 100, 75, 20), 0);
  assert.equal(calculateSafeAbsenceLimit(74, 100, 75, 20), 0);
  assert.equal(calculateSafeAbsenceLimit(0, 10, 0, 20), 20);
  assert.equal(calculateSafeAbsenceLimit(100, 100, 100, 20), 0);
});

test("calculates minimum future attendance needed by term end", () => {
  assert.deepEqual(calculateRequiredFutureAttendance(61, 80, 75, 20), {
    requiredClasses: 14,
    requiredPercentage: 70,
    isPossible: true,
  });

  assert.deepEqual(calculateRequiredFutureAttendance(10, 100, 75, 10), {
    requiredClasses: 73,
    requiredPercentage: 730,
    isPossible: false,
  });

  assert.deepEqual(calculateRequiredFutureAttendance(75, 100, 75, 0), {
    requiredClasses: 0,
    requiredPercentage: null,
    isPossible: true,
  });

  assert.deepEqual(calculateRequiredFutureAttendance(74, 100, 75, 0), {
    requiredClasses: Infinity,
    requiredPercentage: null,
    isPossible: false,
  });
});

test("checks target reachability from remaining classes", () => {
  assert.equal(isTargetReachable(61, 80, 75, 20), true);
  assert.equal(isTargetReachable(10, 100, 75, 10), false);
  assert.equal(calculateMaximumFinalAttendance(10, 100, 10), (20 / 110) * 100);
});

test("converts days remaining to remaining classes", () => {
  assert.equal(calculateRemainingClassesFromDays(35, 5), 175);
  assert.equal(calculateRemainingClassesFromDays(0, 5), 0);
});

test("classifies attendance status", () => {
  assert.equal(getAttendanceStatus(82, 75), "comfortably-above-target");
  assert.equal(getAttendanceStatus(76, 75), "close-to-target");
  assert.equal(getAttendanceStatus(74.99, 75), "below-target");
});

test("validates impossible values", () => {
  assert.throws(() => validateAttendanceInput(11, 10, 75, 0), /attended/);
  assert.throws(() => validateAttendanceInput(-1, 10, 75, 0), /non-negative/);
  assert.throws(() => validateAttendanceInput(1, 10, 101, 0), /0 to 100/);
  assert.throws(() => validateAttendanceInput(1.5, 10, 75, 0), /integer/);
});
