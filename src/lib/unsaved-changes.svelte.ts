import { beforeNavigate } from "$app/navigation";

export function useUnsavedChanges(isDirty: () => boolean, isSaving?: () => boolean) {
	$effect(() => {
		const handler = (e: BeforeUnloadEvent) => {
			if (isDirty() && !isSaving?.()) e.preventDefault();
		};
		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	});

	beforeNavigate(({ cancel }) => {
		if (isDirty() && !isSaving?.() && !confirm("You have unsaved changes. Leave anyway?")) {
			cancel();
		}
	});
}
