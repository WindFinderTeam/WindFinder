'use strict';

import  React, {Component} from 'react';
import {
    AppRegistry,
    StyleSheet,
    Text,
    View,
    ListView,
    TouchableHighlight,
    TouchableOpacity,
    ToastAndroid,
    Modal,
    Image,
    Dimensions,
    Animated,
    Platform,

} from 'react-native';

import Spinner                           from 'react-native-spinkit';
import Ionicons                          from 'react-native-vector-icons/Ionicons';
import ActionButton                      from 'react-native-action-button';
import {realmInstance}                   from "./RealmHndler.js";
import LinearGradient                    from 'react-native-linear-gradient';
import Toast, {DURATION}                 from 'react-native-easy-toast';
import {LazyloadListView, LazyloadView} from 'react-native-lazyload';
import WindSpeedChartModal               from './WindSpeedChartModal';


var pickerStyle = require('./pickerStyle');
var GlidingParser = require('./GlidingParser');
var WeatherImage = require('./WeatherImage');
var DirectionImage = require('./DirectionImage');
var GlidingMenu = require('./GlidingMenu');
const fetch = require('react-native-cancelable-fetch');


var rowKey = 0;           // Listview`s row keys
var offset = 0;           // scroll position for Action Button

var API_URL;
var weatherBackImg = (require('./image/wlLoadingBg.jpg'));
var district;
var bestDirection;

const HEADER_MAX_HEIGHT = 200;
const HEADER_MIN_HEIGHT = 110;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;


const SCREEN_WIDTH = Dimensions.get('window').width;

const color = ['#240d7f', '#230d89', '#230f94', '#1c0e99', '#200ca3', '#1d0ea7', '#1b0ab2', '#140dbd', '#170cc2'
    , '#130ccb', '#0e0cd2', '#100edd', '#0c0de4', '#0f18e3', '#0d20de', '#0c32d5', '#0e40d5', '#104bcd', '#1257cc'
    , '#0d65c6', '#0f74bc', '#1b7abe', '#308ac6', '#4a97cf', '#5ba1d2', '#70afd8', '#84bae0', '#95c2df', '#add4e5'
    , '#c3daec', '#d4e9ee', '#fdfdc9', '#fdfab7', '#fdf99e', '#fbf48a', '#fdf579', '#fef363', '#fff150', '#feee36'
    , '#feee25', '#feeb12', '#ffe60f', '#fede11', '#fed70e', '#ffce10', '#ffc710', '#fec110', '#ffb812', '#fdb10d'
    , '#fea90e', '#fa9e0f', '#fd8d0d', '#f9800b', '#f96b09', '#f35805', '#f34a05', '#f33a04', '#f12a01', '#ee1b00'
    , '#ed0b00', '#eb0300'];

class GlidingWeatherList extends Component {

    constructor(props) {
        super(props);

        API_URL = this.props.rowData.weatherURL; // 날씨URL 가져오기
        bestDirection = this.props.rowData.direction.split(' ');

        this.fetchData = this.fetchData.bind(this);
        this.startCountDown = this.startCountDown.bind(this);
        this.setSpinnerVisible = this.setSpinnerVisible.bind(this);
        this.controlFavorite = this.controlFavorite.bind(this);
        this.setHeartOnOff = this.setHeartOnOff.bind(this);
        this.renderRow = this.renderRow.bind(this);
        this.setWindModalVib = this.setWindModalVib.bind(this);
        this.onScrollEnd = this.onScrollEnd.bind(this);

        var getSectionData = (dataBlob, sectionID) => {
            return dataBlob[sectionID];
        };
        var getRowData = (dataBlob, sectionID, rowID) => {
            return dataBlob[sectionID + ':' + rowID];
        };

        district = this.props.rowData.district;
        this.state = {

            dataSource: new ListView.DataSource(
                {
                    getSectionData: getSectionData,
                    getRowData: getRowData,
                    rowHasChanged: (row1, row2) => row1 !== row2,
                    sectionHeaderHasChanged: (s1, s2) => s1 !== s2
                })
            , topAlpha: 0
            , sunrise: "00:00"
            , sunset: "00:00"
            , updateTime: "00:00"
            , loadOK: false
            , spinnerVisible: true
            , networkState: true
            , heartOnOff: false
            , windModalVib: false
            , windSpeedData: 0
            , scrollY: new Animated.Value(0)

        };
    }

    componentWillMount() // before rendering
    {
        this.readRealm();
        fetch.abort(this);
    }

    componentDidMount() {
        this.fetchData();
    }

    startCountDown() {
        this.setState({spinnerVisible: false, networkState: false});
        fetch.abort(this);
    }

    controlFavorite() {

        realmInstance.write(() => {

            let theme = "FavoriteGliding", var_index = this.props.rowData.index;

            let specificFavorite = realmInstance.objects(theme).filtered('index = ' + '"' + var_index + '"');

            if (Object.keys(specificFavorite) == "") {

                realmInstance.create('FavoriteGliding', {
                    index: var_index,
                    name: this.props.rowData.district,
                    webcam: [],
                    shop: (this.props.rowData.shop != '') ? this.props.rowData.shop : []
                });

            } else    realmInstance.delete(specificFavorite); // Deletes all books

        });
    }

    setHeartOnOff() {

        if (this.state.heartOnOff == true) this.setState({heartOnOff: false});
        else                               this.setState({heartOnOff: true});

    }

    readRealm() {

        realmInstance.write(() => {

            let mode = "FavoriteGliding", var_index = this.props.rowData.index;
            let specificFavorite = realmInstance.objects(mode).filtered('index = ' + '"' + var_index + '"');

            if (Object.keys(specificFavorite) == "") ;
            else    this.setHeartOnOff();
        });
    }

    fetchData() {
        weatherBackImg = WeatherImage.getBackgroundImage();
        var setTimeoudtID = setTimeout(this.startCountDown, 7000);
        var myOs = Platform.OS == 'ios' ? 'ios' : 'android';

        fetch(API_URL)
            .then((response) => response.json())
            .then((responseJSON) => {
                var {dataBlob, sectionIDs, rowIDs, sunInfo} = GlidingParser.getGlidingWeather(responseJSON, myOs);  // Data Parsing
                this.setState({
                    dataSource: this.state.dataSource.cloneWithRowsAndSections(dataBlob, sectionIDs, rowIDs),
                    sunrise: sunInfo[0],
                    sunset: sunInfo[1],
                    updateTime: sunInfo[2],
                    loadOK: true,
                    networkState: true
                });
                this.setSpinnerVisible(false);
                clearTimeout(setTimeoudtID);
            })
            .catch((error) => {
                console.warn(error);
                clearTimeout(setTimeoudtID);
                this.setState({spinnerVisible: false, networkState: false});
            });
    }

    // set the Floating Circle-Button Color
    setRgba() {
        var myAlpha = this.state.topAlpha;
        return `"rgba(156,0,16,` + `${myAlpha})"`;
    }

    // Draw List's Headers
    sectionHeader(rowData, sectionID) {

        var sectionHeader;

        if (sectionID == '9y9m9d') sectionHeader = (
            <LazyloadView host="listExample">
                <View style={{backgroundColor: 'transparent', height: HEADER_SCROLL_DISTANCE}}>
                </View>
            </LazyloadView>)
        else sectionHeader = (
            <LazyloadView host="listExample">
                <View style={pickerStyle.sectionHeader}>
                    <Text style={pickerStyle.sectionHeaderText}>{sectionID}</Text>
                </View>
            </LazyloadView>
        );

        return sectionHeader;
    }

    onScrollEnd(event) {

        var currentOffset = event.nativeEvent.contentOffset.y;
        var direction = currentOffset > offset ? 'down' : 'up';
        offset = currentOffset;

        switch (direction) {
            case 'down'  :
                this.setState({topAlpha: 0,});
                break;
            case 'up'    :
                this.setState({topAlpha: 0.8,});
                break;
        }
        ;
    }

    // Draw List's Rows
    renderRow(rowData, sectionID, rowID) {

        if (sectionID == '9y9m9d')   return null;

        rowKey++;

        var windSpeedWidth = (SCREEN_WIDTH * rowData.windSpeed) / 20;
        var windMaxSpeedWidth = ((SCREEN_WIDTH * rowData.windGust) / 20 ) - windSpeedWidth;

        var {weatherImg, precipitationImg} = WeatherImage.getWatherImage(rowData.time, rowData.cloud, rowData.rain, rowData.snowYn + "");

        var windArrowSrc = DirectionImage.getWindDirectionImage(rowData.windDir); //
        return (
            <View style={pickerStyle.rowViewStyle}>
                <LazyloadView host="listExample">
                    <View key={rowKey} style={pickerStyle.row}>
                        <View style={pickerStyle.menusView}>
                            <Text style={pickerStyle.rowListText}>{rowData.time}시</Text>
                        </View>

                        <View style={[pickerStyle.menusView, {flexDirection: 'column'}]}>
                            {weatherImg}
                            {precipitationImg}
                        </View>
                        <View style={pickerStyle.menusView}>
                            <View
                                style={[pickerStyle.rowTemperatureView, {backgroundColor: color[parseInt(rowData.temperature) + 20]}]}>
                                <Text
                                    style={[pickerStyle.rowListText, {color: (Math.round(rowData.temperature) >= 10 && Math.round(rowData.temperature) <= 20 ) ? 'black' : 'white'}]}>{rowData.temperature}℃</Text>
                            </View>
                        </View>
                        <View style={pickerStyle.menusView}>
                            <Text style={pickerStyle.rowListText}>{rowData.rain}</Text>
                            <Text style={[pickerStyle.rowListText, {fontSize: 10}]}> mm</Text>
                        </View>
                        <View style={pickerStyle.menusView}>
                            <Text style={pickerStyle.rowListText}>{rowData.cloud}%</Text>
                        </View>
                        <View style={pickerStyle.menusView}>
                            {windArrowSrc}
                        </View>

                        <TouchableOpacity
                            onPress={() => { this.setState({windModalVib: true, windSpeedData: rowData.windSpeed})  }}>
                            <View style={styles.windView}>
                                <Text style={styles.windSpeedText}>{rowData.windSpeed + ' m/s'}</Text>
                                <Text style={styles.windGustText}>{'돌풍 ' + rowData.windGust}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </LazyloadView>

                <LazyloadView host="listExample">
                    <View style={{width: SCREEN_WIDTH, height: 4, flexDirection: 'row'}}>
                        <LinearGradient
                            start={{x: 0.0, y: 1.0}} end={{x: 1.0, y: 1.0}}
                            locations={[0, 0.5, 1.0]}
                            colors={['#90E4FF', '#B4FFFF', '#FFFFFF']}
                            style={{width: windSpeedWidth}}/>

                        <LinearGradient
                            start={{x: 0.0, y: 1.0}} end={{x: 1.0, y: 1.0}}
                            locations={[0, 0.5, 1.0]}
                            colors={['#FF9090', '#FFB4B4', '#FFFFFF']}
                            style={{width: windMaxSpeedWidth}}/>
                    </View>
                </LazyloadView>
            </View>
        );
    }

    refreshListView() {

        this.setState({spinnerVisible: true, networkState: true});
        this.fetchData();
    }

    setWindModalVib(visible) {
        return this.setState({windModalVib: visible});
    }

    setSpinnerVisible(visible) {
        this.setState({spinnerVisible: visible});
    }

    render() {


        var isIos = Platform.OS == 'ios' ? true : false;

        var districtSize = this.state.scrollY.interpolate({
            inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
            outputRange: [30, 20, 20],
            extrapolate: 'clamp',
        });

        var updateFontSize = this.state.scrollY.interpolate({
            inputRange: [0, HEADER_SCROLL_DISTANCE / 2, 80],
            outputRange: [15, 7, 1],
            extrapolate: 'clamp',
        });

        var suninfoPosition = this.state.scrollY.interpolate({
            inputRange: [0, HEADER_SCROLL_DISTANCE],
            outputRange: [130, 80],
            extrapolate: 'clamp',
        });

        var menuPosition_ios = this.state.scrollY.interpolate({
            inputRange: [0, HEADER_SCROLL_DISTANCE],
            outputRange: [184, 94],
            extrapolate: 'clamp',
        });

        var menuPosition_and = this.state.scrollY.interpolate({
            inputRange: [0, HEADER_SCROLL_DISTANCE],
            outputRange: [181, 91],
            extrapolate: 'clamp',
        });

        var districtPosition = this.state.scrollY.interpolate({
            inputRange: [0, HEADER_SCROLL_DISTANCE],
            outputRange: [50, 30],
            extrapolate: 'clamp',
        });

        var directionPosition = this.state.scrollY.interpolate({
            inputRange: [0, HEADER_SCROLL_DISTANCE],
            outputRange: [100, 60],
            extrapolate: 'clamp',
        });


        var headerHeight = this.state.scrollY.interpolate({
            inputRange: [0, HEADER_SCROLL_DISTANCE],
            outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
            extrapolate: 'clamp',
        });

        var textOpacity = this.state.scrollY.interpolate({
            inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
            outputRange: [1, 1, 0],
            extrapolate: 'clamp',
        });


        var imageTranslate = this.state.scrollY.interpolate({
            inputRange: [0, HEADER_SCROLL_DISTANCE],
            outputRange: [0, -50],
            extrapolate: 'clamp',
        });

        var myView;

        if (this.state.networkState == true) {

            myView = (
                <LazyloadListView
                    style={{top: HEADER_MIN_HEIGHT, flex: 1}}
                    scrollEventThrottle={10}
                    onScroll={Animated.event([{nativeEvent: {contentOffset: {y: this.state.scrollY}}}]  )}
                    dataSource={this.state.dataSource}
                    renderSectionHeader={this.sectionHeader.bind(this)}
                    renderRow={this.renderRow}
                    scrollRenderAheadDistance={200}
                    renderDistance={200}
                    pageSize={1}
                    initialListSize={8}
                    scrollsToTop={true}
                    stickyHeaderIndices={[0]}
                    onEndReachedThreshold={1000}
                    renderScrollComponent={ _ => {}}
                    name="listExample"
                    ref="ScrollView"
                    scrollEnabled={this.state.loadOK}
                    onScrollEndDrag={this.onScrollEnd}
                    onMomentumScrollEnd={this.onScrollEnd}
                />
            );
        }
        else { // OFFLINE VIEW
            myView = ( <View style={pickerStyle.offlineView}>
                <TouchableOpacity onPress={() => this.refreshListView()}>
                    <Ionicons name="md-refresh-circle" style={pickerStyle.refreshView}/>
                </TouchableOpacity>
                <Text>네트워크 상태를 확인하세요</Text>
            </View>);
        }

        return (
            <View style={{flex: 1, backgroundColor: 'white'}}>
                <Animated.View style={[styles.header, {height: headerHeight}]}>
                    <Animated.Image
                        source={weatherBackImg}
                        style={[ styles.backgroundImage, {opacity: 1, transform: [{translateY: imageTranslate}]}  ]}>

                    </Animated.Image>

                    {/*-------------------------- 1.update ------------------------------*/}
                    <Animated.Text
                        style={{ position:'absolute',top:32, textAlign:'center',width:SCREEN_WIDTH, fontSize:updateFontSize, backgroundColor: 'transparent',  color: '#FFF', opacity:textOpacity }}>업데이트 {this.state.updateTime}</Animated.Text>

                    {/*-------------------------- 2.District ------------------------------*/}
                    <Animated.Text
                        style={{ backgroundColor:'transparent', textAlign:'center',width:SCREEN_WIDTH, color: 'white',fontSize:districtSize, position:'absolute',top:districtPosition}}>{district}</Animated.Text>

                    {/*-------------------------- 3.Direction ------------------------------*/}
                    <Animated.View
                        style={{ position:'absolute',top:directionPosition,width:SCREEN_WIDTH,flexDirection: 'row',  justifyContent: 'center', alignItems: 'center', backgroundColor:'transparent'}}>
                        <Text style={{color: '#FFF'}}>활공방향 </Text>
                        <View style={pickerStyle.bestDirection}>
                            {DirectionImage.getWindDirectionImage(parseInt(bestDirection[0]))}
                            {DirectionImage.getWindDirectionImage(parseInt(bestDirection[1]))}
                            {DirectionImage.getWindDirectionImage(parseInt(bestDirection[2]))}
                            {DirectionImage.getWindDirectionImage(parseInt(bestDirection[3]))}
                        </View>
                    </Animated.View>

                    {/*-------------------------- 4.sun info ------------------------------*/}
                    <Animated.View
                        style={{position:'absolute',width:SCREEN_WIDTH,top:suninfoPosition,flexDirection: 'row',justifyContent:'center', backgroundColor: 'transparent', opacity:textOpacity}}>
                        <View style={pickerStyle.sunInfo }>
                            <Animated.Text
                                style={{color: '#FFF', textAlign: 'center'}}>일출 {this.state.sunrise}</Animated.Text>
                        </View>
                        <View style={pickerStyle.sunInfo }>
                            <Animated.Text
                                style={{color: '#FFF', textAlign: 'center'}}>일몰 {this.state.sunset}</Animated.Text>
                        </View>
                    </Animated.View>

                    {/*-------------------------- 5.menu ------------------------------*/}
                    <Animated.View
                        style={{position:'absolute',top:Platform.OS == 'ios'? menuPosition_ios:menuPosition_and, backgroundColor: 'transparent', width: SCREEN_WIDTH}}>
                        <GlidingMenu/>
                    </Animated.View>

                </Animated.View>
                {myView}

                {/* ------------------------------- Chart Modal ----------------------------------*/}
                <WindSpeedChartModal windModalVib={this.state.windModalVib}
                                     setWindModalVib={this.setWindModalVib}
                                     windSpeedData={this.state.windSpeedData}/>
                {/* ------------------------- Scroll up to top button -----------------------------*/}
                <ActionButton
                    buttonColor={this.setRgba()}
                    type={'tab'}
                    position={'right'}
                    offsetY={35}
                    onPress={() => this.refs.ScrollView.scrollTo({x: 0, y: 0})}
                    icon={<Ionicons name="md-arrow-round-up" style={{ fontSize: 20,height: 22, color: 'white', opacity: this.state.topAlpha }}/>}
                />
                {/* ------------------------------- Toast ----------------------------------*/}
                <Toast ref="toast" style={{backgroundColor: '#222222'}} position='bottom'/>
                {/* ------------------------------- back button, favorite button configure -----------*/}
                <View style={pickerStyle.navigator}>
                    <TouchableOpacity onPress={() => this.props.modalVisible(false)}>
                        <View style={{ width:40, backgroundColor:'transparent'}}>
                            <Ionicons name="ios-arrow-back" size={40} color="white" style={{marginLeft: 10}}/>
                        </View>
                    </TouchableOpacity>

                    <View style={pickerStyle.heartView}>
                        <TouchableOpacity onPress={() => {
                            this.controlFavorite();
                            this.setHeartOnOff();
                            this.props.realmReload('gliding');
                            this.refs.toast.show(this.state.heartOnOff == true ? '즐겨찾기를 지웁니다' : '즐겨찾기에 추가합니다', DURATION.LENGTH_LONG);
                        }}>
                            <Ionicons name="md-heart" size={30}
                                      color={this.state.heartOnOff == true ? "#94000F" : "#C0C0C0"}/>
                        </TouchableOpacity>
                    </View>
                </View>
                {/* ------------------------------- Spinner ------------------------------------*/}
                <Spinner style={pickerStyle.spinner} isVisible={this.state.spinnerVisible} size={80} type={"Bounce"}
                         color={"#94000F"}/>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    backgroundImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        width: null,
        height: HEADER_MAX_HEIGHT,
        resizeMode: 'cover',
    },
    naviBgImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        width: null,
        height: HEADER_MIN_HEIGHT,
        resizeMode: 'cover',
    },
    fill: {
        flex: 1,
    },
    row: {
        height: 40,
        margin: 16,
        backgroundColor: '#D3D3D3',
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        overflow: 'hidden',
    },
    bar: {
        marginTop: 28,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        backgroundColor: 'transparent',
        color: 'white',
        fontSize: 18,
    },
    scrollViewContent: {},

    container: {
        flex: 1,
        backgroundColor: 'white',
        marginTop: HEADER_MAX_HEIGHT,
    },
    windSpeedText: {
        color: 'black',
        textAlign: 'center',
        fontSize: 13,
    },
    windGustText: {
        color: 'black',
        textAlign: 'center',
        fontSize: 10,
    },
    glidingMainBoardView: {
        flex: 1,
        marginTop: 50,
        width: SCREEN_WIDTH,
        justifyContent: 'center',
        alignItems: 'center'
    },
    windView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
    }
});


module.exports = GlidingWeatherList;