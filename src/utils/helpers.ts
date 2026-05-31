export const capitalize = (value: string) => {
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export const formatStatus = (value: string) => {
  switch (value) {
    case "new":
      return "New";
    case "in_progress":
      return "In Progress";
    case "waiting_on_customer":
      return "Waiting";
    case "resolved":
      return "Resolved";
    default:
      return value;
  }
};

export const formatDate = (date: string | null) => {
  if (!date) return "--";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
};
