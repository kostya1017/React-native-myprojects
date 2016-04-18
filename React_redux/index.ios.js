/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */
'use strict';
import React, {
  AppRegistry,
  Component,
  StyleSheet,
  Text,
  Navigator,
  View
} from 'react-native';

var homeRoute = {id:"main_route", name: "Home"};
var playRoute = {id:"play_route", name: "Play audio"};

var ReduxStoreController = require('./ReduxStoreController');
ReduxStoreController.initializeStore();

var routeStack = [homeRoute, playRoute];
var TestProject1 = React.createClass({
  getInitialState: function(){
    return {
      loaded:false
    }
  },

  componentWillMount: function() {
    var component = this;
    component.setState({
      loaded: true,
    });
  },

  render: function() {
    return (
        <Navigator
          ref="nav"
          initialRoute={homeRoute}
          initialRouteStack={routeStack}
          renderScene={this.renderScene}
          configureScene={this.configureScene}
          sceneStyle={styles.scene}
         />
    );
  },
  _onChange: function(event: Event) {
    console.log("OnChange:" + JSON.stringify(event));
  },
  renderScene: function(route, navigator) {
    var routeId = route.id;
    if (this.state.loaded) {
      if (routeId === 'main_route') {
        var Main = require('./Main');
        return (
            <Main navigator={navigator} onChange={this._onChange} />
        );
      }

      if (routeId === 'play_route') {
        var Play = require('./Play');
        return (
            <Play navigator={navigator} onChange={this._onChange} />
        );
      }
    }
  }
});

const styles = StyleSheet.create({
  navbar : {
    flex:1,
    justifyContent: 'center',
    backgroundColor: '#F2BAF2',
  },
  backButton: {

  },
  scene: {
    flex: 1,
    backgroundColor: '#02BAF2',
  },
});

AppRegistry.registerComponent('TestProject1', () => TestProject1);
