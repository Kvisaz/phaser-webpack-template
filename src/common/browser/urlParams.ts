export function setSearchParam(param: string, value: string) {
    const url = new URL(window.location.href);
    url.searchParams.set(param, value);
    window.history.replaceState({}, "", url.toString());
}

export function resetSearchParam(param: string) {
    const url = new URL(window.location.href);
    url.searchParams.delete(param);
    window.history.replaceState({}, "", url.toString());
}

export function getSearchParam(param: string): string | undefined {
    const paramValue = new URLSearchParams(window.location.search).get(param);

    return paramValue != null ? decodeURI(paramValue) : undefined;
}
