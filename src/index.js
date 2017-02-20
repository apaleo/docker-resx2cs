const xml2json = require('xml2js');
const getStdin = require('get-stdin');

/** result structure:
 * 
 * { root: { data: [ { 
 *      $: { name: "AccountInvalidCreds"}, 
 *      value: [ "Invalid username or password" ] 
 * }, {
 *      $: { name: "AccountLogoutConfirmation"}, 
 *      value: [ "You are logged out now!" ] 
 * } ] } }
 * 
 */
function transformObject(dataItems) {
    const resources = dataItems.map(item => {
        const value = item.value.join(' ');
        const params = parseParameters(value);

        return {
            resourceName: item.$.name,
            resourceParams: params,
            hasParams: !!params && params.length > 0
        };
    });
    return { resources: resources };
}

const paramMatcher = /\$\{(\w+)([:,][^\}]*)?\}/g;
const paramNameMatcher = /^\$\{(\w+)([:,][^\}]*)?\}$/;

function parseParameters(resourceValue) {
    let params = resourceValue.match(paramMatcher);

    if (params && params.length > 0) {
        params = params
            .map(p => p.match(paramNameMatcher)[1])
            .sort()
            .map(p => { return { paramName: p }; });
        params[params.length - 1].isLast = true;
        return params;
    } else {
        return null;
    }
}

getStdin().then(input => {
    xml2json.parseString(input, (err, result) => {
        const model = transformObject(result.root.data);

        model.namespace = process.env.RESX2CS_NAMESPACE;
        model.className = process.env.RESX2CS_CLASS_NAME;
        model.resourceName = process.env.RESX2CS_RESOURCE_NAME;

        console.log(JSON.stringify(model));
    });
});
