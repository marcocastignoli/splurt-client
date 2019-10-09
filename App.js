/**
 * Copyright (c) 2011-2019, Zingaya, Inc. All rights reserved.
 *
 * @format
 * @flow
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import React, { Component } from 'react';
import { Platform, StyleSheet, Text, View, Button, TextInput, FlatList } from 'react-native';
import VIForegroundService from "@voximplant/react-native-foreground-service";
import AsyncStorage from '@react-native-community/async-storage'

const storeData = async (key, value) => {
    try {
        await AsyncStorage.setItem(`@${key}`, JSON.stringify(value))
        return true
    } catch (e) {
        return false
    }
}

const removeData = async key => {
    try {
        await AsyncStorage.removeItem(`@${key}`)
        return true
    } catch (e) {
        return false
    }
}



const getData = async key => {
    try {
        const value = await AsyncStorage.getItem(`@${key}`)
        return JSON.parse(value)
    } catch (e) {
        return false
    }
}

var PushNotification = require("react-native-push-notification")

type Props = {};
export default class App extends Component<Props> {

    async startService() {
        if (Platform.OS !== 'android') {
            console.log('Only Android platform is supported');
            return;
        }
        if (Platform.Version >= 26) {
            const channelConfig = {
                id: 'ForegroundServiceChannel',
                name: 'Notification Channel',
                description: 'Notification Channel for Foreground Service',
                enableVibration: false,
                importance: 2
            };
            await VIForegroundService.createNotificationChannel(channelConfig);
        }
        const notificationConfig = {
            id: 3456,
            title: 'Foreground Service',
            text: 'Foreground service is running',
            icon: 'ic_notification',
            priority: 0
        };
        if (Platform.Version >= 26) {
            notificationConfig.channelId = 'ForegroundServiceChannel';
        }
        await VIForegroundService.startService(notificationConfig);
        await storeData('service-running', true)
        this.setState({ serviceRunning: true })
    }

    async stopService() {
        await removeData('service-running')
        this.setState({ serviceRunning: false })
        await VIForegroundService.stopService()
    }

    initAuth() {
        return {
            token: null,
            data: {}
        }
    }

    state = {
        name: 'marco',
        pwd: '12345',
        urlAuthentication: 'http://172.16.125.165:8888',
        urlWebsocket: 'ws://172.16.125.165:3334',
        auth: {
            token: null,
            data: this.initAuth()
        },
        err: '',
        serviceRunning: false
    }

    async componentDidMount() {
        this.setState({
            auth: await getData('auth'),
            serviceRunning: await getData('service-running')
        })
    }

    logout() {
        removeData('auth')
        this.setState({ auth: this.initAuth() })
    }

    async login() {
        fetch(`${this.state.urlAuthentication}/users/login`, {
            method: 'POST',
            body: JSON.stringify({
                name: this.state.name,
                pwd: this.state.pwd,
            }),
            headers: {
                "Content-Type": 'application/json'
            }
        })
            .then(r => r.json())
            .then(async auth => {
                try {
                    await storeData('auth', auth)
                    await storeData('url-websocket', this.state.urlWebsocket)
                    const urlWebsocket = await getData('url-websocket')
                    this.setState({ auth }, () => {
                        var ws = new WebSocket(`${urlWebsocket}`);
                        ws.onopen = async () => {
                            // connection opened
                            const token = await auth.token
                            ws.send(JSON.stringify({
                                channel: 'authentication',
                                data: token
                            }));
                        };
                        ws.onmessage = (e) => {
                            const message = JSON.parse(e.data)
                            PushNotification.localNotification({
                                message: message.title,
                                title: message.service,

                            });
                        };
                    })
                } catch (e) {
                    this.setState({ err: e.toString() })
                }
            })
            .catch(e => this.setState({ err: e.toString() }))
    }

    async setUrlWebsocket(text) {
        this.setState({ urlWebsocket: text })
        await storeData('url-websocket', text)
    }

    render() {
        const { name, pwd, auth, err, data, serviceRunning, urlAuthentication, urlWebsocket } = this.state

        return (
            <View style={styles.container}>
                <Text>{err}</Text>
                {!(auth && auth.token) ?
                    <View>
                        <TextInput style={{ width: 300, borderColor: 'gray', borderWidth: 1 }} onChangeText={text => this.setState({ urlAuthentication: text })} value={urlAuthentication} />
                        <View style={styles.space} />
                        <TextInput style={{ width: 300, borderColor: 'gray', borderWidth: 1 }} onChangeText={text => this.setUrlWebsocket(text)} value={urlWebsocket} />
                        <View style={styles.space} />
                        <TextInput style={{ width: 300, borderColor: 'gray', borderWidth: 1 }} onChangeText={text => this.setState({ name: text })} value={name} />
                        <View style={styles.space} />
                        <TextInput style={{ width: 300, borderColor: 'gray', borderWidth: 1 }} onChangeText={text => this.setState({ pwd: text })} value={pwd} />
                        <View style={styles.space} />
                        <Button title="Login" onPress={() => this.login()} />
                    </View>
                    :
                    <View style={{alignSelf: 'stretch',}}>
                        <View style={styles.list}>
                            <FlatList
                                data={[
                                    { key: 'Devin' },
                                    { key: 'Dan' },
                                ]}
                                renderItem={({ item }) => (
                                    <View style={{alignSelf: 'stretch', flex: 1, flexDirection: 'row',marginVertical: 8,backgroundColor: '#eeeeee',}}>
                                        <Text style={styles.item}>{item.key}</Text>
                                        <Button style={styles.item} title="Activate" />
                                    </View>
                                )}
                            />
                        </View>
                        <View style={styles.space} />
                        <Text>Logged in as {auth && auth.data && auth.data.name}</Text>
                        <View style={styles.space} />
                        <Button title="Logout" onPress={() => this.logout()} />
                    </View>
                }
                <View style={styles.space} />
                {serviceRunning ?
                    <Button title="Stop foreground service" onPress={() => this.stopService()} />
                    :
                    <Button title="Start foreground service" onPress={() => this.startService()} />
                }
                <View style={styles.space} />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5FCFF',
    },
    space: {
        flex: 0.1
    },
    list: {
        height: 200,
        alignSelf: 'stretch',
    },
    item: {
        flex: 5,
        flexDirection: 'column'
    }
});
