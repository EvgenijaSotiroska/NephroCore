import axios from "axios";

// FastAPI sends a string for errors we raise ourselves (HTTPException),
// and a list of problems for validation errors (HTTP 422).
interface ValidationIssue {
  loc?: (string | number)[];
  msg?: string;
}

interface ApiErrorBody {
  detail?: string | ValidationIssue[];
}

/** "body.lab_result.egfr" + "Input should be ..." -> "egfr: Input should be ..." */
function formatValidationIssue(issue: ValidationIssue): string {
  const field = issue.loc?.filter((part) => typeof part === "string" && part !== "body").pop();
  const message = (issue.msg ?? "").replace(/^Value error, /, "");
  return field ? `${field}: ${message}` : message;
}

/** Pulls the readable message out of a FastAPI error response, with a fallback. */
export function getApiErrorMessage(err: unknown, fallback = "Се случи грешка"): string {
  if (axios.isAxiosError<ApiErrorBody>(err)) {
    const detail = err.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      const messages = detail.map(formatValidationIssue).filter(Boolean);
      if (messages.length > 0) {
        return messages.join("; ");
      }
    }
  }
  return fallback;
}
