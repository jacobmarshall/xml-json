(function () {

function extend (base, obj) {
    if (Object.prototype.toString.call(base) !== '[object Object]') {
        base = {};
    }
    if (Object.prototype.toString.call(obj) === '[object Object]') {
        for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                base[key] = obj[key];
            }
        }
    }
    return base;
}

function array (arr) {
    return (arr && arr.length && Array.prototype.slice.apply(arr)) || [];
}

function Parser (options) {
    if ( ! (this instanceof Parser)) {
        return new Parser(options);
    }

    this.options = extend(extend({}, Parser.defaults), options);
}

Parser.defaults = {
    ignoreEmptyTextNodes: true
};

Parser.prototype.parseString = function (xml) {
    if (this._parsed) return this._parsed;

    var parser = new DOMParser(),
        document = parser.parseFromString(xml, 'text/xml'),
        json = array(document.childNodes);

    for (var index = 0, item; index < json.length; index++) {
        item = json[index];
        json[index] = this._serialiseNode(item);
    }

    return (this._parsed = json);
};

Parser.prototype.parseStringToJSON = function (xml) {
    return JSON.stringify(this.parseString(xml), null, '  ');
};

Parser.prototype._serialiseNode = function (node) {
    var item = {
        name: node.nodeName,
        attr: this._serialiseAttributes(node),
        children: [],
        value: node.nodeName === '#text' ? node.textContent : null
    };

    var children = array(node.childNodes);

    for (var index = 0, child; index < children.length; index++) {
        child = children[index];
        item.children.push(this._serialiseNode(child));
    }

    if (this.options.ignoreEmptyTextNodes === true) {
        this._removeEmptyTextNodes(item.children);
    }

    return item;
};

Parser.prototype._removeEmptyTextNodes = function (children) {
    for (var index = children.length - 1, item; index >= 0; index--) {
        item = children[index];

        if (item.name === '#text' && item.value && item.value.trim().length === 0) {
            children.splice(index, 1);
        }
    }
    return children;
};

Parser.prototype._serialiseAttributes = function (node) {
    var attrs = array(node.attributes);

    for (var index = 0, item; index < attrs.length; index++) {
        item = attrs[index];
        attrs[index] = {
            name: item.nodeName,
            value: this._parseAttributeValue(item.nodeValue)
        };
    }

    return attrs;
};

Parser.prototype._parseAttributeValue = function (value) {
    var parsers = [
        function () {
            var num;
            if ( ! isNaN(num = parseFloat(value))) {
                return num;
            }
        },
        function () {
            return value;
        }
    ];

    for (var index = 0, parsed; index < parsers.length; index++) {
        if (typeof (parsed = parsers[index]()) !== 'undefined') {
            return parsed;
        }
    }

    return null;
};

this['XMLJSON'] = {
    Parser: Parser
};

}).call(this.window || this.self || this.global || this);
