/**
 * Created by baebae on 1/27/16.
 */

import { createStore } from 'redux'
var ReduxStoreController = {
	reduxStore : null,

	todos(state = [], action) {
		switch (action.type) {
			case 'AudioURL':
				state.audioURL = action.text;
				break;
			case 'AudioLength':
				state.audioLength = action.text;
				break;
			default:
				return state;
		}
		return state;
	},

	initializeStore: function() {
		this.reduxStore = createStore(this.todos, {});
	},

	getAppStore: function() {
		return this.reduxStore;
	}
};

module.exports = ReduxStoreController;