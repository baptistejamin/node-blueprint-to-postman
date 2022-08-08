var fs = require("fs");
var drafter = require("drafter.js")

module.exports = class BlueprintToPostman {
  constructor(options) {
    this.options = {
      URL_HOST : "{{base_url}}"
    };

    Object.assign(this.options, options);
  }

  convert(input, fn_transform) {
    return Promise.resolve()
      .then(() => {
        return this.__convert_blueprint(input)
      })
      .then(blueprint_object => {
        return this.__get_blueprint_requests(blueprint_object);
      })
      .then(requests => {
        return this.__build_postman_collection(requests, fn_transform);
      })
      .then(postman_object => {
        return Promise.resolve(
          JSON.stringify(postman_object, null, 2)
        );
      })
      .catch(e => {
        return Promise.reject(e);
      });
  }

  __convert_blueprint(raw_blueprint) {
    return new Promise((resolve, reject) => {
      drafter.parse(raw_blueprint, (err, data) => {
        if (err) {
          return reject(err);
        }

        return resolve(data);
      });
    });
  }

  __get_blueprint_requests(blueprint_object) {
    let _requests = [];

    // Crawl blueprint object recursively
    this.__get_blueprint_requests_recursively(blueprint_object, [], _requests);

    return Promise.resolve(_requests);
  }

  __build_postman_collection(requests, fn_transform) {
    let _base = {
      "info": {
          "name": "Reference",
          "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
      },
      "item": []
    };

    this.__build_postman_requests(_base, requests, fn_transform);

    return _base;
  }

  __get_blueprint_requests_recursively(blueprint_object, parents = [], _requests) {
    let _children = blueprint_object.content || [];

    // Stack parents
    if (blueprint_object && blueprint_object.element === "category" || blueprint_object.element === "resource") {
      let _name = blueprint_object.meta.title.content;
      let _description = "";

      if (_children[0] && _children[0].element === "copy") {
        _description = _children[0].content;
      }

      if (_name !== "Reference") {
        parents.push({
          name: _name,
          description: _description
        });
      }
    }

    // Stack requests (marked as transitions)
    if (blueprint_object && blueprint_object.element === "transition") {
      _requests.push({
        parents: parents,
        request: blueprint_object
      });
    }

    // Crawl blueprint object
    if (Array.isArray(_children)) {
      for (let _i = 0; _i < _children.length; _i++) {
        this.__get_blueprint_requests_recursively(_children[_i], [...parents], _requests);
      }
    }
  }

  __find_or_create_folder(postman_object, parents) {
    let _postman_folders = postman_object.item;

    for (let _i = 0; _i < parents.length; _i++) {
      let _current_folder = _postman_folders.find((folder) => {
        return folder.name === parents[_i].name
      });

      // Create a new folder
      if (!_current_folder) {
        _current_folder = {
          name: parents[_i].name,
          description: parents[_i].description,
          item: []
        };

        _postman_folders.push(_current_folder);
      }

      _postman_folders = _current_folder.item;
    }

    // Return last found occurence.
    return _postman_folders;
  }

  __build_postman_requests(postman_object, bluebird_requests, fn_transform) {
    bluebird_requests.forEach((request) => {
      let _parents = request.parents;
      let _request = request.request;

      let _folder = this.__find_or_create_folder(postman_object, _parents);

      let _item = {};

      _item.name = _request.meta.title.content;

      if (_request.content[0] && typeof _request.content[0].content === "string") {
        _item.description = _request.content[0].content;
      }

      _item.request = {
        url : {
          host : this.options.URL_HOST,
          path : this.__build_postman_request_url(_request.attributes.href.content),
        }
      };

      let { variables: _variables, queries: _queries} = (
        this.__build_postman_request_variable_queries(
          _item.request.url.path,
          _request.attributes.hrefVariables
        )
      );

      _item.request.url.variable = _variables;
      _item.request.url.query = _queries;

      let { method: _method, headers: _headers, body: _body} = (
        this.__build_postman_method_headers_body(_request.content[1])
      );

      _item.request.method = _method;
      _item.request.header = _headers;
      _item.request.body = _body;

      if (fn_transform) {
        _item = fn_transform(_item, _request);
      }

      _folder.push(_item);
    });
  }

  __build_postman_request_url(raw_path) {
    return raw_path
      .split("/")
      .map(key => {
        // Map route parameters and delete query parameters
        return key
          .replace(/\{(\w*)\}/g, (_, $1) => {
            return `:${$1}`;
          })
          .replace(/\{[?&]\w*\}/g, "");
      })
      .filter(key => {
        return key !== ""
      });
  }

  __build_postman_request_variable_queries(path, href_variables = {}) {
    let _variables = [];
    let _queries = [];

    (href_variables.content || []).forEach(variable => {
      let _postman_variable = {};

      _postman_variable.description = (
        (((variable.meta || {}).description) || {}).content
      );

      _postman_variable.key = variable.content.key.content;
      _postman_variable.value = variable.content.value.content || "";

      if (path.indexOf(`:${_postman_variable.key}`) !== -1) {
        // Consider as a variable
        _variables.push(_postman_variable);
      } else {
        // Fallback as query parameter
        _queries.push(_postman_variable);
      }
    });

    return {
      variables: _variables,
      queries:_queries
    };
  }

  __build_postman_method_headers_body(request_content) {
    let _method = "GET";
    let _headers = [];
    let _body = {};
    let _is_json = false;

    let _request = request_content.content[0];

    _method = _request.attributes.method.content;

    _request.attributes.headers.content.forEach((header) => {
      if (header.content.key.content.toLowerCase() === "content-type" &&
          header.content.value.content.toLowerCase() === "application/json") {
        _is_json = true;
      }

      _headers.push({
        key: header.content.key.content,
        value: header.content.value.content
      })
    });

    if (["POST", "PUT", "PATCH"].indexOf(_method) !== -1) {
      let _raw_body = _request.content.find((content) => {
        return content.element === "asset"
      });

      _body = {
        raw  : (_raw_body || {}).content || {},
        mode : "raw"
      }

      if (_is_json) {
        _body.options = {
          raw: {
            language: "json"
          }
        };
      }
    }

    return {
      method: _method,
      headers: _headers,
      body: _body
    };
  }
}
