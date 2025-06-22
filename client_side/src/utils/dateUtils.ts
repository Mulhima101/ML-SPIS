// Convert any date to GMT+5:30 (Indian Standard Time)
export const toIST = (date: Date | string): Date => {
  const inputDate = typeof date === "string" ? new Date(date) : date;

  // Get UTC time and add 5 hours 30 minutes (330 minutes)
  const utc = inputDate.getTime() + inputDate.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 330 * 60000); // 330 minutes = 5.5 hours

  return ist;
};

// Format time to HH:MM in IST
export const formatTimeIST = (date: Date | string): string => {
  const istDate = toIST(date);
  return istDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });
};

// Format full date and time in IST
export const formatDateTimeIST = (date: Date | string): string => {
  const istDate = toIST(date);
  return istDate.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
};

// Get current time in IST
export const getCurrentTimeIST = (): Date => {
  return toIST(new Date());
};

// Check if current time is within a time window (in IST)
export const isWithinTimeWindow = (
  startTime: Date | string,
  endTime: Date | string
): boolean => {
  const currentIST = getCurrentTimeIST();
  const startIST = toIST(startTime);
  const endIST = toIST(endTime);

  return currentIST >= startIST && currentIST <= endIST;
};

// Format date and time together for display
export const formatDateTimeDisplay = (date: Date | string): string => {
  if (!date) return "Not scheduled";

  const istDate = toIST(date);
  const dateStr = istDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = istDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${dateStr} ${timeStr}`;
};

// Check if current time is within a date-time window
export const isWithinDateTimeWindow = (
  startDateTime: Date | string,
  endDateTime: Date | string
): boolean => {
  const now = getCurrentTimeIST();
  const start = toIST(startDateTime);
  const end = toIST(endDateTime);

  return now >= start && now <= end;
};
