import React, { Component, Fragment } from 'react';
import './assets/style.css'
import MapStyle from './mapStyle.json';
import Marker from './assets/location.svg';
import {
    Button,
    Header,
    Image,
    Modal,
    Rating,
    Loader,
    List,
    Icon
} from 'semantic-ui-react'


let Googlescript, marker, map, directionsService, directionsDisplay;
let restaurents, markers = [];


class Main extends Component {

    state = {
        lat : null,
        lon : null,
        userLocation : {
            lat : null,
            lon : null
        },
        locationPermission : true,
        showModel : false,
        restaurant : {},
        showDirections : false,
        showPreference : false
    }

    componentWillMount(){
        Googlescript = document.createElement('script');
        Googlescript.setAttribute(
            "src",
            `https://maps.googleapis.com/maps/api/js?key=AIzaSyCC7YHjQGGdP6w05RDrhdfrSImE6u7m6hc&libraries=places&${new Date().getTime()}`
        )
        document.head.appendChild(Googlescript)
    }

    componentDidMount(){
        if(Googlescript){
            Googlescript.onload=((e) => {
                this._getCurrentPosition()
            })
		}
    }

    componentWillUnmount(){
        this.setState({
            lat : null,
            lon : null,
            userLocation : {
                lat : null,
                lon : null
            },
            locationPermission : true,
            showModel : false,
            restaurant : {},
            showDirections : false
        })
    }

    _getCurrentPosition = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this._handlePosition, this._handleBlock);
        }
    }

    _handlePosition = (position) => {
        this.setState({
            lat : parseFloat(position.coords.latitude),
            lon : parseFloat(position.coords.longitude),
            userLocation : {
                lat : parseFloat(position.coords.latitude),
                lon : parseFloat(position.coords.longitude),
            }
        })
        this._initiateMap()
    }

    _handleBlock = ()=> {
        this.setState({
            locationPermission : false
        })
    }

    _initiateMap(){
        var centerLatLng = new google.maps.LatLng(this.state.lat,this.state.lon);
        var mapOptions = {
            zoom: 18,
            center: centerLatLng,
            fullscreenControl : false,
            mapTypeControl : false,
            streetViewControl : false,
            styles : MapStyle,
        }
        map = new google.maps.Map(document.getElementById('map'), mapOptions);
        this._fetchRestaurants()
        map.addListener('dragend', ()=>{
            if(!this.state.showDirections){
                this._clearMarkers();
                this.setState({
                    lat : parseFloat(map.getCenter().lat()),
                    lon : parseFloat(map.getCenter().lng()),
                })
                this._fetchRestaurants()
            }
        })
    }

    _fetchRestaurants = () => {
        const centerLatLng = new google.maps.LatLng(this.state.lat,this.state.lon);
        const places = new google.maps.places.PlacesService(map)
        places.nearbySearch({
            location : centerLatLng,
            radius : 500,
            type : ["restaurant"]
        }, this._handleRestaurentsSearch)
    }

    _handleRestaurentsSearch = (results, status) => {
        if(status == "OK"){
            restaurents = results;
            for (let i=0; i < restaurents.length; i++){
                const centerLatLng = new google.maps.LatLng(restaurents[i].geometry.location.lat(),restaurents[i].geometry.location.lng());
                marker = new google.maps.Marker({
                    position: centerLatLng,
                    icon : {
                        url: Marker,
                        scaledSize: new google.maps.Size(50, 50),
                        origin: new google.maps.Point(0,0),
                        anchor: new google.maps.Point(0, 0)
                    },
                    map: map
                })
                marker.addListener('click', ()=>{
                    this._showDetailsOfRestaurants(restaurents[i])
                })
                markers.push(marker)
            }
        }
    }

    _showDetailsOfRestaurants = (restaurant) => {
        this.setState({
            showModel : true,
            restaurant : restaurant
        })
    }

    _clearMarkers = () => {
        if(markers.length > 0){
            for(let i=0; i < markers.length; i++){
                markers[i].setMap(null);
            }
        }
    }

    _getDirections = () => {
        this.setState({
            showModel : false,
            showDirections : true
        })
        this._clearMarkers();
        directionsService = new google.maps.DirectionsService;
        directionsDisplay = new google.maps.DirectionsRenderer;
        directionsDisplay.setMap(map);
        directionsService.route({
            origin : `${this.state.userLocation.lat},${this.state.userLocation.lon}`,
            destination : `${this.state.restaurant.geometry.location.lat()},${this.state.restaurant.geometry.location.lng()}`,
            travelMode: 'DRIVING'
        }, function(response, status) {
            if (status === 'OK') {
                directionsDisplay.setDirections(response);
            }
        })
    }

    _closeDirection = () => {
        this.setState({showDirections : false})
        directionsDisplay.setMap(null);
        this._fetchRestaurants()
    }

    _saveRestaurants = () => {
        let savedRestaurants = localStorage.getItem('restaurants')
        if(savedRestaurants){
            savedRestaurants = JSON.parse(savedRestaurants);
            savedRestaurants.push(this.state.restaurant)
            localStorage.setItem('restaurants', JSON.stringify(savedRestaurants));
        }else{
            let restaurants = []
            restaurants.push(this.state.restaurant)
            localStorage.setItem('restaurants', JSON.stringify(restaurants));
        }
        this.setState({showModel : false})
    }

    _removeRestaurants = () => {
        let savedRestaurants = localStorage.getItem('restaurants');
        if(savedRestaurants){
            savedRestaurants = JSON.parse(savedRestaurants);
            let indexOfRestaurant = null;
            savedRestaurants.filter((data, index)=>{
                if(data.place_id == this.state.restaurant.place_id){
                    indexOfRestaurant = index;
                }
            })
            let newSavedRestaurants = [
                ...savedRestaurants.slice(0, indexOfRestaurant),
                ...savedRestaurants.slice(indexOfRestaurant+1)
            ]
            localStorage.setItem('restaurants', JSON.stringify(newSavedRestaurants));
            this.setState({showModel : false})
        }
    }

    _showPreferance = () => {
        this.setState({showPreference : true})
    }

    _hidePreferance = () => {
        this.setState({showPreference : false})
    }

    _getDirectionsForPreferedLocation = (restaurant) => {
        this.setState({
            showPreference : false,
            showDirections : true
        })
        this._clearMarkers();
        directionsService = new google.maps.DirectionsService;
        directionsDisplay = new google.maps.DirectionsRenderer;
        directionsDisplay.setMap(map);
        directionsService.route({
            origin : `${this.state.userLocation.lat},${this.state.userLocation.lon}`,
            destination : `${restaurant.geometry.location.lat},${restaurant.geometry.location.lng}`,
            travelMode: 'DRIVING'
        }, function(response, status) {
            if (status === 'OK') {
                directionsDisplay.setDirections(response);
            }
        })
    }

    render() {
        let image = null;
        let savedRestaurants = JSON.parse(localStorage.getItem('restaurants'));
        let savedRestaurant = false;
        if(savedRestaurants && Object.keys(this.state.restaurant).length > 0){
            savedRestaurants.map(data => {
                if(data.place_id == this.state.restaurant.place_id){
                    savedRestaurant = true;
                }
            })
            if(this.state.restaurant.photos != undefined){
                image = this.state.restaurant.photos[0].getUrl({maxWidth : 500, maxHeight : 500});
            }
        }
        if(this.state.lat && this.state.lon && this.state.locationPermission){
            return (
                <Fragment>
                    <div className="container" id="map"></div>

                    <Button secondary className="map_adjust_button2" onClick = {()=> this._showPreferance()}>
                        Preferences
                    </Button>

                    {
                        this.state.showDirections && <Button negative className="map_adjust_button" onClick = {()=> this._closeDirection()}>
                            Close
                        </Button>
                    }

                    {
                        (this.state.showModel) && <Modal open={this.state.showModel} size={"mini"}>
                            <Modal.Header>{this.state.restaurant.name}</Modal.Header>
                            <Modal.Content image>
                                {
                                    image && <Image
                                        wrapped
                                        size='medium'
                                        src={image}
                                    />
                                }
                            </Modal.Content>
                            <Modal.Content>
                                <Modal.Description>
                                    <div>
                                        <div style={{display : "inline-block"}}>
                                            <Rating
                                                maxRating={5}
                                                icon='star'
                                                rating = {this.state.restaurant.rating}
                                                disabled = {true}
                                            /> ({this.state.restaurant.rating})
                                        </div>
                                        <div style={{display : "inline-block", float : "right"}}>
                                            {(this.state.restaurant.name) ? <span style={{fontSize : 15, color : "green"}}>
                                                    Open now
                                                </span> : <span style={{fontSize : 15, color : "red"}}>
                                                    Closed
                                                </span>
                                            }
                                        </div>
                                    </div>
                                </Modal.Description>
                            </Modal.Content>
                            <Modal.Actions>
                                <Button negative onClick={()=> {this.setState({showModel : false})}}>
                                    Close
                                </Button>
                                {
                                    (savedRestaurant) ? <Button secondary onClick={()=> this._removeRestaurants()}>
                                        Remove
                                    </Button> : <Button secondary onClick={()=> this._saveRestaurants()}>
                                        Save
                                    </Button>
                                }
                                <Button color='blue' onClick={()=> this._getDirections()}>
                                    Get Directions
                                </Button>
                            </Modal.Actions>
                        </Modal>
                    }

                    {
                        (this.state.showPreference) && <Modal open={this.state.showPreference} size={"mini"}>
                            <Modal.Header>Saved</Modal.Header>
                            <Modal.Content>
                                <Modal.Description>
                                    {
                                        (savedRestaurants && savedRestaurants.length > 0) && <List >
                                            {
                                                savedRestaurants.map((data, index)=> <Items
                                                    key={index}
                                                    data = {data}
                                                    _getDirectionsForPreferedLocation = {this._getDirectionsForPreferedLocation}
                                                />)
                                            }
                                        </List>
                                    }
                                    {
                                        (!savedRestaurants || savedRestaurants.length <= 0) && <p>
                                            No restarants added in prefrances
                                        </p>
                                    }
                                </Modal.Description>
                            </Modal.Content>
                            <Modal.Actions>
                                <Button negative onClick={()=> this._hidePreferance()}>
                                    Close
                                </Button>
                            </Modal.Actions>
                        </Modal>
                    }

                </Fragment>
            )
        }
        if(!this.state.lat && !this.state.lon && this.state.locationPermission){
            return(
                <div className="container">
                    <Loader active inline='centered' className="loader">
                        Loading map...
                    </Loader>
                </div>
            )
        }
        if(!this.state.lat && !this.state.lon && !this.state.locationPermission){
            return(
                <div className="container">
                    <div className="errorInfo">
                        Allow browser to access your location.
                    </div>
                </div>
            )
        }
        return <div></div>
    }
}


class Items extends Component{

    _getDirection = (restaurant) => {
        this.props._getDirectionsForPreferedLocation(restaurant)
    }

    render(){
        let restaurant = this.props.data;
        return(
            <List.Item>
                <List.Content floated='right'>
                    <Button primary icon onClick={()=>this._getDirection(restaurant)}>
                        <Icon name='level up alternate' />
                    </Button>
                </List.Content>
                <Image
                    avatar
                    src={Marker}
                />
                <List.Content style={{padding : 10}}>{restaurant.name}</List.Content>
            </List.Item>
        )
    }
}

export default Main;
