let DynamicDomMobx;

(() => {
    function mobxToSubscribe(fn) {
        return (subscriber) => mobx.reaction(fn, subscriber, { fireImmediately: true });
    }

    function dyn(fn) {
        return DynamicDom.dyn(mobxToSubscribe(fn));
    }

    function dynIf(predicate, create) {
        return DynamicDom.dynIf(mobxToSubscribe(predicate), create);
    }

    function dynList(getItems, create) {
        return DynamicDom.dynList(mobxToSubscribe(() => getItems().slice()), create);
    }

    DynamicDomMobx = { dyn, dynIf, dynList };
})();
