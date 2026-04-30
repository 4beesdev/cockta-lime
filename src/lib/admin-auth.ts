import { useCallback, useEffect, useState } from "react";

export const ADMIN_PASSWORD_KEY = "cockta-admin-password";

export function useAdminPassword() {
	const [password, setPasswordState] = useState<string | null>(() => {
		if (typeof window === "undefined") return null;
		return window.localStorage.getItem(ADMIN_PASSWORD_KEY);
	});

	useEffect(() => {
		if (typeof window === "undefined") return;
		const stored = window.localStorage.getItem(ADMIN_PASSWORD_KEY);
		if (stored !== password) setPasswordState(stored);
	}, [password]);

	const setPassword = useCallback((value: string) => {
		window.localStorage.setItem(ADMIN_PASSWORD_KEY, value);
		setPasswordState(value);
	}, []);

	const clearPassword = useCallback(() => {
		window.localStorage.removeItem(ADMIN_PASSWORD_KEY);
		setPasswordState(null);
	}, []);

	return { password, setPassword, clearPassword };
}
