import throttle from 'lodash/throttle';

const parallelLimit = require('async/parallelLimit');

export class ComposedTask<T> {
    items: T[];
    progress: Map<T, number>;
    progressReporter: (progress: number) => void;
    limit: number;

    constructor(items: T[], callback: (progress: number) => void, limit: number) {
        this.items = items;
        this.progressReporter = callback;
        this.progress = new Map<T, number>();
        this.limit = limit;
    }

    reportProgress(): void {
        const sum = [...this.progress.values()].reduce((a, b) => a + b, 0);
        const average = sum / this.items.length;
        this.progressReporter(average);
    }

    async run<R>(fun: (a: T, cb: (value: number) => void) => Promise<R>): Promise<R[]> {
        const throttledReport = throttle(() => this.reportProgress(), 300);

        const reportState = (a: T) => (value: number) => {
            this.progress.set(a, value);
            throttledReport();
        };

        const functions = this.items.map(i => {
            return async () => {
                const reporter = reportState(i);
                const res = await fun(i, reporter);
                reporter(1);
                return res;
            }
        });

        return parallelLimit(functions, this.limit);
    }
}
