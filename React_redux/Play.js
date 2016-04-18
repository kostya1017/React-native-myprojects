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
var ReduxStoreController = require('./ReduxStoreController');
var TimerMixin = require('react-timer-mixin');
var NavigationBar = require('react-native-navbar');
var Play = React.createClass({
  mixins: [TimerMixin],
  unSubscribeStore : null,
  getInitialState() {
    return {
      duration:'',
      played: 0
    }
  },
  storeChanged: function() {
    this.setState({
      duration: ReduxStoreController.getAppStore().getState()['audioLength']
    });

    this.setInterval(
      () => {
        this.setState({
          played: this.state.played + 1
        })
      },
      1000
    );
  },

  componentDidMount: function() {
    this.unSubscribeStore = ReduxStoreController.getAppStore().subscribe(this.storeChanged);
    var PlayManager = require('react-native').NativeModules.TestManager;
    PlayManager.setAudioFileName(ReduxStoreController.getAppStore().getState().audioURL);
  },

  componentWillUnmount: function() {
    this.unSubscribeStore();
    var PlayManager = require('react-native').NativeModules.TestManager;
    PlayManager.stopAudio();
  },

  getDuration: function(length) {
    let sec = length % 60;
    let min = (length - sec) / 60;
    let ret = "";
    if (sec < 10) {
      ret = min + " : 0" + sec;
    } else {
      ret = min + " : " + sec;
    }
    return ret;
  },

  getAudioStatus: function(length) {
    let ret = "";
    if (length > 0) {
      ret = this.getDuration(this.state.played) + " / " + this.getDuration(length);
    }

    return ret;
  },
  render: function() {
    var component = this;
    return (
      <View style={{flex: 1}}>
        <NavigationBar
          leftButton={{
            title: 'Back',
            handler: function onNext() {
              component.props.navigator.pop();
              component.componentWillUnmount();
            }
          }}
          title={{title: 'Playing'}}/>
        <View style={styles.container}>

          <Text style={styles.status}>
            {this.getAudioStatus(this.state.duration)}
          </Text>

        </View>
      </View>
    );
  }
});

var { NativeAppEventEmitter } = require('react-native');

var subscription = NativeAppEventEmitter.addListener(
  'onDurationChanged',
  (event) => {
    ReduxStoreController.getAppStore().dispatch({
      type: 'AudioLength',
      text: event.duration
    });
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },

  status: {
    textAlign: 'center',
    color: '#333333',
    fontSize: 20,
    marginBottom: 5,
  },
});

module.exports = Play;