let DynamicDomObservable;

(() => {
    function observableToSubscribe(observableGet) {
        return (subscriber) => ObservableUtil.reaction(observableGet, subscriber);
    }

    function dyn(observableGet) {
        return DynamicDom.dyn(observableToSubscribe(observableGet));
    }

    function dynIf(observableGet, create) {
        return DynamicDom.dynIf(observableToSubscribe(observableGet), create);
    }

    function dynList(observableGet, create) {
        return DynamicDom.dynList(observableToSubscribe(observableGet), create);
    }

    DynamicDomObservable = { dyn, dynIf, dynList };
})();
