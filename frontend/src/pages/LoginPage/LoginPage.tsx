import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import type { User } from "../../types/api";
import { api, ApiError, getUserId, setUserId } from "../../api/client";
import styles from "./LoginPage.module.css";

type Action = "login" | "register";

interface FieldErrors {
  login?: string;
  password?: string;
}

// Te same zasady co w backendzie (backend/app/schemas/users.py) – tu tylko po to,
// żeby pokazać błąd po polsku przy polu, zanim formularz trafi do serwera.
const LOGIN_PATTERN = /^[\p{L}\p{N}_.-]+$/u;

function validate(login: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (login === "") errors.login = "Podaj login.";
  else if (login.length < 3 || login.length > 50) errors.login = "Login musi mieć od 3 do 50 znaków.";
  else if (!LOGIN_PATTERN.test(login))
    errors.login = "Login może zawierać tylko litery, cyfry oraz znaki „_”, „.” i „-”.";

  if (password === "") errors.password = "Podaj hasło.";
  else if (password.length < 4) errors.password = "Hasło musi mieć co najmniej 4 znaki.";
  return errors;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState<Action | null>(null);

  if (getUserId()) return <Navigate to="/podroze" replace />;

  async function submit(action: Action) {
    const trimmedLogin = login.trim();
    const errors = validate(trimmedLogin, password);
    setFieldErrors(errors);
    setFormError(null);
    if (errors.login || errors.password) return;

    setPending(action);
    try {
      const path = action === "login" ? "/auth/login" : "/auth/register";
      const user = await api.post<User>(path, { login: trimmedLogin, password });
      setUserId(user.id);
      navigate("/podroze", { replace: true });
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : "Nie udało się. Spróbuj ponownie.");
      setPending(null);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    submit("login");
  }

  return (
    <div className={styles.page}>
      <aside className={styles.panel}>
        <p className={styles.logo}>Moje podróże</p>
        <p className={styles.tagline}>
          Zaplanuj podróż.
          <br />
          Zapisz wspomnienia.
        </p>
      </aside>

      <main className={styles.main}>
        <form className={styles.form} onSubmit={onSubmit} noValidate data-testid="login-form">
          <h1 className={styles.title}>Zaloguj się</h1>

          {formError && (
            <p className={styles.formError} role="alert" data-testid="login-error">
              {formError}
            </p>
          )}

          <div className={styles.fieldGroup}>
            <label htmlFor="login" className={styles.label}>
              Login
            </label>
            <input
              id="login"
              className={styles.field}
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              autoComplete="username"
              aria-invalid={fieldErrors.login ? true : undefined}
              aria-describedby={fieldErrors.login ? "login-field-error" : undefined}
              data-testid="input-login"
            />
            {fieldErrors.login && (
              <p id="login-field-error" className={styles.fieldError} data-testid="error-login">
                {fieldErrors.login}
              </p>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="password" className={styles.label}>
              Hasło
            </label>
            <input
              id="password"
              type="password"
              className={styles.field}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              aria-invalid={fieldErrors.password ? true : undefined}
              aria-describedby={fieldErrors.password ? "password-field-error" : undefined}
              data-testid="input-password"
            />
            {fieldErrors.password && (
              <p id="password-field-error" className={styles.fieldError} data-testid="error-password">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => submit("register")}
              disabled={pending !== null}
              data-testid="btn-register"
            >
              {pending === "register" ? "Rejestrowanie…" : "Zarejestruj się"}
            </button>
            <button
              type="submit"
              className={styles.primary}
              disabled={pending !== null}
              data-testid="btn-login"
            >
              {pending === "login" ? "Logowanie…" : "Zaloguj się"}
            </button>
          </div>

          <p className={styles.note}>Aplikacja lokalna – dane zostają na tym komputerze.</p>
        </form>
      </main>
    </div>
  );
}
