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
  View,
  TextInput
} from 'react-native';

var Button = require('react-native-material-button');
var {bp, vw, vh} = require('react-native-relative-units')(100);
var NavigationBar = require('react-native-navbar');
var ReduxStoreController = require('./ReduxStoreController');

var Main = React.createClass({
  defaultAudioURL : "http://50.31.154.42/radiolab_podcast/radiolab_podcast15crispr.mp3",

  getInitialState() {
    return {
      textAudioURL:this.defaultAudioURL
    }
  },

  render: function() {
    return (
      <View style={{flex: 1}}>
        <NavigationBar
          title={{title: 'Redux player'}}/>
          <View style={styles.container}>
            <View style={styles.form_area}>
              <View style={{flex: 1, width: vw * 100}}>
                <TextInput ref={'inputPassword'}
                           onChangeText={(text) => {
                                 this.setState({textAudioURL: text});
                                 ReduxStoreController.getAppStore().dispatch({
                                    type: 'AudioURL',
                                    text: text
                                });
                             }}
                           style={{flex: 1, width: vw * 90, marginLeft: vw * 5 }}
                           value={this.state.textAudioURL}
                           placeholder="URL">
                </TextInput>

              </View>
              <View style={{flex: 1, width: vw * 100}}>
                <Button
                  rippleColor = "rgba(255, 255, 255, 0.1)"
                  style = {styles.play_button}
                  onPressOut = {() => {
                            ReduxStoreController.getAppStore().dispatch({
                                    type: 'AudioURL',
                                    text: this.state.textAudioURL
                                });
                            this.props.navigator.push({ id: 'play_route', name: 'Play audio'});
                          }}>
                  <Text style={styles.button_text_style}>PLAY</Text>
                </Button>
              </View>
            </View>
          </View>


      </View>
    );
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
    form_area: {
        width: vw * 100,
        height: vh * 20,
        justifyContent: 'center',
        flexDirection:'column',
        alignItems: 'center',
    },
    play_button: {
        marginLeft: vw * 5,
        width: vw * 90,
        paddingTop: vh * 2,
        paddingBottom: vh * 2,
        borderRadius: vh * 0.8,
        backgroundColor: '#50ABF1',
    },
    button_text_style: {
        color: '#FFF',
        textAlign: 'center',
        fontSize: vh * 2.5,
        fontWeight: '600'
    },
});

module.exports = Main;