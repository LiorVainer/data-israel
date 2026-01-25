"use strict";
/**
 * Data.gov.il CKAN API Client
 *
 * Provides typed access to the Israeli open data portal API
 * Base URL: https://data.gov.il/api/3
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataGovApi = void 0;
var axios_1 = require("axios");
var BASE_URL = 'https://data.gov.il/api/3';
/**
 * Axios instance configured for data.gov.il API
 */
var axiosInstance = axios_1.default.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});
/**
 * Generic GET request that automatically unwraps DataGovResponse
 * @param endpoint - API endpoint (e.g., '/action/package_search')
 * @param params - Query parameters
 * @returns The unwrapped result from the API response
 */
function dataGovGet(endpoint, params) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, axiosInstance.get(endpoint, { params: params })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.data.result];
            }
        });
    });
}
/**
 * Data.gov.il API client with organized namespaces
 */
exports.dataGovApi = {
    /**
     * System operations
     */
    system: {
        /**
         * Get CKAN version and installed extensions
         * @returns Status information including CKAN version
         */
        status: function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, dataGovGet('/action/status_show')];
            });
        }); },
        /**
         * Get list of available licenses
         * @returns Array of license objects
         */
        licenses: function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, dataGovGet('/action/license_list')];
            });
        }); },
        /**
         * Get the schema for a dataset type
         * @param type - Dataset type ('dataset' or 'info')
         * @returns Schema definition
         */
        schema: function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (type) {
                if (type === void 0) { type = 'dataset'; }
                return __generator(this, function (_a) {
                    return [2 /*return*/, dataGovGet('/action/scheming_dataset_schema_show', { type: type })];
                });
            });
        },
    },
    /**
     * Dataset operations
     */
    dataset: {
        /**
         * Get all dataset IDs
         * @returns Array of dataset IDs/names
         */
        list: function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, dataGovGet('/action/package_list')];
            });
        }); },
        /**
         * Search for datasets
         * @param params - Search parameters
         * @returns Search results with count and dataset list
         */
        search: function (params) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, dataGovGet('/action/package_search', params)];
            });
        }); },
        /**
         * Get details for a specific dataset
         * @param id - Dataset ID or name
         * @returns Full dataset information
         */
        show: function (id) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, dataGovGet('/action/package_show', { id: id })];
            });
        }); },
        /**
         * Get activity stream of a dataset
         * @param id - Dataset ID
         * @param params - Pagination parameters
         * @returns Array of activities
         */
        activity: function (id, params) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, dataGovGet('/action/package_activity_list', __assign({ id: id }, params))];
            });
        }); },
    },
    /**
     * Organization operations
     */
    organization: {
        /**
         * List all organizations
         * @returns Array of organization names
         */
        list: function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, dataGovGet('/action/organization_list')];
            });
        }); },
        /**
         * Get details of a specific organization
         * @param id - Organization ID or name
         * @returns Organization details
         */
        show: function (id) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, dataGovGet('/action/organization_show', { id: id })];
            });
        }); },
        /**
         * Get activity stream of an organization
         * @param id - Organization ID or name
         * @param params - Pagination parameters
         * @returns Array of activities
         */
        activity: function (id, params) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, dataGovGet('/action/organization_activity_list', __assign({ id: id }, params))];
            });
        }); },
    },
    /**
     * Resource operations
     */
    resource: {
        /**
         * Search for resources
         * @param params - Search parameters
         * @returns Search results with count and resources
         */
        search: function (params) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, dataGovGet('/action/resource_search', params)];
            });
        }); },
        /**
         * Get metadata for a specific resource
         * @param id - Resource ID
         * @param includeTracking - Include tracking information
         * @returns Resource metadata
         */
        show: function (id_1) {
            var args_1 = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args_1[_i - 1] = arguments[_i];
            }
            return __awaiter(void 0, __spreadArray([id_1], args_1, true), void 0, function (id, includeTracking) {
                if (includeTracking === void 0) { includeTracking = false; }
                return __generator(this, function (_a) {
                    return [2 /*return*/, dataGovGet('/action/resource_show', {
                            id: id,
                            include_tracking: includeTracking,
                        })];
                });
            });
        },
    },
    /**
     * Group (publisher/category) operations
     */
    group: {
        /**
         * List all groups
         * @param params - List parameters
         * @returns Array of groups
         */
        list: function (params) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, dataGovGet('/action/group_list', params)];
            });
        }); },
    },
    /**
     * Tag (keyword) operations
     */
    tag: {
        /**
         * List all tags
         * @param params - List parameters
         * @returns Array of tags
         */
        list: function (params) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, dataGovGet('/action/tag_list', params)];
            });
        }); },
    },
    /**
     * DataStore operations for querying resource data
     */
    datastore: {
        /**
         * Search/query data within a DataStore resource
         * @param params - Query parameters
         * @returns DataStore search results with fields and records
         */
        search: function (params) { return __awaiter(void 0, void 0, void 0, function () {
            var queryParams;
            return __generator(this, function (_a) {
                queryParams = {
                    resource_id: params.resource_id,
                    limit: params.limit,
                    offset: params.offset,
                    sort: params.sort,
                    q: params.q,
                    plain: params.plain,
                };
                if (params.filters) {
                    queryParams.filters = JSON.stringify(params.filters);
                }
                return [2 /*return*/, dataGovGet('/action/datastore_search', queryParams)];
            });
        }); },
    },
};
