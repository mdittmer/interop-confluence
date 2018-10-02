webpackJsonp([2],{

/***/ 108:
/***/ (function(module, exports) {

// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

foam.CLASS({
  package: 'org.chromium.apis.web',
  name: 'AbstractFacetedIndexed',

  documentation: 'Abstract class for something that is faceted (stores a Class\n      in "of") and indexed according to "propertIndexGroups" property.',

  properties: [{
    class: 'Class',
    name: 'of'
  }, {
    class: 'Array',
    name: 'propertyIndexGroups',
    documentation: 'An array of arrays of properties. Each inner array\n          a property index. Strings are adapted as property names of "of";\n          strings not wrapped in an array are wrapped. E.g.,\n\n          of=SomeClass;\n          propertyIndexGroups=[\'a\', [\'b\', \'c]] adapts to:\n              [[SomeClass.A], [SomeClass.B, SomeClass.C]]',
    adapt: function adapt(_, nu) {
      var _this = this;

      return nu.map(function (maybeArr) {
        return (Array.isArray(maybeArr) ? maybeArr : [maybeArr]).map(function (strOrProp) {
          return foam.core.Property.isInstance(strOrProp) ? strOrProp : _this.of.getAxiomByName(strOrProp);
        });
      });
    }
  }]
});

foam.CLASS({
  package: 'org.chromium.apis.web',
  name: 'MDAO',
  extends: 'foam.dao.MDAO',
  implements: ['org.chromium.apis.web.AbstractFacetedIndexed'],

  documentation: 'Extension of MDAO that uses "propertyIndexGroups" to specify\n      property indices.',

  properties: [{
    name: 'promise',
    transient: true,
    factory: function factory() {
      throw new Error('Concrete JsonDAO "' + this.cls_.id + '" without required\n            promise factory');
    }
  }],

  methods: [function init() {
    var _this2 = this;

    this.SUPER();
    this.propertyIndexGroups.forEach(function (index) {
      return _this2.addPropertyIndex.apply(_this2, index);
    });
  }]
});

foam.CLASS({
  package: 'org.chromium.apis.web',
  name: 'SerializableIndexedDAO',
  extends: 'foam.dao.ProxyDAO',
  implements: ['org.chromium.apis.web.AbstractFacetedIndexed'],

  documentation: 'Base class for serializable, indexable DAO descriptions.',

  properties: [{
    class: 'foam.dao.DAOProperty',
    name: 'delegate',
    documentation: 'Transient DAO that will fetch data when instantiated.',
    transient: true
  }]
});

/***/ }),

/***/ 148:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


var _promise = __webpack_require__(61);

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

foam.CLASS({
  name: 'ClassGenerator',
  package: 'org.chromium.apis.web',

  axioms: [foam.pattern.Multiton.create({ property: 'classURL' })],

  requires: ['foam.box.ClassWhitelistContext', 'foam.net.HTTPRequest', 'foam.json.Parser'],

  properties: [{
    class: 'String',
    name: 'classURL',
    final: true,
    required: true
  }, {
    class: 'Function',
    name: 'parseURL_',
    transient: true,
    factory: function factory() {
      if (foam.isServer) {
        var url = __webpack_require__(227);
        return url.parse.bind(url);
      } else {
        return function (str) {
          return new URL(str);
        };
      }
    }
  }, {
    class: 'FObjectProperty',
    of: 'foam.json.Parser',
    name: 'parser',
    transient: true,
    factory: function factory() {
      return this.Parser.create({
        strict: true,
        creationContext: this.ClassWhitelistContext.create({
          whitelist: __webpack_require__(70)
        }, this).__subContext__
      });
    }
  }, {
    name: 'fs_',
    transient: true,
    factory: function factory() {
      foam.assert(foam.isServer, 'Attempted filesystem access from non-NodeJS context');
      return __webpack_require__(16);
    }
  }, {
    name: 'clsPromise_',
    transient: true,
    value: null
  }],

  methods: [{
    name: 'generateClass',
    code: function code() {
      var _this = this;

      this.validate();

      if (this.clsPromise_) {
        return this.clsPromise_;
      }

      return this.clsPromise_ = this.loadSpec_().then(function (specStr) {
        var model = _this.parser.parseClassFromString(specStr, foam.core.Model);
        model.validate();
        var cls = model.buildClass();
        cls.validate();
        foam.register(cls);
        foam.package.registerClass(cls);
        return cls;
      });
    }
  }, {
    name: 'loadSpec_',
    code: function code() {
      var _this2 = this;

      var url = void 0;
      try {
        url = this.parseURL_(this.classURL);
      } catch (err) {
        return _promise2.default.reject(err);
      }

      // TODO(markdittmer): "http:" should only be allowed in dev mode.
      if (url.protocol === 'https:' || url.protocol === 'http:') {
        return this.HTTPRequest.create({
          url: this.classURL
        }).send().then(function (resp) {
          return resp.payload;
        }).then(function (strOrBuffer) {
          return strOrBuffer.toString();
        });
      } else if (url.protocol === 'file:') {
        return new _promise2.default(function (resolve, reject) {
          _this2.fs_.readFile(url.pathname, function (err, data) {
            if (err) {
              reject(err);
            } else {
              resolve(data.toString());
            }
          });
        });
      } else {
        return _promise2.default.reject(new Error('Invalid URL protocol: "' + url.protocol + '"'));
      }
    }
  }]
});

/***/ }),

/***/ 21:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


__webpack_require__(42);
__webpack_require__(43);
__webpack_require__(41);
__webpack_require__(24);

foam.CLASS({
  name: 'CompatProperty',
  package: 'org.chromium.apis.web',
  extends: 'foam.core.Boolean',

  documentation: 'A Boolean property that contains a browser release as\n      metadata. This pattern is used for per-API compat data.',

  requires: ['org.chromium.apis.web.Release'],

  css: '\n    .org-chromium-apis-web-CompatProperty {\n      display: flex;\n      justify-content: center;\n      align-items: center;\n    }\n\n    .org-chromium-apis-web-CompatProperty.false {\n      background-color: #FF8A80;\n    }\n\n    .org-chromium-apis-web-CompatProperty.true {\n      background-color: #B9F6CA;\n    }\n  ',

  properties: [{
    class: 'FObjectProperty',
    of: 'org.chromium.apis.web.Release',
    name: 'release',
    documentation: 'The browser release associated with this property.'
  }, {
    name: 'rawTableCellFormatter',
    documentation: 'A raw markup outputter for table cells outputting this\n          property\'s value.',
    value: function value(_value, obj, axiom) {
      // Apply CSS class associated with this FOAM class.
      var cls = 'org-chromium-apis-web-CompatProperty';
      // Apply CSS class associated with value.
      var valueCls = _value === true ? 'true' : _value === false ? 'false' : '';
      // Select Material icon text for checkmark, X, or hourglass (loading),
      // according to value.
      //
      // See https://material.io/icons/
      var iconValue = _value === true ? 'check' : _value === false ? 'clear' : 'hourglass_empty';

      return '\n          <div class="' + cls + ' ' + valueCls + '">\n            <span class="material-icons">' + iconValue + '</span>\n          </div>\n        ';
    }
  }],

  methods: [{
    name: 'toString',
    documentation: 'Provide something more useful than\n          [FOAM class package path] as string representation',
    code: function code() {
      return this.name;
    }
  }]
});

foam.CLASS({
  name: 'AbstractApiCompatData',
  package: 'org.chromium.apis.web',

  requires: ['org.chromium.apis.web.CompatProperty'],

  documentation: 'Abstract class underpinning generated API compat data class\n\n      This class is the basis for a generated class with a CompatProperty per\n      release, detailing all the browser compatability data for a single\n      API. This representation of the compat data is well aligned with FOAM\n      features such as U2 table views, query parsers, MDAO indices, etc..',

  properties: [{
    class: 'String',
    name: 'id',
    documentation: 'ID of each datum is composed from interface + interface\n          member name. Markup outputter enables CSS overlay pattern to\n          conditionally overlay ID text over other table cells.',
    label: 'API',
    expression: function expression(interfaceName, apiName) {
      return interfaceName + '#' + apiName;
    },
    hidden: true,
    rawTableCellFormatter: function rawTableCellFormatter(value, obj, axiom) {
      var textValue = foam.String.isInstance(value) ? value : '&nbsp;';
      return '\n          <div class="id">\n            <div class="overlay">' + textValue + '</div>\n            <div class="ellipsis"><span>' + textValue + '</span></div>\n          </div>\n        ';
    }
  }, {
    class: 'String',
    name: 'interfaceName',
    required: true
  }, {
    class: 'String',
    name: 'apiName',
    required: true
  }]
});

foam.CLASS({
  name: 'AbstractCompatClassGenerator',
  package: 'org.chromium.apis.web',

  documentation: 'Component that encapsulates logic for generating a compat\n      data class based on a collection of known releases.',

  axioms: [foam.pattern.Singleton.create()],

  methods: [{
    name: 'generateSpec',
    documentation: 'Generate the "spec" that would be passed to foam.CLASS()\n          to declare a class of given [pkg].[name], based on given releases.',
    code: function code(pkg, name, releases) {
      var _this = this;

      var spec = {
        class: 'Model',
        package: pkg,
        name: name,
        extends: 'org.chromium.apis.web.AbstractApiCompatData',

        requires: ['org.chromium.apis.web.CompatProperty'],

        properties: []
      };

      var propSpecs = releases.map(function (release) {
        return {
          class: 'org.chromium.apis.web.CompatProperty',
          name: _this.propertyNameFromRelease(release),
          label: _this.propertyLabelFromRelease(release),
          release: release
        };
      });
      spec.properties = spec.properties.concat(propSpecs);

      return spec;
    }
  }, {
    name: 'generateClass',
    documentation: 'Generate a class based on a spec or foam.core.Model. The\n          former is used during data generation phase; the latter is used when\n          loading a model for existing data.',
    code: function code(specOrModel) {
      if (foam.core.Model.isInstance(specOrModel)) {
        // Run post-model instantiation steps from:
        // https://github.com/foam-framework/foam2/blob/632c6467c0a7f123a2270cc549db5d8e3d93b574/src/foam/core/Boot.js#L201
        var model = specOrModel;
        model.validate();
        var cls = model.buildClass();
        cls.validate();
        foam.register(cls);
        foam.package.registerClass(cls);
        return cls;
      } else {
        // Declare class from spec as usual.
        var spec = specOrModel;
        foam.CLASS(spec);
        return foam.lookup(spec.package + '.' + spec.name);
      }
    }
  }, {
    name: 'propertyNameFromRelease',
    documentation: 'Produce a consistent property name from a release object.\n          The property is used to store compat data for the release.',
    code: function code(release) {
      return (release.browserName.charAt(0).toLowerCase() + release.browserName.substr(1) + release.browserVersion + release.osName.charAt(0).toLowerCase() + release.osName.substr(1) + release.osVersion).replace(/[^a-z0-9]/ig, '_');
    }
  }, {
    name: 'propertyLabelFromRelease',
    documentation: 'Produce a label for use in UIs displaying compat data for\n          the given release.',
    code: function code(release) {
      return release.browserName + ' ' + release.browserVersion + ' ' + release.osName + ' ' + release.osVersion;
    }
  }]
});

foam.CLASS({
  name: 'CompatClassGenerator',
  package: 'org.chromium.apis.web',
  extends: 'org.chromium.apis.web.AbstractCompatClassGenerator',

  documentation: 'Singleton AbstractCompatClassGenerator',

  axioms: [foam.pattern.Singleton.create()]
});

/***/ }),

/***/ 24:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


foam.CLASS({
  name: 'Release',
  package: 'org.chromium.apis.web',
  ids: ['releaseKey'],

  constants: {
    // HACK(markdittmer): A bunch of Safari data were collected before userAgent
    // scraping fetched the Safari version number (rather than the WebKit
    // version number). This constant provides version number translation.
    FRIENDLY_BROWSER_VERSIONS: {
      Safari: {
        '534': '5.1',
        '536': '6.0',
        '537.43': '6.1',
        '537.71': '7.0',
        '537.73': '7.0',
        '537.75': '7.0',
        '537.76': '7.0',
        '537.77': '7.0',
        '537.78': '7.0',
        '537.85': '7.1',
        '538': '8.0',
        '600': '8.0',
        '601.1': '9.0',
        '601.2': '9.0',
        '601.3': '9.0',
        '601.4': '9.0',
        '601.5': '9.1',
        '601.6': '9.1',
        '601.7': '9.1',
        '602': '10.0',
        '603': '10.1'
      }
    }
  },

  properties: [{
    class: 'String',
    name: 'browserName',
    documentation: 'The name of release.',
    required: true,
    final: true
  }, {
    class: 'String',
    name: 'browserVersion',
    documentation: 'The version of release.',
    required: true,
    final: true
  }, {
    class: 'String',
    name: 'friendlyBrowserVersion',
    transient: true,
    getter: function getter() {
      var names = this.FRIENDLY_BROWSER_VERSIONS;
      if (!names[this.browserName]) return this.browserVersion;
      var versionNames = names[this.browserName];
      var version = this.browserVersion.split('.');
      for (var i = 1; i <= version.length; i++) {
        var versionStr = version.slice(0, i).join('.');
        if (versionNames[versionStr]) return versionNames[versionStr];
      }
      return this.browserVersion;
    }
  }, {
    class: 'String',
    name: 'osName',
    documentation: 'The name of operating system as reported by the\n        object-graph-js library.',
    required: true,
    final: true
  }, {
    class: 'String',
    name: 'osVersion',
    documentation: 'The version of operating system as reported by the\n        object-graph-js library.',
    required: true,
    final: true
  }, {
    class: 'String',
    name: 'releaseKey',
    documentation: 'An unique key for this release. Avoid the need for\n        CONCAT mLang or similar to be able to groupBy browserName,\n        browserVersion, osName, osVersion.',
    expression: function expression(browserName, browserVersion, osName, osVersion) {
      return browserName + '_' + browserVersion + '_' + osName + '_' + osVersion;
    }
  }, {
    class: 'Date',
    name: 'releaseDate',
    documentation: 'The date when this version is released.',
    // Provide default releaseDate; default object should not have undefined.
    factory: function factory() {
      return new Date(0);
    }
  }, {
    class: 'Boolean',
    name: 'isMobile',
    documentation: 'Is this a mobile release?',
    expression: function expression(osName) {
      return osName === 'Android' || osName === 'iPhone';
    },
    transient: true
  }]
});

/***/ }),

/***/ 36:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


foam.CLASS({
  name: 'ActionView',
  package: 'org.chromium.apis.web',
  extends: 'foam.u2.Element',

  css: '\n    ^ {\n      position: relative;\n    }\n\n    ^label {\n      color: inherit;\n      -webkit-user-select: none;\n      -moz-user-select: none;\n      -ms-user-select: none;\n      user-select: none;\n      display: inline-block;\n      padding: 1rem;\n    }\n\n    ^label:hover {\n      background-color: rgba(255, 255, 255, 0.2);\n      cursor: pointer;\n    }\n\n    ^unavailable {\n      display: none;\n    }\n\n    ^disabled {\n      opacity: 0.5;\n    }\n\n    /*\n    * Old behaviour: Display greyed-out disabled buttons\n    *\n    ^disabled, ^disabled^label:hover {\n      filter: opacity(0.4);\n      background-color: inherit;\n    }\n    */\n  ',

  properties: ['data', 'action', {
    name: 'icon',
    expression: function expression(action) {
      return action.icon || action.name;
    }
  }],

  methods: [function initE() {
    var label = this.E('i').addClass('material-icons').addClass(this.myClass('label')).add(this.icon);

    this.nodeName = 'span';
    this.addClass(this.myClass()).addClass(this.myClass(this.action.name)).add(label).on('click', this.onClick);

    if (this.action.isAvailable) {
      label.enableClass(this.myClass('unavailable'), this.action.createIsAvailable$(this.data$), true /* negate */);
    }
    if (this.action.isEnabled) {
      var isEnabled = this.action.createIsEnabled$(this.data$);
      this.attrs({
        disabled: isEnabled.map(function (e) {
          return e ? false : 'disabled';
        })
      });
      label.enableClass(this.myClass('disabled'), isEnabled, true /* negate */);
    }
  }],

  listeners: [function onClick() {
    this.action.maybeCall(this.__subContext__, this.data);
  }]
});

/***/ }),

/***/ 397:
/***/ (function(module, exports, __webpack_require__) {

var _regenerator = __webpack_require__(486);

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = __webpack_require__(61);

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

__webpack_require__(432);
__webpack_require__(148);
__webpack_require__(434);
var pkg = org.chromium.apis.web;

var classURL = location.origin + location.pathname.substring(0, location.pathname.lastIndexOf('/')) + '/interop/class:org.chromium.apis.web.generated.InteropData.json';
var url = location.origin + location.pathname.substring(0, location.pathname.lastIndexOf('/')) + '/interop/org.chromium.apis.web.generated.InteropData.json';

var inputReducer = void 0;
var outputOutput = void 0;
var btnRun = void 0;

(function _callee2() {
  var load, InteropData, dao, props;
  return _regenerator2.default.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          load = new _promise2.default(function (resolve, reject) {
            document.addEventListener('DOMContentLoaded', function (e) {
              inputReducer = document.querySelector('#input-reducer');
              outputOutput = document.querySelector('#output-output');
              btnRun = document.querySelector('#btn-run');
              console.log(inputReducer, outputOutput, btnRun);
              resolve();
            });
          });
          _context2.next = 3;
          return _regenerator2.default.awrap(pkg.ClassGenerator.create({
            classURL: classURL
          }).generateClass());

        case 3:
          InteropData = _context2.sent;
          dao = pkg.HttpJsonDAO.create({
            safeProtocols: [location.protocol],
            safeHostnames: [location.hostname],
            safePathPrefixes: ['/interop/'],
            of: InteropData,
            url: url
          });
          _context2.next = 7;
          return _regenerator2.default.awrap(_promise2.default.all([load, dao.limit(1).select()]));

        case 7:
          props = InteropData.getAxiomsByClass(pkg.InteropProperty);


          btnRun.addEventListener('click', function _callee() {
            var _f, sink;

            return _regenerator2.default.async(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    _f = eval('(function() {' + inputReducer.value + '})()');
                    _context.next = 3;
                    return _regenerator2.default.awrap(dao.where({
                      f: function f(data) {
                        var v = void 0;
                        for (var i = 0; i < props.length; i++) {
                          v = _f(v, props[i].f(data), i, props.length, props[i].releaseDate, foam.json.objectify(props[i].releases));
                        }
                        return v;
                      },
                      toDisjunctiveNormalForm: function toDisjunctiveNormalForm() {
                        return this;
                      }
                    }).select());

                  case 3:
                    sink = _context.sent;


                    outputOutput.textContent = sink.array.map(function (data) {
                      return data.id;
                    }).join('\n');

                  case 5:
                  case 'end':
                    return _context.stop();
                }
              }
            }, null, undefined);
          });
          btnRun.removeAttribute('disabled');

        case 10:
        case 'end':
          return _context2.stop();
      }
    }
  }, null, undefined);
})();

/***/ }),

/***/ 41:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


__webpack_require__(36);

foam.CLASS({
  refines: 'foam.core.Action',

  requires: ['org.chromium.apis.web.ActionView'],

  methods: [function toE(args, X) {
    var view = foam.u2.ViewSpec.createView({
      class: 'org.chromium.apis.web.ActionView',
      action: this
    }, args, this, X);

    if (X.data$ && !(args && (args.data || args.data$))) {
      view.data$ = X.data$;
    }

    return view;
  }]
});

/***/ }),

/***/ 42:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


// Refine foam.Object.equals to recursively check own object keys. This is
// necessary for dealing with plain objects in URL state comparisons.

foam.LIB({
  name: 'foam.Object',

  methods: [function equals(a, b) {
    var keys = {};
    if (!foam.Object.isInstance(b)) return false;
    for (var key in a) {
      if (!a.hasOwnProperty(key)) continue;
      if (!foam.util.equals(a[key], b[key])) return false;
      keys[key] = true;
    }
    for (var _key in b) {
      if (keys[_key] || !b.hasOwnProperty(_key)) continue;
      if (!foam.util.equals(a[_key], b[_key])) return false;
    }
    return true;
  }]
});

/***/ }),

/***/ 43:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


var _typeof2 = __webpack_require__(155);

var _typeof3 = _interopRequireDefault(_typeof2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

foam.CLASS({
  name: 'Property',
  package: 'org.chromium.apis.web',
  refines: 'foam.core.Property',

  documentation: 'Refine properties to contain a rawTableCellFormatter()\n      function that can be leveraged by foam.u2.RowFormatters to delegate\n      outputting individual table cells.',

  properties: [{
    class: 'Function',
    name: 'rawTableCellFormatter',
    value: function value(_value, obj, axiom) {
      return '<div>\n          [unformatted ' + (_value === null ? 'null' : typeof _value === 'undefined' ? 'undefined' : (0, _typeof3.default)(_value)) + ' value]\n        </div>';
    }
  }, {
    class: 'String',
    name: 'gridTemplateColumn',
    value: '1fr'
  }]
});

/***/ }),

/***/ 432:
/***/ (function(module, exports, __webpack_require__) {

var _promise = __webpack_require__(61);

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

__webpack_require__(108);

foam.CLASS({
  package: 'org.chromium.apis.web',
  name: 'HttpJsonDAO',
  extends: 'foam.dao.PromisedDAO',
  implements: ['org.chromium.apis.web.AbstractFacetedIndexed'],

  documentation: 'DAO that fetches a JSON array via HTTP.',

  requires: ['foam.box.ClassWhitelistContext', 'foam.json.Parser', 'foam.net.HTTPRequest', 'org.chromium.apis.web.MDAO'],

  constants: {
    ERROR_URL: 'https://storage.googleapis.com/web-api-confluence-data-cache/does-not-exist'
  },

  properties: [{
    class: 'String',
    name: 'url',
    documentation: 'Location of file containing JSON array.',
    required: true
  }, {
    class: 'Array',
    of: 'String',
    name: 'safeProtocols',
    required: true
  }, {
    class: 'Array',
    of: 'String',
    name: 'safeHostnames',
    required: true
  }, {
    class: 'Array',
    of: 'String',
    name: 'safePathPrefixes',
    required: true
  }, {
    class: 'FObjectProperty',
    of: 'foam.json.Parser',
    name: 'parser',
    transient: true,
    factory: function factory() {
      // NOTE: Configuration must be consistent with outputters in
      // corresponding foam.dao.RestDAO.
      return this.Parser.create({
        strict: true,
        creationContext: this.ClassWhitelistContext.create({
          whitelist: __webpack_require__(70)
        }, this).__subContext__
      });
    }
  }, {
    class: 'Function',
    name: 'createURL',
    documentation: 'Platform-independent URL factory function.',
    transient: true,
    factory: function factory() {
      return foam.isServer ? function (str) {
        return __webpack_require__(227).parse(str);
      } : function (str) {
        return new URL(str);
      };
    }
  }, {
    name: 'promise',
    transient: true,
    factory: function factory() {
      var _this = this;

      try {
        this.validate();
      } catch (error) {
        return _promise2.default.reject(error);
      }

      var url = this.url;
      return this.HTTPRequest.create({
        url: url,
        responseType: 'text'
      }).send().then(function (response) {
        if (response.status !== 200) throw response;
        return response.payload;
      }).then(function (jsonStr) {
        var array = _this.parser.parseClassFromString(jsonStr, _this.of);
        foam.assert(Array.isArray(array), 'HttpJsonDAO: Expected array');

        var dao = _this.MDAO.create({
          of: _this.of,
          propertyIndexGroups: _this.propertyIndexGroups
        });

        // Recontextualize items in DAO context. Safe to resolve immediately
        // because MDAO.put() is synchronous.
        array.forEach(function (item) {
          return dao.put(item.clone(dao));
        });

        return dao;
      });
    }
  }],

  methods: [function validate() {
    this.SUPER();
    var url = this.url;
    if (!foam.String.isInstance(url)) throw new Error('HttpJsonDAO: URL is not a String');
    if (!this.urlIsSafe(this.createURL(url))) throw new Error('HttpJsonDAO: URL is not safe: ' + url);
  }, function urlIsSafe(url) {
    return this.safeProtocols.includes(url.protocol) && this.safeHostnames.includes(url.hostname) && this.safePathPrefixes.some(function (prefix) {
      return url.pathname.startsWith(prefix);
    });
  }]
});

foam.CLASS({
  package: 'org.chromium.apis.web',
  name: 'SerializableHttpJsonDAO',
  extends: 'org.chromium.apis.web.SerializableIndexedDAO',

  documentation: 'A proxy that can be instantiated as a HttpJsonDAO\n      configuration (without fetching data) in one context, and then deployed\n      (by fetching data) in another. This is achieved by using a lazy factory\n      on a transient "delegate" property; only in contexts where the "delegate"\n      property is accessed will fetch data.',

  requires: ['org.chromium.apis.web.HttpJsonDAO'],

  properties: [{
    class: 'String',
    name: 'url',
    documentation: 'Configuration passed to delegate.',
    required: true
  }, {
    class: 'Array',
    of: 'String',
    name: 'safeProtocols',
    factory: function factory() {
      return ['https:'];
    }
  }, {
    class: 'Array',
    of: 'String',
    name: 'safeHostnames',
    factory: function factory() {
      return ['localhost', 'storage.googleapis.com'];
    }
  }, {
    class: 'Array',
    of: 'String',
    name: 'safePathPrefixes',
    factory: function factory() {
      return ['/web-api-confluence-data-cache/'];
    }
  }, {
    name: 'delegate',
    factory: function factory() {
      this.validate();
      return foam.lookup('org.chromium.apis.web.HttpJsonDAO').create({
        of: this.of,
        propertyIndexGroups: this.propertyIndexGroups,
        url: this.url,
        safeProtocols: this.safeProtocols,
        safeHostnames: this.safeHostnames,
        safePathPrefixes: this.safePathPrefixes
      });
    }
  }]
});

/***/ }),

/***/ 434:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


var _from = __webpack_require__(25);

var _from2 = _interopRequireDefault(_from);

var _getIterator2 = __webpack_require__(17);

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _map = __webpack_require__(154);

var _map2 = _interopRequireDefault(_map);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

__webpack_require__(41);
__webpack_require__(42);
__webpack_require__(43);
__webpack_require__(21);
__webpack_require__(24);

foam.CLASS({
  name: 'InteropProperty',
  package: 'org.chromium.apis.web',
  extends: 'foam.core.Int',

  documentation: 'An integer property that contains a the number of releases.',

  requires: ['org.chromium.apis.web.Release'],

  properties: [{
    class: 'FObjectArray',
    of: 'org.chromium.apis.web.Release',
    name: 'releases',
    documentation: 'The browser releases associated with this property.'
  }, {
    class: 'Date',
    name: 'releaseDate'
  }]
});

foam.CLASS({
  name: 'InteropPropertyGenerator',
  package: 'org.chromium.apis.web',

  properties: [{
    class: 'FObjectArray',
    of: 'org.chromium.apis.web.Release',
    name: 'releases',
    required: true
  }, {
    name: 'releaseSeqNos_',
    expression: function expression(releases) {
      var dateMap = new _map2.default();
      var relMap = new _map2.default();
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = (0, _getIterator3.default)(releases), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var release = _step.value;

          var dateKey = release.releaseDate.getTime();
          if (typeof dateMap.get(dateKey) !== 'number') {
            dateMap.set(dateKey, 0);
          }
          var num = dateMap.get(dateKey);
          relMap.set(release.id, num);
          dateMap.set(dateKey, num + 1);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return relMap;
    }
  }],

  methods: [{
    name: 'propertyNameFromRelease',
    code: function code(release) {
      return 'r' + release.releaseDate.getTime() + '_' + this.releaseSeqNos_.get(release.id);
    }
  }, {
    name: 'propertyLabelFromRelease',
    code: function code(release) {
      return release.releaseDate.toDateString() + ' #' + this.releaseSeqNos_.get(release.id);
    }
  }]
});

foam.CLASS({
  name: 'AbstractInteropClassGenerator',
  package: 'org.chromium.apis.web',

  requires: ['org.chromium.apis.web.InteropPropertyGenerator', 'org.chromium.apis.web.generated.CompatData'],

  methods: [{
    name: 'generateSpec',
    // NOTE: Releases must be in a deterministiccronological release date order.
    code: function code(pkg, name, releases) {
      var gen = this.InteropPropertyGenerator.create({ releases: releases });
      var spec = {
        class: 'Model',
        package: pkg,
        name: name,
        extends: 'org.chromium.apis.web.AbstractApiCompatData',

        requires: ['org.chromium.apis.web.InteropProperty'],

        properties: []
      };

      var propSpecs = [];
      var currentReleasesMap = new _map2.default();
      var i = void 0;
      for (i = 0; currentReleasesMap.size < 4; i++) {
        currentReleasesMap.set(releases[i].browserName, releases[i]);
      }

      for (i--; i < releases.length; i++) {
        var release = releases[i];
        currentReleasesMap.set(release.browserName, release);
        var currentReleases = (0, _from2.default)(currentReleasesMap.values());
        var cols = [];
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = (0, _getIterator3.default)(currentReleases), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var _release = _step2.value;

            cols.push(this.CompatData.getAxiomByName(gen.propertyNameFromRelease(_release)));
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }

        propSpecs.push({
          class: 'org.chromium.apis.web.InteropProperty',
          name: gen.propertyNameFromRelease(release),
          label: gen.propertyLabelFromRelease(release),
          releases: (0, _from2.default)(currentReleases),
          releaseDate: release.releaseDate
        });
      }

      spec.properties = spec.properties.concat(propSpecs);

      return spec;
    }
  }, {
    name: 'generateClass',
    documentation: 'Generate a class based on a spec or foam.core.Model. The\n          former is used during data generation phase; the latter is used when\n          loading a model for existing data.',
    code: function code(specOrModel) {
      if (foam.core.Model.isInstance(specOrModel)) {
        // Run post-model instantiation steps from:
        // https://github.com/foam-framework/foam2/blob/632c6467c0a7f123a2270cc549db5d8e3d93b574/src/foam/core/Boot.js#L201
        var model = specOrModel;
        model.validate();
        var cls = model.buildClass();
        cls.validate();
        foam.register(cls);
        foam.package.registerClass(cls);
        return cls;
      } else {
        // Declare class from spec as usual.
        var spec = specOrModel;
        foam.CLASS(spec);
        return foam.lookup(spec.package + '.' + spec.name);
      }
    }
  }]
});

foam.CLASS({
  name: 'InteropClassGenerator',
  package: 'org.chromium.apis.web',
  extends: 'org.chromium.apis.web.AbstractInteropClassGenerator',

  documentation: 'Singleton AbstractInteropClassGenerator',

  axioms: [foam.pattern.Singleton.create()]
});

/***/ }),

/***/ 70:
/***/ (function(module, exports) {

module.exports = ["FObject","Property","Requires","String","__Property__","com.google.cloud.datastore.DatastoreMutation","foam.box.Box","foam.box.EventMessage","foam.box.Message","foam.box.NamedBox","foam.box.RPCErrorMessage","foam.box.RPCMessage","foam.box.RPCReturnMessage","foam.box.RawSocketBox","foam.box.RegisterSelfMessage","foam.box.ReplyBox","foam.box.ReturnBox","foam.box.SkeletonBox","foam.box.SocketBox","foam.box.SocketConnectBox","foam.box.SubBox","foam.box.SubBoxMessage","foam.core.FObject","foam.core.Property","foam.core.Requires","foam.core.String","foam.dao.ArraySink","foam.dao.ClientSink","foam.dao.DAO","foam.dao.MergedResetSink","foam.dao.ProxyListener","foam.mlang.Constant","foam.mlang.expr.Dot","foam.mlang.order.Comparator","foam.mlang.order.Desc","foam.mlang.order.ThenBy","foam.mlang.predicate.And","foam.mlang.predicate.Contains","foam.mlang.predicate.ContainsIC","foam.mlang.predicate.Eq","foam.mlang.predicate.False","foam.mlang.predicate.Gt","foam.mlang.predicate.Gte","foam.mlang.predicate.Has","foam.mlang.predicate.In","foam.mlang.predicate.InIC","foam.mlang.predicate.Keyword","foam.mlang.predicate.Lt","foam.mlang.predicate.Lte","foam.mlang.predicate.Neq","foam.mlang.predicate.Not","foam.mlang.predicate.Or","foam.mlang.predicate.StartsWith","foam.mlang.predicate.StartsWithIC","foam.mlang.predicate.True","foam.mlang.sink.Count","foam.mlang.sink.GroupBy","foam.mlang.sink.Max","foam.mlang.sink.Min","foam.mlang.sink.NullSink","foam.mlang.sink.Sum","foam.mlang.sink.Unique","org.chromium.apis.web.generated.CompatData","org.chromium.apis.web.AbstractApiCompatData","org.chromium.apis.web.ApiExtractorService","org.chromium.apis.web.ApiCountData","org.chromium.apis.web.BrowserMetricData","org.chromium.apis.web.BrowserMetricDataType","org.chromium.apis.web.CompatProperty","org.chromium.apis.web.InteropProperty","org.chromium.apis.web.ConfluenceSyncDAO","org.chromium.apis.web.DataLoadedEvent","org.chromium.apis.web.MetricComputerService","org.chromium.apis.web.MetricComputerType","org.chromium.apis.web.Release","org.chromium.apis.web.ReleaseWebInterfaceJunction","org.chromium.apis.web.SerializableHttpJsonDAO","org.chromium.apis.web.SerializableLocalJsonDAO","org.chromium.apis.web.VersionedApiCountData","org.chromium.apis.web.VersionedBrowserMetricData","org.chromium.apis.web.VersionedRelease","org.chromium.apis.web.VersionedReleaseWebInterfaceJunction","org.chromium.apis.web.VersionedWebInterface","org.chromium.apis.web.WebInterface","org.chromium.apis.web.WorkerDAO","org.chromium.mlang.ArrayCount","org.chromium.mlang.Seq","org.chromium.mlang.Truthy"]

/***/ }),

/***/ 884:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(397);


/***/ })

},[884]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9saWIvZGFvL2luZGV4ZWRfZGFvLmVzNi5qcz8xNGUxIiwid2VicGFjazovLy8uL2xpYi9jb21wYXQuZXM2LmpzP2E2MjYiLCJ3ZWJwYWNrOi8vLy4vbGliL3dlYl9hcGlzL2FwaV9jb21wYXRfZGF0YS5lczYuanM/YzZjMioiLCJ3ZWJwYWNrOi8vLy4vbGliL3dlYl9hcGlzL3JlbGVhc2UuZXM2LmpzPzcxYjEqIiwid2VicGFjazovLy8uL2xpYi91Mi9BY3Rpb25WaWV3LmVzNi5qcz9iNTllKiIsIndlYnBhY2s6Ly8vLi9tYWluL2ludGVyb3AuZXM2LmpzIiwid2VicGFjazovLy8uL2xpYi9hY3Rpb24uZXM2LmpzP2RlYjAqIiwid2VicGFjazovLy8uL2xpYi9vYmplY3QuZXM2LmpzPzVhOTYqIiwid2VicGFjazovLy8uL2xpYi9wcm9wZXJ0eS5lczYuanM/NDZhNioiLCJ3ZWJwYWNrOi8vLy4vbGliL2Rhby9odHRwX2pzb25fZGFvLmVzNi5qcyIsIndlYnBhY2s6Ly8vLi9saWIvd2ViX2FwaXMvYXBpX2ludGVyb3BfZGF0YS5lczYuanMiLCJ3ZWJwYWNrOi8vLy4vZGF0YS9jbGFzc193aGl0ZWxpc3QuanNvbj8zYTRkIl0sIm5hbWVzIjpbImZvYW0iLCJDTEFTUyIsInBhY2thZ2UiLCJuYW1lIiwiZG9jdW1lbnRhdGlvbiIsInByb3BlcnRpZXMiLCJjbGFzcyIsImFkYXB0IiwiXyIsIm51IiwibWFwIiwiQXJyYXkiLCJpc0FycmF5IiwibWF5YmVBcnIiLCJjb3JlIiwiUHJvcGVydHkiLCJpc0luc3RhbmNlIiwic3RyT3JQcm9wIiwib2YiLCJnZXRBeGlvbUJ5TmFtZSIsImV4dGVuZHMiLCJpbXBsZW1lbnRzIiwidHJhbnNpZW50IiwiZmFjdG9yeSIsIkVycm9yIiwiY2xzXyIsImlkIiwibWV0aG9kcyIsImluaXQiLCJTVVBFUiIsInByb3BlcnR5SW5kZXhHcm91cHMiLCJmb3JFYWNoIiwiYWRkUHJvcGVydHlJbmRleCIsImFwcGx5IiwiaW5kZXgiLCJheGlvbXMiLCJwYXR0ZXJuIiwiTXVsdGl0b24iLCJjcmVhdGUiLCJwcm9wZXJ0eSIsInJlcXVpcmVzIiwiZmluYWwiLCJyZXF1aXJlZCIsImlzU2VydmVyIiwidXJsIiwicmVxdWlyZSIsInBhcnNlIiwiYmluZCIsIlVSTCIsInN0ciIsIlBhcnNlciIsInN0cmljdCIsImNyZWF0aW9uQ29udGV4dCIsIkNsYXNzV2hpdGVsaXN0Q29udGV4dCIsIndoaXRlbGlzdCIsIl9fc3ViQ29udGV4dF9fIiwiYXNzZXJ0IiwidmFsdWUiLCJjb2RlIiwidmFsaWRhdGUiLCJjbHNQcm9taXNlXyIsImxvYWRTcGVjXyIsInRoZW4iLCJtb2RlbCIsInBhcnNlciIsInBhcnNlQ2xhc3NGcm9tU3RyaW5nIiwic3BlY1N0ciIsIk1vZGVsIiwiY2xzIiwiYnVpbGRDbGFzcyIsInJlZ2lzdGVyIiwicmVnaXN0ZXJDbGFzcyIsInBhcnNlVVJMXyIsImNsYXNzVVJMIiwiZXJyIiwicmVqZWN0IiwicHJvdG9jb2wiLCJIVFRQUmVxdWVzdCIsInNlbmQiLCJyZXNwIiwicGF5bG9hZCIsInN0ck9yQnVmZmVyIiwidG9TdHJpbmciLCJyZXNvbHZlIiwiZnNfIiwicmVhZEZpbGUiLCJwYXRobmFtZSIsImRhdGEiLCJjc3MiLCJvYmoiLCJheGlvbSIsInZhbHVlQ2xzIiwiaWNvblZhbHVlIiwibGFiZWwiLCJleHByZXNzaW9uIiwiaW50ZXJmYWNlTmFtZSIsImFwaU5hbWUiLCJoaWRkZW4iLCJyYXdUYWJsZUNlbGxGb3JtYXR0ZXIiLCJ0ZXh0VmFsdWUiLCJTdHJpbmciLCJTaW5nbGV0b24iLCJwa2ciLCJyZWxlYXNlcyIsInNwZWMiLCJwcm9wU3BlY3MiLCJwcm9wZXJ0eU5hbWVGcm9tUmVsZWFzZSIsInJlbGVhc2UiLCJwcm9wZXJ0eUxhYmVsRnJvbVJlbGVhc2UiLCJjb25jYXQiLCJzcGVjT3JNb2RlbCIsImxvb2t1cCIsImJyb3dzZXJOYW1lIiwiY2hhckF0IiwidG9Mb3dlckNhc2UiLCJzdWJzdHIiLCJicm93c2VyVmVyc2lvbiIsIm9zTmFtZSIsIm9zVmVyc2lvbiIsInJlcGxhY2UiLCJpZHMiLCJjb25zdGFudHMiLCJGUklFTkRMWV9CUk9XU0VSX1ZFUlNJT05TIiwiU2FmYXJpIiwiZ2V0dGVyIiwibmFtZXMiLCJ2ZXJzaW9uTmFtZXMiLCJ2ZXJzaW9uIiwic3BsaXQiLCJpIiwibGVuZ3RoIiwidmVyc2lvblN0ciIsInNsaWNlIiwiam9pbiIsIkRhdGUiLCJhY3Rpb24iLCJpY29uIiwiaW5pdEUiLCJFIiwiYWRkQ2xhc3MiLCJteUNsYXNzIiwiYWRkIiwibm9kZU5hbWUiLCJvbiIsIm9uQ2xpY2siLCJpc0F2YWlsYWJsZSIsImVuYWJsZUNsYXNzIiwiY3JlYXRlSXNBdmFpbGFibGUkIiwiZGF0YSQiLCJpc0VuYWJsZWQiLCJjcmVhdGVJc0VuYWJsZWQkIiwiYXR0cnMiLCJkaXNhYmxlZCIsImUiLCJsaXN0ZW5lcnMiLCJtYXliZUNhbGwiLCJvcmciLCJjaHJvbWl1bSIsImFwaXMiLCJ3ZWIiLCJsb2NhdGlvbiIsIm9yaWdpbiIsImlucHV0UmVkdWNlciIsIm91dHB1dE91dHB1dCIsImJ0blJ1biIsImxvYWQiLCJkb2N1bWVudCIsImFkZEV2ZW50TGlzdGVuZXIiLCJxdWVyeVNlbGVjdG9yIiwiY29uc29sZSIsImxvZyIsIkNsYXNzR2VuZXJhdG9yIiwiZ2VuZXJhdGVDbGFzcyIsIkludGVyb3BEYXRhIiwiZGFvIiwiSHR0cEpzb25EQU8iLCJzYWZlUHJvdG9jb2xzIiwic2FmZUhvc3RuYW1lcyIsImhvc3RuYW1lIiwic2FmZVBhdGhQcmVmaXhlcyIsImFsbCIsImxpbWl0Iiwic2VsZWN0IiwicHJvcHMiLCJnZXRBeGlvbXNCeUNsYXNzIiwiSW50ZXJvcFByb3BlcnR5IiwiZiIsImV2YWwiLCJ3aGVyZSIsInYiLCJyZWxlYXNlRGF0ZSIsImpzb24iLCJvYmplY3RpZnkiLCJ0b0Rpc2p1bmN0aXZlTm9ybWFsRm9ybSIsInNpbmsiLCJ0ZXh0Q29udGVudCIsImFycmF5IiwicmVtb3ZlQXR0cmlidXRlIiwicmVmaW5lcyIsInRvRSIsImFyZ3MiLCJYIiwidmlldyIsInUyIiwiVmlld1NwZWMiLCJjcmVhdGVWaWV3IiwiTElCIiwiZXF1YWxzIiwiYSIsImIiLCJrZXlzIiwiT2JqZWN0Iiwia2V5IiwiaGFzT3duUHJvcGVydHkiLCJ1dGlsIiwiRVJST1JfVVJMIiwiZXJyb3IiLCJyZXNwb25zZVR5cGUiLCJyZXNwb25zZSIsInN0YXR1cyIsImpzb25TdHIiLCJNREFPIiwicHV0IiwiaXRlbSIsImNsb25lIiwidXJsSXNTYWZlIiwiY3JlYXRlVVJMIiwiaW5jbHVkZXMiLCJzb21lIiwic3RhcnRzV2l0aCIsInByZWZpeCIsImRhdGVNYXAiLCJyZWxNYXAiLCJkYXRlS2V5IiwiZ2V0VGltZSIsImdldCIsInNldCIsIm51bSIsInJlbGVhc2VTZXFOb3NfIiwidG9EYXRlU3RyaW5nIiwiZ2VuIiwiSW50ZXJvcFByb3BlcnR5R2VuZXJhdG9yIiwiY3VycmVudFJlbGVhc2VzTWFwIiwic2l6ZSIsImN1cnJlbnRSZWxlYXNlcyIsInZhbHVlcyIsImNvbHMiLCJwdXNoIiwiQ29tcGF0RGF0YSJdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQTtBQUNBO0FBQ0E7O0FBRUFBLEtBQUtDLEtBQUwsQ0FBVztBQUNUQyxXQUFTLHVCQURBO0FBRVRDLFFBQU0sd0JBRkc7O0FBSVRDLHVKQUpTOztBQU9UQyxjQUFZLENBQ1Y7QUFDRUMsV0FBTyxPQURUO0FBRUVILFVBQU07QUFGUixHQURVLEVBS1Y7QUFDRUcsV0FBTyxPQURUO0FBRUVILFVBQU0scUJBRlI7QUFHRUMsdVdBSEY7QUFVRUcsV0FBTyxlQUFTQyxDQUFULEVBQVlDLEVBQVosRUFBZ0I7QUFBQTs7QUFDckIsYUFBT0EsR0FBR0MsR0FBSCxDQUNIO0FBQUEsZUFBWSxDQUFDQyxNQUFNQyxPQUFOLENBQWNDLFFBQWQsSUFBMEJBLFFBQTFCLEdBQXFDLENBQUNBLFFBQUQsQ0FBdEMsRUFDVEgsR0FEUyxDQUNMO0FBQUEsaUJBQWFWLEtBQUtjLElBQUwsQ0FBVUMsUUFBVixDQUFtQkMs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QU0sY0FBU29ELFdBQVQsRUFBc0I7QUFDMUIsVUFBSTlHLEtBQUtjLElBQUwsQ0FBVXFELEtBQVYsQ0FBZ0JuRCxVQUFoQixDQUEyQjhGLFdBQTNCLENBQUosRUFBNkM7QUFDM0M7QUFDQTtBQUNBLFlBQU0vQyxRQUFRK0MsV0FBZDtBQUNBL0MsY0FBTUosUUFBTjtBQUNBLFlBQU1TLE1BQU1MLE1BQU1NLFVBQU4sRUFBWjtBQUNBRCxZQUFJVCxRQUFKO0FBQ0EzRCxhQUFLc0UsUUFBTCxDQUFjRixHQUFkO0FBQ0FwRSxhQUFLRSxPQUFMLENBQWFxRSxhQUFiLENBQTJCSCxHQUEzQjtBQUNBLGVBQU9BLEdBQVA7QUFDRCxPQVZELE1BVU87QUFDTDtBQUNBLFlBQU1vQyxPQUFPTSxXQUFiO0FBQ0E5RyxhQUFLQyxLQUFMLENBQVd1RyxJQUFYO0FBQ0EsZUFBT3hHLEtBQUsrRyxNQUFMLENBQWVQLEtBQUt0RyxPQUFwQixTQUErQnNHLEtBQUtyRyxJQUFwQyxDQUFQO0FBQ0Q7QUFDRjtBQXRCSCxHQWhETztBQVRBLENBQVg7O0FBb0ZBSCxLQUFLQyxLQUFMLENBQVc7QUFDVEUsUUFBTSx1QkFERztBQUVURCxXQUFTLHVCQUZBO0FBR1RrQixXQUFTLHFEQUhBOztBQUtUaEIsaUJBQWUseUNBTE47O0FBT1QrQixVQUFRLENBQUNuQyxLQUFLb0MsT0FBTCxDQUFhaUUsU0FBYixDQUF1Qi9ELE1BQXZCLEVBQUQ7QUFQQyxDQUFYLEU7Ozs7Ozs7QUNwS0EsOGlGIiwiZmlsZSI6ImludGVyb3AuYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTcgVGhlIENocm9taXVtIEF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhIEJTRC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4vLyBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlLlxuXG5mb2FtLkNMQVNTKHtcbiAgcGFja2FnZTogJ29yZy5jaHJvbWl1bS5hcGlzLndlYicsXG4gIG5hbWU6ICdBYnN0cmFjdEZhY2V0ZWRJbmRleGVkJyxcblxuICBkb2N1bWVudGF0aW9uOiBgQWJzdHJhY3QgY2xhc3MgZm9yIHNvbWV0aGluZyB0aGF0IGlzIGZhY2V0ZWQgKHN0b3JlcyBhIENsYXNzXG4gICAgICBpbiBcIm9mXCIpIGFuZCBpbmRleGVkIGFjY29yZGluZyB0byBcInByb3BlcnRJbmRleEdyb3Vwc1wiIHByb3BlcnR5LmAsXG5cbiAgcHJvcGVydGllczogW1xuICAgIHtcbiAgICAgIGNsYXNzOiAnQ2xhc3MnLFxuICAgICAgbmFtZTogJ29mJyxcbiAgICB9LFxuICAgIHtcbiAgICAgIGNsYXNzOiAnQXJyYXknLFxuICAgICAgbmFtZTogJ3Byb3BlcnR5SW5kZXhHcm91cHMnLFxuICAgICAgZG9jdW1lbnRhdGlvbjogYEFuIGFycmF5IG9mIGFycmF5cyBvZiBwcm9wZXJ0aWVzLiBFYWNoIGlubmVyIGFycmF5XG4gICAgICAgICAgYSBwcm9wZXJ0eSBpbmRleC4gU3RyaW5ncyBhcmUgYWRhcHRlZCBhcyBwcm9wZXJ0eSBuYW1lcyBvZiBcIm9mXCI7XG4gICAgICAgICAgc3RyaW5ncyBub3Qgd3JhcHBlZCBpbiBhbiBhcnJheSBhcmUgd3JhcHBlZC4gRS5nLixcblxuICAgICAgICAgIG9mPVNvbWVDbGFzcztcbiAgICAgICAgICBwcm9wZXJ0eUluZGV4R3JvdXBzPVsnYScsIFsnYicsICdjXV0gYWRhcHRzIHRvOlxuICAgICAgICAgICAgICBbW1NvbWVDbGFzcy5BXSwgW1NvbWVDbGFzcy5CLCBTb21lQ2xhc3MuQ11dYCxcbiAgICAgIGFkYXB0OiBmdW5jdGlvbihfLCBudSkge1xuICAgICAgICByZXR1cm4gbnUubWFwKFxuICAgICAgICAgICAgbWF5YmVBcnIgPT4gKEFycmF5LmlzQXJyYXkobWF5YmVBcnIpID8gbWF5YmVBcnIgOiBbbWF5YmVBcnJdKVxuICAgICAgICAgICAgICAubWFwKHN0ck9yUHJvcCA9PiBmb2FtLmNvcmUuUHJvcGVydHkuaXNJbnN0YW5jZShzdHJPclByb3ApID9cbiAgICAgICAgICAgICAgICAgICBzdHJPclByb3AgOiB0aGlzLm9mLmdldEF4aW9tQnlOYW1lKHN0ck9yUHJvcCkpKTtcbiAgICAgIH0sXG4gICAgfSxcbiAgXSxcbn0pO1xuXG5mb2FtLkNMQVNTKHtcbiAgcGFja2FnZTogJ29yZy5jaHJvbWl1bS5hcGlzLndlYicsXG4gIG5hbWU6ICdNREFPJyxcbiAgZXh0ZW5kczogJ2ZvYW0uZGFvLk1EQU8nLFxuICBpbXBsZW1lbnRzOiBbJ29yZy5jaHJvbWl1bS5hcGlzLndlYi5BYnN0cmFjdEZhY2V0ZWRJbmRleGVkJ10sXG5cbiAgZG9jdW1lbnRhdGlvbjogYEV4dGVuc2lvbiBvZiBNREFPIHRoYXQgdXNlcyBcInByb3BlcnR5SW5kZXhHcm91cHNcIiB0byBzcGVjaWZ5XG4gICAgICBwcm9wZXJ0eSBpbmRpY2VzLmAsXG5cbiAgcHJvcGVydGllczogW1xuICAgIHtcbiAgICAgIG5hbWU6ICdwcm9taXNlJyxcbiAgICAgIHRyYW5zaWVudDogdHJ1ZSxcbiAgICAgIGZhY3Rvcnk6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENvbmNyZXRlIEpzb25EQU8gXCIke3RoaXMuY2xzXy5pZH1cIiB3aXRob3V0IHJlcXVpcmVkXG4gICAgICAgICAgICBwcm9taXNlIGZhY3RvcnlgKTtcbiAgICAgIH0sXG4gICAgfSxcbiAgXSxcblxuICBtZXRob2RzOiBbXG4gICAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgIHRoaXMuU1VQRVIoKTtcbiAgICAgIHRoaXMucHJvcGVydHlJbmRleEdyb3Vwc1xuICAgICAgICAgIC5mb3JFYWNoKGluZGV4ID0+IHRoaXMuYWRkUHJvcGVydHlJbmRleC5hcHBseSh0aGlzLCBpbmRleCkpO1xuICAgIH0sXG4gIF0sXG59KTtcblxuZm9hbS5DTEFTUyh7XG4gIHBhY2thZ2U6ICdvcmcuY2hyb21pdW0uYXBpcy53ZWInLFxuICBuYW1lOiAnU2VyaWFsaXphYmxlSW5kZXhlZERBTycsXG4gIGV4dGVuZHM6ICdmb2FtLmRhby5Qcm94eURBTycsXG4gIGltcGxlbWVudHM6IFsnb3JnLmNocm9taXVtLmFwaXMud2ViLkFic3RyYWN0RmFjZXRlZEluZGV4ZWQnXSxcblxuICBkb2N1bWVudGF0aW9uOiBgQmFzZSBjbGFzcyBmb3Igc2VyaWFsaXphYmxlLCBpbmRleGFibGUgREFPIGRlc2NyaXB0aW9ucy5gLFxuXG4gIHByb3BlcnRpZXM6IFtcbiAgICB7XG4gICAgICBjbGFzczogJ2ZvYW0uZGFvLkRBT1Byb3BlcnR5JyxcbiAgICAgIG5hbWU6ICdkZWxlZ2F0ZScsXG4gICAgICBkb2N1bWVudGF0aW9uOiAnVHJhbnNpZW50IERBTyB0aGF0IHdpbGwgZmV0Y2ggZGF0YSB3aGVuIGluc3RhbnRpYXRlZC4nLFxuICAgICAgdHJhbnNpZW50OiB0cnVlLFxuICAgIH0sXG4gIF0sXG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL2xpYi9kYW8vaW5kZXhlZF9kYW8uZXM2LmpzIiwiLy8gQ29weXJpZ2h0IDIwMTcgVGhlIENocm9taXVtIEF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhIEJTRC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4vLyBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlLlxuJ3VzZSBzdHJpY3QnO1xuXG5mb2FtLkNMQVNTKHtcbiAgbmFtZTogJ0NsYXNzR2VuZXJhdG9yJyxcbiAgcGFja2FnZTogJ29yZy5jaHJvbWl1bS5hcGlzLndlYicsXG5cbiAgYXhpb21zOiBbXG4gICAgZm9hbS5wYXR0ZXJuLk11bHRpdG9uLmNyZWF0ZSh7cHJvcGVydHk6ICdjbGFzc1VSTCd9KSxcbiAgXSxcblxuICByZXF1aXJlczogW1xuICAgICdmb2FtLmJveC5DbGFzc1doaXRlbGlzdENvbnRleHQnLFxuICAgICdmb2FtLm5ldC5IVFRQUmVxdWVzdCcsXG4gICAgJ2ZvYW0uanNvbi5QYXJzZXInLFxuICBdLFxuXG4gIHByb3BlcnRpZXM6IFtcbiAgICB7XG4gICAgICBjbGFzczogJ1N0cmluZycsXG4gICAgICBuYW1lOiAnY2xhc3NVUkwnLFxuICAgICAgZmluYWw6IHRydWUsXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICB9LFxuICAgIHtcbiAgICAgIGNsYXNzOiAnRnVuY3Rpb24nLFxuICAgICAgbmFtZTogJ3BhcnNlVVJMXycsXG4gICAgICB0cmFuc2llbnQ6IHRydWUsXG4gICAgICBmYWN0b3J5OiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGZvYW0uaXNTZXJ2ZXIpIHtcbiAgICAgICAgICBjb25zdCB1cmwgPSByZXF1aXJlKCd1cmwnKTtcbiAgICAgICAgICByZXR1cm4gdXJsLnBhcnNlLmJpbmQodXJsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gc3RyID0+IG5ldyBVUkwoc3RyKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgIGNsYXNzOiAnRk9iamVjdFByb3BlcnR5JyxcbiAgICAgIG9mOiAnZm9hbS5qc29uLlBhcnNlcicsXG4gICAgICBuYW1lOiAncGFyc2VyJyxcbiAgICAgIHRyYW5zaWVudDogdHJ1ZSxcbiAgICAgIGZhY3Rvcnk6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5QYXJzZXIuY3JlYXRlKHtcbiAgICAgICAgICBzdHJpY3Q6IHRydWUsXG4gICAgICAgICAgY3JlYXRpb25Db250ZXh0OiB0aGlzLkNsYXNzV2hpdGVsaXN0Q29udGV4dC5jcmVhdGUoe1xuICAgICAgICAgICAgd2hpdGVsaXN0OiByZXF1aXJlKCcuLi9kYXRhL2NsYXNzX3doaXRlbGlzdC5qc29uJyksXG4gICAgICAgICAgfSwgdGhpcykuX19zdWJDb250ZXh0X18sXG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6ICdmc18nLFxuICAgICAgdHJhbnNpZW50OiB0cnVlLFxuICAgICAgZmFjdG9yeTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGZvYW0uYXNzZXJ0KFxuICAgICAgICAgICAgZm9hbS5pc1NlcnZlcixcbiAgICAgICAgICAgICdBdHRlbXB0ZWQgZmlsZXN5c3RlbSBhY2Nlc3MgZnJvbSBub24tTm9kZUpTIGNvbnRleHQnKTtcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUoJ2ZzJyk7XG4gICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogJ2Nsc1Byb21pc2VfJyxcbiAgICAgIHRyYW5zaWVudDogdHJ1ZSxcbiAgICAgIHZhbHVlOiBudWxsLFxuICAgIH0sXG4gIF0sXG5cbiAgbWV0aG9kczogW1xuICAgIHtcbiAgICAgIG5hbWU6ICdnZW5lcmF0ZUNsYXNzJyxcbiAgICAgIGNvZGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnZhbGlkYXRlKCk7XG5cbiAgICAgICAgaWYgKHRoaXMuY2xzUHJvbWlzZV8pIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5jbHNQcm9taXNlXztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmNsc1Byb21pc2VfID0gdGhpcy5sb2FkU3BlY18oKS50aGVuKHNwZWNTdHIgPT4ge1xuICAgICAgICAgIGNvbnN0IG1vZGVsID0gdGhpcy5wYXJzZXIucGFyc2VDbGFzc0Zyb21TdHJpbmcoXG4gICAgICAgICAgICAgIHNwZWNTdHIsIGZvYW0uY29yZS5Nb2RlbCk7XG4gICAgICAgICAgbW9kZWwudmFsaWRhdGUoKTtcbiAgICAgICAgICBjb25zdCBjbHMgPSBtb2RlbC5idWlsZENsYXNzKCk7XG4gICAgICAgICAgY2xzLnZhbGlkYXRlKCk7XG4gICAgICAgICAgZm9hbS5yZWdpc3RlcihjbHMpO1xuICAgICAgICAgIGZvYW0ucGFja2FnZS5yZWdpc3RlckNsYXNzKGNscyk7XG4gICAgICAgICAgcmV0dXJuIGNscztcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogJ2xvYWRTcGVjXycsXG4gICAgICBjb2RlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHVybDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICB1cmwgPSB0aGlzLnBhcnNlVVJMXyh0aGlzLmNsYXNzVVJMKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUT0RPKG1hcmtkaXR0bWVyKTogXCJodHRwOlwiIHNob3VsZCBvbmx5IGJlIGFsbG93ZWQgaW4gZGV2IG1vZGUuXG4gICAgICAgIGlmICh1cmwucHJvdG9jb2wgPT09ICdodHRwczonIHx8IHVybC5wcm90b2NvbCA9PT0gJ2h0dHA6Jykge1xuICAgICAgICAgIHJldHVybiB0aGlzLkhUVFBSZXF1ZXN0LmNyZWF0ZSh7XG4gICAgICAgICAgICB1cmw6IHRoaXMuY2xhc3NVUkwsXG4gICAgICAgICAgfSkuc2VuZCgpLnRoZW4ocmVzcCA9PiB7XG4gICAgICAgICAgICByZXR1cm4gcmVzcC5wYXlsb2FkO1xuICAgICAgICAgIH0pLnRoZW4oc3RyT3JCdWZmZXIgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHN0ck9yQnVmZmVyLnRvU3RyaW5nKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAodXJsLnByb3RvY29sID09PSAnZmlsZTonKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZnNfLnJlYWRGaWxlKHVybC5wYXRobmFtZSwgKGVyciwgZGF0YSkgPT4ge1xuICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcbiAgICAgICAgICAgICAgbmV3IEVycm9yKGBJbnZhbGlkIFVSTCBwcm90b2NvbDogXCIke3VybC5wcm90b2NvbH1cImApKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9LFxuICBdLFxufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9saWIvY29tcGF0LmVzNi5qcyIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBDaHJvbWl1bSBBdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYSBCU0Qtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuLy8gZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZS5cbid1c2Ugc3RyaWN0JztcblxucmVxdWlyZSgnLi4vb2JqZWN0LmVzNi5qcycpO1xucmVxdWlyZSgnLi4vcHJvcGVydHkuZXM2LmpzJyk7XG5yZXF1aXJlKCcuLi9hY3Rpb24uZXM2LmpzJyk7XG5yZXF1aXJlKCcuL3JlbGVhc2UuZXM2LmpzJyk7XG5cbmZvYW0uQ0xBU1Moe1xuICBuYW1lOiAnQ29tcGF0UHJvcGVydHknLFxuICBwYWNrYWdlOiAnb3JnLmNocm9taXVtLmFwaXMud2ViJyxcbiAgZXh0ZW5kczogJ2ZvYW0uY29yZS5Cb29sZWFuJyxcblxuICBkb2N1bWVudGF0aW9uOiBgQSBCb29sZWFuIHByb3BlcnR5IHRoYXQgY29udGFpbnMgYSBicm93c2VyIHJlbGVhc2UgYXNcbiAgICAgIG1ldGFkYXRhLiBUaGlzIHBhdHRlcm4gaXMgdXNlZCBmb3IgcGVyLUFQSSBjb21wYXQgZGF0YS5gLFxuXG4gIHJlcXVpcmVzOiBbJ29yZy5jaHJvbWl1bS5hcGlzLndlYi5SZWxlYXNlJ10sXG5cbiAgY3NzOiBgXG4gICAgLm9yZy1jaHJvbWl1bS1hcGlzLXdlYi1Db21wYXRQcm9wZXJ0eSB7XG4gICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIH1cblxuICAgIC5vcmctY2hyb21pdW0tYXBpcy13ZWItQ29tcGF0UHJvcGVydHkuZmFsc2Uge1xuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI0ZGOEE4MDtcbiAgICB9XG5cbiAgICAub3JnLWNocm9taXVtLWFwaXMtd2ViLUNvbXBhdFByb3BlcnR5LnRydWUge1xuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI0I5RjZDQTtcbiAgICB9XG4gIGAsXG5cbiAgcHJvcGVydGllczogW1xuICAgIHtcbiAgICAgIGNsYXNzOiAnRk9iamVjdFByb3BlcnR5JyxcbiAgICAgIG9mOiAnb3JnLmNocm9taXVtLmFwaXMud2ViLlJlbGVhc2UnLFxuICAgICAgbmFtZTogJ3JlbGVhc2UnLFxuICAgICAgZG9jdW1lbnRhdGlvbjogYFRoZSBicm93c2VyIHJlbGVhc2UgYXNzb2NpYXRlZCB3aXRoIHRoaXMgcHJvcGVydHkuYCxcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6ICdyYXdUYWJsZUNlbGxGb3JtYXR0ZXInLFxuICAgICAgZG9jdW1lbnRhdGlvbjogYEEgcmF3IG1hcmt1cCBvdXRwdXR0ZXIgZm9yIHRhYmxlIGNlbGxzIG91dHB1dHRpbmcgdGhpc1xuICAgICAgICAgIHByb3BlcnR5J3MgdmFsdWUuYCxcbiAgICAgIHZhbHVlOiBmdW5jdGlvbih2YWx1ZSwgb2JqLCBheGlvbSkge1xuICAgICAgICAvLyBBcHBseSBDU1MgY2xhc3MgYXNzb2NpYXRlZCB3aXRoIHRoaXMgRk9BTSBjbGFzcy5cbiAgICAgICAgY29uc3QgY2xzID0gJ29yZy1jaHJvbWl1bS1hcGlzLXdlYi1Db21wYXRQcm9wZXJ0eSc7XG4gICAgICAgIC8vIEFwcGx5IENTUyBjbGFzcyBhc3NvY2lhdGVkIHdpdGggdmFsdWUuXG4gICAgICAgIGNvbnN0IHZhbHVlQ2xzID0gdmFsdWUgPT09IHRydWUgPyAndHJ1ZScgOiB2YWx1ZSA9PT0gZmFsc2UgP1xuICAgICAgICAgICAgICAnZmFsc2UnIDogJyc7XG4gICAgICAgIC8vIFNlbGVjdCBNYXRlcmlhbCBpY29uIHRleHQgZm9yIGNoZWNrbWFyaywgWCwgb3IgaG91cmdsYXNzIChsb2FkaW5nKSxcbiAgICAgICAgLy8gYWNjb3JkaW5nIHRvIHZhbHVlLlxuICAgICAgICAvL1xuICAgICAgICAvLyBTZWUgaHR0cHM6Ly9tYXRlcmlhbC5pby9pY29ucy9cbiAgICAgICAgY29uc3QgaWNvblZhbHVlID0gdmFsdWUgPT09IHRydWUgPyAnY2hlY2snIDogdmFsdWUgPT09IGZhbHNlID9cbiAgICAgICAgICAgICAgJ2NsZWFyJyA6ICdob3VyZ2xhc3NfZW1wdHknO1xuXG4gICAgICAgIHJldHVybiBgXG4gICAgICAgICAgPGRpdiBjbGFzcz1cIiR7Y2xzfSAke3ZhbHVlQ2xzfVwiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJtYXRlcmlhbC1pY29uc1wiPiR7aWNvblZhbHVlfTwvc3Bhbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgYDtcbiAgICAgIH0sXG4gICAgfSxcbiAgXSxcblxuICBtZXRob2RzOiBbXG4gICAge1xuICAgICAgbmFtZTogJ3RvU3RyaW5nJyxcbiAgICAgIGRvY3VtZW50YXRpb246IGBQcm92aWRlIHNvbWV0aGluZyBtb3JlIHVzZWZ1bCB0aGFuXG4gICAgICAgICAgW0ZPQU0gY2xhc3MgcGFja2FnZSBwYXRoXSBhcyBzdHJpbmcgcmVwcmVzZW50YXRpb25gLFxuICAgICAgY29kZTogZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLm5hbWU7IH0sXG4gICAgfSxcbiAgXSxcbn0pO1xuXG5mb2FtLkNMQVNTKHtcbiAgbmFtZTogJ0Fic3RyYWN0QXBpQ29tcGF0RGF0YScsXG4gIHBhY2thZ2U6ICdvcmcuY2hyb21pdW0uYXBpcy53ZWInLFxuXG4gIHJlcXVpcmVzOiBbJ29yZy5jaHJvbWl1bS5hcGlzLndlYi5Db21wYXRQcm9wZXJ0eSddLFxuXG4gIGRvY3VtZW50YXRpb246IGBBYnN0cmFjdCBjbGFzcyB1bmRlcnBpbm5pbmcgZ2VuZXJhdGVkIEFQSSBjb21wYXQgZGF0YSBjbGFzc1xuXG4gICAgICBUaGlzIGNsYXNzIGlzIHRoZSBiYXNpcyBmb3IgYSBnZW5lcmF0ZWQgY2xhc3Mgd2l0aCBhIENvbXBhdFByb3BlcnR5IHBlclxuICAgICAgcmVsZWFzZSwgZGV0YWlsaW5nIGFsbCB0aGUgYnJvd3NlciBjb21wYXRhYmlsaXR5IGRhdGEgZm9yIGEgc2luZ2xlXG4gICAgICBBUEkuIFRoaXMgcmVwcmVzZW50YXRpb24gb2YgdGhlIGNvbXBhdCBkYXRhIGlzIHdlbGwgYWxpZ25lZCB3aXRoIEZPQU1cbiAgICAgIGZlYXR1cmVzIHN1Y2ggYXMgVTIgdGFibGUgdmlld3MsIHF1ZXJ5IHBhcnNlcnMsIE1EQU8gaW5kaWNlcywgZXRjLi5gLFxuXG4gIHByb3BlcnRpZXM6IFtcbiAgICB7XG4gICAgICBjbGFzczogJ1N0cmluZycsXG4gICAgICBuYW1lOiAnaWQnLFxuICAgICAgZG9jdW1lbnRhdGlvbjogYElEIG9mIGVhY2ggZGF0dW0gaXMgY29tcG9zZWQgZnJvbSBpbnRlcmZhY2UgKyBpbnRlcmZhY2VcbiAgICAgICAgICBtZW1iZXIgbmFtZS4gTWFya3VwIG91dHB1dHRlciBlbmFibGVzIENTUyBvdmVybGF5IHBhdHRlcm4gdG9cbiAgICAgICAgICBjb25kaXRpb25hbGx5IG92ZXJsYXkgSUQgdGV4dCBvdmVyIG90aGVyIHRhYmxlIGNlbGxzLmAsXG4gICAgICBsYWJlbDogJ0FQSScsXG4gICAgICBleHByZXNzaW9uOiBmdW5jdGlvbihpbnRlcmZhY2VOYW1lLCBhcGlOYW1lKSB7XG4gICAgICAgIHJldHVybiBgJHtpbnRlcmZhY2VOYW1lfSMke2FwaU5hbWV9YDtcbiAgICAgIH0sXG4gICAgICBoaWRkZW46IHRydWUsXG4gICAgICByYXdUYWJsZUNlbGxGb3JtYXR0ZXI6IGZ1bmN0aW9uKHZhbHVlLCBvYmosIGF4aW9tKSB7XG4gICAgICAgIGNvbnN0IHRleHRWYWx1ZSA9IGZvYW0uU3RyaW5nLmlzSW5zdGFuY2UodmFsdWUpID8gdmFsdWUgOiAnJm5ic3A7JztcbiAgICAgICAgcmV0dXJuIGBcbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiaWRcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJvdmVybGF5XCI+JHt0ZXh0VmFsdWV9PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZWxsaXBzaXNcIj48c3Bhbj4ke3RleHRWYWx1ZX08L3NwYW4+PC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIGA7XG4gICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgY2xhc3M6ICdTdHJpbmcnLFxuICAgICAgbmFtZTogJ2ludGVyZmFjZU5hbWUnLFxuICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgfSxcbiAgICB7XG4gICAgICBjbGFzczogJ1N0cmluZycsXG4gICAgICBuYW1lOiAnYXBpTmFtZScsXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICB9LFxuICBdLFxufSk7XG5cbmZvYW0uQ0xBU1Moe1xuICBuYW1lOiAnQWJzdHJhY3RDb21wYXRDbGFzc0dlbmVyYXRvcicsXG4gIHBhY2thZ2U6ICdvcmcuY2hyb21pdW0uYXBpcy53ZWInLFxuXG4gIGRvY3VtZW50YXRpb246IGBDb21wb25lbnQgdGhhdCBlbmNhcHN1bGF0ZXMgbG9naWMgZm9yIGdlbmVyYXRpbmcgYSBjb21wYXRcbiAgICAgIGRhdGEgY2xhc3MgYmFzZWQgb24gYSBjb2xsZWN0aW9uIG9mIGtub3duIHJlbGVhc2VzLmAsXG5cbiAgYXhpb21zOiBbZm9hbS5wYXR0ZXJuLlNpbmdsZXRvbi5jcmVhdGUoKV0sXG5cbiAgbWV0aG9kczogW1xuICAgIHtcbiAgICAgIG5hbWU6ICdnZW5lcmF0ZVNwZWMnLFxuICAgICAgZG9jdW1lbnRhdGlvbjogYEdlbmVyYXRlIHRoZSBcInNwZWNcIiB0aGF0IHdvdWxkIGJlIHBhc3NlZCB0byBmb2FtLkNMQVNTKClcbiAgICAgICAgICB0byBkZWNsYXJlIGEgY2xhc3Mgb2YgZ2l2ZW4gW3BrZ10uW25hbWVdLCBiYXNlZCBvbiBnaXZlbiByZWxlYXNlcy5gLFxuICAgICAgY29kZTogZnVuY3Rpb24ocGtnLCBuYW1lLCByZWxlYXNlcykge1xuICAgICAgICBsZXQgc3BlYyA9IHtcbiAgICAgICAgICBjbGFzczogJ01vZGVsJyxcbiAgICAgICAgICBwYWNrYWdlOiBwa2csXG4gICAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgICBleHRlbmRzOiAnb3JnLmNocm9taXVtLmFwaXMud2ViLkFic3RyYWN0QXBpQ29tcGF0RGF0YScsXG5cbiAgICAgICAgICByZXF1aXJlczogWydvcmcuY2hyb21pdW0uYXBpcy53ZWIuQ29tcGF0UHJvcGVydHknXSxcblxuICAgICAgICAgIHByb3BlcnRpZXM6IFtdLFxuICAgICAgICB9O1xuXG4gICAgICAgIGxldCBwcm9wU3BlY3MgPSByZWxlYXNlcy5tYXAocmVsZWFzZSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNsYXNzOiAnb3JnLmNocm9taXVtLmFwaXMud2ViLkNvbXBhdFByb3BlcnR5JyxcbiAgICAgICAgICAgIG5hbWU6IHRoaXMucHJvcGVydHlOYW1lRnJvbVJlbGVhc2UocmVsZWFzZSksXG4gICAgICAgICAgICBsYWJlbDogdGhpcy5wcm9wZXJ0eUxhYmVsRnJvbVJlbGVhc2UocmVsZWFzZSksXG4gICAgICAgICAgICByZWxlYXNlLFxuICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgICAgICBzcGVjLnByb3BlcnRpZXMgPSBzcGVjLnByb3BlcnRpZXMuY29uY2F0KHByb3BTcGVjcyk7XG5cbiAgICAgICAgcmV0dXJuIHNwZWM7XG4gICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogJ2dlbmVyYXRlQ2xhc3MnLFxuICAgICAgZG9jdW1lbnRhdGlvbjogYEdlbmVyYXRlIGEgY2xhc3MgYmFzZWQgb24gYSBzcGVjIG9yIGZvYW0uY29yZS5Nb2RlbC4gVGhlXG4gICAgICAgICAgZm9ybWVyIGlzIHVzZWQgZHVyaW5nIGRhdGEgZ2VuZXJhdGlvbiBwaGFzZTsgdGhlIGxhdHRlciBpcyB1c2VkIHdoZW5cbiAgICAgICAgICBsb2FkaW5nIGEgbW9kZWwgZm9yIGV4aXN0aW5nIGRhdGEuYCxcbiAgICAgIGNvZGU6IGZ1bmN0aW9uKHNwZWNPck1vZGVsKSB7XG4gICAgICAgIGlmIChmb2FtLmNvcmUuTW9kZWwuaXNJbnN0YW5jZShzcGVjT3JNb2RlbCkpIHtcbiAgICAgICAgICAvLyBSdW4gcG9zdC1tb2RlbCBpbnN0YW50aWF0aW9uIHN0ZXBzIGZyb206XG4gICAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2ZvYW0tZnJhbWV3b3JrL2ZvYW0yL2Jsb2IvNjMyYzY0NjdjMGE3ZjEyM2EyMjcwY2M1NDlkYjVkOGUzZDkzYjU3NC9zcmMvZm9hbS9jb3JlL0Jvb3QuanMjTDIwMVxuICAgICAgICAgIGNvbnN0IG1vZGVsID0gc3BlY09yTW9kZWw7XG4gICAgICAgICAgbW9kZWwudmFsaWRhdGUoKTtcbiAgICAgICAgICBjb25zdCBjbHMgPSBtb2RlbC5idWlsZENsYXNzKCk7XG4gICAgICAgICAgY2xzLnZhbGlkYXRlKCk7XG4gICAgICAgICAgZm9hbS5yZWdpc3RlcihjbHMpO1xuICAgICAgICAgIGZvYW0ucGFja2FnZS5yZWdpc3RlckNsYXNzKGNscyk7XG4gICAgICAgICAgcmV0dXJuIGNscztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBEZWNsYXJlIGNsYXNzIGZyb20gc3BlYyBhcyB1c3VhbC5cbiAgICAgICAgICBjb25zdCBzcGVjID0gc3BlY09yTW9kZWw7XG4gICAgICAgICAgZm9hbS5DTEFTUyhzcGVjKTtcbiAgICAgICAgICByZXR1cm4gZm9hbS5sb29rdXAoYCR7c3BlYy5wYWNrYWdlfS4ke3NwZWMubmFtZX1gKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6ICdwcm9wZXJ0eU5hbWVGcm9tUmVsZWFzZScsXG4gICAgICBkb2N1bWVudGF0aW9uOiBgUHJvZHVjZSBhIGNvbnNpc3RlbnQgcHJvcGVydHkgbmFtZSBmcm9tIGEgcmVsZWFzZSBvYmplY3QuXG4gICAgICAgICAgVGhlIHByb3BlcnR5IGlzIHVzZWQgdG8gc3RvcmUgY29tcGF0IGRhdGEgZm9yIHRoZSByZWxlYXNlLmAsXG4gICAgICBjb2RlOiBmdW5jdGlvbiAocmVsZWFzZSkge1xuICAgICAgICByZXR1cm4gKHJlbGVhc2UuYnJvd3Nlck5hbWUuY2hhckF0KDApLnRvTG93ZXJDYXNlKCkgK1xuICAgICAgICAgICAgICAgIHJlbGVhc2UuYnJvd3Nlck5hbWUuc3Vic3RyKDEpICtcbiAgICAgICAgICAgICAgICByZWxlYXNlLmJyb3dzZXJWZXJzaW9uICtcbiAgICAgICAgICAgICAgICByZWxlYXNlLm9zTmFtZS5jaGFyQXQoMCkudG9Mb3dlckNhc2UoKSArXG4gICAgICAgICAgICAgICAgcmVsZWFzZS5vc05hbWUuc3Vic3RyKDEpICtcbiAgICAgICAgICAgICAgICByZWxlYXNlLm9zVmVyc2lvbikucmVwbGFjZSgvW15hLXowLTldL2lnLCAnXycpO1xuXG4gICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogJ3Byb3BlcnR5TGFiZWxGcm9tUmVsZWFzZScsXG4gICAgICBkb2N1bWVudGF0aW9uOiBgUHJvZHVjZSBhIGxhYmVsIGZvciB1c2UgaW4gVUlzIGRpc3BsYXlpbmcgY29tcGF0IGRhdGEgZm9yXG4gICAgICAgICAgdGhlIGdpdmVuIHJlbGVhc2UuYCxcbiAgICAgIGNvZGU6IGZ1bmN0aW9uKHJlbGVhc2UpIHtcbiAgICAgICAgcmV0dXJuIHJlbGVhc2UuYnJvd3Nlck5hbWUgKyAnICcgK1xuICAgICAgICAgIHJlbGVhc2UuYnJvd3NlclZlcnNpb24gKyAnICcgK1xuICAgICAgICAgIHJlbGVhc2Uub3NOYW1lICsgJyAnICtcbiAgICAgICAgICByZWxlYXNlLm9zVmVyc2lvbjtcbiAgICAgIH0sXG4gICAgfSxcbiAgXSxcbn0pO1xuXG5mb2FtLkNMQVNTKHtcbiAgbmFtZTogJ0NvbXBhdENsYXNzR2VuZXJhdG9yJyxcbiAgcGFja2FnZTogJ29yZy5jaHJvbWl1bS5hcGlzLndlYicsXG4gIGV4dGVuZHM6ICdvcmcuY2hyb21pdW0uYXBpcy53ZWIuQWJzdHJhY3RDb21wYXRDbGFzc0dlbmVyYXRvcicsXG5cbiAgZG9jdW1lbnRhdGlvbjogJ1NpbmdsZXRvbiBBYnN0cmFjdENvbXBhdENsYXNzR2VuZXJhdG9yJyxcblxuICBheGlvbXM6IFtmb2FtLnBhdHRlcm4uU2luZ2xldG9uLmNyZWF0ZSgpXSxcbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vbGliL3dlYl9hcGlzL2FwaV9jb21wYXRfZGF0YS5lczYuanMiLCIvLyBDb3B5cmlnaHQgMjAxNyBUaGUgQ2hyb21pdW0gQXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGEgQlNELXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbi8vIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUuXG4ndXNlIHN0cmljdCc7XG5cbmZvYW0uQ0xBU1Moe1xuICBuYW1lOiAnUmVsZWFzZScsXG4gIHBhY2thZ2U6ICdvcmcuY2hyb21pdW0uYXBpcy53ZWInLFxuICBpZHM6IFsncmVsZWFzZUtleSddLFxuXG4gIGNvbnN0YW50czoge1xuICAgIC8vIEhBQ0sobWFya2RpdHRtZXIpOiBBIGJ1bmNoIG9mIFNhZmFyaSBkYXRhIHdlcmUgY29sbGVjdGVkIGJlZm9yZSB1c2VyQWdlbnRcbiAgICAvLyBzY3JhcGluZyBmZXRjaGVkIHRoZSBTYWZhcmkgdmVyc2lvbiBudW1iZXIgKHJhdGhlciB0aGFuIHRoZSBXZWJLaXRcbiAgICAvLyB2ZXJzaW9uIG51bWJlcikuIFRoaXMgY29uc3RhbnQgcHJvdmlkZXMgdmVyc2lvbiBudW1iZXIgdHJhbnNsYXRpb24uXG4gICAgRlJJRU5ETFlfQlJPV1NFUl9WRVJTSU9OUzoge1xuICAgICAgU2FmYXJpOiB7XG4gICAgICAgICc1MzQnOiAnNS4xJyxcbiAgICAgICAgJzUzNic6ICc2LjAnLFxuICAgICAgICAnNTM3LjQzJzogJzYuMScsXG4gICAgICAgICc1MzcuNzEnOiAnNy4wJyxcbiAgICAgICAgJzUzNy43Myc6ICc3LjAnLFxuICAgICAgICAnNTM3Ljc1JzogJzcuMCcsXG4gICAgICAgICc1MzcuNzYnOiAnNy4wJyxcbiAgICAgICAgJzUzNy43Nyc6ICc3LjAnLFxuICAgICAgICAnNTM3Ljc4JzogJzcuMCcsXG4gICAgICAgICc1MzcuODUnOiAnNy4xJyxcbiAgICAgICAgJzUzOCc6ICc4LjAnLFxuICAgICAgICAnNjAwJzogJzguMCcsXG4gICAgICAgICc2MDEuMSc6ICc5LjAnLFxuICAgICAgICAnNjAxLjInOiAnOS4wJyxcbiAgICAgICAgJzYwMS4zJzogJzkuMCcsXG4gICAgICAgICc2MDEuNCc6ICc5LjAnLFxuICAgICAgICAnNjAxLjUnOiAnOS4xJyxcbiAgICAgICAgJzYwMS42JzogJzkuMScsXG4gICAgICAgICc2MDEuNyc6ICc5LjEnLFxuICAgICAgICAnNjAyJzogJzEwLjAnLFxuICAgICAgICAnNjAzJzogJzEwLjEnLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuXG4gIHByb3BlcnRpZXM6IFtcbiAgICB7XG4gICAgICBjbGFzczogJ1N0cmluZycsXG4gICAgICBuYW1lOiAnYnJvd3Nlck5hbWUnLFxuICAgICAgZG9jdW1lbnRhdGlvbjogYFRoZSBuYW1lIG9mIHJlbGVhc2UuYCxcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgZmluYWw6IHRydWUsXG4gICAgfSxcbiAgICB7XG4gICAgICBjbGFzczogJ1N0cmluZycsXG4gICAgICBuYW1lOiAnYnJvd3NlclZlcnNpb24nLFxuICAgICAgZG9jdW1lbnRhdGlvbjogYFRoZSB2ZXJzaW9uIG9mIHJlbGVhc2UuYCxcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgZmluYWw6IHRydWUsXG4gICAgfSxcbiAgICB7XG4gICAgICBjbGFzczogJ1N0cmluZycsXG4gICAgICBuYW1lOiAnZnJpZW5kbHlCcm93c2VyVmVyc2lvbicsXG4gICAgICB0cmFuc2llbnQ6IHRydWUsXG4gICAgICBnZXR0ZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBuYW1lcyA9IHRoaXMuRlJJRU5ETFlfQlJPV1NFUl9WRVJTSU9OUztcbiAgICAgICAgaWYgKCFuYW1lc1t0aGlzLmJyb3dzZXJOYW1lXSkgcmV0dXJuIHRoaXMuYnJvd3NlclZlcnNpb247XG4gICAgICAgIGNvbnN0IHZlcnNpb25OYW1lcyA9IG5hbWVzW3RoaXMuYnJvd3Nlck5hbWVdO1xuICAgICAgICBjb25zdCB2ZXJzaW9uID0gdGhpcy5icm93c2VyVmVyc2lvbi5zcGxpdCgnLicpO1xuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSB2ZXJzaW9uLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3QgdmVyc2lvblN0ciA9IHZlcnNpb24uc2xpY2UoMCwgaSkuam9pbignLicpO1xuICAgICAgICAgIGlmICh2ZXJzaW9uTmFtZXNbdmVyc2lvblN0cl0pIHJldHVybiB2ZXJzaW9uTmFtZXNbdmVyc2lvblN0cl07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuYnJvd3NlclZlcnNpb247XG4gICAgICB9XG4gICAgfSxcbiAgICB7XG4gICAgICBjbGFzczogJ1N0cmluZycsXG4gICAgICBuYW1lOiAnb3NOYW1lJyxcbiAgICAgIGRvY3VtZW50YXRpb246IGBUaGUgbmFtZSBvZiBvcGVyYXRpbmcgc3lzdGVtIGFzIHJlcG9ydGVkIGJ5IHRoZVxuICAgICAgICBvYmplY3QtZ3JhcGgtanMgbGlicmFyeS5gLFxuICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICBmaW5hbDogdHJ1ZSxcbiAgICB9LFxuICAgIHtcbiAgICAgIGNsYXNzOiAnU3RyaW5nJyxcbiAgICAgIG5hbWU6ICdvc1ZlcnNpb24nLFxuICAgICAgZG9jdW1lbnRhdGlvbjogYFRoZSB2ZXJzaW9uIG9mIG9wZXJhdGluZyBzeXN0ZW0gYXMgcmVwb3J0ZWQgYnkgdGhlXG4gICAgICAgIG9iamVjdC1ncmFwaC1qcyBsaWJyYXJ5LmAsXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgIGZpbmFsOiB0cnVlLFxuICAgIH0sXG4gICAge1xuICAgICAgY2xhc3M6ICdTdHJpbmcnLFxuICAgICAgbmFtZTogJ3JlbGVhc2VLZXknLFxuICAgICAgZG9jdW1lbnRhdGlvbjogYEFuIHVuaXF1ZSBrZXkgZm9yIHRoaXMgcmVsZWFzZS4gQXZvaWQgdGhlIG5lZWQgZm9yXG4gICAgICAgIENPTkNBVCBtTGFuZyBvciBzaW1pbGFyIHRvIGJlIGFibGUgdG8gZ3JvdXBCeSBicm93c2VyTmFtZSxcbiAgICAgICAgYnJvd3NlclZlcnNpb24sIG9zTmFtZSwgb3NWZXJzaW9uLmAsXG4gICAgICBleHByZXNzaW9uOiBmdW5jdGlvbihicm93c2VyTmFtZSwgYnJvd3NlclZlcnNpb24sIG9zTmFtZSwgb3NWZXJzaW9uKSB7XG4gICAgICAgIHJldHVybmAke2Jyb3dzZXJOYW1lfV8ke2Jyb3dzZXJWZXJzaW9ufV8ke29zTmFtZX1fJHtvc1ZlcnNpb259YDtcbiAgICAgIH0sXG4gICAgfSxcbiAgICB7XG4gICAgICBjbGFzczogJ0RhdGUnLFxuICAgICAgbmFtZTogJ3JlbGVhc2VEYXRlJyxcbiAgICAgIGRvY3VtZW50YXRpb246IGBUaGUgZGF0ZSB3aGVuIHRoaXMgdmVyc2lvbiBpcyByZWxlYXNlZC5gLFxuICAgICAgLy8gUHJvdmlkZSBkZWZhdWx0IHJlbGVhc2VEYXRlOyBkZWZhdWx0IG9iamVjdCBzaG91bGQgbm90IGhhdmUgdW5kZWZpbmVkLlxuICAgICAgZmFjdG9yeTogZnVuY3Rpb24oKSB7IHJldHVybiBuZXcgRGF0ZSgwKTsgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgIGNsYXNzOiAnQm9vbGVhbicsXG4gICAgICBuYW1lOiAnaXNNb2JpbGUnLFxuICAgICAgZG9jdW1lbnRhdGlvbjogJ0lzIHRoaXMgYSBtb2JpbGUgcmVsZWFzZT8nLFxuICAgICAgZXhwcmVzc2lvbjogZnVuY3Rpb24ob3NOYW1lKSB7XG4gICAgICAgIHJldHVybiBvc05hbWUgPT09ICdBbmRyb2lkJyB8fCBvc05hbWUgPT09ICdpUGhvbmUnO1xuICAgICAgfSxcbiAgICAgIHRyYW5zaWVudDogdHJ1ZSxcbiAgICB9LFxuICBdLFxufSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9saWIvd2ViX2FwaXMvcmVsZWFzZS5lczYuanMiLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgQ2hyb21pdW0gQXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGEgQlNELXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbi8vIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUuXG4ndXNlIHN0cmljdCc7XG5cbmZvYW0uQ0xBU1Moe1xuICBuYW1lOiAnQWN0aW9uVmlldycsXG4gIHBhY2thZ2U6ICdvcmcuY2hyb21pdW0uYXBpcy53ZWInLFxuICBleHRlbmRzOiAnZm9hbS51Mi5FbGVtZW50JyxcblxuICBjc3M6IGBcbiAgICBeIHtcbiAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICB9XG5cbiAgICBebGFiZWwge1xuICAgICAgY29sb3I6IGluaGVyaXQ7XG4gICAgICAtd2Via2l0LXVzZXItc2VsZWN0OiBub25lO1xuICAgICAgLW1vei11c2VyLXNlbGVjdDogbm9uZTtcbiAgICAgIC1tcy11c2VyLXNlbGVjdDogbm9uZTtcbiAgICAgIHVzZXItc2VsZWN0OiBub25lO1xuICAgICAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xuICAgICAgcGFkZGluZzogMXJlbTtcbiAgICB9XG5cbiAgICBebGFiZWw6aG92ZXIge1xuICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpO1xuICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgIH1cblxuICAgIF51bmF2YWlsYWJsZSB7XG4gICAgICBkaXNwbGF5OiBub25lO1xuICAgIH1cblxuICAgIF5kaXNhYmxlZCB7XG4gICAgICBvcGFjaXR5OiAwLjU7XG4gICAgfVxuXG4gICAgLypcbiAgICAqIE9sZCBiZWhhdmlvdXI6IERpc3BsYXkgZ3JleWVkLW91dCBkaXNhYmxlZCBidXR0b25zXG4gICAgKlxuICAgIF5kaXNhYmxlZCwgXmRpc2FibGVkXmxhYmVsOmhvdmVyIHtcbiAgICAgIGZpbHRlcjogb3BhY2l0eSgwLjQpO1xuICAgICAgYmFja2dyb3VuZC1jb2xvcjogaW5oZXJpdDtcbiAgICB9XG4gICAgKi9cbiAgYCxcblxuICBwcm9wZXJ0aWVzOiBbXG4gICAgJ2RhdGEnLFxuICAgICdhY3Rpb24nLFxuICAgIHtcbiAgICAgIG5hbWU6ICdpY29uJyxcbiAgICAgIGV4cHJlc3Npb246IGZ1bmN0aW9uKGFjdGlvbikgeyByZXR1cm4gYWN0aW9uLmljb24gfHwgYWN0aW9uLm5hbWU7IH1cbiAgICB9XG4gIF0sXG5cbiAgbWV0aG9kczogW1xuICAgIGZ1bmN0aW9uIGluaXRFKCkge1xuICAgICAgbGV0IGxhYmVsID0gdGhpcy5FKCdpJykuYWRkQ2xhc3MoJ21hdGVyaWFsLWljb25zJylcbiAgICAgICAgICAuYWRkQ2xhc3ModGhpcy5teUNsYXNzKCdsYWJlbCcpKVxuICAgICAgICAgIC5hZGQodGhpcy5pY29uKTtcblxuICAgICAgdGhpcy5ub2RlTmFtZSA9ICdzcGFuJztcbiAgICAgIHRoaXMuYWRkQ2xhc3ModGhpcy5teUNsYXNzKCkpLmFkZENsYXNzKHRoaXMubXlDbGFzcyh0aGlzLmFjdGlvbi5uYW1lKSlcbiAgICAgICAgICAuYWRkKGxhYmVsKS5vbignY2xpY2snLCB0aGlzLm9uQ2xpY2spO1xuXG4gICAgICBpZiAodGhpcy5hY3Rpb24uaXNBdmFpbGFibGUpIHtcbiAgICAgICAgbGFiZWwuZW5hYmxlQ2xhc3ModGhpcy5teUNsYXNzKCd1bmF2YWlsYWJsZScpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbi5jcmVhdGVJc0F2YWlsYWJsZSQodGhpcy5kYXRhJCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRydWUgLyogbmVnYXRlICovKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmFjdGlvbi5pc0VuYWJsZWQpIHtcbiAgICAgICAgY29uc3QgaXNFbmFibGVkID0gdGhpcy5hY3Rpb24uY3JlYXRlSXNFbmFibGVkJCh0aGlzLmRhdGEkKTtcbiAgICAgICAgdGhpcy5hdHRycyh7XG4gICAgICAgICAgZGlzYWJsZWQ6IGlzRW5hYmxlZC5tYXAoZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgcmV0dXJuIGUgPyBmYWxzZSA6ICdkaXNhYmxlZCc7XG4gICAgICAgICAgfSlcbiAgICAgICAgfSk7XG4gICAgICAgIGxhYmVsLmVuYWJsZUNsYXNzKHRoaXMubXlDbGFzcygnZGlzYWJsZWQnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaXNFbmFibGVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB0cnVlIC8qIG5lZ2F0ZSAqLyk7XG4gICAgICB9XG4gICAgfSxcbiAgXSxcblxuICBsaXN0ZW5lcnM6IFtcbiAgICBmdW5jdGlvbiBvbkNsaWNrKCkge1xuICAgICAgdGhpcy5hY3Rpb24ubWF5YmVDYWxsKHRoaXMuX19zdWJDb250ZXh0X18sIHRoaXMuZGF0YSk7XG4gICAgfVxuICBdXG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL2xpYi91Mi9BY3Rpb25WaWV3LmVzNi5qcyIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBDaHJvbWl1bSBBdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYSBCU0Qtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuLy8gZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZS5cblxucmVxdWlyZSgnLi4vbGliL2Rhby9odHRwX2pzb25fZGFvLmVzNi5qcycpO1xucmVxdWlyZSgnLi4vbGliL2NvbXBhdC5lczYuanMnKTtcbnJlcXVpcmUoJy4uL2xpYi93ZWJfYXBpcy9hcGlfaW50ZXJvcF9kYXRhLmVzNi5qcycpO1xuY29uc3QgcGtnID0gb3JnLmNocm9taXVtLmFwaXMud2ViO1xuXG5jb25zdCBjbGFzc1VSTCA9IGAke2xvY2F0aW9uLm9yaWdpbn0vaW50ZXJvcC9jbGFzczpvcmcuY2hyb21pdW0uYXBpcy53ZWIuZ2VuZXJhdGVkLkludGVyb3BEYXRhLmpzb25gO1xuY29uc3QgdXJsID0gYCR7bG9jYXRpb24ub3JpZ2lufS9pbnRlcm9wL29yZy5jaHJvbWl1bS5hcGlzLndlYi5nZW5lcmF0ZWQuSW50ZXJvcERhdGEuanNvbmA7XG5cbmxldCBpbnB1dFJlZHVjZXI7XG5sZXQgb3V0cHV0T3V0cHV0O1xubGV0IGJ0blJ1bjtcblxuXG4oYXN5bmMgKCkgPT4ge1xuICBjb25zdCBsb2FkID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBlID0+IHtcbiAgICAgIGlucHV0UmVkdWNlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNpbnB1dC1yZWR1Y2VyJyk7XG4gICAgICBvdXRwdXRPdXRwdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjb3V0cHV0LW91dHB1dCcpO1xuICAgICAgYnRuUnVuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2J0bi1ydW4nKTtcbiAgICAgIGNvbnNvbGUubG9nKGlucHV0UmVkdWNlciwgb3V0cHV0T3V0cHV0LCBidG5SdW4pO1xuICAgICAgcmVzb2x2ZSgpO1xuICAgIH0pO1xuICB9KTtcblxuICBjb25zdCBJbnRlcm9wRGF0YSA9IGF3YWl0IHBrZy5DbGFzc0dlbmVyYXRvci5jcmVhdGUoe1xuICAgIGNsYXNzVVJMLFxuICB9KS5nZW5lcmF0ZUNsYXNzKCk7XG5cbiAgY29uc3QgZGFvID0gcGtnLkh0dHBKc29uREFPLmNyZWF0ZSh7XG4gICAgc2FmZVByb3RvY29sczogW2xvY2F0aW9uLnByb3RvY29sXSxcbiAgICBzYWZlSG9zdG5hbWVzOiBbbG9jYXRpb24uaG9zdG5hbWVdLFxuICAgIHNhZmVQYXRoUHJlZml4ZXM6IFsnL2ludGVyb3AvJ10sXG4gICAgb2Y6IEludGVyb3BEYXRhLFxuICAgIHVybCxcbiAgfSk7XG5cbiAgYXdhaXQgUHJvbWlzZS5hbGwoW2xvYWQsIGRhby5saW1pdCgxKS5zZWxlY3QoKV0pO1xuXG4gIGNvbnN0IHByb3BzID0gSW50ZXJvcERhdGEuZ2V0QXhpb21zQnlDbGFzcyhwa2cuSW50ZXJvcFByb3BlcnR5KTtcblxuICBidG5SdW4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBhc3luYyAoKSA9PiB7XG4gICAgbGV0IGYgPSBldmFsKGAoZnVuY3Rpb24oKSB7JHtpbnB1dFJlZHVjZXIudmFsdWV9fSkoKWApO1xuXG4gICAgY29uc3Qgc2luayA9IGF3YWl0IGRhby53aGVyZSh7XG4gICAgICBmOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGxldCB2O1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdiA9IGYodiwgcHJvcHNbaV0uZihkYXRhKSwgaSwgcHJvcHMubGVuZ3RoLCBwcm9wc1tpXS5yZWxlYXNlRGF0ZSwgZm9hbS5qc29uLm9iamVjdGlmeShwcm9wc1tpXS5yZWxlYXNlcykpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2O1xuICAgICAgfSxcbiAgICAgIHRvRGlzanVuY3RpdmVOb3JtYWxGb3JtOiBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH0sXG4gICAgfSkuc2VsZWN0KCk7XG5cbiAgICBvdXRwdXRPdXRwdXQudGV4dENvbnRlbnQgPSBzaW5rLmFycmF5Lm1hcChkYXRhID0+IGRhdGEuaWQpLmpvaW4oJ1xcbicpO1xuICB9KTtcbiAgYnRuUnVuLnJlbW92ZUF0dHJpYnV0ZSgnZGlzYWJsZWQnKTtcbn0pKCk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9tYWluL2ludGVyb3AuZXM2LmpzIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIENocm9taXVtIEF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhIEJTRC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4vLyBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlLlxuJ3VzZSBzdHJpY3QnO1xuXG5yZXF1aXJlKCcuL3UyL0FjdGlvblZpZXcuZXM2LmpzJylcblxuZm9hbS5DTEFTUyh7XG4gIHJlZmluZXM6ICdmb2FtLmNvcmUuQWN0aW9uJyxcblxuICByZXF1aXJlczogW1xuICAgICdvcmcuY2hyb21pdW0uYXBpcy53ZWIuQWN0aW9uVmlldydcbiAgXSxcblxuICBtZXRob2RzOiBbXG4gICAgZnVuY3Rpb24gdG9FKGFyZ3MsIFgpIHtcbiAgICAgIHZhciB2aWV3ID0gZm9hbS51Mi5WaWV3U3BlYy5jcmVhdGVWaWV3KHtcbiAgICAgICAgY2xhc3M6ICdvcmcuY2hyb21pdW0uYXBpcy53ZWIuQWN0aW9uVmlldycsXG4gICAgICAgIGFjdGlvbjogdGhpcyxcbiAgICAgIH0sIGFyZ3MsIHRoaXMsIFgpO1xuXG4gICAgICBpZiAoWC5kYXRhJCAmJiAhKGFyZ3MgJiYgKGFyZ3MuZGF0YSB8fCBhcmdzLmRhdGEkKSkpIHtcbiAgICAgICAgdmlldy5kYXRhJCA9IFguZGF0YSQ7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB2aWV3O1xuICAgIH0sXG4gIF0sXG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL2xpYi9hY3Rpb24uZXM2LmpzIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIENocm9taXVtIEF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhIEJTRC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4vLyBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlLlxuJ3VzZSBzdHJpY3QnO1xuXG4vLyBSZWZpbmUgZm9hbS5PYmplY3QuZXF1YWxzIHRvIHJlY3Vyc2l2ZWx5IGNoZWNrIG93biBvYmplY3Qga2V5cy4gVGhpcyBpc1xuLy8gbmVjZXNzYXJ5IGZvciBkZWFsaW5nIHdpdGggcGxhaW4gb2JqZWN0cyBpbiBVUkwgc3RhdGUgY29tcGFyaXNvbnMuXG5mb2FtLkxJQih7XG4gIG5hbWU6ICdmb2FtLk9iamVjdCcsXG5cbiAgbWV0aG9kczogW1xuICAgIGZ1bmN0aW9uIGVxdWFscyhhLCBiKSB7XG4gICAgICB2YXIga2V5cyA9IHt9O1xuICAgICAgaWYgKCAhIGZvYW0uT2JqZWN0LmlzSW5zdGFuY2UoYikgKSByZXR1cm4gZmFsc2U7XG4gICAgICBmb3IgKGxldCBrZXkgaW4gYSkge1xuICAgICAgICBpZiAoIWEuaGFzT3duUHJvcGVydHkoa2V5KSkgY29udGludWU7XG4gICAgICAgIGlmICghZm9hbS51dGlsLmVxdWFscyhhW2tleV0sIGJba2V5XSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAga2V5c1trZXldID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGZvciAobGV0IGtleSBpbiBiKSB7XG4gICAgICAgIGlmIChrZXlzW2tleV0gfHwgIWIuaGFzT3duUHJvcGVydHkoa2V5KSkgY29udGludWU7XG4gICAgICAgIGlmICghZm9hbS51dGlsLmVxdWFscyhhW2tleV0sIGJba2V5XSkpIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sXG4gIF0sXG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL2xpYi9vYmplY3QuZXM2LmpzIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIENocm9taXVtIEF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhIEJTRC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4vLyBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlLlxuJ3VzZSBzdHJpY3QnO1xuXG5mb2FtLkNMQVNTKHtcbiAgbmFtZTogJ1Byb3BlcnR5JyxcbiAgcGFja2FnZTogJ29yZy5jaHJvbWl1bS5hcGlzLndlYicsXG4gIHJlZmluZXM6ICdmb2FtLmNvcmUuUHJvcGVydHknLFxuXG4gIGRvY3VtZW50YXRpb246IGBSZWZpbmUgcHJvcGVydGllcyB0byBjb250YWluIGEgcmF3VGFibGVDZWxsRm9ybWF0dGVyKClcbiAgICAgIGZ1bmN0aW9uIHRoYXQgY2FuIGJlIGxldmVyYWdlZCBieSBmb2FtLnUyLlJvd0Zvcm1hdHRlcnMgdG8gZGVsZWdhdGVcbiAgICAgIG91dHB1dHRpbmcgaW5kaXZpZHVhbCB0YWJsZSBjZWxscy5gLFxuXG4gIHByb3BlcnRpZXM6IFtcbiAgICB7XG4gICAgICBjbGFzczogJ0Z1bmN0aW9uJyxcbiAgICAgIG5hbWU6ICdyYXdUYWJsZUNlbGxGb3JtYXR0ZXInLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uKHZhbHVlLCBvYmosIGF4aW9tKSB7XG4gICAgICAgIHJldHVybiBgPGRpdj5cbiAgICAgICAgICBbdW5mb3JtYXR0ZWQgJHt2YWx1ZSA9PT0gbnVsbCA/ICdudWxsJyA6IHR5cGVvZiB2YWx1ZX0gdmFsdWVdXG4gICAgICAgIDwvZGl2PmA7XG4gICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgY2xhc3M6ICdTdHJpbmcnLFxuICAgICAgbmFtZTogJ2dyaWRUZW1wbGF0ZUNvbHVtbicsXG4gICAgICB2YWx1ZTogJzFmcicsXG4gICAgfSxcbiAgXSxcbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vbGliL3Byb3BlcnR5LmVzNi5qcyIsIi8vIENvcHlyaWdodCAyMDE3IFRoZSBDaHJvbWl1bSBBdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYSBCU0Qtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuLy8gZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZS5cblxucmVxdWlyZSgnLi9pbmRleGVkX2Rhby5lczYuanMnKTtcblxuZm9hbS5DTEFTUyh7XG4gIHBhY2thZ2U6ICdvcmcuY2hyb21pdW0uYXBpcy53ZWInLFxuICBuYW1lOiAnSHR0cEpzb25EQU8nLFxuICBleHRlbmRzOiAnZm9hbS5kYW8uUHJvbWlzZWREQU8nLFxuICBpbXBsZW1lbnRzOiBbJ29yZy5jaHJvbWl1bS5hcGlzLndlYi5BYnN0cmFjdEZhY2V0ZWRJbmRleGVkJ10sXG5cbiAgZG9jdW1lbnRhdGlvbjogYERBTyB0aGF0IGZldGNoZXMgYSBKU09OIGFycmF5IHZpYSBIVFRQLmAsXG5cbiAgcmVxdWlyZXM6IFtcbiAgICAnZm9hbS5ib3guQ2xhc3NXaGl0ZWxpc3RDb250ZXh0JyxcbiAgICAnZm9hbS5qc29uLlBhcnNlcicsXG4gICAgJ2ZvYW0ubmV0LkhUVFBSZXF1ZXN0JyxcbiAgICAnb3JnLmNocm9taXVtLmFwaXMud2ViLk1EQU8nLFxuICBdLFxuXG4gIGNvbnN0YW50czoge1xuICAgIEVSUk9SX1VSTDogJ2h0dHBzOi8vc3RvcmFnZS5nb29nbGVhcGlzLmNvbS93ZWItYXBpLWNvbmZsdWVuY2UtZGF0YS1jYWNoZS9kb2VzLW5vdC1leGlzdCcsXG4gIH0sXG5cbiAgcHJvcGVydGllczogW1xuICAgIHtcbiAgICAgIGNsYXNzOiAnU3RyaW5nJyxcbiAgICAgIG5hbWU6ICd1cmwnLFxuICAgICAgZG9jdW1lbnRhdGlvbjogJ0xvY2F0aW9uIG9mIGZpbGUgY29udGFpbmluZyBKU09OIGFycmF5LicsXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICB9LFxuICAgIHtcbiAgICAgIGNsYXNzOiAnQXJyYXknLFxuICAgICAgb2Y6ICdTdHJpbmcnLFxuICAgICAgbmFtZTogJ3NhZmVQcm90b2NvbHMnLFxuICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgfSxcbiAgICB7XG4gICAgICBjbGFzczogJ0FycmF5JyxcbiAgICAgIG9mOiAnU3RyaW5nJyxcbiAgICAgIG5hbWU6ICdzYWZlSG9zdG5hbWVzJyxcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgIH0sXG4gICAge1xuICAgICAgY2xhc3M6ICdBcnJheScsXG4gICAgICBvZjogJ1N0cmluZycsXG4gICAgICBuYW1lOiAnc2FmZVBhdGhQcmVmaXhlcycsXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICB9LFxuICAgIHtcbiAgICAgIGNsYXNzOiAnRk9iamVjdFByb3BlcnR5JyxcbiAgICAgIG9mOiAnZm9hbS5qc29uLlBhcnNlcicsXG4gICAgICBuYW1lOiAncGFyc2VyJyxcbiAgICAgIHRyYW5zaWVudDogdHJ1ZSxcbiAgICAgIGZhY3Rvcnk6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBOT1RFOiBDb25maWd1cmF0aW9uIG11c3QgYmUgY29uc2lzdGVudCB3aXRoIG91dHB1dHRlcnMgaW5cbiAgICAgICAgLy8gY29ycmVzcG9uZGluZyBmb2FtLmRhby5SZXN0REFPLlxuICAgICAgICByZXR1cm4gdGhpcy5QYXJzZXIuY3JlYXRlKHtcbiAgICAgICAgICBzdHJpY3Q6IHRydWUsXG4gICAgICAgICAgY3JlYXRpb25Db250ZXh0OiB0aGlzLkNsYXNzV2hpdGVsaXN0Q29udGV4dC5jcmVhdGUoe1xuICAgICAgICAgICAgd2hpdGVsaXN0OiByZXF1aXJlKCcuLi8uLi9kYXRhL2NsYXNzX3doaXRlbGlzdC5qc29uJyksXG4gICAgICAgICAgfSwgdGhpcykuX19zdWJDb250ZXh0X18sXG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgIGNsYXNzOiAnRnVuY3Rpb24nLFxuICAgICAgbmFtZTogJ2NyZWF0ZVVSTCcsXG4gICAgICBkb2N1bWVudGF0aW9uOiAnUGxhdGZvcm0taW5kZXBlbmRlbnQgVVJMIGZhY3RvcnkgZnVuY3Rpb24uJyxcbiAgICAgIHRyYW5zaWVudDogdHJ1ZSxcbiAgICAgIGZhY3Rvcnk6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZm9hbS5pc1NlcnZlciA/XG4gICAgICAgICAgICBzdHIgPT4gcmVxdWlyZSgndXJsJykucGFyc2Uoc3RyKSA6XG4gICAgICAgICAgICBzdHIgPT4gbmV3IFVSTChzdHIpO1xuICAgICAgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6ICdwcm9taXNlJyxcbiAgICAgIHRyYW5zaWVudDogdHJ1ZSxcbiAgICAgIGZhY3Rvcnk6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHRoaXMudmFsaWRhdGUoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdXJsID0gdGhpcy51cmw7XG4gICAgICAgIHJldHVybiB0aGlzLkhUVFBSZXF1ZXN0LmNyZWF0ZSh7XG4gICAgICAgICAgdXJsLFxuICAgICAgICAgIHJlc3BvbnNlVHlwZTogJ3RleHQnLFxuICAgICAgICB9KS5zZW5kKCkudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyAhPT0gMjAwKSB0aHJvdyByZXNwb25zZTtcbiAgICAgICAgICByZXR1cm4gcmVzcG9uc2UucGF5bG9hZDtcbiAgICAgICAgfSkudGhlbihqc29uU3RyID0+IHtcbiAgICAgICAgICBjb25zdCBhcnJheSA9IHRoaXMucGFyc2VyLnBhcnNlQ2xhc3NGcm9tU3RyaW5nKGpzb25TdHIsIHRoaXMub2YpO1xuICAgICAgICAgIGZvYW0uYXNzZXJ0KEFycmF5LmlzQXJyYXkoYXJyYXkpLCAnSHR0cEpzb25EQU86IEV4cGVjdGVkIGFycmF5Jyk7XG5cbiAgICAgICAgICBsZXQgZGFvID0gdGhpcy5NREFPLmNyZWF0ZSh7XG4gICAgICAgICAgICBvZjogdGhpcy5vZixcbiAgICAgICAgICAgIHByb3BlcnR5SW5kZXhHcm91cHM6IHRoaXMucHJvcGVydHlJbmRleEdyb3VwcyxcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIC8vIFJlY29udGV4dHVhbGl6ZSBpdGVtcyBpbiBEQU8gY29udGV4dC4gU2FmZSB0byByZXNvbHZlIGltbWVkaWF0ZWx5XG4gICAgICAgICAgLy8gYmVjYXVzZSBNREFPLnB1dCgpIGlzIHN5bmNocm9ub3VzLlxuICAgICAgICAgIGFycmF5LmZvckVhY2goaXRlbSA9PiBkYW8ucHV0KGl0ZW0uY2xvbmUoZGFvKSkpO1xuXG4gICAgICAgICAgcmV0dXJuIGRhbztcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgIH0sXG4gIF0sXG5cbiAgbWV0aG9kczogW1xuICAgIGZ1bmN0aW9uIHZhbGlkYXRlKCkge1xuICAgICAgdGhpcy5TVVBFUigpO1xuICAgICAgY29uc3QgdXJsID0gdGhpcy51cmw7XG4gICAgICBpZiAoIWZvYW0uU3RyaW5nLmlzSW5zdGFuY2UodXJsKSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdIdHRwSnNvbkRBTzogVVJMIGlzIG5vdCBhIFN0cmluZycpO1xuICAgICAgaWYgKCF0aGlzLnVybElzU2FmZSh0aGlzLmNyZWF0ZVVSTCh1cmwpKSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBIdHRwSnNvbkRBTzogVVJMIGlzIG5vdCBzYWZlOiAke3VybH1gKTtcbiAgICB9LFxuICAgIGZ1bmN0aW9uIHVybElzU2FmZSh1cmwpIHtcbiAgICAgIHJldHVybiB0aGlzLnNhZmVQcm90b2NvbHMuaW5jbHVkZXModXJsLnByb3RvY29sKSAmJlxuICAgICAgICAgIHRoaXMuc2FmZUhvc3RuYW1lcy5pbmNsdWRlcyh1cmwuaG9zdG5hbWUpICYmXG4gICAgICAgICAgdGhpcy5zYWZlUGF0aFByZWZpeGVzLnNvbWUocHJlZml4ID0+IHVybC5wYXRobmFtZS5zdGFydHNXaXRoKHByZWZpeCkpO1xuICAgIH0sXG4gIF0sXG59KTtcblxuZm9hbS5DTEFTUyh7XG4gIHBhY2thZ2U6ICdvcmcuY2hyb21pdW0uYXBpcy53ZWInLFxuICBuYW1lOiAnU2VyaWFsaXphYmxlSHR0cEpzb25EQU8nLFxuICBleHRlbmRzOiAnb3JnLmNocm9taXVtLmFwaXMud2ViLlNlcmlhbGl6YWJsZUluZGV4ZWREQU8nLFxuXG4gIGRvY3VtZW50YXRpb246IGBBIHByb3h5IHRoYXQgY2FuIGJlIGluc3RhbnRpYXRlZCBhcyBhIEh0dHBKc29uREFPXG4gICAgICBjb25maWd1cmF0aW9uICh3aXRob3V0IGZldGNoaW5nIGRhdGEpIGluIG9uZSBjb250ZXh0LCBhbmQgdGhlbiBkZXBsb3llZFxuICAgICAgKGJ5IGZldGNoaW5nIGRhdGEpIGluIGFub3RoZXIuIFRoaXMgaXMgYWNoaWV2ZWQgYnkgdXNpbmcgYSBsYXp5IGZhY3RvcnlcbiAgICAgIG9uIGEgdHJhbnNpZW50IFwiZGVsZWdhdGVcIiBwcm9wZXJ0eTsgb25seSBpbiBjb250ZXh0cyB3aGVyZSB0aGUgXCJkZWxlZ2F0ZVwiXG4gICAgICBwcm9wZXJ0eSBpcyBhY2Nlc3NlZCB3aWxsIGZldGNoIGRhdGEuYCxcblxuICByZXF1aXJlczogWydvcmcuY2hyb21pdW0uYXBpcy53ZWIuSHR0cEpzb25EQU8nXSxcblxuICBwcm9wZXJ0aWVzOiBbXG4gICAge1xuICAgICAgY2xhc3M6ICdTdHJpbmcnLFxuICAgICAgbmFtZTogJ3VybCcsXG4gICAgICBkb2N1bWVudGF0aW9uOiAnQ29uZmlndXJhdGlvbiBwYXNzZWQgdG8gZGVsZWdhdGUuJyxcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgIH0sXG4gICAge1xuICAgICAgY2xhc3M6ICdBcnJheScsXG4gICAgICBvZjogJ1N0cmluZycsXG4gICAgICBuYW1lOiAnc2FmZVByb3RvY29scycsXG4gICAgICBmYWN0b3J5OiBmdW5jdGlvbigpIHsgcmV0dXJuIFsnaHR0cHM6J107IH0sXG4gICAgfSxcbiAgICB7XG4gICAgICBjbGFzczogJ0FycmF5JyxcbiAgICAgIG9mOiAnU3RyaW5nJyxcbiAgICAgIG5hbWU6ICdzYWZlSG9zdG5hbWVzJyxcbiAgICAgIGZhY3Rvcnk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gWydsb2NhbGhvc3QnLCAnc3RvcmFnZS5nb29nbGVhcGlzLmNvbSddOyB9LFxuICAgIH0sXG4gICAge1xuICAgICAgY2xhc3M6ICdBcnJheScsXG4gICAgICBvZjogJ1N0cmluZycsXG4gICAgICBuYW1lOiAnc2FmZVBhdGhQcmVmaXhlcycsXG4gICAgICBmYWN0b3J5OiBmdW5jdGlvbigpIHsgcmV0dXJuIFsnL3dlYi1hcGktY29uZmx1ZW5jZS1kYXRhLWNhY2hlLyddOyB9LFxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogJ2RlbGVnYXRlJyxcbiAgICAgIGZhY3Rvcnk6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnZhbGlkYXRlKCk7XG4gICAgICAgIHJldHVybiBmb2FtLmxvb2t1cCgnb3JnLmNocm9taXVtLmFwaXMud2ViLkh0dHBKc29uREFPJykuY3JlYXRlKHtcbiAgICAgICAgICBvZjogdGhpcy5vZixcbiAgICAgICAgICBwcm9wZXJ0eUluZGV4R3JvdXBzOiB0aGlzLnByb3BlcnR5SW5kZXhHcm91cHMsXG4gICAgICAgICAgdXJsOiB0aGlzLnVybCxcbiAgICAgICAgICBzYWZlUHJvdG9jb2xzOiB0aGlzLnNhZmVQcm90b2NvbHMsXG4gICAgICAgICAgc2FmZUhvc3RuYW1lczogdGhpcy5zYWZlSG9zdG5hbWVzLFxuICAgICAgICAgIHNhZmVQYXRoUHJlZml4ZXM6IHRoaXMuc2FmZVBhdGhQcmVmaXhlcyxcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgIH0sXG4gIF0sXG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL2xpYi9kYW8vaHR0cF9qc29uX2Rhby5lczYuanMiLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgQ2hyb21pdW0gQXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGEgQlNELXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbi8vIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUuXG4ndXNlIHN0cmljdCc7XG5cbnJlcXVpcmUoJy4uL2FjdGlvbi5lczYuanMnKTtcbnJlcXVpcmUoJy4uL29iamVjdC5lczYuanMnKTtcbnJlcXVpcmUoJy4uL3Byb3BlcnR5LmVzNi5qcycpO1xucmVxdWlyZSgnLi9hcGlfY29tcGF0X2RhdGEuZXM2LmpzJyk7XG5yZXF1aXJlKCcuL3JlbGVhc2UuZXM2LmpzJyk7XG5cbmZvYW0uQ0xBU1Moe1xuICBuYW1lOiAnSW50ZXJvcFByb3BlcnR5JyxcbiAgcGFja2FnZTogJ29yZy5jaHJvbWl1bS5hcGlzLndlYicsXG4gIGV4dGVuZHM6ICdmb2FtLmNvcmUuSW50JyxcblxuICBkb2N1bWVudGF0aW9uOiBgQW4gaW50ZWdlciBwcm9wZXJ0eSB0aGF0IGNvbnRhaW5zIGEgdGhlIG51bWJlciBvZiByZWxlYXNlcy5gLFxuXG4gIHJlcXVpcmVzOiBbJ29yZy5jaHJvbWl1bS5hcGlzLndlYi5SZWxlYXNlJ10sXG5cbiAgcHJvcGVydGllczogW1xuICAgIHtcbiAgICAgIGNsYXNzOiAnRk9iamVjdEFycmF5JyxcbiAgICAgIG9mOiAnb3JnLmNocm9taXVtLmFwaXMud2ViLlJlbGVhc2UnLFxuICAgICAgbmFtZTogJ3JlbGVhc2VzJyxcbiAgICAgIGRvY3VtZW50YXRpb246IGBUaGUgYnJvd3NlciByZWxlYXNlcyBhc3NvY2lhdGVkIHdpdGggdGhpcyBwcm9wZXJ0eS5gLFxuICAgIH0sXG4gICAge1xuICAgICAgY2xhc3M6ICdEYXRlJyxcbiAgICAgIG5hbWU6ICdyZWxlYXNlRGF0ZScsXG4gICAgfSxcbiAgXSxcbn0pO1xuXG5mb2FtLkNMQVNTKHtcbiAgbmFtZTogJ0ludGVyb3BQcm9wZXJ0eUdlbmVyYXRvcicsXG4gIHBhY2thZ2U6ICdvcmcuY2hyb21pdW0uYXBpcy53ZWInLFxuXG4gIHByb3BlcnRpZXM6IFtcbiAgICB7XG4gICAgICBjbGFzczogJ0ZPYmplY3RBcnJheScsXG4gICAgICBvZjogJ29yZy5jaHJvbWl1bS5hcGlzLndlYi5SZWxlYXNlJyxcbiAgICAgIG5hbWU6ICdyZWxlYXNlcycsXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6ICdyZWxlYXNlU2VxTm9zXycsXG4gICAgICBleHByZXNzaW9uOiBmdW5jdGlvbihyZWxlYXNlcykge1xuICAgICAgICBsZXQgZGF0ZU1hcCA9IG5ldyBNYXAoKTtcbiAgICAgICAgbGV0IHJlbE1hcCA9IG5ldyBNYXAoKTtcbiAgICAgICAgZm9yIChjb25zdCByZWxlYXNlIG9mIHJlbGVhc2VzKSB7XG4gICAgICAgICAgY29uc3QgZGF0ZUtleSA9IHJlbGVhc2UucmVsZWFzZURhdGUuZ2V0VGltZSgpO1xuICAgICAgICAgIGlmICh0eXBlb2YgZGF0ZU1hcC5nZXQoZGF0ZUtleSkgIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBkYXRlTWFwLnNldChkYXRlS2V5LCAwKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgbnVtID0gZGF0ZU1hcC5nZXQoZGF0ZUtleSk7XG4gICAgICAgICAgcmVsTWFwLnNldChyZWxlYXNlLmlkLCBudW0pO1xuICAgICAgICAgIGRhdGVNYXAuc2V0KGRhdGVLZXksIG51bSArIDEpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZWxNYXA7XG4gICAgICB9LFxuICAgIH0sXG4gIF0sXG5cbiAgbWV0aG9kczogW1xuICAgIHtcbiAgICAgIG5hbWU6ICdwcm9wZXJ0eU5hbWVGcm9tUmVsZWFzZScsXG4gICAgICBjb2RlOiBmdW5jdGlvbiAocmVsZWFzZSkge1xuICAgICAgICByZXR1cm4gYHIke3JlbGVhc2UucmVsZWFzZURhdGUuZ2V0VGltZSgpfV8ke3RoaXMucmVsZWFzZVNlcU5vc18uZ2V0KHJlbGVhc2UuaWQpfWA7XG4gICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogJ3Byb3BlcnR5TGFiZWxGcm9tUmVsZWFzZScsXG4gICAgICBjb2RlOiBmdW5jdGlvbihyZWxlYXNlKSB7XG4gICAgICAgIHJldHVybiBgJHtyZWxlYXNlLnJlbGVhc2VEYXRlLnRvRGF0ZVN0cmluZygpfSAjJHt0aGlzLnJlbGVhc2VTZXFOb3NfLmdldChyZWxlYXNlLmlkKX1gO1xuICAgICAgfSxcbiAgICB9LFxuICBdLFxufSlcblxuZm9hbS5DTEFTUyh7XG4gIG5hbWU6ICdBYnN0cmFjdEludGVyb3BDbGFzc0dlbmVyYXRvcicsXG4gIHBhY2thZ2U6ICdvcmcuY2hyb21pdW0uYXBpcy53ZWInLFxuXG4gIHJlcXVpcmVzOiBbXG4gICAgJ29yZy5jaHJvbWl1bS5hcGlzLndlYi5JbnRlcm9wUHJvcGVydHlHZW5lcmF0b3InLFxuICAgICdvcmcuY2hyb21pdW0uYXBpcy53ZWIuZ2VuZXJhdGVkLkNvbXBhdERhdGEnLFxuICBdLFxuXG4gIG1ldGhvZHM6IFtcbiAgICB7XG4gICAgICBuYW1lOiAnZ2VuZXJhdGVTcGVjJyxcbiAgICAgIC8vIE5PVEU6IFJlbGVhc2VzIG11c3QgYmUgaW4gYSBkZXRlcm1pbmlzdGljY3Jvbm9sb2dpY2FsIHJlbGVhc2UgZGF0ZSBvcmRlci5cbiAgICAgIGNvZGU6IGZ1bmN0aW9uKHBrZywgbmFtZSwgcmVsZWFzZXMpIHtcbiAgICAgICAgY29uc3QgZ2VuID0gdGhpcy5JbnRlcm9wUHJvcGVydHlHZW5lcmF0b3IuY3JlYXRlKHtyZWxlYXNlc30pO1xuICAgICAgICBsZXQgc3BlYyA9IHtcbiAgICAgICAgICBjbGFzczogJ01vZGVsJyxcbiAgICAgICAgICBwYWNrYWdlOiBwa2csXG4gICAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgICBleHRlbmRzOiAnb3JnLmNocm9taXVtLmFwaXMud2ViLkFic3RyYWN0QXBpQ29tcGF0RGF0YScsXG5cbiAgICAgICAgICByZXF1aXJlczogWydvcmcuY2hyb21pdW0uYXBpcy53ZWIuSW50ZXJvcFByb3BlcnR5J10sXG5cbiAgICAgICAgICBwcm9wZXJ0aWVzOiBbXSxcbiAgICAgICAgfTtcblxuICAgICAgICBsZXQgcHJvcFNwZWNzID0gW107XG4gICAgICAgIGxldCBjdXJyZW50UmVsZWFzZXNNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgIGxldCBpO1xuICAgICAgICBmb3IgKGkgPSAwOyBjdXJyZW50UmVsZWFzZXNNYXAuc2l6ZSA8IDQ7IGkrKykge1xuICAgICAgICAgIGN1cnJlbnRSZWxlYXNlc01hcC5zZXQocmVsZWFzZXNbaV0uYnJvd3Nlck5hbWUsIHJlbGVhc2VzW2ldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoaS0tOyBpIDwgcmVsZWFzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCByZWxlYXNlID0gcmVsZWFzZXNbaV07XG4gICAgICAgICAgY3VycmVudFJlbGVhc2VzTWFwLnNldChyZWxlYXNlLmJyb3dzZXJOYW1lLCByZWxlYXNlKTtcbiAgICAgICAgICBjb25zdCBjdXJyZW50UmVsZWFzZXMgPSBBcnJheS5mcm9tKGN1cnJlbnRSZWxlYXNlc01hcC52YWx1ZXMoKSk7XG4gICAgICAgICAgbGV0IGNvbHMgPSBbXTtcbiAgICAgICAgICBmb3IgKGNvbnN0IHJlbGVhc2Ugb2YgY3VycmVudFJlbGVhc2VzKSB7XG4gICAgICAgICAgICBjb2xzLnB1c2godGhpcy5Db21wYXREYXRhLmdldEF4aW9tQnlOYW1lKFxuICAgICAgICAgICAgICAgIGdlbi5wcm9wZXJ0eU5hbWVGcm9tUmVsZWFzZShyZWxlYXNlKSkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHByb3BTcGVjcy5wdXNoKHtcbiAgICAgICAgICAgIGNsYXNzOiAnb3JnLmNocm9taXVtLmFwaXMud2ViLkludGVyb3BQcm9wZXJ0eScsXG4gICAgICAgICAgICBuYW1lOiBnZW4ucHJvcGVydHlOYW1lRnJvbVJlbGVhc2UocmVsZWFzZSksXG4gICAgICAgICAgICBsYWJlbDogZ2VuLnByb3BlcnR5TGFiZWxGcm9tUmVsZWFzZShyZWxlYXNlKSxcbiAgICAgICAgICAgIHJlbGVhc2VzOiBBcnJheS5mcm9tKGN1cnJlbnRSZWxlYXNlcyksXG4gICAgICAgICAgICByZWxlYXNlRGF0ZTogcmVsZWFzZS5yZWxlYXNlRGF0ZSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNwZWMucHJvcGVydGllcyA9IHNwZWMucHJvcGVydGllcy5jb25jYXQocHJvcFNwZWNzKTtcblxuICAgICAgICByZXR1cm4gc3BlYztcbiAgICAgIH0sXG4gICAgfSxcbiAgICB7XG4gICAgICBuYW1lOiAnZ2VuZXJhdGVDbGFzcycsXG4gICAgICBkb2N1bWVudGF0aW9uOiBgR2VuZXJhdGUgYSBjbGFzcyBiYXNlZCBvbiBhIHNwZWMgb3IgZm9hbS5jb3JlLk1vZGVsLiBUaGVcbiAgICAgICAgICBmb3JtZXIgaXMgdXNlZCBkdXJpbmcgZGF0YSBnZW5lcmF0aW9uIHBoYXNlOyB0aGUgbGF0dGVyIGlzIHVzZWQgd2hlblxuICAgICAgICAgIGxvYWRpbmcgYSBtb2RlbCBmb3IgZXhpc3RpbmcgZGF0YS5gLFxuICAgICAgY29kZTogZnVuY3Rpb24oc3BlY09yTW9kZWwpIHtcbiAgICAgICAgaWYgKGZvYW0uY29yZS5Nb2RlbC5pc0luc3RhbmNlKHNwZWNPck1vZGVsKSkge1xuICAgICAgICAgIC8vIFJ1biBwb3N0LW1vZGVsIGluc3RhbnRpYXRpb24gc3RlcHMgZnJvbTpcbiAgICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vZm9hbS1mcmFtZXdvcmsvZm9hbTIvYmxvYi82MzJjNjQ2N2MwYTdmMTIzYTIyNzBjYzU0OWRiNWQ4ZTNkOTNiNTc0L3NyYy9mb2FtL2NvcmUvQm9vdC5qcyNMMjAxXG4gICAgICAgICAgY29uc3QgbW9kZWwgPSBzcGVjT3JNb2RlbDtcbiAgICAgICAgICBtb2RlbC52YWxpZGF0ZSgpO1xuICAgICAgICAgIGNvbnN0IGNscyA9IG1vZGVsLmJ1aWxkQ2xhc3MoKTtcbiAgICAgICAgICBjbHMudmFsaWRhdGUoKTtcbiAgICAgICAgICBmb2FtLnJlZ2lzdGVyKGNscyk7XG4gICAgICAgICAgZm9hbS5wYWNrYWdlLnJlZ2lzdGVyQ2xhc3MoY2xzKTtcbiAgICAgICAgICByZXR1cm4gY2xzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIERlY2xhcmUgY2xhc3MgZnJvbSBzcGVjIGFzIHVzdWFsLlxuICAgICAgICAgIGNvbnN0IHNwZWMgPSBzcGVjT3JNb2RlbDtcbiAgICAgICAgICBmb2FtLkNMQVNTKHNwZWMpO1xuICAgICAgICAgIHJldHVybiBmb2FtLmxvb2t1cChgJHtzcGVjLnBhY2thZ2V9LiR7c3BlYy5uYW1lfWApO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH0sXG4gIF0sXG59KTtcblxuZm9hbS5DTEFTUyh7XG4gIG5hbWU6ICdJbnRlcm9wQ2xhc3NHZW5lcmF0b3InLFxuICBwYWNrYWdlOiAnb3JnLmNocm9taXVtLmFwaXMud2ViJyxcbiAgZXh0ZW5kczogJ29yZy5jaHJvbWl1bS5hcGlzLndlYi5BYnN0cmFjdEludGVyb3BDbGFzc0dlbmVyYXRvcicsXG5cbiAgZG9jdW1lbnRhdGlvbjogJ1NpbmdsZXRvbiBBYnN0cmFjdEludGVyb3BDbGFzc0dlbmVyYXRvcicsXG5cbiAgYXhpb21zOiBbZm9hbS5wYXR0ZXJuLlNpbmdsZXRvbi5jcmVhdGUoKV0sXG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL2xpYi93ZWJfYXBpcy9hcGlfaW50ZXJvcF9kYXRhLmVzNi5qcyIsIm1vZHVsZS5leHBvcnRzID0gW1wiRk9iamVjdFwiLFwiUHJvcGVydHlcIixcIlJlcXVpcmVzXCIsXCJTdHJpbmdcIixcIl9fUHJvcGVydHlfX1wiLFwiY29tLmdvb2dsZS5jbG91ZC5kYXRhc3RvcmUuRGF0YXN0b3JlTXV0YXRpb25cIixcImZvYW0uYm94LkJveFwiLFwiZm9hbS5ib3guRXZlbnRNZXNzYWdlXCIsXCJmb2FtLmJveC5NZXNzYWdlXCIsXCJmb2FtLmJveC5OYW1lZEJveFwiLFwiZm9hbS5ib3guUlBDRXJyb3JNZXNzYWdlXCIsXCJmb2FtLmJveC5SUENNZXNzYWdlXCIsXCJmb2FtLmJveC5SUENSZXR1cm5NZXNzYWdlXCIsXCJmb2FtLmJveC5SYXdTb2NrZXRCb3hcIixcImZvYW0uYm94LlJlZ2lzdGVyU2VsZk1lc3NhZ2VcIixcImZvYW0uYm94LlJlcGx5Qm94XCIsXCJmb2FtLmJveC5SZXR1cm5Cb3hcIixcImZvYW0uYm94LlNrZWxldG9uQm94XCIsXCJmb2FtLmJveC5Tb2NrZXRCb3hcIixcImZvYW0uYm94LlNvY2tldENvbm5lY3RCb3hcIixcImZvYW0uYm94LlN1YkJveFwiLFwiZm9hbS5ib3guU3ViQm94TWVzc2FnZVwiLFwiZm9hbS5jb3JlLkZPYmplY3RcIixcImZvYW0uY29yZS5Qcm9wZXJ0eVwiLFwiZm9hbS5jb3JlLlJlcXVpcmVzXCIsXCJmb2FtLmNvcmUuU3RyaW5nXCIsXCJmb2FtLmRhby5BcnJheVNpbmtcIixcImZvYW0uZGFvLkNsaWVudFNpbmtcIixcImZvYW0uZGFvLkRBT1wiLFwiZm9hbS5kYW8uTWVyZ2VkUmVzZXRTaW5rXCIsXCJmb2FtLmRhby5Qcm94eUxpc3RlbmVyXCIsXCJmb2FtLm1sYW5nLkNvbnN0YW50XCIsXCJmb2FtLm1sYW5nLmV4cHIuRG90XCIsXCJmb2FtLm1sYW5nLm9yZGVyLkNvbXBhcmF0b3JcIixcImZvYW0ubWxhbmcub3JkZXIuRGVzY1wiLFwiZm9hbS5tbGFuZy5vcmRlci5UaGVuQnlcIixcImZvYW0ubWxhbmcucHJlZGljYXRlLkFuZFwiLFwiZm9hbS5tbGFuZy5wcmVkaWNhdGUuQ29udGFpbnNcIixcImZvYW0ubWxhbmcucHJlZGljYXRlLkNvbnRhaW5zSUNcIixcImZvYW0ubWxhbmcucHJlZGljYXRlLkVxXCIsXCJmb2FtLm1sYW5nLnByZWRpY2F0ZS5GYWxzZVwiLFwiZm9hbS5tbGFuZy5wcmVkaWNhdGUuR3RcIixcImZvYW0ubWxhbmcucHJlZGljYXRlLkd0ZVwiLFwiZm9hbS5tbGFuZy5wcmVkaWNhdGUuSGFzXCIsXCJmb2FtLm1sYW5nLnByZWRpY2F0ZS5JblwiLFwiZm9hbS5tbGFuZy5wcmVkaWNhdGUuSW5JQ1wiLFwiZm9hbS5tbGFuZy5wcmVkaWNhdGUuS2V5d29yZFwiLFwiZm9hbS5tbGFuZy5wcmVkaWNhdGUuTHRcIixcImZvYW0ubWxhbmcucHJlZGljYXRlLkx0ZVwiLFwiZm9hbS5tbGFuZy5wcmVkaWNhdGUuTmVxXCIsXCJmb2FtLm1sYW5nLnByZWRpY2F0ZS5Ob3RcIixcImZvYW0ubWxhbmcucHJlZGljYXRlLk9yXCIsXCJmb2FtLm1sYW5nLnByZWRpY2F0ZS5TdGFydHNXaXRoXCIsXCJmb2FtLm1sYW5nLnByZWRpY2F0ZS5TdGFydHNXaXRoSUNcIixcImZvYW0ubWxhbmcucHJlZGljYXRlLlRydWVcIixcImZvYW0ubWxhbmcuc2luay5Db3VudFwiLFwiZm9hbS5tbGFuZy5zaW5rLkdyb3VwQnlcIixcImZvYW0ubWxhbmcuc2luay5NYXhcIixcImZvYW0ubWxhbmcuc2luay5NaW5cIixcImZvYW0ubWxhbmcuc2luay5OdWxsU2lua1wiLFwiZm9hbS5tbGFuZy5zaW5rLlN1bVwiLFwiZm9hbS5tbGFuZy5zaW5rLlVuaXF1ZVwiLFwib3JnLmNocm9taXVtLmFwaXMud2ViLmdlbmVyYXRlZC5Db21wYXREYXRhXCIsXCJvcmcuY2hyb21pdW0uYXBpcy53ZWIuQWJzdHJhY3RBcGlDb21wYXREYXRhXCIsXCJvcmcuY2hyb21pdW0uYXBpcy53ZWIuQXBpRXh0cmFjdG9yU2VydmljZVwiLFwib3JnLmNocm9taXVtLmFwaXMud2ViLkFwaUNvdW50RGF0YVwiLFwib3JnLmNocm9taXVtLmFwaXMud2ViLkJyb3dzZXJNZXRyaWNEYXRhXCIsXCJvcmcuY2hyb21pdW0uYXBpcy53ZWIuQnJvd3Nlck1ldHJpY0RhdGFUeXBlXCIsXCJvcmcuY2hyb21pdW0uYXBpcy53ZWIuQ29tcGF0UHJvcGVydHlcIixcIm9yZy5jaHJvbWl1bS5hcGlzLndlYi5JbnRlcm9wUHJvcGVydHlcIixcIm9yZy5jaHJvbWl1bS5hcGlzLndlYi5Db25mbHVlbmNlU3luY0RBT1wiLFwib3JnLmNocm9taXVtLmFwaXMud2ViLkRhdGFMb2FkZWRFdmVudFwiLFwib3JnLmNocm9taXVtLmFwaXMud2ViLk1ldHJpY0NvbXB1dGVyU2VydmljZVwiLFwib3JnLmNocm9taXVtLmFwaXMud2ViLk1ldHJpY0NvbXB1dGVyVHlwZVwiLFwib3JnLmNocm9taXVtLmFwaXMud2ViLlJlbGVhc2VcIixcIm9yZy5jaHJvbWl1bS5hcGlzLndlYi5SZWxlYXNlV2ViSW50ZXJmYWNlSnVuY3Rpb25cIixcIm9yZy5jaHJvbWl1bS5hcGlzLndlYi5TZXJpYWxpemFibGVIdHRwSnNvbkRBT1wiLFwib3JnLmNocm9taXVtLmFwaXMud2ViLlNlcmlhbGl6YWJsZUxvY2FsSnNvbkRBT1wiLFwib3JnLmNocm9taXVtLmFwaXMud2ViLlZlcnNpb25lZEFwaUNvdW50RGF0YVwiLFwib3JnLmNocm9taXVtLmFwaXMud2ViLlZlcnNpb25lZEJyb3dzZXJNZXRyaWNEYXRhXCIsXCJvcmcuY2hyb21pdW0uYXBpcy53ZWIuVmVyc2lvbmVkUmVsZWFzZVwiLFwib3JnLmNocm9taXVtLmFwaXMud2ViLlZlcnNpb25lZFJlbGVhc2VXZWJJbnRlcmZhY2VKdW5jdGlvblwiLFwib3JnLmNocm9taXVtLmFwaXMud2ViLlZlcnNpb25lZFdlYkludGVyZmFjZVwiLFwib3JnLmNocm9taXVtLmFwaXMud2ViLldlYkludGVyZmFjZVwiLFwib3JnLmNocm9taXVtLmFwaXMud2ViLldvcmtlckRBT1wiLFwib3JnLmNocm9taXVtLm1sYW5nLkFycmF5Q291bnRcIixcIm9yZy5jaHJvbWl1bS5tbGFuZy5TZXFcIixcIm9yZy5jaHJvbWl1bS5tbGFuZy5UcnV0aHlcIl1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL2RhdGEvY2xhc3Nfd2hpdGVsaXN0Lmpzb25cbi8vIG1vZHVsZSBpZCA9IDcwXG4vLyBtb2R1bGUgY2h1bmtzID0gMCAyIl0sInNvdXJjZVJvb3QiOiIifQ==
