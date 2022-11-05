(() => {
    function assert(b) {
        if (!b) {
            throw 'assertion failed';
        }
    }

    function shuffle(array) {
        let currentIndex = array.length,  randomIndex;

        // While there remain elements to shuffle.
        while (currentIndex != 0) {
            // Pick a remaining element.
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            // And swap it with the current element.
            [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
        }

        return array;
    }

    function randomInt(lower, upper) {
        return lower + Math.floor(Math.random() * (upper - lower + 1));
    }

    function shuffle(xs) {
        for (let i = xs.length - 1; i >= 1; --i) {
            const j = randomInt(0, i);
            swap(xs, i, j);
        }
    }

    function swap(xs, i, j) {
        const temp = xs[i];
        xs[i] = xs[j];
        xs[j] = temp;
    }

    function test1(iterations) {
        const items = [];
        const indexes = [];
        for (let i = 0; i < 100; ++i) {
            items.push({ n: i + 1 });
            indexes.push(i);
        }

        const observableItems = mobx.observable([]);

        const parentResult = DynamicDom.h('div', {},
            DynamicDomMobx.dynList(() => observableItems, (item) => DynamicDom.h('div', {}, item.n)),
        );
        const parent = parentResult.element;

        for (let i = 0; i < iterations; ++i) {
            shuffle(indexes);
            const randomIndexes = indexes.slice(randomInt(1, indexes.length));
            const randomItems = randomIndexes.map((i) => items[i]);

            mobx.runInAction(() => {
                while (observableItems.length > 0) {
                    observableItems.pop();
                }
                for (const item of randomItems) {
                    observableItems.push(item);
                }
            });

            let i = 0;
            for (const child of parent.children) {
                assert(child.textContent === observableItems[i].n.toString());
                i += 1;
            }
        }
    }

    test1(100);

    console.log('DynamicDom tests passed');
})();
