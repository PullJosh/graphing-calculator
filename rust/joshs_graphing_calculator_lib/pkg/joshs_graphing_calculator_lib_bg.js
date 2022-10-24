import * as wasm from './joshs_graphing_calculator_lib_bg.wasm';

const lTextDecoder = typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder : TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachedUint8Memory0 = new Uint8Array();

function getUint8Memory0() {
    if (cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;

const lTextEncoder = typeof TextEncoder === 'undefined' ? (0, module.require)('util').TextEncoder : TextEncoder;

let cachedTextEncoder = new lTextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length);
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len);

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3);
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedInt32Memory0 = new Int32Array();

function getInt32Memory0() {
    if (cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
}
/**
* @param {string} math_json
* @param {bigint} scale
* @param {bigint} x
* @param {bigint} y
* @param {bigint} depth
* @param {bigint} search_depth
* @returns {string}
*/
export function graph_equation_to_contours_json(math_json, scale, x, y, depth, search_depth) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(math_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.graph_equation_to_contours_json(retptr, ptr0, len0, scale, x, y, depth, search_depth);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_free(r0, r1);
    }
}

/**
*/
export class GraphBox {

    static __wrap(ptr) {
        const obj = Object.create(GraphBox.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_graphbox_free(ptr);
    }
    /**
    * @returns {number}
    */
    get x_min() {
        const ret = wasm.__wbg_get_graphbox_x_min(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set x_min(arg0) {
        wasm.__wbg_set_graphbox_x_min(this.ptr, arg0);
    }
    /**
    * @returns {number}
    */
    get x_max() {
        const ret = wasm.__wbg_get_graphbox_x_max(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set x_max(arg0) {
        wasm.__wbg_set_graphbox_x_max(this.ptr, arg0);
    }
    /**
    * @returns {number}
    */
    get y_min() {
        const ret = wasm.__wbg_get_graphbox_y_min(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set y_min(arg0) {
        wasm.__wbg_set_graphbox_y_min(this.ptr, arg0);
    }
    /**
    * @returns {number}
    */
    get y_max() {
        const ret = wasm.__wbg_get_graphbox_y_max(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set y_max(arg0) {
        wasm.__wbg_set_graphbox_y_max(this.ptr, arg0);
    }
}
/**
*/
export class GraphRegion {

    static __wrap(ptr) {
        const obj = Object.create(GraphRegion.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_graphregion_free(ptr);
    }
    /**
    * @param {bigint} scale
    * @param {bigint} x
    * @param {bigint} y
    */
    constructor(scale, x, y) {
        const ret = wasm.graphregion_new(scale, x, y);
        return GraphRegion.__wrap(ret);
    }
    /**
    * @returns {GraphBox}
    */
    to_graph_box() {
        const ret = wasm.graphregion_to_graph_box(this.ptr);
        return GraphBox.__wrap(ret);
    }
}

export function __wbindgen_throw(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

