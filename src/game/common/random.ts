export function random(min: number, max: number) {
    if (max < min) {
        throw new Error('Parameter max should not be less than min.');
    }
    return Math.random() * (max - min) + min;
}

export function randomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    if (max < min) {
        throw new Error('Parameter max should not be less than min.');
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomIntExclude(min: number, max: number, exclude: number[]) {
    min = Math.ceil(min);
    max = Math.floor(max);
    if (max < min) {
        throw new Error('Parameter max should not be less than min.');
    }
    const candidate: number[] = [];
    for (let i = min; i <= max; ++i) {
        if (!exclude.includes(i)) {
            candidate.push(i);
        }
    }
    if (candidate.length === 0) {
        throw new Error('No candidate number.');
    }
    return candidate[randomInt(0, candidate.length - 1)];
}

export function randomlySelectOne<T>(arr: T[]): T | undefined {
    if (arr.length) {
        return arr[randomInt(0, arr.length - 1)];
    }
    return undefined;
}
