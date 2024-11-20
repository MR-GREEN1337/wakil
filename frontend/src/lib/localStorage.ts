export function setPlayerNameInLocalStorage(game_id: string, playerName: string) {
    localStorage.setItem(`game_${game_id}`, playerName);
}

export function getUserNameFromLocalStorage(game_id: string) {
    // to fix "ReferenceError: localStorage is not defined"
    if (typeof window !== "undefined") {
        return localStorage.getItem(`game_${game_id}`);
    }
}