/**
 * Copyright (c) 2019 Marco Castignoli & Ahmed Tawfeeq
 * Copyright (c) 2011-2019, Zingaya, Inc. All rights reserved.
 *
 * @format
 * @flow
 */

import React, { useState, useEffect } from 'react';
import { Platform, StyleSheet, Text, View, Button, TextInput, FlatList } from 'react-native';
import VIForegroundService from "@voximplant/react-native-foreground-service";
import AsyncStorage from '@react-native-community/async-storage'
import { typeAlias, booleanLiteral } from '@babel/types';

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



const getData: (string) => any = async key => {
    try {
        const value = await AsyncStorage.getItem(`@${key}`)
        return JSON.parse(value)
    } catch (e) {
        return false
    }
}

var PushNotification = require("react-native-push-notification")

let globalWs = null

const App: () => React$Node = () => {

    const startService = async() => {
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
            priority: 0,
            channelId: ''
        };
        if (Platform.Version >= 26) {
            notificationConfig.channelId = 'ForegroundServiceChannel';
        }
        await VIForegroundService.startService(notificationConfig);
        await storeData('service-running', true)
        setState({ ...state, serviceRunning: true })
    }

    const stopService = async() => {
        await removeData('service-running')
        setState({ ...state, serviceRunning: false })
        await VIForegroundService.stopService()
    }

    const initAuth = () => ({
        token: '',
        data: ({ name: '' })
    })

    type s = {
        name: string,
        pwd: string,
        urlAuthentication: string,
        urlWebsocket: string,
        auth: {
            token: string,
            data: {
                name: string
            }
        },
        err: string,
        serviceRunning: bool,
        services: []
    };
    const [state, setState]: [s, ((s => s) | s) => void] = useState({
        name: 'marco',
        pwd: '12345',
        urlAuthentication: 'http://192.168.100.3:8888',
        urlWebsocket: 'ws://192.168.100.3:3334',
        auth: initAuth(),
        err: '',
        serviceRunning: false,
        services: []
    })

    useEffect(() => {
        (async() => {
            const auth = await getData('auth')
            const serviceRunning = await getData('service-running')
            setState({
                ...state,
                auth,
                serviceRunning
            })
            loadServices()
        })()
    }, [])

    const loadServices = () => {
        let token
        try {
            token = state.auth.token
        } catch (e) { }
        if (token) {
            fetch(`${state.urlAuthentication}/users/available_services`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                }
            })
                .then(r => r.json())
                .then(services => {
                    setState({ ...state, services })
                })
        }
    }

    const denyService = (service) => {
        let token
        try {
            token = state.auth.token
        } catch (e) { }
        if (token) {
            fetch(`${state.urlAuthentication}/users/service/${service}`, {
                method: 'DELETE',
                headers: {
                    "Authorization": `Bearer ${token}`,
                }
            }).then(() => {
                loadServices()
            })
        }
    }

    const allowService = (service) => {
        let token
        try {
            token = state.auth.token
        } catch (e) { }
        if (token) {
            fetch(`${state.urlAuthentication}/users/service/${service}`, {
                method: 'PUT',
                headers: {
                    "Authorization": `Bearer ${token}`,
                }
            }).then(() => {
                loadServices()
            })
        }
    }

    const logout = () => {
        removeData('auth')
        setState({ ...state, auth: initAuth() })
        disconnectWebsocket()
    }

    const login = async() => {
        fetch(`${state.urlAuthentication}/users/login`, {
            method: 'POST',
            body: JSON.stringify({
                name: state.name,
                pwd: state.pwd,
            }),
            headers: {
                "Content-Type": 'application/json'
            }
        })
            .then(r => r.json())
            .then(async auth => {
                try {
                    await storeData('auth', auth)
                    await storeData('url-websocket', state.urlWebsocket)
                    setState({ ...state, auth })
                    loadServices()
                    connectWebsocket(auth)
                } catch (e) {
                    setState({ ...state, err: e.toString() })
                }
            })
            .catch(e => setState({ ...state, err: e.toString() }))
    }

    const connectWebsocket = async(auth) => {
        const urlWebsocket = await getData('url-websocket')
        globalWs = new WebSocket(`${urlWebsocket ? urlWebsocket : ""}`);
        globalWs.onopen = async () => {
            // connection opened
            const token = await auth.token
            if (globalWs) {
                globalWs.send(JSON.stringify({
                    channel: 'authentication',
                    data: token
                }));
            }
        };
        globalWs.onmessage = (e) => {
            const message = JSON.parse(String(e.data))
            PushNotification.localNotification({
                message: message.title,
                title: message.service,

            });
        };
        globalWs.onerror = () => {
            globalWs = null
            connectWebsocket(auth)
        }
    }

    const disconnectWebsocket = () => {
        if (globalWs) {
            globalWs.close()
        }
    }

    const setUrlWebsocket = async(text) => {
        setState({ ...state, urlWebsocket: text })
        await storeData('url-websocket', text)
    }


    const { name, pwd, auth, err, serviceRunning, urlAuthentication, urlWebsocket, services } = state

    return (
        <View style={styles.container}>
            <Text>{err}</Text>
            {!(auth && auth.token) ?
                <View>
                    <TextInput style={{ width: 300, borderColor: 'gray', borderWidth: 1 }} onChangeText={text => setState({ ...state, urlAuthentication: text })} value={urlAuthentication} />
                    <View style={styles.space} />
                    <TextInput style={{ width: 300, borderColor: 'gray', borderWidth: 1 }} onChangeText={text => setUrlWebsocket(text)} value={urlWebsocket} />
                    <View style={styles.space} />
                    <TextInput style={{ width: 300, borderColor: 'gray', borderWidth: 1 }} onChangeText={text => setState({ ...state, name: text })} value={name} />
                    <View style={styles.space} />
                    <TextInput style={{ width: 300, borderColor: 'gray', borderWidth: 1 }} onChangeText={text => setState({ ...state, pwd: text })} value={pwd} />
                    <View style={styles.space} />
                    <Button title="Login" onPress={() => login()} />
                </View>
                :
                <View style={{ alignSelf: 'stretch', }}>
                    <View style={styles.list}>
                        <FlatList
                            data={services}
                            keyExtractor={item => item._id}
                            renderItem={({ item }) => (
                                <View style={{ alignSelf: 'stretch', flex: 1, flexDirection: 'row', marginVertical: 8, backgroundColor: '#eeeeee', }}>
                                    <Text style={styles.item}>{item.name}</Text>
                                    {item.active ?
                                        <Button title="Deny" onPress={() => denyService(item._id)} />
                                        :
                                        <Button title="Allow" onPress={() => allowService(item._id)} />
                                    }
                                </View>
                            )}
                        />
                    </View>
                    <View style={styles.space} />
                    <Text>Logged in as {auth && auth.data && auth.data.name}</Text>
                    <View style={styles.space} />
                    <Button title="Logout" onPress={() => logout()} />
                </View>
            }
            <View style={styles.space} />
            {serviceRunning ?
                <Button title="Stop foreground service" onPress={() => stopService()} />
                :
                <Button title="Start foreground service" onPress={() => startService()} />
            }
            <View style={styles.space} />
        </View>
    );
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

export default App;
