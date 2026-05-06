export function getAdminEnv() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@evofilmes.com";
  const sessionSecret = process.env.ADMIN_SESSION_SECRET ?? "";
  const passwordHash = process.env.ADMIN_PASSWORD_HASH ?? "";

  return {
    adminEmail,
    sessionSecret,
    passwordHash,
  };
}

export function getDataDir(): string {
  return process.env.EVO_DATA_DIR?.trim() || "data";
}

