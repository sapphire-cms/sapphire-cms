export var ContentType;
(function (ContentType) {
    /**
     * A single, unique document. Not meant to be duplicated or listed.
     */
    ContentType["SINGLETON"] = "singleton";
    /**
     * A flat list (array) of content entries of the same type.
     */
    ContentType["COLLECTION"] = "collection";
    /**
     * A hierarchical structure of content, similar to a file system.
     */
    ContentType["TREE"] = "tree";
})(ContentType || (ContentType = {}));
//# sourceMappingURL=content-schema.js.map