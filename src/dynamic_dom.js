
let DynamicDom;

(() => {
    function runAll(fns) {
        for (const fn of fns) {
            fn();
        }
    }

    function dyn(subscribe) {
        return {
            kind: 'dynamic_value',
            subscribe: subscribe,
        };
    }

    function dynIf(subscribe, create) {
        return {
            kind: 'dynamic_children',
            append: (parent) => {
                const disposes = [];

                let childElement = null;
                let childDisposes = [];
                let prevValue = null;

                disposes.push(() => {
                    runAll(childDisposes);
                });

                const placeholder = document.createComment('');
                parent.appendChild(placeholder);

                disposes.push(subscribe((value) => {
                    if (value === prevValue) return;
                    if (value) {
                        const result = create();
                        parent.insertBefore(result.element, placeholder);
                        childElement = result.element;
                        childDisposes = result.disposes;
                    } else {
                        if (childElement !== null) {
                            parent.removeChild(childElement);
                            runAll(childDisposes);
                            childElement = null;
                            childDisposes = [];
                        }
                    }
                    prevValue = value;
                }));

                return disposes;
            },
        };
    }

    function dynList(subscribe, create) {
        return {
            kind: 'dynamic_children',
            append: (parent) => {
                const disposes = [];

                const childNodes = new Map();
                const childDisposes = new Map();
                let prevItems = null;

                disposes.push(() => {
                    runAll(childDisposes.values().flat());
                });

                const placeholder = document.createComment('');
                parent.appendChild(placeholder);

                disposes.push(subscribe((items) => {
                    if (prevItems === null) { // First run
                        let lastAddedNode = placeholder;
                        for (const item of items) {
                            const result = create(item);
                            childNodes.set(item, result.element);
                            childDisposes.set(item, result.disposes);
                            lastAddedNode.after(result.element);
                            lastAddedNode = result.element;
                        }
                        prevItems = items;
                        return;
                    }

                    const deletedItems = new Set();

                    // Delete
                    for (const prevItem of prevItems) {
                        if (!items.includes(prevItem)) {
                            runAll(childDisposes.get(prevItem));
                            childDisposes.delete(prevItem);
                            parent.removeChild(childNodes.get(prevItem));
                            childNodes.delete(prevItem);
                            deletedItems.add(prevItem);
                        }
                    }

                    // Create or move
                    let prevI = 0;
                    const prevISkipDeleted = () => {
                        while (deletedItems.has(prevItems[prevI])) {
                            prevI += 1;
                        }
                    };
                    prevISkipDeleted();
                    let lastAddedNode = placeholder;
                    for (const item of items) {
                        if (childNodes.has(item)) { // Exists
                            if (item === prevItems[prevI]) { // Skip
                                lastAddedNode = childNodes.get(item);
                            } else { // Move
                                const newNode = childNodes.get(item);
                                lastAddedNode.after(newNode);
                                lastAddedNode = newNode;
                            }

                            prevI += 1;
                            prevISkipDeleted();
                        } else { // Create
                            const result = create(item);
                            childNodes.set(item, result.element);
                            childDisposes.set(item, result.disposes);
                            lastAddedNode.after(result.element);
                            lastAddedNode = result.element;
                        }
                    }

                    prevItems = items;
                }));

                return disposes;
            },
        };
    }

    function createElement(tagName) {
        if (tagName.startsWith('svg:')) {
            return document.createElementNS('http://www.w3.org/2000/svg', tagName.substring('svg:'.length));
        } else {
            return document.createElement(tagName);
        }
    }

    function h(tagName, attributes, ...children) {
        const disposes = [];
        const parent = createElement(tagName);

        for (const [k, v] of Object.entries(attributes)) {
            if (k === 'style') {
                for (const [styleK, styleV] of Object.entries(v)) {
                    if (typeof styleV === 'object' && styleV.kind === 'dynamic_value') {
                        disposes.push(styleV.subscribe((value) => {
                            parent.style[styleK] = value;
                        }));
                    } else {
                        parent.style[styleK] = styleV;
                    }
                }
            } else if (k === 'value' || k === 'checked') {
                if (typeof v === 'object' && v.kind === 'dynamic_value') {
                    disposes.push(v.subscribe((value) => {
                        parent[k] = value;
                    }));
                } else {
                    parent[k] = v;
                }
            } else if (k.startsWith('on')) {
                const event = k.substring(2).toLowerCase();
                parent.addEventListener(event, v);
                disposes.push(() => {
                    parent.removeEventListener(event, v);
                });
            } else {
                if (typeof v === 'object' && v.kind === 'dynamic_value') {
                    disposes.push(v.subscribe((value) => {
                        parent.setAttribute(k, value);
                    }));
                } else {
                    parent.setAttribute(k, v);
                }
            }
        }

        for (const child of children.flat()) {
            if (typeof child === 'string' || typeof child === 'number') {
                parent.appendChild(
                    document.createTextNode(child)
                );
            } else if (typeof child === 'object') {
                const kind = child.kind;
                if (kind === 'static_element') {
                    parent.appendChild(child.element);
                    disposes.push(...child.disposes);
                } else if (kind === 'dynamic_value') {
                    const textElement = document.createTextNode('');
                    parent.appendChild(textElement);
                    disposes.push(child.subscribe((value) => {
                        textElement.textContent = value;
                    }));
                } else if (kind === 'dynamic_children') {
                    disposes.push(...child.append(parent));
                }
            }
        }

        return {
            kind: 'static_element',
            element: parent,
            disposes: disposes,
        };
    }

    DynamicDom = { dyn, dynIf, dynList, h };
})();
