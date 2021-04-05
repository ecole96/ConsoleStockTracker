import React, { Component } from 'react';

export default class Header extends Component {
    render() {
        return (
            <div className="jumbotron bg-dark mb-3">
                <h1 className="display-4">Console Stock Tracker</h1>
                <p className="lead">Live tracking of new video game console stock across various retailers - sign up for email updates!</p>
            </div>
        );
    }
}