import { execSync } from "child_process";

export function getGitRemoteUrl() {
  try {
    const url = execSync("git remote get-url origin", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    return url || "<NOTE-NO-GIT>";
  } catch {
    return "<NOTE-NO-GIT>";
  }
}
