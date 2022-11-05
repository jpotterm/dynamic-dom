let Observable;

(() => {
    const notifier = newNotifier();
    let globalContext = null;

    function runAll(fns) {
        for (const fn of fns) {
            fn();
        }
    }

    function newNotifier() {
        let paused = false;
        let deferred = new Set();
        return {
            notify: (subscriber) => {
                if (paused) {
                    deferred.add(subscriber);
                } else {
                    subscriber();
                }
            },
            pause: () => {
                paused = true;
            },
            resume: () => {
                for (const d of deferred) {
                    d();
                }
                deferred = new Set();
                paused = false;
            },
        };
    }

    function newObservable(initialValue) {
        const subscribers = new Set();
        let value = initialValue;

        const self = {
            get: () => {
                if (globalContext !== null) {
                    globalContext(self);
                }
                return value;
            },
            set: (newValue) => {
                if (newValue === value) return;
                value = newValue;
                for (const subscriber of Array.from(subscribers)) {
                    notifier.notify(subscriber);
                }
            },
            subscribe: (subscriber) => {
                subscribers.add(subscriber);
                return () => {
                    subscribers.delete(subscriber);
                };
            },
            toJSON: () => value,
        };

        return self;
    }

    function transaction(fn) {
        notifier.pause();
        try {
            fn();
        } finally {
            notifier.resume();
        }
    }

    function runWithContext(fn, context) {
        const prevContext = globalContext;
        globalContext = context;
        let result;
        try {
            result = fn();
        } finally {
            globalContext = prevContext;
        }
        return result;
    }

    function track(fn) {
        const observables = [];
        runWithContext(fn, (observable) => {
            observables.push(observable);
        });
        return observables;
    }

    function autorun(fn) {
        let disposes = [];

        const dispose = () => {
            runAll(disposes);
            disposes = [];
        };

        const wrappedFn = () => {
            dispose();

            runWithContext(fn, (observable) => {
                disposes.push(observable.subscribe(wrappedFn));
            });
        };

        wrappedFn();

        return dispose;
    }

    function untracked(fn) {
        return runWithContext(fn, null);
    }

    Observable = { newObservable, transaction, track, autorun, untracked };
})();
