export interface TransitionValueSettings {
    duration: number;
    from: number;
    to: number;
    easingFunction?: (progress: number) => number;
}

export default class TransitionValue {

    duration: number;
    from: number;
    to: number;
    easingFunction: (progress: number) => number;
    elapsed: number = 0;
    finished: boolean = false;

    constructor(settings: TransitionValueSettings) {
        // if (settings.duration <= 0) {
        //     throw new Error('Duration should be larger than 0.');
        // }
        this.duration = settings.duration;
        this.from = settings.from;
        this.to = settings.to;
        this.easingFunction = settings.easingFunction || (n => n);
    }

    step(dt: number) {
        if (this.duration <= 0) {
            this.finished = true;
            return this.from;
        }
        this.elapsed += dt;
        const progress = Math.min(this.elapsed / this.duration, 1);
        this.finished = progress === 1;
        return this.easingFunction(progress) * (this.to - this.from) + this.from;
    }

}
