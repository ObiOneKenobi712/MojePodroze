import { useState } from "react";
import type { KeyboardEvent } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router";
import { clearUserId } from "../../api/client";
import ThemeSwitcher from "../ThemeSwitcher/ThemeSwitcher";
import styles from "./Layout.module.css";

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? `${styles.navLink} ${styles.active}` : styles.navLink;
}

export default function Layout() {
  const navigate = useNavigate();
  // Telefon: menu schowane pod przyciskiem ☰ (na szerszym ekranie zawsze widoczne – CSS)
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  function logout() {
    closeMenu();
    clearUserId();
    navigate("/logowanie", { replace: true });
  }

  // Esc zamyka rozwinięte menu i wraca fokusem na przycisk ☰
  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && menuOpen) {
      closeMenu();
      document.getElementById("menu-toggle")?.focus();
    }
  }

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link to="/podroze" className={styles.logo} onClick={closeMenu}>
            Moje podróże
          </Link>
          <button
            id="menu-toggle"
            type="button"
            className={styles.menuToggle}
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="main-menu"
            data-testid="btn-menu"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
            <span className="visually-hidden">{menuOpen ? "Zamknij menu" : "Menu"}</span>
          </button>
          <div
            id="main-menu"
            className={menuOpen ? `${styles.menu} ${styles.menuOpen}` : styles.menu}
            onKeyDown={onMenuKeyDown}
          >
            <nav aria-label="Główna nawigacja" className={styles.nav}>
              <NavLink to="/podroze" className={navClass} onClick={closeMenu} data-testid="nav-trips">
                Moje podróże
              </NavLink>
              <NavLink to="/statystyki" className={navClass} onClick={closeMenu} data-testid="nav-stats">
                Statystyki
              </NavLink>
            </nav>
            <div className={styles.theme}>
              <ThemeSwitcher />
            </div>
            <button type="button" className={styles.logout} onClick={logout} data-testid="btn-logout">
              Wyloguj
            </button>
          </div>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </>
  );
}
