// Using native global fetch (Node.js 18+ and Vercel Serverless)

const VERCEL_API_URL = "https://api.vercel.com";

function getHeaders() {
  const token = process.env.VERCEL_TOKEN;
  if (!token) throw new Error("Missing VERCEL_TOKEN environment variable");
  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };
}

function getQuery() {
  const teamId = process.env.VERCEL_TEAM_ID;
  return teamId ? `?teamId=${teamId}` : "";
}

export async function listVercelEnvs() {
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!projectId) throw new Error("Missing VERCEL_PROJECT_ID");
  const res = await fetch(`${VERCEL_API_URL}/v9/projects/${projectId}/env${getQuery()}`, {
    headers: getHeaders()
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to list Vercel Envs: ${errorText}`);
  }
  const data = await res.json();
  return data.envs || [];
}

export async function addVercelEnv(key: string, value: string, target = ["production", "preview", "development"]) {
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!projectId) throw new Error("Missing VERCEL_PROJECT_ID");
  
  const res = await fetch(`${VERCEL_API_URL}/v10/projects/${projectId}/env${getQuery()}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      key,
      value,
      target,
      type: "encrypted"
    })
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to add Vercel Env: ${errorText}`);
  }
  return await res.json();
}

export async function removeVercelEnv(envId: string) {
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!projectId) throw new Error("Missing VERCEL_PROJECT_ID");
  
  const res = await fetch(`${VERCEL_API_URL}/v9/projects/${projectId}/env/${envId}${getQuery()}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to remove Vercel Env: ${errorText}`);
  }
  return await res.json();
}

export async function triggerVercelDeployment() {
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!projectId) throw new Error("Missing VERCEL_PROJECT_ID");
  
  const res = await fetch(`${VERCEL_API_URL}/v13/deployments${getQuery()}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      name: projectId, // Deployment name typically project name
      target: "production"
    })
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to trigger deployment: ${errorText}`);
  }
  return await res.json();
}
