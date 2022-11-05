const { dyn, dynIf, dynList } = DynamicDomObservable;
const { newObservable, transaction } = Observable;
const { h } = DynamicDom;

const state = {
    count: newObservable(1),
    items: newObservable([
        newObservable({ n: 293 }),
    ]),
    name: newObservable(''),
};

function main() {
    const root = createRoot();
    document.getElementById('root').appendChild(root.element);
}

function createRoot() {
    function onIncrementClick() {
        console.log('onIncrementClick');
        transaction(() => {
            state.count.set(state.count.get() + 1);
            state.items.set([
                ...state.items.get(),
                newObservable({ n: Math.round(Math.random() * 100) }),
            ]);
        });
    }

    function onDecrementClick() {
        console.log('onDecrementClick');
        transaction(() => {
            state.count.set(state.count.get() - 1);
            state.items.set(state.items.get().slice(0, -1));
        });
    }

    function onInput(e) {
        console.log('onInput');
        state.name.set(e.target.value);
    }

    return h('div', { class: 'root' },
        createButtons(onIncrementClick, onDecrementClick),
        h('div', { class: dyn(() => 'test-count-' + state.count.get()) }),
        'Count: ',
        dyn(() => state.count.get()),
        dynIf(() => state.count.get() === 3,
            () => h('div', {}, 'Count is 3'),
        ),
        h('ul', {},
            dynList(state.items.get, createItem),
        ),

        h('svg:svg',
            {
                width: '24',
                height: '24',
                viewBox: '0 0 24 24',
                xmlns: 'http://www.w3.org/2000/svg',
            },
            h('svg:path', {
                d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM7.07 18.28c.43-.9 3.05-1.78 4.93-1.78s4.51.88 4.93 1.78C15.57 19.36 13.86 20 12 20s-3.57-.64-4.93-1.72zm11.29-1.45c-1.43-1.74-4.9-2.33-6.36-2.33s-4.93.59-6.36 2.33C4.62 15.49 4 13.82 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8c0 1.82-.62 3.49-1.64 4.83zM12 6c-1.94 0-3.5 1.56-3.5 3.5S10.06 13 12 13s3.5-1.56 3.5-3.5S13.94 6 12 6zm0 5c-.83 0-1.5-.67-1.5-1.5S11.17 8 12 8s1.5.67 1.5 1.5S12.83 11 12 11z',
            }),
        ),

        h('div', {},
            h('input', { type: 'text', onInput: onInput }),
        ),
        h('div', {},
            'Name: ',
            dyn(state.name.get),
        ),
        h('div',
            {
                style: {
                    color: 'red',
                    paddingLeft: dyn(() => state.name.get().length + 'px'),
                },
            },
            'Style',
        ),
        createForm(),
    );
}

function createButtons(onIncrementClick, onDecrementClick) {
    return [
        h('div', { onClick: onIncrementClick }, 'Increment'),
        h('div', { onClick: onDecrementClick }, 'Decrement'),
    ];
}

function createItem(item) {
    function onClick() {
        console.log('onItemClick');
        item.set({
            n: item.get().n + 1,
        });
    }

    return h('li', { onClick: onClick },
        dyn(() => item.get().n),
    );
}

function createForm() {
    const state = {
        firstName: newObservable(''),
        lastName: newObservable(''),
        address: newObservable(''),
    };

    function onSubmit(e) {
        e.preventDefault();
        console.log('onSubmit', state.firstName.get(), state.lastName.get(), state.address.get());
        console.log(JSON.stringify(state));
        transaction(() => {
            state.firstName.set('');
            state.lastName.set('');
            state.address.set('');
        });
    }

    return h('form', { onSubmit: onSubmit },
        h('div', {}, 'First Name:'),
        h('input', { ...bindValue(state.firstName) }),

        h('div', {}, 'Last Name:'),
        h('input', { ...bindValue(state.lastName) }),

        h('div', {}, 'Address:'),
        h('input', { ...bindValue(state.address) }),

        h('div', {},
            h('input', { type: 'submit', value: 'Submit' }),
        ),
    );
}

function bindValue(observable) {
    return {
        value: dyn(observable.get),
        onInput: (e) => observable.set(e.target.value),
    };
}

main();
