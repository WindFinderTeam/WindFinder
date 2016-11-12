'use strict';

import  React, {Component} from 'react';
import {
    StyleSheet,
    Text,
    View,
} from 'react-native';

var pickerStyle   = require('./pickerStyle');

class SurfMenu extends Component {

    constructor(props) {
        super(props);
    }


    render() {
        return (
            <View style={{flexDirection:'row',}}>
                <View style={pickerStyle.menusView}>
                    <Text style={pickerStyle.menuText}>시간</Text>
                </View>
                <View style={pickerStyle.menusView}>
                    <Text style={pickerStyle.menuText}>날씨</Text>
                </View>
                <View style={pickerStyle.menusView}>
                    <Text style={pickerStyle.menuText}>기온</Text>
                </View>
                <View style={pickerStyle.menusView}>
                    <Text style={pickerStyle.menuText}>강수량</Text>
                </View>

                <View style={pickerStyle.menusView}>
                    <Text style={pickerStyle.menuText}>바람</Text>
                </View>
                <View style={pickerStyle.menusView}>
                    <Text style={pickerStyle.menuText}>파도</Text>
                </View>
                <View style={pickerStyle.menusView}>
                    <Text style={pickerStyle.menuText}>조수</Text>
                </View>
            </View>

        )
    }
}


module.exports = SurfMenu;