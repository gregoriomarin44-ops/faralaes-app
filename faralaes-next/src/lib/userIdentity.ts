export const USERNAME_PATTERN = /^[a-z0-9_]+$/;

export const normalizeUsername = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

export const validateUsername = (value: unknown) => {
  const username = normalizeUsername(value);

  if (username.length < 3) {
    return {
      error: "El nombre de usuario debe tener al menos 3 caracteres.",
      username,
    };
  }

  if (!USERNAME_PATTERN.test(username)) {
    return {
      error:
        "El nombre de usuario solo puede contener letras, numeros y guiones bajos.",
      username,
    };
  }

  return { error: "", username };
};

export const normalizeDisplayName = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export const getInitial = (displayName: string, username: string) =>
  (displayName.trim() || username.trim() || "F").charAt(0).toUpperCase();
