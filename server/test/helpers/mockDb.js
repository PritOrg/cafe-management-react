/** Shared mock knex chain for unit tests (no real DB). */
export const createMockDb = (overrides = {}) => {
    const state = {
        firstResult: overrides.firstResult ?? null,
        selectResult: overrides.selectResult ?? [],
        insertResult: overrides.insertResult ?? [{ id: 'x' }],
        updateResult: overrides.updateResult ?? [],
        delResult: overrides.delResult ?? [],
        countResult: overrides.countResult ?? { count: 0 },
    };

    const chain = new Proxy({}, {
        get(_, prop) {
            if (prop === 'then') {
                return (resolve, reject) => Promise.resolve(state.selectResult).then(resolve, reject);
            }
            if (prop === 'first') {
                return () => Promise.resolve(state.firstResult);
            }
            if (prop === 'count') {
                return () => ({ first: () => Promise.resolve(state.countResult) });
            }
            if (prop === 'returning') {
                return () => Promise.resolve(state.insertResult);
            }
            if (prop === 'clone') {
                return () => chain;
            }
            return () => chain;
        },
    });

    const db = () => chain;
    db.raw = (sql, bindings) => ({ __raw: true, sql, bindings });
    db.transaction = async (fn) => fn(chain);
    db.client = { pool: { numUsed: () => 0 } };
    db.__state = state;
    return db;
};

export const mockRes = () => {
    const r = { statusCode: null, body: null, headers: {}, req: {} };
    r.status = (c) => { r.statusCode = c; return r; };
    r.json = (b) => { r.body = b; return r; };
    r.setHeader = (k, v) => { r.headers[k] = v; return r; };
    r.send = (b) => { r.body = b; return r; };
    return r;
};
