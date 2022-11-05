const { dyn, dynIf, dynList } = DynamicDomObservable;
const { newObservable, transaction } = Observable;
const { h } = DynamicDom;

const state = {
    addText: newObservable(''),
    editText: newObservable(''),
    todos: newObservable([]),
    filter: newObservable('all'),
};

function getActiveTodos() {
    return state.todos.get().filter((todo) => !todo.get().completed);
}

function getCompletedTodos() {
    return state.todos.get().filter((todo) => todo.get().completed);
}

function getFilteredTodos() {
    const filter = state.filter.get();
    if (filter === 'active') {
        return getActiveTodos();
    } else if (filter === 'completed') {
        return getCompletedTodos();
    } else {
        return state.todos.get();
    }
}

function isOnlyCompletedTodos() {
    for (const todo of state.todos.get()) {
        if (!todo.get().completed) return false;
    }
    return true;
}

function main() {
    const root = createRoot();
    document.getElementById('root').appendChild(root.element);
}

function createRoot() {
    return h('section', { class: 'todoapp' },
        createHeader(),
        createMain(),
        createFooter(),
    );
}

function createHeader() {
    function onAddChange() {
        transaction(() => {
            state.todos.set([
                ...state.todos.get(),
                newObservable({
                    text: state.addText.get(),
                    completed: false,
                    editing: false,
                }),
            ]);
            state.addText.set('');
        });
    }

    return h('header', { class: 'header' },
        h('h1', {}, 'todos'),
        h('input', { ...bindValue(state.addText), class: 'new-todo', placeholder: 'What needs to be done?', onChange: onAddChange }),
    );
}

function createMain() {
    function onToggleAllInput() {
        const completed = !isOnlyCompletedTodos();
        transaction(() => {
            for (const todo of state.todos.get()) {
                todo.set({
                    ...todo.get(),
                    completed: completed,
                });
            }
        });
    }

    return h('section', { class: 'main' },
        h('input', {
            class: 'toggle-all',
            id: 'toggle-all',
            type: 'checkbox',
            checked: dyn(isOnlyCompletedTodos),
            onInput: onToggleAllInput,
        }),
        h('label', {
            for: 'toggle-all',
            style: { display: dyn(() => state.todos.get().length === 0 ? 'none' : 'block') },
        }),
        h('ul', { class: 'todo-list' },
            dynList(getFilteredTodos, createTodo),
        ),
    );
}

function createTodo(todo) {
    function onCompleteInput(todo) {
        todo.set({
            ...todo.get(),
            completed: !todo.get().completed,
        });
    }

    function onDelete(todo) {
        state.todos.set(state.todos.get().filter((t) => t !== todo));
    }

    function onTodoDblClick(todo) {
        transaction(() => {
            todo.set({
                ...todo.get(),
                editing: true,
            });
            state.editText.set(todo.get().text);
        });
    }

    function onEditSubmit(todo) {
        todo.set({
            ...todo.get(),
            text: state.editText.get(),
            editing: false,
        });
    }

    function onEditKeyDown(e, todo) {
        if (e.key === 'Enter') {
            onEditSubmit(todo);
        } else if (e.key === 'Escape') {
            todo.set({
                ...todo.get(),
                editing: false,
            });
        }
    }

    return h('li',
        {
            class: dyn(() => {
                const result = [];
                if (todo.get().completed) result.push('completed');
                if (todo.get().editing) result.push('editing');
                return result.join(' ');
            }),
        },
        h('div', { class: 'view' },
            h('input', { class: 'toggle', type: 'checkbox', checked: dyn(() => todo.get().completed), onInput: () => onCompleteInput(todo) }),
            h('label', { onDblClick: () => onTodoDblClick(todo) }, dyn(() => todo.get().text)),
            h('button', { class: 'destroy', onClick: () => onDelete(todo) }),
        ),
        dynIf(() => todo.get().editing,
            () => {
                const result = h('input', {
                    ...bindValue(state.editText),
                    class: 'edit',
                    onKeyDown: (e) => onEditKeyDown(e, todo),
                });
                const element = result.element;
                const disposes = result.disposes.slice();

                setTimeout(() => {
                    element.focus();
                });

                const onDocumentClick = (e) => {
                    if (!element.contains(e.target)) {
                        onEditSubmit(todo);
                    }
                };
                document.addEventListener('click', onDocumentClick);
                disposes.push(() => document.removeEventListener('click', onDocumentClick));

                return {
                    element: element,
                    disposes: disposes,
                };
            },
        ),
    );
}

function createFooter() {
    function onFilterClick(e, filter) {
        e.preventDefault();
        state.filter.set(filter);
    }

    function onClearCompletedClick() {
        state.todos.set(state.todos.get().filter((todo) => !todo.get().completed));
    }

    return h('footer', { class: 'footer' },
        h('span', { class: 'todo-count' },
            dyn(() => {
                const count = state.todos.get().filter((todo) => !todo.get().completed).length;
                return count + ' item' + (count !== 1 ? 's' : '') + ' left';
            }),
        ),
        h('ul', { class: 'filters' },
            h('li', {},
                h('a',
                    {
                        class: dyn(() => state.filter.get() === 'all' ? 'selected' : ''),
                        href: '#/',
                        onClick: (e) => onFilterClick(e, 'all'),
                    },
                    'All',
                ),
            ),
            h('li', {},
                h('a',
                    {
                        class: dyn(() => state.filter.get() === 'active' ? 'selected' : ''),
                        href: '#/active',
                        onClick: (e) => onFilterClick(e, 'active'),
                    },
                    'Active',
                ),
            ),
            h('li', {},
                h('a',
                    {
                        class: dyn(() => state.filter.get() === 'completed' ? 'selected' : ''),
                        href: '#/completed',
                        onClick: (e) => onFilterClick(e, 'completed'),
                    },
                    'Completed',
                ),
            ),
        ),
        h('button', { class: 'clear-completed', style: { display: dyn(() => getCompletedTodos().length > 0 ? 'block' : 'none') }, onClick: onClearCompletedClick }, 'Clear completed'),
    );
}

function bindValue(observable) {
    return {
        value: dyn(observable.get),
        onInput: (e) => observable.set(e.target.value),
    };
}

main();
