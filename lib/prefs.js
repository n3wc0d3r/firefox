/*
	prefs.js
	Copyright © 2009-2011  WOT Services Oy <info@mywot.com>

	This file is part of WOT.

	WOT is free software: you can redistribute it and/or modify it
	under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	WOT is distributed in the hope that it will be useful, but WITHOUT
	ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
	or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
	License for more details.

	You should have received a copy of the GNU General Public License
	along with WOT. If not, see <http://www.gnu.org/licenses/>.
*/

const constants = require("constants.js").constants;
const messaging = require("messaging");
const utils = require("utils");
const logger = require("logger");

const simpleStorage = require("simple-storage");

(function() {


	if(typeof simpleStorage.storage.prefs == "undefined") {
		simpleStorage.storage.prefs = {};
	}

	var localStorage = simpleStorage.storage.prefs;

	var defaults = {
			/* setting names are the same for each platform, don't change */
			accessible:				false,
			min_confidence_level:	constants.confidencelevels[2].min + 2,
			my_cookies:				true,
			popup_hide_delay:		1000,
			popup_show_delay:		200,
			search_ignore_0:		false,
			search_ignore_1:		false,
			search_ignore_2:		false,
			search_ignore_4:		true,
			search_level:			constants.reputationlevels[5].min,
			search_type:			constants.searchtypes.optimized,
			show_application_0:		true,
			show_application_1:		true,
			show_application_2:		true,
			show_application_4:		true,
			show_search_popup:		true,
			use_search_level:		false,
			status_level:			"",
			warning_level_0:		constants.reputationlevels[4].min - 1,
			warning_level_1:		constants.reputationlevels[4].min - 1,
			warning_level_2:		constants.reputationlevels[4].min - 1,
			warning_level_4:		0,
			warning_opacity:		0.7,
			warning_type_0:			constants.warningtypes.overlay,
			warning_type_1:			constants.warningtypes.overlay,
			warning_type_2:			constants.warningtypes.overlay,
			warning_type_4:			constants.warningtypes.none,
			warning_unknown_0:		false,
			warning_unknown_1:		false,
			warning_unknown_2:		false,
			warning_unknown_4:		false
		};

	var set = exports.set = function(name, value) {
		logger.log("- prefs.set <" + name + ">");
		try {
			localStorage[name] = JSON.stringify(value);
			messaging.trigger("prefs:set", [ name, value ]);
			return true;
		} catch (e) {
			logger.fail("prefs.set: failed with ", e);
		}

		return false;
	};

	var get = exports.get = function(name) {
		logger.log("- prefs.get <" + name + ">");
		try {
			var value;

			try {
				value = JSON.parse(localStorage[name]);
				logger.log("- pref.get, value" + value);
			} catch (e) {
			}

			if (value == null) {
				value = constants[name];
			}

			messaging.trigger("prefs:get", [ name, value ]);
			return value;
		} catch (e) {
			logger.fail("prefs.get: failed with ", e);
		}

		return null;
	};

	var clear = exports.clear = function(name) {
		try {
			delete localStorage[name];
			messaging.trigger("prefs:clear", [ name ]);
			return true;
		} catch (e) {
			logger.fail("prefs.clear: failed with ", e);
		}

		return false;
	};

	var each = exports.each = function(func, params) {
		if (typeof(func) != "function") {
			logger.log('prefs.each / not a function provided. Exiting');
			return;
		}

		params = params || [];

		for (key in localStorage) {

			var rv = func.apply(null,
						[ key, get(key) ].concat(params));

			if (rv) {
				return;
			}
		}
	};

	var getall = exports.getall = function() {

		var prefs_data = utils.extend(defaults, {});

		each(function(name, value) {
			prefs_data[name] = value;
		});

		return prefs_data;

	};

	messaging.bind("message:prefs:getm", function(port, data) {
		var values = {};

		data.names.forEach(function(item) {
			values[item] = get(item);
		});

		port.post("putm", {
			values: values
		});
	});

//	messaging.bind("message:prefs:get", function(port, data) {
//			port.post("put", {
//				name: data.name,
//				value: get(data.name)
//			});
//	});

	messaging.bind("message:prefs:set", function(port, data) {
		set(data.name, data.value);
	});

	messaging.bind("message:prefs:clear", function(port, data) {
		clear(data.name);
	});

	//messaging.listen("prefs");

})();
