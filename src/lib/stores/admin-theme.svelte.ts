export type Theme = "system" | "light" | "dark";

const STORAGE_KEY = "admin-theme";

let theme = $state<Theme>("system");
let systemDark = $state(false);

export function initTheme() {
	const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
	if (stored === "light" || stored === "dark" || stored === "system") {
		theme = stored;
	}

	systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

	const mql = window.matchMedia("(prefers-color-scheme: dark)");
	const handler = (e: MediaQueryListEvent) => {
		systemDark = e.matches;
	};
	mql.addEventListener("change", handler);

	return () => mql.removeEventListener("change", handler);
}

export function setTheme(value: Theme) {
	theme = value;
	localStorage.setItem(STORAGE_KEY, value);
}

export function getTheme(): Theme {
	return theme;
}

export function isDark(): boolean {
	if (theme === "system") return systemDark;
	return theme === "dark";
}
