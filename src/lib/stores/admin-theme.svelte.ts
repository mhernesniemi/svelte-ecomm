export type Theme = "system" | "light" | "dark";

const STORAGE_KEY = "admin-theme";

let theme = $state<Theme>("system");

function getSystemPreference(): "light" | "dark" {
	if (typeof window === "undefined") return "light";
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme() {
	if (typeof document === "undefined") return;
	const resolved = theme === "system" ? getSystemPreference() : theme;
	document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function initTheme() {
	const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
	if (stored === "light" || stored === "dark" || stored === "system") {
		theme = stored;
	}
	applyTheme();

	const mql = window.matchMedia("(prefers-color-scheme: dark)");
	const handler = () => {
		if (theme === "system") applyTheme();
	};
	mql.addEventListener("change", handler);

	return () => mql.removeEventListener("change", handler);
}

export function setTheme(value: Theme) {
	theme = value;
	localStorage.setItem(STORAGE_KEY, value);
	applyTheme();
}

export function getTheme(): Theme {
	return theme;
}
