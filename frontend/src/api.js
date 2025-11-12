export const API_URL = "http://localhost:3000";

export async function getUsers() {
    const res = await fetch(`/api/users`);
    return res.json();
  }
  