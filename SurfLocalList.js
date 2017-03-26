'use strict';

import  React, {Component} from 'react';
import {
    AppRegistry,
    StyleSheet,
    Text,
    View,
    ListView,
    TouchableOpacity,
    Modal,
    Image,
    Dimensions } from 'react-native';


import SurfWeatherList   from './SurfWeatherList';
import Ionicons          from 'react-native-vector-icons/Ionicons';
import { realmInstance } from "./RealmHndler.js";

var pickerStyle   = require('./pickerStyle') ;
var surfLocalData = require('./jsData/SurfLocalData.json');
var selectedRowData ;

class LocalList extends Component{

    setModalVisible(visible) {     this.setState({modalVisible: visible});   }

    setRgba(alpha) {
        var myAlpha = alpha;
        return `"rgba(156,0,16,` + `${myAlpha})"`;
    }


    _onPressButton(rowData){
        selectedRowData = rowData;
        this.setModalVisible(true);
    }

    constructor(prop){
        super(prop);

        //---------------- Binding to Custom Func ----------------
        this.setModalVisible = this.setModalVisible.bind(this);
        this.renderRow       = this.renderRow.bind(this);
        //---------------------------------------------------------
        this.ds = new ListView.DataSource({
            sectionHeaderHasChanged : (r1, r2) => r1 !== r2,
            rowHasChanged           : (r1, r2) => r1 !== r2
        });

        this.state = {
             dataSource          : this.ds.cloneWithRowsAndSections(this.renderListViewData())
            ,modalVisible        : false
            ,dataSource_fb       : new ListView.DataSource({   rowHasChanged: (row1, row2) => row1 !== row2     })
        };

        this.controlModeRealm();
    }


    renderListViewData() {

        var localListMap = {}  ;

        Array.from(surfLocalData.local).forEach(function (myItem){
            if(!localListMap[myItem.province])   localListMap[myItem.province] = [];
            localListMap[myItem.province].push(myItem);
        });

        return localListMap;
    }

    renderSectionHeader(data, sectionId) {

        return (
            <View style={pickerStyle.localSectionHeader}>
                <Text style={pickerStyle.localSectionHeaderText}>{sectionId}</Text>
            </View>
        );
    }

    controlModeRealm(){

        realmInstance.write(() => {
            //Already exists. update mode to 'S'
            realmInstance.create('ModeLastStay', {index: 'lastmode', mode: 'S'}, true);

        });
    }

    renderRow(rowData) {

        var webcamShow = false, shopShow = false, webcamShowJudge;

        if(typeof rowData.webcam == "undefined")    webcamShow = false;
        else                                        webcamShow = true;

        if( typeof rowData.shop == "undefined")     shopShow   = false;
        else                                        shopShow   = true;

        if (webcamShow == true) {
            webcamShowJudge = (
                <TouchableOpacity onPress={()=>{if(webcamShow==true){this.props.setWebCamModalVisible(true, rowData.webcam)}}}>
                    <View style={[styles.webcamIconView ,{width:webcamShow==false?0:50,height:webcamShow==false?0:50}]}>
                            <View style={[pickerStyle.iconBorder, {opacity:webcamShow==false?0:1}]}>
                                <Ionicons name="ios-videocam" style={{color:webcamShow==false?this.setRgba(0):this.setRgba(1), fontSize:25}}/>
                            </View>
                    </View>
                </TouchableOpacity>
            );
        }
        else    webcamShowJudge = (<View style={{flex:1}}/>);

        return (
            <TouchableOpacity onPress={() => { this._onPressButton(rowData)}}>
                {/* row style */}
                <View style={pickerStyle.listViewrow}>
                    {/* distict */}
                    <View style={pickerStyle.listViewrowDistrict}>
                        <Text style={pickerStyle.localListrowText}>{rowData.district}</Text>
                    </View>

                    {/* icons */}
                    <View style={pickerStyle.listViewrowCamShop}>
                        <View style={{flex:1}}>{webcamShowJudge}</View>

                        <View style={{flex:1 }}>
                             {shopShow && <TouchableOpacity onPress = {() => this.props.setShopModalVisible(true, rowData.shop)}>
                                <View style={styles.shopIconView}>
                                    <View style={pickerStyle.iconBorder}>
                                        <Image source={require('./image/surfShop.png')} style={{width: 35, height: 35}}/>
                                    </View>
                                </View>
                            </TouchableOpacity>}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        )
    }

    render() {
        return (
            <View>
                <Modal
                    animationType  = {"fade"}
                    transparent    = {false}
                    visible        = {this.state.modalVisible}
                    onRequestClose = {() => {this.setModalVisible(false)}}>

                    <SurfWeatherList
                        modalVisible = {this.setModalVisible}
                        rowData      = {selectedRowData}/>
                </Modal>
                <ListView
                    ref                 = "listView"
                    scrollsToTop        = {true}
                    dataSource          = {this.state.dataSource}
                    renderSectionHeader = {this.renderSectionHeader}
                    renderRow           = {this.renderRow}
                    automaticallyAdjustContentInsets={false}
                />
            </View>
        );
    }
};


var styles = StyleSheet.create({

    webcamIconView: { alignItems:'center', justifyContent:'center'  },
    shopIconView  : { alignItems:'center', justifyContent:'center', height:50}
});

module.exports = LocalList;
