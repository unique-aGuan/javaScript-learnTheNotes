(function () {
  var class2type = {};
  var toString = class2type.toString;
  var hasOwn = class2type.hasOwnProperty;
  var fnToString = hasOwn.toString;
  var ObjectFunctionString = fnToString.call(Object);
  var getProto = Object.getPrototypeOf;

  var mapType = ["Boolean", "Number", "String", "Function", "Array", "Date", "RegExp", "Object", "Error", "Symbol", "BigInt"];
  mapType.forEach(function (name) {
    class2type["[object " + name + "]"] = name.toLocaleLowerCase();
  });

  var toType = function toType (obj) {
    if (obj == null) {
      return obj + "";
    }
    return typeof obj === "object" || typeof obj === "function" ?
      class2type[toString.call(obj)] || "object" :
      typeof obj;
  };

  var isFunction = function isFunction (obj) {
    return typeof obj === "function" && typeof obj.nodeType !== "number";
  };

  var isWindow = function isWindow (obj) {
    return obj != null && obj === obj.window;
  };

  var isArrayLike = function isArrayLike (obj) {
    var length = !!obj && "length" in obj && obj.length,
      type = toType(obj);
    if (isFunction(obj) || isWindow(obj)) return false;
    return type === "array" || length === 0 ||
      typeof length === "number" && length > 0 && (length - 1) in obj;
  };

  var isPlainObject = function isPlainObject (obj) {
    var proto, Ctor;
    if (!obj || toString.call(obj) !== "[object Object]") {
      return false;
    }
    proto = getProto(obj);
    if (!proto) return true;
    Ctor = hasOwn.call(proto, "constructor") && proto.constructor;
    return typeof Ctor === "function" && fnToString.call(Ctor) === ObjectFunctionString;
  };

  var isEmptyObject = function isEmptyObject (obj) {
    if (obj == null) return false;
    if (typeof obj !== "object") return false;
    var keys = Object.keys(obj);
    if (hasOwn.call(Object, 'getOwnPropertySymbols')) {
      keys = keys.concat(Object.getOwnPropertySymbols(obj));
    }
    return keys.length === 0;
  };

  var isNumeric = function isNumeric (obj) {
    var type = toType(obj);
    return (type === "number" || type === "string") && !isNaN(+obj);
  };

  var each = function each (obj, callback) {
    var length, i = 0;
    if (isArrayLike(obj)) {
      length = obj.length;
      for (; i < length; i++) {
        var result = callback.call(obj[i], i, obj[i]);
        if (result === false) {
          break;
        }
      }
    } else {
      var keys = Object.keys(obj);
      typeof Symbol !== "undefined" ? keys = keys.concat(Object.getOwnPropertySymbols(obj)) : null;
      for (; i < keys.length; i++) {
        var key = keys[i];
        if (callback.call(obj[key], key, obj[key]) === false) {
          break;
        }
      }
    }
    return obj;
  }

  var shallowMerge = function shallowMerge (obj1, obj2) {
    var isPlain1 = isPlainObject(obj1),
      isPlain2 = isPlainObject(obj2);
    if (!isPlain1) return obj2;
    if (!isPlain2) return obj1;
    each(obj2, function (key, value) {
      obj1[key] = value;
    });
    return obj1;
  };

  var deepMerge = function deepMerge (obj1, obj2, cache) {
    cache = !Array.isArray(cache) ? [] : cache;
    if (cache.indexOf(obj2) >= 0) return obj2;
    cache.push(obj2);
    var isPlain1 = isPlainObject(obj1),
      isPlain2 = isPlainObject(obj2);
    if (!isPlain1 || !isPlain2) return shallowMerge(obj1, obj2);
    each(obj2, function (key, value) {
      obj1[key] = deepMerge(obj1[key], value, cache);
    });
    return obj1;
  };

  var shallowClone = function shallowClone (obj) {
    var type = toType(obj),
      Ctor = null;
    if (obj == null) return obj;
    Ctor = obj.constructor;
    if (/^(regexp|date)$/i.test(type)) return new Ctor(obj);
    if (/^(symbol|bigint)$/i.test(type)) return Object(obj);
    if (/^error$/i.test(type)) return new Ctor(obj.message);
    if (/^function$/i.test(type)) {
      return function anonymous () {
        return obj.apply(this, arguments);
      };
    }
    if (isPlainObject(obj) || type === "array") {
      var result = new Ctor();
      each(obj, function (key, value) {
        result[key] = value;
      });
      return result;
    }
    return obj;
  };

  var deepClone = function deepClone (obj, cache) {
    var type = toType(obj),
      Ctor = null,
      result = null;
    if (!isPlainObject(obj) && type !== "array") return shallowClone(obj);
    cache = !Array.isArray(cache) ? [] : cache;
    if (cache.indexOf(obj) >= 0) return obj;
    cache.push(obj);
    Ctor = obj.constructor;
    result = new Ctor();
    each(obj, function (key, value) {
      result[key] = deepClone(value, cache);
    });
    return result;
  };

  // 暴露到外部
  var utils = {
    toType: toType,
    isFunction: isFunction,
    isWindow: isWindow,
    isArrayLike: isArrayLike,
    isPlainObject: isPlainObject,
    isEmptyObject: isEmptyObject,
    isNumeric: isNumeric,
    each: each,
    shallowMerge: shallowMerge,
    deepMerge: deepMerge,
    shallowClone: shallowClone,
    deepClone: deepClone
  };
  if (typeof window !== "undefined") {
    window._ = window.utils = utils;
  }
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = utils;
  }
})();

(function () {
  /* 核心操作 */
  class Ajax {
    constructor(config) {
      // 把信息挂在到实例上:只要保证方法中的this是实例，则可以实现信息的共享「私有的」
      let self = this;
      // 请求拦截器
      let [onResolveCallback] = ajax.interceptors.request.pond || [];
      if (typeof onResolveCallback === "function") {
        config = onResolveCallback(config);
      }
      self.config = config;
      return self.request();
    }
    // 发送数据请求
    request () {
      let self = this;
      let {
        method,
        timeout,
        withCredentials,
        validateStatus,
        responseType
      } = self.config;

      let promise = new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest;
        xhr.open(method.toUpperCase(), self.handleURL());
        // 设置一些在杂七杂八的
        timeout > 0 ? xhr.timeout = timeout : null;
        xhr.withCredentials = withCredentials;
        // 设置请求头
        self.handleRequestHeaders(xhr);
        xhr.onreadystatechange = () => {
          let readyState = xhr.readyState,
            status = xhr.status;
          if (!validateStatus(status)) {
            // 状态码层面错误
            if (status === 0) return;
            reject(self.handleResponse(false, xhr, xhr.statusText));
            return;
          }
          if (readyState === 4) {
            // 成功
            let result = xhr.responseText;
            switch (responseType.toLowerCase()) {
              case 'json':
                result = JSON.parse(result);
                break;
              case 'document':
                result = xhr.responseXML;
                break;
              case 'stream':
                result = xhr.response;
                break;
            }
            resolve(self.handleResponse(true, xhr, result));
          }
        };
        xhr.onerror = err => {
          // 请求失败「网络层」
          reject(self.handleResponse(false, xhr, {
            message: '网络断开!'
          }));
        };
        xhr.ontimeout = err => {
          // 请求失败「请求超时」
          reject(self.handleResponse(false, xhr, {
            message: '请求超时!'
          }));
        };
        xhr.send(self.handleData());
      });

      // 响应拦截器
      let [onResolveCallback, onRejectCallback] = ajax.interceptors.response.pond || [];
      if (typeof onResolveCallback !== "function") {
        onResolveCallback = response => {
          return response;
        };
      }
      if (typeof onRejectCallback !== "function") {
        onRejectCallback = reason => {
          return Promise.reject(reason);
        };
      }

      return promise.then(onResolveCallback, onRejectCallback);
    }
    // 对象格式化成为x-www-urlencoded
    paramsSerializer (obj) {
      let str = ``;
      _.each(obj, (key, value) => {
        str += `&${key}=${value}`;
      });
      return str.substring(1);
    }
    // 处理URL
    handleURL () {
      let {
        baseURL,
        url,
        params,
        cache,
        method
      } = this.config;
      url = baseURL + url;

      // params
      if (params && !_.isEmptyObject(params)) {
        if (typeof params === "object") params = this.paramsSerializer(params);
        url += `${url.includes('?') ? '&' : '?'}${params}`;
      }

      // catch
      if (method_get.includes(method.toLowerCase()) && cache === false) {
        url += `${url.includes('?') ? '&' : '?'}_=${Math.random()}`;
      }

      return url;
    }
    // 处理请求主体的信息
    handleData () {
      let {
        method,
        data,
        headers,
        transformRequest
      } = this.config;
      if (!method_post.includes(method.toLowerCase())) return null;
      data = transformRequest(data, headers);
      // 经过处理后，如果DATA还是一个对象（非formData对象）:可能是用户没有自己设置transformRequest，此时我们把其变为JSON格式的字符串
      if (data && typeof data === "object" && !(data instanceof FormData)) {
        try {
          data = JSON.stringify(data);
        } catch (err) {
          data = null;
        }
      }
      return data;
    }
    // 处理请求头
    handleRequestHeaders (xhr) {
      let {
        headers,
        method
      } = this.config;
      headers = _.deepClone(headers);
      let common = headers['common'] || {},
        methodObj = headers[method.toLowerCase()] || {};
      delete headers['common'];
      _.each(methods, (index, item) => {
        delete headers[item];
      });
      // 请求方式->common->外层
      headers = _.deepMerge(headers, common);
      headers = _.deepMerge(headers, methodObj);
      // 设置请求头信息
      _.each(headers, (key, value) => {
        xhr.setRequestHeader(key, value);
      });
    }
    // 处理请求结果
    queryResponseHeaders (xhr) {
      let headers = {},
        text = xhr.getAllResponseHeaders(),
        arr = text.split(/(?:\n|: )/g);
      for (let i = 0; i < arr.length; i += 2) {
        let key = arr[i],
          value = arr[i + 1];
        if (key && value) {
          headers[key] = value;
        }
      }
      return headers;
    }
    handleResponse (flag, xhr, data) {
      let response = {
        data: flag ? data : null,
        status: xhr.status,
        statusText: xhr.statusText,
        headers: this.queryResponseHeaders(xhr),
        request: xhr
      };
      let reason = {
        message: data.message || data
      };
      if (flag) return response;
      typeof data === "string" ? reason.response = response : null;
      return reason;
    }
  }

  /* 配置项的处理 */
  const method_get = ['get', 'head', 'options', 'delete'],
    method_post = ['post', 'put', 'patch'],
    methods = method_get.concat(method_post);

  // 处理HEADERS结构
  const headers = {
    common: {}
  };
  _.each(methods, (_, item) => {
    headers[item] = {};
  });

  // 设置配置项的默认规则「默认值、是否必传、值的类型」
  const configRule = {
    baseURL: {
      type: 'string',
      default: ''
    },
    url: {
      type: 'string',
      required: true
    },
    method: {
      type: 'string',
      default: 'GET'
    },
    transformRequest: {
      type: 'function',
      default: data => {
        return data;
      }
    },
    headers: {
      type: 'object',
      default: headers
    },
    params: {
      type: ['object', 'string'],
      default: {}
    },
    cache: {
      type: 'boolean',
      default: true
    },
    data: {
      type: ['object', 'string'],
      default: {}
    },
    timeout: {
      type: 'number',
      default: 0
    },
    withCredentials: {
      type: 'boolean',
      default: false
    },
    responseType: {
      type: 'string',
      default: 'json'
    },
    validateStatus: {
      type: 'function',
      default: status => {
        return status >= 200 && status < 300;;
      }
    }
  };

  const initParams = function initParams (config) {
    config = _.deepMerge(_.deepMerge({}, ajax.defaults), config);
    // 按照配置项规则进行校验跟合并
    _.each(configRule, (key, rule) => {
      let {
        type,
        default: defaultValue,
        required
      } = rule;

      let myValue = config[key],
        myType = _.toType(myValue);

      // 1.我们没有传递值，如果要求是必须传递的，则报错，否则使用默认值即可
      if (myType === "undefined") {
        if (required) throw new TypeError(`${key} must be required!`);
        config[key] = defaultValue;
        return;
      }

      // 2.我们传递值了，校验传递值的类型是否和规则一致，校验不通过则报错，通过则以自己传递的值为主「可以和默认值合并」
      type = Array.isArray(type) ? type : [type];
      if (!type.includes(myType)) throw new TypeError(`${key} must be ${type}!`);
      if (_.isPlainObject(defaultValue) && _.isPlainObject(myValue)) {
        config[key] = _.deepMerge(_.deepMerge({}, defaultValue), myValue);
      } else {
        config[key] = myValue;
      }
    });

    // 特殊校验
    if (!methods.includes(config['method'].toLowerCase())) throw new TypeError('method must be a get/head/options/delete/post/put/patch!');

    return config;
  };

  const ajax = function ajax (config) {
    if (!_.isPlainObject(config)) config = {};
    // 初始参数配置
    config = initParams(config);
    // 发送数据请求
    return new Ajax(config);
  };

  ajax.defaults = {
    // 必须要有HEADERS，否则后期基于 ajax.defaults.headers.xxx['xxx']=xxx 会报错
    headers: headers
  };

  ajax.all = function all (promises) {
    if (!_.isArrayLike(promises)) throw new TypeError('promises must be a array or like-array!');
    return Promise.all(promises);
  };

  _.each(method_get, (index, item) => {
    ajax[item] = function (url, config) {
      if (!_.isPlainObject(config)) config = {};
      config.url = url;
      config.method = item;
      return ajax(config);
    };
  });
  _.each(method_post, (index, item) => {
    ajax[item] = function (url, data, config) {
      if (!_.isPlainObject(config)) config = {};
      config.url = url;
      config.method = item;
      config.data = data;
      return ajax(config);
    };
  });

  /* 拦截器 */
  class InterceptorManager {
    constructor() {
      let self = this;
      self.request = {
        use: self.use
      };
      self.response = {
        use: self.use
      };
    }
    use (onResolveCallback, onRejectCallback) {
      let self = this;
      self.pond = [onResolveCallback, onRejectCallback];
    }
  }
  ajax.interceptors = new InterceptorManager;

  /*  暴露API */
  if (typeof window !== "undefined") {
    window.ajax = ajax;
  }
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = ajax;
  }
})();


/*
* 基于Promise封装一个ajax库
*   + 参考axios的部分处理方式
*   + XMLHttpRequest
*
* 基本语法：
*   ajax([config])
*   ajax.get/head/options/delete([url],[config])
*   ajax.post/put/patch([url],[data],[config])
*   ajax.all([promise array])
*
* 二次配置：
*   + 默认配置项
*   + ajax.defaults.xxx 修改默认配置项
*   + ajax([config]) 自己传递的配置项
* {
*    baseURL:'',
*    url:'',
*    method:'get',
*    transformRequest:function(data){return data;}, 请求主体传递信息的格式化
*    headers:{
*       common:{},
*       get:{},
*       ...
*       'Content-Type':'application/json'
*    },
*    params:{},  URL传参数信息（拼接到URL的末尾）
*    cache:true, GET系列请求中是否清除缓存（?_=随机数）
*    data:{}, 请求主体传参信息
*    timeout:0, 设置请求超时时间
*    withCredentials:false, 跨域请求中允许携带资源凭证
*    responseType:'json',  预设服务器返回结果的处理方案 'stream', 'document', 'json', 'text'
*    validateStatus: function (status) {
*       return status >= 200 && status < 300; // default
*    }
* }
*
* 拦截器：
*   InterceptorManager
*   + 请求拦截器  ajax.interceptors.request.use(function(config){})
*   + 响应拦截器  ajax.interceptors.response.use(function(response){},function(reason){})
*
* 基于ajax请求回来的结果都是promise实例
*   + response
*     + data  响应主体信息
*     + status 状态码
*     + statusText 状态码的描述
*     + headers 响应头信息
*     + request XHR原生对象
*   + reason
*     + response
*     + message
*     + ...
*/