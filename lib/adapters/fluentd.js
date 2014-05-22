var $uuid = require('uuid'),
    $logger = require('fluent-logger');

/**
 * Fluentd Adapter
 * @param {Object} params
 * @param {LoggerFactory} loggerFactory
 * @constructor
 */
var FluentdAdapter = function(params, loggerFactory){
    this._id = $uuid.v4();
    this.loggerFactory = loggerFactory;
    this.params = params;
    this.logger = $logger.createFluentSender(params.tag, params);
};

/**
 * Log data
 * @param {Object} params Log Record Params
 * @param {Function} callback
 */
FluentdAdapter.prototype.log = function(params, callback){
    var data = {};
    if (typeof params.message !== 'object') {
        data.message = JSON.stringify(params.message);
    } else {
        data.messgae = params.message;
    }
    data.level = params.level;
    data.hostname = params.hostname;
    data.logger = params.name;
    if (params.label){
        data.marker = params.label;
    }
    if (params.stack){
        data.throwable = {
            stack: params.stack.join("\n"),
            code: params.code
        }
    }
    var context = {};
    if (params.info) {
        params.info.forEach(function (el) {
            if (isObject(el)){
                el = mapObject(el);
                for(var key in el) if (el.hasOwnProperty(key)){
                    context[key] = el[key];
                }
            }
        });
    }

    data.context = context;

    this.logger.emit(params.name, data);
};

var mapObject = function(el){
    var excludeArrays = function(el){
        for(var key in el) if (el.hasOwnProperty(key)){
            var value = el[key];
            if (Array.isArray(value)){
                el[key] = JSON.stringify(value);
            } else if (value instanceof Object){
                el[key] = excludeArrays(value);
            }
        }
        return el;
    };
    var result = JSON.parse(JSON.stringify(el));
    result = excludeArrays(result);
    return result;
};

var isObject = function(el){
    return Object.prototype.toString.call(el) === '[object Object]';
};

module.exports = exports = FluentdAdapter;