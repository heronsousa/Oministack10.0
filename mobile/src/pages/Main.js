import React, { useEffect, useState } from 'react';
import { StyleSheet, Image, Text, View, TextInput, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { requestPermissionsAsync, getCurrentPositionAsync } from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons'

import api from '../services/api';
import { connect, disconnect, subscribeNewDevs } from '../services/socket';

function Main({ navigation }) {
    const [currentRegion, setCurrentRegion] = useState(null);
    const [devs, setDevs] = useState([]);
    const [techs, setTechs] = useState('');

    useEffect(() => {
        async function loadInitialPosition() {
            const { granted } = await requestPermissionsAsync();

            if(granted){
                const { coords } = await getCurrentPositionAsync({
                    enableHighAccuracy: true
                });
                
                const { latitude, longitude } = coords;
    
                setCurrentRegion({
                    latitude,
                    longitude,
                    longitudeDelta: 0.04,
                    latitudeDelta: 0.04
                });
            }

        }

        loadInitialPosition();
    }, []);

    // A função setDevs pode demorar a ser concluida
    // então monitoramos se a variavel devs muda e valor
    // e adiciona os novos devs ao final do array
    useEffect(() => {
        subscribeNewDevs(dev => setDevs([...devs, dev]));
    }, [devs]);

    function setupWebSocket() {
        disconnect();

        const { latitude, longitude } = currentRegion;
        
        connect(
            latitude,
            longitude,
            techs
        );
    }

    async function loadDevs() {
        setDevs([]);

        const { latitude, longitude } = currentRegion;

        const response = await api.get('/search', {
            params: {
                latitude,
                longitude,
                techs
            }
        });

        setDevs(response.data.devs);
        setupWebSocket();   //Quando for procurar por devs, inicia conexão com socket
    }

    function handleRegionChanged(region) {
        setCurrentRegion(region);
    }

    if(!currentRegion){
        return null;
    }

    return (
        <>
            <MapView onRegionChangeComplete={handleRegionChanged} initialRegion={currentRegion} style={styles.map}>
            {devs.map(dev => (
                <Marker 
                    key={dev._id}
                    coordinate={{ 
                        latitude: dev.location.coordinates[1], 
                        longitude: dev.location.coordinates[0]
                    }}>
                    <Image 
                        style={styles.avatar} 
                        source={{ uri: dev.avatar_url }} 
                    />

                    <Callout onPress={() => {
                        navigation.navigate('Profile', { github_username: dev.github_username })
                    }}>
                        <View style={styles.callout}>
                            <Text style={styles.name}>{dev.name}</Text>
                            <Text style={styles.bio}>{dev.bio}</Text>
                            <Text style={styles.techs}>{dev.techs.join(', ')}</Text>
                        </View>
                    </Callout>
                </Marker>
            ))}
            </MapView>
            <View style={styles.search}>
                <TextInput
                    style={styles.searchInput}
                    placeholder={'Buscar devs por techs...'}
                    placeholderTextColor='#999'
                    autoCapitalize='words'
                    autoCorrect={false}
                    value={techs}
                    onChangeText={setTechs}
                />

                <TouchableOpacity onPress={loadDevs} style={styles.searchButton}>
                    <MaterialIcons name='my-location' size={20} color='#fff' />
                </TouchableOpacity>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    map: {
        flex: 1,
    },

    avatar: {
        width: 54,
        height: 54,
        borderRadius: 4,
        borderWidth: 4,
        borderColor: '#fff'
    },

    callout: {
        width: 260,
    },

    name: {
        fontWeight: 'bold',
        fontSize: 16
    },

    bio: {
        color: '#666',
        marginTop: 5
    },

    techs: {
        marginTop: 3
    },

    search: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        zIndex: 5,
        flexDirection: 'row'
    },

    searchInput: {
        flex: 1,
        height: 50,
        backgroundColor: '#fff',
        color: '#333',
        borderRadius: 25,
        paddingHorizontal: 20,
        fontSize: 16,
        elevation: 3    // Sombra
    },

    searchButton: {
        width: 50,
        height: 50,
        backgroundColor: '#8e4dff',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 15
    }
});

export default Main;