(() => {
    function assert(b) {
        if (!b) {
            throw 'assertion failed';
        }
    }

    function test1() {
        const one = Observable.newObservable(1);
        const two = Observable.newObservable(2);
        const three = Observable.newObservable(0);
        let result;
        let runs = 0;

        const dispose = Observable.autorun(() => {
            result = one.get() + two.get() + Observable.untracked(() => three.get());
            runs += 1;
        });

        one.set(3);
        assert(result === 5);
        assert(runs === 2);

        two.set(4);
        assert(result === 7);
        assert(runs === 3);

        Observable.transaction(() => {
            one.set(4);
            two.set(5);
        });
        assert(result === 9);
        assert(runs === 4);

        three.set(1);
        assert(runs === 4);

        dispose();

        one.set(6);
        assert(runs === 4);
    }

    function test2() {
        const one = Observable.newObservable(1);
        const two = Observable.newObservable(2);
        let runs = 0;

        const observables = Observable.track(() => {
            const result = one.get() + two.get();
            runs += 1;
        });

        assert(observables.length === 2);
        assert(observables[0] === one);
        assert(observables[1] === two);
    }

    function test3() {
        const one = Observable.newObservable(1);
        const two = Observable.newObservable(2);
        const four = Observable.newObservable(4);
        let memoRuns = 0;

        const three = ObservableUtil.memo(() => {
            memoRuns += 1;
            return one.get() + two.get();
        });
        assert(memoRuns === 0);

        let result;
        const dispose = Observable.autorun(() => {
            result = three.get() + four.get();
        });
        assert(result === 7);
        assert(memoRuns === 1);

        four.set(5);
        assert(result === 8);
        assert(memoRuns === 1);

        two.set(3);
        assert(result === 9);
        assert(memoRuns === 2);

        dispose();
    }

    function test4() {
        const one = Observable.newObservable(1);
        const two = Observable.newObservable(2);
        const three = Observable.newObservable(3);

        let result;
        const dispose = ObservableUtil.reaction(
            () => one.get() + two.get(),
            (value) => result = value + three.get(),
        );
        assert(result === 6);

        one.set(4);
        assert(result === 9);

        three.set(5);
        assert(result === 9);

        dispose();

        one.set(6);
        assert(result === 9);
    }

    function test5() {
        const one = ObservableUtil.newReducerObservable(1, (value, action) => {
            if (action === 'increment') return value + 1;
            if (action === 'decrement') return value - 1;
        });

        let result;
        const dispose = Observable.autorun(() => {
            result = one.get();
        });
        assert(result === 1);

        one.dispatch('increment');
        assert(result === 2);

        one.dispatch('increment');
        assert(result === 3);

        one.dispatch('decrement');
        assert(result === 2);

        dispose();

        one.dispatch('decrement');
        assert(result === 2);
    }

    test1();
    test2();
    test3();
    test4();
    test5();

    console.log('Observable tests passed');
})();
