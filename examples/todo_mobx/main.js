const { dyn, dynIf, dynList } = DynamicDomMobx;
const { h } = DynamicDom;

const state = mobx.observable({
    addText: '',
    editText: '',
    todos: [],
    filter: 'all',
});

function getActiveTodos() {
    return state.todos.filter((todo) => !todo.completed);
}

function getCompletedTodos() {
    return state.todos.filter((todo) => todo.completed);
}

function getFilteredTodos() {
    if (state.filter === 'active') {
        return getActiveTodos();
    } else if (state.filter === 'completed') {
        return getCompletedTodos();
    } else {
        return state.todos;
    }
}

function isOnlyCompletedTodos() {
    for (const todo of state.todos) {
        if (!todo.completed) return false;
    }
    return true;
}

function main() {
    const root = createRoot();
    document.getElementById('root').appendChild(root.element);
}

function createRoot() {
    function onAddInput(e) {
        mobx.runInAction(() => {
            state.addText = e.target.value;
        });
    }

    function onAddChange() {
        mobx.runInAction(() => {
            state.todos.push({
                text: state.addText,
                completed: false,
                editing: false,
            });
            state.addText = '';
        });
    }

    function onCompleteInput(todo) {
        mobx.runInAction(() => {
            todo.completed = !todo.completed;
        });
    }

    function onDelete(todo) {
        mobx.runInAction(() => {
            state.todos.splice(state.todos.indexOf(todo), 1);
        });
    }

    function onFilterClick(e, filter) {
        e.preventDefault();
        mobx.runInAction(() => {
            state.filter = filter;
        });
    }

    function onClearCompletedClick() {
        mobx.runInAction(() => {
            state.todos = state.todos.filter((todo) => !todo.completed);
        });
    }

    function onToggleAllInput() {
        const completed = !isOnlyCompletedTodos();
        mobx.runInAction(() => {
            for (const todo of state.todos) {
                todo.completed = completed;
            }
        });
    }

    function onTodoDblClick(todo) {
        mobx.runInAction(() => {
            todo.editing = true;
            state.editText = todo.text;
        });
    }

    function onEditInput(e) {
        mobx.runInAction(() => {
            state.editText = e.target.value;
        });
    }

    function onEditSubmit(todo) {
        mobx.runInAction(() => {
            todo.text = state.editText;
            todo.editing = false;
        });
    }

    function onEditKeyDown(e, todo) {
        if (e.key === 'Enter') {
            onEditSubmit(todo);
        } else if (e.key === 'Escape') {
            mobx.runInAction(() => {
                todo.editing = false;
            });
        }
    }

    return h('section', { class: 'todoapp' },
        h('header', { class: 'header' },
            h('h1', {}, 'todos'),
            h('input', { class: 'new-todo', placeholder: 'What needs to be done?', value: dyn(() => state.addText), onInput: onAddInput, onChange: onAddChange }),
        ),
        h('section', { class: 'main' },
            h('input', {
                class: 'toggle-all',
                id: 'toggle-all',
                type: 'checkbox',
                checked: dyn(isOnlyCompletedTodos),
                onInput: onToggleAllInput,
            }),
            h('label', {
                for: 'toggle-all',
                style: { display: dyn(() => state.todos.length === 0 ? 'none' : 'block') },
            }),
            h('ul', { class: 'todo-list' },
                dynList(getFilteredTodos,
                    (todo) => h('li',
                        {
                            class: dyn(() => {
                                const result = [];
                                if (todo.completed) result.push('completed');
                                if (todo.editing) result.push('editing');
                                return result.join(' ');
                            }),
                        },
                        h('div', { class: 'view' },
                            h('input', { class: 'toggle', type: 'checkbox', checked: dyn(() => todo.completed), onInput: () => onCompleteInput(todo) }),
                            h('label', { onDblClick: () => onTodoDblClick(todo) }, dyn(() => todo.text)),
                            h('button', { class: 'destroy', onClick: () => onDelete(todo) }),
                        ),
                        dynIf(() => todo.editing,
                            () => {
                                const result = h('input', {
                                    class: 'edit',
                                    value: dyn(() => state.editText),
                                    onInput: onEditInput,
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
                    ),
                ),
            ),
        ),
        h('footer', { class: 'footer' },
            h('span', { class: 'todo-count' },
                dyn(() => {
                    const count = state.todos.filter((todo) => !todo.completed).length;
                    return count + ' item' + (count !== 1 ? 's' : '') + ' left';
                }),
            ),
            h('ul', { class: 'filters' },
                h('li', {},
                    h('a',
                        {
                            class: dyn(() => state.filter === 'all' ? 'selected' : ''),
                            href: '#/',
                            onClick: (e) => onFilterClick(e, 'all'),
                        },
                        'All',
                    ),
                ),
                h('li', {},
                    h('a',
                        {
                            class: dyn(() => state.filter === 'active' ? 'selected' : ''),
                            href: '#/active',
                            onClick: (e) => onFilterClick(e, 'active'),
                        },
                        'Active',
                    ),
                ),
                h('li', {},
                    h('a',
                        {
                            class: dyn(() => state.filter === 'completed' ? 'selected' : ''),
                            href: '#/completed',
                            onClick: (e) => onFilterClick(e, 'completed'),
                        },
                        'Completed',
                    ),
                ),
            ),
            h('button', { class: 'clear-completed', style: { display: dyn(() => getCompletedTodos().length > 0 ? 'block' : 'none') }, onClick: onClearCompletedClick }, 'Clear completed'),
        ),
    );
}

main();
