
let wasm;

const heap = new Array(32).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function dropObject(idx) {
    if (idx < 36) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

function _assertBoolean(n) {
    if (typeof(n) !== 'boolean') {
        throw new Error('expected a boolean argument');
    }
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachegetUint8Memory0 = null;
function getUint8Memory0() {
    if (cachegetUint8Memory0 === null || cachegetUint8Memory0.buffer !== wasm.memory.buffer) {
        cachegetUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachegetUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    if (typeof(heap_next) !== 'number') throw new Error('corrupt heap');

    heap[idx] = obj;
    return idx;
}

let WASM_VECTOR_LEN = 0;

let cachedTextEncoder = new TextEncoder('utf-8');

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

    if (typeof(arg) !== 'string') throw new Error('expected a string argument');

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
        if (ret.read !== arg.length) throw new Error('failed to pass whole string');
        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

let cachegetInt32Memory0 = null;
function getInt32Memory0() {
    if (cachegetInt32Memory0 === null || cachegetInt32Memory0.buffer !== wasm.memory.buffer) {
        cachegetInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachegetInt32Memory0;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function makeMutClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {
        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            if (--state.cnt === 0) {
                wasm.__wbindgen_export_2.get(state.dtor)(a, state.b);

            } else {
                state.a = a;
            }
        }
    };
    real.original = state;

    return real;
}

function logError(f) {
    return function () {
        try {
            return f.apply(this, arguments);

        } catch (e) {
            let error = (function () {
                try {
                    return e instanceof Error ? `${e.message}\n\nStack:\n${e.stack}` : e.toString();
                } catch(_) {
                    return "<failed to stringify thrown value>";
                }
            }());
            console.error("wasm-bindgen: imported JS function that was not marked as `catch` threw an error:", error);
            throw e;
        }
    };
}

function _assertNum(n) {
    if (typeof(n) !== 'number') throw new Error('expected a number argument');
}
function __wbg_adapter_18(arg0, arg1, arg2) {
    _assertNum(arg0);
    _assertNum(arg1);
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hc37ae271ff58b2d7(arg0, arg1, arg2);
}

function __wbg_adapter_21(arg0, arg1, arg2) {
    _assertNum(arg0);
    _assertNum(arg1);
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h4895c63c86232e3e(arg0, arg1, addHeapObject(arg2));
}

/**
*/
export function start() {
    wasm.start();
}

function handleError(f) {
    return function () {
        try {
            return f.apply(this, arguments);

        } catch (e) {
            wasm.__wbindgen_exn_store(addHeapObject(e));
        }
    };
}

function getArrayU8FromWasm0(ptr, len) {
    return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
}
function __wbg_adapter_217(arg0, arg1, arg2, arg3, arg4) {
    _assertNum(arg0);
    _assertNum(arg1);
    _assertNum(arg3);
    wasm.wasm_bindgen__convert__closures__invoke3_mut__h9c711a456413e867(arg0, arg1, addHeapObject(arg2), arg3, addHeapObject(arg4));
}

async function load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {

        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {

        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

async function init(input) {
    if (typeof input === 'undefined') {
        input = import.meta.url.replace(/\.js$/, '_bg.wasm');
    }
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbindgen_cb_drop = function(arg0) {
        const obj = takeObject(arg0).original;
        if (obj.cnt-- == 1) {
            obj.a = 0;
            return true;
        }
        var ret = false;
        _assertBoolean(ret);
        return ret;
    };
    imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
        var ret = getStringFromWasm0(arg0, arg1);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_object_clone_ref = function(arg0) {
        var ret = getObject(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_self_1c83eb4471d9eb9b = handleError(function() {
        var ret = self.self;
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_msCrypto_679be765111ba775 = logError(function(arg0) {
        var ret = getObject(arg0).msCrypto;
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_crypto_c12f14e810edcaa2 = logError(function(arg0) {
        var ret = getObject(arg0).crypto;
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_getRandomValues_05a60bf171bfc2be = logError(function(arg0) {
        var ret = getObject(arg0).getRandomValues;
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_getRandomValues_3ac1b33c90b52596 = logError(function(arg0, arg1, arg2) {
        getObject(arg0).getRandomValues(getArrayU8FromWasm0(arg1, arg2));
    });
    imports.wbg.__wbg_randomFillSync_6f956029658662ec = logError(function(arg0, arg1, arg2) {
        getObject(arg0).randomFillSync(getArrayU8FromWasm0(arg1, arg2));
    });
    imports.wbg.__wbg_static_accessor_MODULE_abf5ae284bffdf45 = logError(function() {
        var ret = module;
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_require_5b2b5b594d809d9f = logError(function(arg0, arg1, arg2) {
        var ret = getObject(arg0).require(getStringFromWasm0(arg1, arg2));
        return addHeapObject(ret);
    });
    imports.wbg.__wbindgen_is_undefined = function(arg0) {
        var ret = getObject(arg0) === undefined;
        _assertBoolean(ret);
        return ret;
    };
    imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
        takeObject(arg0);
    };
    imports.wbg.__wbg_instanceof_Window_adf3196bdc02b386 = logError(function(arg0) {
        var ret = getObject(arg0) instanceof Window;
        _assertBoolean(ret);
        return ret;
    });
    imports.wbg.__wbg_document_6cc8d0b87c0a99b9 = logError(function(arg0) {
        var ret = getObject(arg0).document;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    });
    imports.wbg.__wbg_location_9b924f46d7090431 = logError(function(arg0) {
        var ret = getObject(arg0).location;
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_history_d9280cd6f4ab46c1 = handleError(function(arg0) {
        var ret = getObject(arg0).history;
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_performance_8594a974edffb1dc = logError(function(arg0) {
        var ret = getObject(arg0).performance;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    });
    imports.wbg.__wbg_cancelAnimationFrame_7f3ba4191e67c86b = handleError(function(arg0, arg1) {
        getObject(arg0).cancelAnimationFrame(arg1);
    });
    imports.wbg.__wbg_requestAnimationFrame_89935c9d6ac25d2f = handleError(function(arg0, arg1) {
        var ret = getObject(arg0).requestAnimationFrame(getObject(arg1));
        _assertNum(ret);
        return ret;
    });
    imports.wbg.__wbg_activeElement_be2f4f67d6a3c80b = logError(function(arg0) {
        var ret = getObject(arg0).activeElement;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    });
    imports.wbg.__wbg_createElement_5bdf88a5af9f17c5 = handleError(function(arg0, arg1, arg2) {
        var ret = getObject(arg0).createElement(getStringFromWasm0(arg1, arg2));
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_createElementNS_ea14cb45a87a0719 = handleError(function(arg0, arg1, arg2, arg3, arg4) {
        var ret = getObject(arg0).createElementNS(arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_createTextNode_b3c9e3cb02f83ab5 = logError(function(arg0, arg1, arg2) {
        var ret = getObject(arg0).createTextNode(getStringFromWasm0(arg1, arg2));
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_getElementById_0cb6ad9511b1efc0 = logError(function(arg0, arg1, arg2) {
        var ret = getObject(arg0).getElementById(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    });
    imports.wbg.__wbg_querySelector_69fd5cd784bcc892 = handleError(function(arg0, arg1, arg2) {
        var ret = getObject(arg0).querySelector(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    });
    imports.wbg.__wbg_target_02b2c4e71f788cc6 = logError(function(arg0) {
        var ret = getObject(arg0).target;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    });
    imports.wbg.__wbg_preventDefault_93d06688748bfc14 = logError(function(arg0) {
        getObject(arg0).preventDefault();
    });
    imports.wbg.__wbg_instanceof_HtmlSelectElement_0fa32c61ae67777c = logError(function(arg0) {
        var ret = getObject(arg0) instanceof HTMLSelectElement;
        _assertBoolean(ret);
        return ret;
    });
    imports.wbg.__wbg_setvalue_830d76745039a2c5 = logError(function(arg0, arg1, arg2) {
        getObject(arg0).value = getStringFromWasm0(arg1, arg2);
    });
    imports.wbg.__wbg_pushState_bfff600da5cf31c2 = handleError(function(arg0, arg1, arg2, arg3, arg4, arg5) {
        getObject(arg0).pushState(getObject(arg1), getStringFromWasm0(arg2, arg3), arg4 === 0 ? undefined : getStringFromWasm0(arg4, arg5));
    });
    imports.wbg.__wbg_instanceof_HtmlParamElement_581a71a22f5c2498 = logError(function(arg0) {
        var ret = getObject(arg0) instanceof HTMLParamElement;
        _assertBoolean(ret);
        return ret;
    });
    imports.wbg.__wbg_setvalue_847fad7028bcc30e = logError(function(arg0, arg1, arg2) {
        getObject(arg0).value = getStringFromWasm0(arg1, arg2);
    });
    imports.wbg.__wbg_instanceof_Node_27d89f84f47512bc = logError(function(arg0) {
        var ret = getObject(arg0) instanceof Node;
        _assertBoolean(ret);
        return ret;
    });
    imports.wbg.__wbg_nodeType_ff9a5fdbb9596b36 = logError(function(arg0) {
        var ret = getObject(arg0).nodeType;
        _assertNum(ret);
        return ret;
    });
    imports.wbg.__wbg_childNodes_1dec4dedb079dff2 = logError(function(arg0) {
        var ret = getObject(arg0).childNodes;
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_firstChild_da572db3c494324b = logError(function(arg0) {
        var ret = getObject(arg0).firstChild;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    });
    imports.wbg.__wbg_textContent_26582d13b9c5ea07 = logError(function(arg0, arg1) {
        var ret = getObject(arg1).textContent;
        var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    });
    imports.wbg.__wbg_settextContent_9ac5ef9163ad40d0 = logError(function(arg0, arg1, arg2) {
        getObject(arg0).textContent = arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2);
    });
    imports.wbg.__wbg_appendChild_77215fd672b162c5 = handleError(function(arg0, arg1) {
        var ret = getObject(arg0).appendChild(getObject(arg1));
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_insertBefore_ea385f1d7ec76e50 = handleError(function(arg0, arg1, arg2) {
        var ret = getObject(arg0).insertBefore(getObject(arg1), getObject(arg2));
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_removeChild_f4829fcd2e376e1b = handleError(function(arg0, arg1) {
        var ret = getObject(arg0).removeChild(getObject(arg1));
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_replaceChild_a97c4b16a9298934 = handleError(function(arg0, arg1, arg2) {
        var ret = getObject(arg0).replaceChild(getObject(arg1), getObject(arg2));
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_instanceof_HtmlDataElement_733566730c9db145 = logError(function(arg0) {
        var ret = getObject(arg0) instanceof HTMLDataElement;
        _assertBoolean(ret);
        return ret;
    });
    imports.wbg.__wbg_setvalue_f7419c0e6e46a805 = logError(function(arg0, arg1, arg2) {
        getObject(arg0).value = getStringFromWasm0(arg1, arg2);
    });
    imports.wbg.__wbg_href_3c5dae0bee2f925f = handleError(function(arg0, arg1) {
        var ret = getObject(arg1).href;
        var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    });
    imports.wbg.__wbg_instanceof_HtmlMenuItemElement_682abbfb74fd70f0 = logError(function(arg0) {
        var ret = getObject(arg0) instanceof HTMLMenuItemElement;
        _assertBoolean(ret);
        return ret;
    });
    imports.wbg.__wbg_setchecked_1977997978bb5c38 = logError(function(arg0, arg1) {
        getObject(arg0).checked = arg1 !== 0;
    });
    imports.wbg.__wbg_instanceof_HtmlProgressElement_8b2f3dc6e8a1d381 = logError(function(arg0) {
        var ret = getObject(arg0) instanceof HTMLProgressElement;
        _assertBoolean(ret);
        return ret;
    });
    imports.wbg.__wbg_setvalue_610458700e55ffcb = logError(function(arg0, arg1) {
        getObject(arg0).value = arg1;
    });
    imports.wbg.__wbg_new_fe819706e49340dc = handleError(function() {
        var ret = new URLSearchParams();
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_append_33ac2e6940de908e = logError(function(arg0, arg1, arg2, arg3, arg4) {
        getObject(arg0).append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    });
    imports.wbg.__wbg_instanceof_HtmlMeterElement_841f0b5447b2f5af = logError(function(arg0) {
        var ret = getObject(arg0) instanceof HTMLMeterElement;
        _assertBoolean(ret);
        return ret;
    });
    imports.wbg.__wbg_setvalue_5a9debf0ce0a59ff = logError(function(arg0, arg1) {
        getObject(arg0).value = arg1;
    });
    imports.wbg.__wbg_instanceof_HtmlOutputElement_c5abc7b2174b2d02 = logError(function(arg0) {
        var ret = getObject(arg0) instanceof HTMLOutputElement;
        _assertBoolean(ret);
        return ret;
    });
    imports.wbg.__wbg_setvalue_ac1d8d5794081f16 = logError(function(arg0, arg1, arg2) {
        getObject(arg0).value = getStringFromWasm0(arg1, arg2);
    });
    imports.wbg.__wbg_href_1a561d51222d5db4 = logError(function(arg0, arg1) {
        var ret = getObject(arg1).href;
        var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    });
    imports.wbg.__wbg_pathname_e987b432f240be95 = logError(function(arg0, arg1) {
        var ret = getObject(arg1).pathname;
        var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    });
    imports.wbg.__wbg_setsearch_99fbe349990cdcb0 = logError(function(arg0, arg1, arg2) {
        getObject(arg0).search = getStringFromWasm0(arg1, arg2);
    });
    imports.wbg.__wbg_searchParams_a1acc6866ef4c2eb = logError(function(arg0) {
        var ret = getObject(arg0).searchParams;
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_hash_27d9716878516044 = logError(function(arg0, arg1) {
        var ret = getObject(arg1).hash;
        var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    });
    imports.wbg.__wbg_sethash_3a71d53c87cdc307 = logError(function(arg0, arg1, arg2) {
        getObject(arg0).hash = getStringFromWasm0(arg1, arg2);
    });
    imports.wbg.__wbg_newwithbase_ab67001ec63cc8c1 = handleError(function(arg0, arg1, arg2, arg3) {
        var ret = new URL(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_instanceof_Element_fa1f2e86d1bc5f26 = logError(function(arg0) {
        var ret = getObject(arg0) instanceof Element;
        _assertBoolean(ret);
        return ret;
    });
    imports.wbg.__wbg_namespaceURI_a4d52538ca0c6bae = logError(function(arg0, arg1) {
        var ret = getObject(arg1).namespaceURI;
        var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    });
    imports.wbg.__wbg_tagName_6513794923bf4962 = logError(function(arg0, arg1) {
        var ret = getObject(arg1).tagName;
        var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    });
    imports.wbg.__wbg_closest_5a57be82755ccd47 = handleError(function(arg0, arg1, arg2) {
        var ret = getObject(arg0).closest(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    });
    imports.wbg.__wbg_getAttribute_ecbed0bd44a3467a = logError(function(arg0, arg1, arg2, arg3) {
        var ret = getObject(arg1).getAttribute(getStringFromWasm0(arg2, arg3));
        var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    });
    imports.wbg.__wbg_getAttributeNames_0aa52c16b346b81e = logError(function(arg0) {
        var ret = getObject(arg0).getAttributeNames();
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_removeAttribute_a705c6de4bb158c4 = handleError(function(arg0, arg1, arg2) {
        getObject(arg0).removeAttribute(getStringFromWasm0(arg1, arg2));
    });
    imports.wbg.__wbg_setAttribute_727bdb9763037624 = handleError(function(arg0, arg1, arg2, arg3, arg4) {
        getObject(arg0).setAttribute(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    });
    imports.wbg.__wbg_instanceof_HashChangeEvent_0a4181b712f15417 = logError(function(arg0) {
        var ret = getObject(arg0) instanceof HashChangeEvent;
        _assertBoolean(ret);
        return ret;
    });
    imports.wbg.__wbg_newURL_1cfa804b2e12093f = logError(function(arg0, arg1) {
        var ret = getObject(arg1).newURL;
        var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    });
    imports.wbg.__wbg_instanceof_HtmlTextAreaElement_6c876047bbe08f92 = logError(function(arg0) {
        var ret = getObject(arg0) instanceof HTMLTextAreaElement;
        _assertBoolean(ret);
        return ret;
    });
    imports.wbg.__wbg_setvalue_1012134a2989f3ee = logError(function(arg0, arg1, arg2) {
        getObject(arg0).value = getStringFromWasm0(arg1, arg2);
    });
    imports.wbg.__wbg_error_7f083efc6bc6752c = logError(function(arg0) {
        console.error(getObject(arg0));
    });
    imports.wbg.__wbg_instanceof_HtmlButtonElement_645b6f9d0d172e00 = logError(function(arg0) {
        var ret = getObject(arg0) instanceof HTMLButtonElement;
        _assertBoolean(ret);
        return ret;
    });
    imports.wbg.__wbg_setvalue_4c31dbc978f93fed = logError(function(arg0, arg1, arg2) {
        getObject(arg0).value = getStringFromWasm0(arg1, arg2);
    });
    imports.wbg.__wbg_instanceof_HtmlLiElement_bb4c0488b1da1339 = logError(function(arg0) {
        var ret = getObject(arg0) instanceof HTMLLIElement;
        _assertBoolean(ret);
        return ret;
    });
    imports.wbg.__wbg_setvalue_d0a5bf05d0c944b8 = logError(function(arg0, arg1) {
        getObject(arg0).value = arg1;
    });
    imports.wbg.__wbg_instanceof_HtmlOptionElement_a8407a273506b97a = logError(function(arg0) {
        var ret = getObject(arg0) instanceof HTMLOptionElement;
        _assertBoolean(ret);
        return ret;
    });
    imports.wbg.__wbg_setvalue_12c31c340e69edb4 = logError(function(arg0, arg1, arg2) {
        getObject(arg0).value = getStringFromWasm0(arg1, arg2);
    });
    imports.wbg.__wbg_length_6fa44e923fffc6e2 = logError(function(arg0) {
        var ret = getObject(arg0).length;
        _assertNum(ret);
        return ret;
    });
    imports.wbg.__wbg_get_f298a14531107a3d = logError(function(arg0, arg1) {
        var ret = getObject(arg0)[arg1 >>> 0];
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    });
    imports.wbg.__wbg_now_49847177a6d1d57e = logError(function(arg0) {
        var ret = getObject(arg0).now();
        return ret;
    });
    imports.wbg.__wbg_instanceof_HtmlElement_9cd64b297a10eb1e = logError(function(arg0) {
        var ret = getObject(arg0) instanceof HTMLElement;
        _assertBoolean(ret);
        return ret;
    });
    imports.wbg.__wbg_focus_5f74cb245be46131 = handleError(function(arg0) {
        getObject(arg0).focus();
    });
    imports.wbg.__wbg_instanceof_HtmlInputElement_aaef9fb14eceaa9b = logError(function(arg0) {
        var ret = getObject(arg0) instanceof HTMLInputElement;
        _assertBoolean(ret);
        return ret;
    });
    imports.wbg.__wbg_setchecked_1a89c058f5ac906a = logError(function(arg0, arg1) {
        getObject(arg0).checked = arg1 !== 0;
    });
    imports.wbg.__wbg_type_c26c07fdd821d8e7 = logError(function(arg0, arg1) {
        var ret = getObject(arg1).type;
        var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    });
    imports.wbg.__wbg_setvalue_839acf17e43a847f = logError(function(arg0, arg1, arg2) {
        getObject(arg0).value = getStringFromWasm0(arg1, arg2);
    });
    imports.wbg.__wbg_selectionStart_172742e26f272c7f = handleError(function(arg0, arg1) {
        var ret = getObject(arg1).selectionStart;
        if (!isLikeNone(ret)) {
            _assertNum(ret);
        }
        getInt32Memory0()[arg0 / 4 + 1] = isLikeNone(ret) ? 0 : ret;
        getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
    });
    imports.wbg.__wbg_setselectionStart_55c8971911559f17 = handleError(function(arg0, arg1, arg2) {
        getObject(arg0).selectionStart = arg1 === 0 ? undefined : arg2 >>> 0;
    });
    imports.wbg.__wbg_selectionEnd_3a3cdd8917642a90 = handleError(function(arg0, arg1) {
        var ret = getObject(arg1).selectionEnd;
        if (!isLikeNone(ret)) {
            _assertNum(ret);
        }
        getInt32Memory0()[arg0 / 4 + 1] = isLikeNone(ret) ? 0 : ret;
        getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
    });
    imports.wbg.__wbg_setselectionEnd_af122bd95be35f57 = handleError(function(arg0, arg1, arg2) {
        getObject(arg0).selectionEnd = arg1 === 0 ? undefined : arg2 >>> 0;
    });
    imports.wbg.__wbg_addEventListener_9e7b0c3f65ebc0d7 = handleError(function(arg0, arg1, arg2, arg3) {
        getObject(arg0).addEventListener(getStringFromWasm0(arg1, arg2), getObject(arg3));
    });
    imports.wbg.__wbg_removeEventListener_e118aefce350c930 = handleError(function(arg0, arg1, arg2, arg3) {
        getObject(arg0).removeEventListener(getStringFromWasm0(arg1, arg2), getObject(arg3));
    });
    imports.wbg.__wbg_instanceof_PopStateEvent_072db307eac00244 = logError(function(arg0) {
        var ret = getObject(arg0) instanceof PopStateEvent;
        _assertBoolean(ret);
        return ret;
    });
    imports.wbg.__wbg_state_3e1f3022931685ab = logError(function(arg0) {
        var ret = getObject(arg0).state;
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_decodeURIComponent_01fe81d04512fc8b = handleError(function(arg0, arg1) {
        var ret = decodeURIComponent(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_get_27693110cb44e852 = logError(function(arg0, arg1) {
        var ret = getObject(arg0)[arg1 >>> 0];
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_from_2a5d647e62275bfd = logError(function(arg0) {
        var ret = Array.from(getObject(arg0));
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_forEach_e8150d9b57b1318e = logError(function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_217(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            getObject(arg0).forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    });
    imports.wbg.__wbg_length_079c4e509ec6d375 = logError(function(arg0) {
        var ret = getObject(arg0).length;
        _assertNum(ret);
        return ret;
    });
    imports.wbg.__wbg_newnoargs_f3b8a801d5d4b079 = logError(function(arg0, arg1) {
        var ret = new Function(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_call_8e95613cc6524977 = handleError(function(arg0, arg1) {
        var ret = getObject(arg0).call(getObject(arg1));
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_is_333329c4a02916de = logError(function(arg0, arg1) {
        var ret = Object.is(getObject(arg0), getObject(arg1));
        _assertBoolean(ret);
        return ret;
    });
    imports.wbg.__wbg_toString_380767dc94884950 = logError(function(arg0) {
        var ret = getObject(arg0).toString();
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_globalThis_b9277fc37e201fe5 = handleError(function() {
        var ret = globalThis.globalThis;
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_self_07b2f89e82ceb76d = handleError(function() {
        var ret = self.self;
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_window_ba85d88572adc0dc = handleError(function() {
        var ret = window.window;
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_global_e16303fe83e1d57f = handleError(function() {
        var ret = global.global;
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_error_4bb6c2a97407129a = logError(function(arg0, arg1) {
        try {
            console.error(getStringFromWasm0(arg0, arg1));
        } finally {
            wasm.__wbindgen_free(arg0, arg1);
        }
    });
    imports.wbg.__wbg_new_59cb74e423758ede = logError(function() {
        var ret = new Error();
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_stack_558ba5917b466edd = logError(function(arg0, arg1) {
        var ret = getObject(arg1).stack;
        var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    });
    imports.wbg.__wbindgen_string_get = function(arg0, arg1) {
        const obj = getObject(arg1);
        var ret = typeof(obj) === 'string' ? obj : undefined;
        var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    };
    imports.wbg.__wbindgen_debug_string = function(arg0, arg1) {
        var ret = debugString(getObject(arg1));
        var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbindgen_closure_wrapper1313 = logError(function(arg0, arg1, arg2) {
        var ret = makeMutClosure(arg0, arg1, 67, __wbg_adapter_18);
        return addHeapObject(ret);
    });
    imports.wbg.__wbindgen_closure_wrapper1315 = logError(function(arg0, arg1, arg2) {
        var ret = makeMutClosure(arg0, arg1, 69, __wbg_adapter_21);
        return addHeapObject(ret);
    });

    if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
        input = fetch(input);
    }

    const { instance, module } = await load(await input, imports);

    wasm = instance.exports;
    init.__wbindgen_wasm_module = module;
    wasm.__wbindgen_start();
    return wasm;
}

export default init;

