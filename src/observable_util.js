let ObservableUtil;

(() => {
    function reaction(dataFn, effectFn) {
        return Observable.autorun(() => {
            const data = dataFn();
            Observable.untracked(() => effectFn(data));
        });
    }

    function action(fn) {
        Observable.untracked(() => Observable.transaction(fn));
    }

    function newReducerObservable(initialValue, reducer) {
        const observable = Observable.newObservable(initialValue);
        return {
            get: observable.get,
            dispatch: (action) => {
                observable.set(reducer(observable.get(), action));
            },
        };
    }

    function memo(fn) {
        let initialized = false;
        let value;
        let deps;

        // Sets value, sets deps, and subscribes parent autorun to deps
        function recompute() {
            // This won't be tracked by parent autorun
            const observables = Observable.track(() => {
                value = fn();
            });

            // This will be tracked by parent autorun
            deps = [];
            for (const observable of observables) {
                deps.push({
                    observable: observable,
                    value: observable.get(),
                });
            }
        }

        return {
            get: () => {
                if (initialized) {
                    const changed = Observable.untracked(() => {
                        for (const dep of deps) {
                            if (dep.value !== dep.observable.get()) return true;
                        }
                        return false;
                    });

                    if (changed) {
                        recompute();
                    } else {
                        // Subscribe parent autorun to deps
                        for (const dep of deps) {
                            dep.observable.get();
                        }
                    }
                } else {
                    recompute();
                    initialized = true;
                }

                return value;
            },
        };
    }

    function arrayEqual(xs, ys) {
        if (xs.length !== ys.length) return false;
        for (let i = 0; i < xs.length; ++i) {
            if (xs[i] !== ys[i]) return false;
        }
        return true;
    }

    function memoPure(fn) {
        let initialized = false;
        let prevArgs;
        let prevValue;
        return (...args) => {
            if (!initialized || !arrayEqual(prevArgs, args)) {
                prevValue = fn(...args);
                prevArgs = args;
            }
            return prevValue;
        };
    }

    function memoExplicit(observables, fn) {
        const fnMemo = memoPure(fn);
        return () => {
            const args = observables.map((observable) => observable.get());
            return fnMemo(args);
        };
    }

    ObservableUtil = { reaction, action, newReducerObservable, memo, memoExplicit };
})();
