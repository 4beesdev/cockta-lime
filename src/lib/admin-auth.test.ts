import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ADMIN_PASSWORD_KEY, useAdminPassword } from "./admin-auth";

describe("useAdminPassword", () => {
	beforeEach(() => {
		window.localStorage.clear();
	});

	it("returns null when localStorage is empty", () => {
		const { result } = renderHook(() => useAdminPassword());
		expect(result.current.password).toBeNull();
	});

	it("returns the stored password when localStorage has one", () => {
		window.localStorage.setItem(ADMIN_PASSWORD_KEY, "cockta2025");
		const { result } = renderHook(() => useAdminPassword());
		expect(result.current.password).toBe("cockta2025");
	});

	it("setPassword writes to localStorage and updates state", () => {
		const { result } = renderHook(() => useAdminPassword());
		act(() => {
			result.current.setPassword("newpass");
		});
		expect(result.current.password).toBe("newpass");
		expect(window.localStorage.getItem(ADMIN_PASSWORD_KEY)).toBe("newpass");
	});

	it("clearPassword removes from localStorage and clears state", () => {
		window.localStorage.setItem(ADMIN_PASSWORD_KEY, "cockta2025");
		const { result } = renderHook(() => useAdminPassword());
		act(() => {
			result.current.clearPassword();
		});
		expect(result.current.password).toBeNull();
		expect(window.localStorage.getItem(ADMIN_PASSWORD_KEY)).toBeNull();
	});
});
