import { BACKEND_URL } from "./contract";

const STORAGE_KEY = "shipstake_github_session";

export type GithubSession = {
  username: string;
  token: string;
};

export type GithubRepo = {
  fullName: string;
  name: string;
  fork: boolean;
};

export type GithubPR = {
  title: string;
  url: string;
  number: number;
  repo: string;
  state: string;
  merged: boolean;
};

export function saveGithubSession(session: GithubSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function getGithubSession(): GithubSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GithubSession;
  } catch {
    return null;
  }
}

export function clearGithubSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export async function fetchUserRepos(username: string): Promise<GithubRepo[]> {
  const res = await fetch(`${BACKEND_URL}/auth/github/repos?username=${encodeURIComponent(username)}`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchUserPRs(username: string, repo?: string): Promise<GithubPR[]> {
  const url = repo
    ? `${BACKEND_URL}/auth/github/prs?username=${encodeURIComponent(username)}&repo=${encodeURIComponent(repo)}`
    : `${BACKEND_URL}/auth/github/prs?username=${encodeURIComponent(username)}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  return res.json();
}
