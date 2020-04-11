export function preventGC(arg: {}) {
    Object.keys(arg)
        .map(key => {
            // @ts-ignore
            global[`_${key}`] = arg[key];
        });
}
